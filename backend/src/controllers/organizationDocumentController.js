const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const OrganizationDocument = require("../models/OrganizationDocument");
const { DOCUMENT_TYPES, SEMESTERS } = require("../models/OrganizationDocument");
const {
  MAX_DOCUMENT_FILES,
} = require("../middleware/organizationDocumentUpload");

const SUBMITTER_ROLES = new Set(["secretary", "org_admin", "treasurer"]);
const REVIEW_RULES = {
  adviser: {
    expectedStatus: "Pending Adviser Review",
    nextStatus: "Pending OVPSAS Review",
    reviewField: "adviserReview",
    reviewerLabel: "faculty adviser",
    nextReviewerLabel: "OVPSAS administrator",
  },
  admin: {
    expectedStatus: "Pending OVPSAS Review",
    nextStatus: "Approved",
    reviewField: "ovpsasReview",
    reviewerLabel: "OVPSAS administrator",
    nextReviewerLabel: "",
  },
};

const editableFields = ["title", "schoolYear", "semester"];

const normalizeDocumentType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  if (normalized === "annual report") return "Annual Report";
  if (
    normalized === "activity plan" ||
    normalized === "organization plan" ||
    normalized === "organisational plan"
  ) {
    return "Activity Plan";
  }
  return "";
};

const isValidSchoolYear = (value) => {
  const match = /^(\d{4})-(\d{4})$/.exec(String(value || "").trim());
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
};

const uploadedAttachments = (files = []) =>
  files.map((file) => ({
    originalName: file.originalname,
    filename: file.filename,
    path: `/uploads/organization-documents/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

const attachmentPath = (attachment) => {
  const filename = path.basename(String(attachment?.filename || ""));
  if (!filename) return "";
  return path.join(
    process.cwd(),
    "uploads",
    "organization-documents",
    filename,
  );
};

const removeFiles = (attachments = []) => {
  attachments.forEach((attachment) => {
    const filePath = attachmentPath(attachment);
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Could not remove uploaded file ${filePath}:`, error);
      }
    }
  });
};

const parseRetainedAttachmentIds = (value) => {
  if (value === undefined) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (_error) {
    return [];
  }
};

const sendValidationError = (res, error, fallbackMessage) =>
  res.status(400).json({
    success: false,
    message:
      Object.values(error?.errors || {})[0]?.message ||
      fallbackMessage ||
      "The organization document contains invalid information.",
  });

const validateFields = ({ documentType, title, schoolYear, semester }) => {
  const normalizedType = normalizeDocumentType(documentType);
  const normalizedTitle = String(title || "").trim();
  const normalizedSchoolYear = String(schoolYear || "").trim();
  const normalizedSemester = String(semester || "").trim();

  if (!DOCUMENT_TYPES.includes(normalizedType)) {
    return { error: "Select Annual Report or Activity Plan." };
  }
  if (!normalizedTitle) return { error: "Title is required." };
  if (normalizedTitle.length > 150) {
    return { error: "Title cannot exceed 150 characters." };
  }
  if (!isValidSchoolYear(normalizedSchoolYear)) {
    return {
      error:
        "School year must use consecutive years in YYYY-YYYY format, for example 2026-2027.",
    };
  }
  if (!SEMESTERS.includes(normalizedSemester)) {
    return { error: "Select a valid semester." };
  }

  return {
    data: {
      documentType: normalizedType,
      title: normalizedTitle,
      schoolYear: normalizedSchoolYear,
      semester: normalizedSemester,
    },
  };
};

const populateDocument = (query) =>
  query
    .populate("org", "name acronym college")
    .populate("createdBy", "name email role")
    .populate("adviserReview.reviewedBy", "name email role")
    .populate("ovpsasReview.reviewedBy", "name email role");

const populateSavedDocument = (document) =>
  document.populate([
    { path: "org", select: "name acronym college" },
    { path: "createdBy", select: "name email role" },
    { path: "adviserReview.reviewedBy", select: "name email role" },
    { path: "ovpsasReview.reviewedBy", select: "name email role" },
  ]);

const ensureOrganizationContext = (req, res) => {
  if (req.user.organization) return true;
  res.status(400).json({
    success: false,
    message: "Organization context is required.",
  });
  return false;
};

const createOrganizationDocument = async (req, res) => {
  const newAttachments = uploadedAttachments(req.files);

  try {
    if (!ensureOrganizationContext(req, res)) {
      removeFiles(newAttachments);
      return undefined;
    }

    const validation = validateFields(req.body);
    if (validation.error) {
      removeFiles(newAttachments);
      return res
        .status(400)
        .json({ success: false, message: validation.error });
    }

    if (!newAttachments.length) {
      return res.status(400).json({
        success: false,
        message: "Attach at least one document before submitting.",
      });
    }

    const document = await OrganizationDocument.create({
      ...validation.data,
      org: req.user.organization,
      createdBy: req.user._id,
      attachments: newAttachments,
    });
    await populateSavedDocument(document);

    return res.status(201).json({
      success: true,
      message: `${document.documentType} submitted for faculty adviser validation.`,
      data: document,
    });
  } catch (error) {
    removeFiles(newAttachments);
    if (error.name === "ValidationError")
      return sendValidationError(res, error);
    console.error("Error creating organization document:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create the organization document submission.",
    });
  }
};

const getOrganizationDocuments = async (req, res) => {
  try {
    const isOvpsas = req.user.role === "admin";
    if (!isOvpsas && !ensureOrganizationContext(req, res)) return undefined;

    const query = isOvpsas ? {} : { org: req.user.organization };
    const documentType = normalizeDocumentType(req.query.documentType);
    if (req.query.documentType && !documentType) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type filter.",
      });
    }
    if (documentType) query.documentType = documentType;

    if (req.user.role === "admin") {
      query.status = { $in: ["Pending OVPSAS Review", "Approved", "Rejected"] };
    }

    const documents = await populateDocument(
      OrganizationDocument.find(query).sort({ createdAt: -1 }),
    );

    return res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error retrieving organization documents:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve organization documents.",
    });
  }
};

const updateOrganizationDocument = async (req, res) => {
  const newAttachments = uploadedAttachments(req.files);

  try {
    if (!ensureOrganizationContext(req, res)) {
      removeFiles(newAttachments);
      return undefined;
    }

    const document = await OrganizationDocument.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!document) {
      removeFiles(newAttachments);
      return res.status(404).json({
        success: false,
        message: "Organization document not found.",
      });
    }

    if (!["Pending Adviser Review", "Rejected"].includes(document.status)) {
      removeFiles(newAttachments);
      return res.status(409).json({
        success: false,
        message:
          "Only submissions awaiting faculty adviser review or rejected submissions can be edited.",
      });
    }

    const candidate = {
      documentType: document.documentType,
      title: document.title,
      schoolYear: document.schoolYear,
      semester: document.semester,
    };
    editableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        candidate[field] = req.body[field];
      }
    });
    const validation = validateFields(candidate);
    if (validation.error) {
      removeFiles(newAttachments);
      return res
        .status(400)
        .json({ success: false, message: validation.error });
    }

    const retainedIds = parseRetainedAttachmentIds(
      req.body.retainedAttachmentIds,
    );
    const retainedAttachments =
      retainedIds === null
        ? document.attachments
        : document.attachments.filter((attachment) =>
            retainedIds.includes(String(attachment._id)),
          );

    const attachmentCount = retainedAttachments.length + newAttachments.length;
    if (attachmentCount < 1 || attachmentCount > MAX_DOCUMENT_FILES) {
      removeFiles(newAttachments);
      return res.status(400).json({
        success: false,
        message:
          attachmentCount < 1
            ? "At least one attachment is required."
            : `A submission can contain at most ${MAX_DOCUMENT_FILES} attachments.`,
      });
    }

    const removedAttachments = document.attachments.filter(
      (attachment) =>
        !retainedAttachments.some(
          (retained) => String(retained._id) === String(attachment._id),
        ),
    );

    const isResubmission = document.status === "Rejected";
    Object.assign(document, validation.data);
    document.attachments = [...retainedAttachments, ...newAttachments];
    if (isResubmission) {
      document.status = "Pending Adviser Review";
      document.adviserReview = undefined;
      document.ovpsasReview = undefined;
    }
    await document.save();
    removeFiles(removedAttachments);
    await populateSavedDocument(document);

    return res.json({
      success: true,
      message: isResubmission
        ? `${document.documentType} revised and resubmitted for faculty adviser validation.`
        : `${document.documentType} updated successfully.`,
      data: document,
    });
  } catch (error) {
    removeFiles(newAttachments);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return sendValidationError(res, error);
    }
    console.error("Error updating organization document:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update the organization document.",
    });
  }
};

const reviewOrganizationDocument = async (req, res) => {
  const decision = String(req.body.decision || "").trim();
  const remarks = String(req.body.remarks || "").trim();
  const rule = REVIEW_RULES[req.user.role];

  if (!rule) {
    return res.status(403).json({
      success: false,
      message: "This account cannot review organization documents.",
    });
  }
  if (!["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "A valid approval decision is required.",
    });
  }
  if (remarks.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Review remarks cannot exceed 500 characters.",
    });
  }
  if (decision === "Rejected" && !remarks) {
    return res.status(400).json({
      success: false,
      message: "Remarks are required when rejecting a submission.",
    });
  }

  try {
    if (req.user.role === "adviser" && !ensureOrganizationContext(req, res)) {
      return undefined;
    }

    const query = { _id: req.params.id };
    if (req.user.role === "adviser") query.org = req.user.organization;

    const document = await OrganizationDocument.findOne(query);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Organization document not found.",
      });
    }
    if (["Approved", "Rejected"].includes(document.status)) {
      return res.status(409).json({
        success: false,
        message: "This submission has already received a final decision.",
      });
    }
    if (document.status !== rule.expectedStatus) {
      return res.status(409).json({
        success: false,
        message: `This submission is not ready for ${rule.reviewerLabel} review.`,
      });
    }

    document.status = decision === "Approved" ? rule.nextStatus : "Rejected";
    document[rule.reviewField] = {
      decision,
      remarks,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };
    await document.save();
    await populateSavedDocument(document);

    const message =
      decision === "Rejected"
        ? `${document.documentType} rejected by the ${rule.reviewerLabel}.`
        : req.user.role === "admin"
          ? `${document.documentType} received final OVPSAS approval.`
          : `${document.documentType} validated and forwarded to the ${rule.nextReviewerLabel}.`;

    return res.json({ success: true, message, data: document });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return sendValidationError(res, error);
    }
    console.error("Error reviewing organization document:", error);
    return res.status(500).json({
      success: false,
      message: "Could not review the organization document.",
    });
  }
};

const deleteOrganizationDocument = async (req, res) => {
  try {
    if (!ensureOrganizationContext(req, res)) return undefined;

    const document = await OrganizationDocument.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Organization document not found.",
      });
    }
    if (!["Pending Adviser Review", "Rejected"].includes(document.status)) {
      return res.status(409).json({
        success: false,
        message:
          "Only submissions awaiting faculty adviser review or rejected submissions can be deleted.",
      });
    }

    await document.deleteOne();
    removeFiles(document.attachments);
    return res.json({
      success: true,
      message: `${document.documentType} deleted successfully.`,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid organization document identifier.",
      });
    }
    console.error("Error deleting organization document:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete the organization document.",
    });
  }
};

const removeOrganizationDocumentFiles = async (organizationId) => {
  if (!mongoose.isValidObjectId(organizationId)) return;
  const documents = await OrganizationDocument.find({ org: organizationId })
    .select("attachments")
    .lean();
  documents.forEach((document) => removeFiles(document.attachments));
};

module.exports = {
  SUBMITTER_ROLES,
  REVIEW_RULES,
  normalizeDocumentType,
  isValidSchoolYear,
  validateFields,
  removeFiles,
  removeOrganizationDocumentFiles,
  createOrganizationDocument,
  getOrganizationDocuments,
  updateOrganizationDocument,
  reviewOrganizationDocument,
  deleteOrganizationDocument,
};
