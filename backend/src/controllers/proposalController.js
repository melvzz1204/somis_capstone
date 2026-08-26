const fs = require("fs");
const path = require("path");
const Proposal = require("../models/Proposal");
const Member = require("../models/MemberOrganization");
const Organization = require("../models/OrganizationModels");

const formatMemberSignature = (member) => {
  if (!member) return "";
  if (member.surname && member.firstName) {
    const givenName = [member.firstName, member.middleInitial]
      .filter(Boolean)
      .join(" ");
    return [`${member.surname}, ${givenName}`, member.suffix]
      .filter(Boolean)
      .join(", ");
  }
  return member.name?.trim() || "";
};

const resolveLeaderSignature = async (user) => {
  const organizationId = user.organization;
  const normalizedEmail = String(user.email || "")
    .toLowerCase()
    .trim();

  let leader = normalizedEmail
    ? await Member.findOne({
        organization: organizationId,
        email: normalizedEmail,
      }).select("name surname firstName middleInitial suffix role")
    : null;

  if (!leader) {
    leader = await Member.findOne({
      organization: organizationId,
      role: "President",
    }).select("name surname firstName middleInitial suffix role");
  }

  // A president must complete the structured name fields before signing. Other
  // legacy officer records may still contain a complete name in one field.
  if (leader?.role === "President" && !(leader.surname && leader.firstName))
    return "";
  const memberSignature = formatMemberSignature(leader);
  if (memberSignature) return memberSignature;
  if (user.name?.trim()) return user.name.trim();

  const organization =
    await Organization.findById(organizationId).select("president");
  return organization?.president?.trim() || "";
};

const resolveFacultySignature = async (user, memberRole) => {
  const organizationId = user.organization;
  const normalizedEmail = String(user.email || "")
    .toLowerCase()
    .trim();

  let member = normalizedEmail
    ? await Member.findOne({
        organization: organizationId,
        email: normalizedEmail,
        role: memberRole,
      }).select("name surname firstName middleInitial suffix")
    : null;

  if (!member) {
    member = await Member.findOne({
      organization: organizationId,
      role: memberRole,
    }).select("name surname firstName middleInitial suffix");
  }

  return formatMemberSignature(member) || user.name?.trim() || "";
};

const resolveAdviserSignature = (user) =>
  resolveFacultySignature(user, "Faculty Adviser");

const resolveDeanSignature = (user) =>
  resolveFacultySignature(user, "Department Dean");

const editableFields = [
  "proposalTitle",
  "activityCategory",
  "projectObjectives",
  "projectDescription",
  "requestedStartDateTime",
  "requestedEndDateTime",
  "targetVenue",
  "expectedAttendees",
  "targetAudience",
  "totalBudgetAllocation",
  "sourceOfFunds",
  "projectLeadPerson",
  "projectLeadContact",
];

const removeFiles = (attachments = []) => {
  attachments.forEach((attachment) => {
    if (!attachment?.filename) return;
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "proposals",
      attachment.filename,
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

const uploadedAttachments = (files = []) =>
  files.map((file) => ({
    originalName: file.originalname,
    filename: file.filename,
    path: `/uploads/proposals/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

const parseRetainedAttachmentIds = (value) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch (_error) {
    return null;
  }
};

const sendValidationError = (res, error) =>
  res.status(400).json({
    success: false,
    message:
      Object.values(error.errors || {})[0]?.message ||
      "The proposal contains invalid information.",
  });

const normalizeExpectedAttendees = (value) => {
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 ? count : value;
};

const createProposal = async (req, res) => {
  const newAttachments = uploadedAttachments(req.files);

  try {
    if (!req.user.organization) {
      removeFiles(newAttachments);
      return res
        .status(400)
        .json({ success: false, message: "Organization context is required." });
    }

    const data = editableFields.reduce((result, field) => {
      result[field] = req.body[field];
      return result;
    }, {});
    data.sourceOfFunds = String(data.sourceOfFunds || "").trim();
    data.expectedAttendees = normalizeExpectedAttendees(data.expectedAttendees);

    const proposal = await Proposal.create({
      ...data,
      org: req.user.organization,
      createdBy: req.user._id,
      attachments: newAttachments,
    });

    return res.status(201).json({
      success: true,
      message: "Proposal created successfully.",
      data: proposal,
    });
  } catch (error) {
    removeFiles(newAttachments);
    if (error.name === "ValidationError")
      return sendValidationError(res, error);
    console.error("Error creating proposal:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not create proposal." });
  }
};

const getProposals = async (req, res) => {
  try {
    const isOvpsas = req.user.role === "admin";
    if (!isOvpsas && !req.user.organization) {
      return res
        .status(400)
        .json({ success: false, message: "Organization context is required." });
    }

    if (req.user.role === "dean") {
      await Proposal.updateMany(
        {
          org: req.user.organization,
          status: "Approved",
          "adviserReview.decision": "Approved",
          "adviserReview.reviewedAt": { $exists: true },
          "deanReview.reviewedAt": { $exists: false },
          "ovpsasReview.reviewedAt": { $exists: false },
        },
        { $set: { status: "Pending Dean Review" } },
      );
    }

    const query = isOvpsas ? {} : { org: req.user.organization };
    const visibleStatusesByRole = {
      adviser: [
        "Pending Adviser Review",
        "Pending Dean Review",
        "Pending OVPSAS Review",
        "Approved",
        "Rejected",
      ],
      dean: [
        "Pending Dean Review",
        "Pending OVPSAS Review",
        "Approved",
        "Rejected",
      ],
      admin: ["Pending OVPSAS Review", "Approved", "Rejected"],
    };
    if (visibleStatusesByRole[req.user.role]) {
      query.status = { $in: visibleStatusesByRole[req.user.role] };
    }

    const proposals = await Proposal.find(query)
      .populate("org", "name acronym college")
      .sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    console.error("Error retrieving proposals:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not retrieve proposals." });
  }
};

const updateProposal = async (req, res) => {
  const newAttachments = uploadedAttachments(req.files);

  try {
    const proposal = await Proposal.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!proposal) {
      removeFiles(newAttachments);
      return res
        .status(404)
        .json({ success: false, message: "Proposal not found." });
    }

    if (["Approved", "Rejected"].includes(proposal.status)) {
      removeFiles(newAttachments);
      return res.status(409).json({
        success: false,
        message: "Finalized proposals cannot be edited.",
      });
    }

    const retainedIds = parseRetainedAttachmentIds(
      req.body.retainedAttachmentIds,
    );
    const retainedAttachments =
      retainedIds === null
        ? proposal.attachments
        : proposal.attachments.filter((attachment) =>
            retainedIds.includes(String(attachment._id)),
          );

    if (retainedAttachments.length + newAttachments.length > 5) {
      removeFiles(newAttachments);
      return res.status(400).json({
        success: false,
        message: "A proposal can contain no more than 5 attachments.",
      });
    }

    const removedAttachments = proposal.attachments.filter(
      (attachment) =>
        !retainedAttachments.some(
          (retained) => String(retained._id) === String(attachment._id),
        ),
    );

    editableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field))
        proposal[field] = req.body[field];
    });
    if (Object.prototype.hasOwnProperty.call(req.body, "sourceOfFunds")) {
      proposal.sourceOfFunds = String(req.body.sourceOfFunds || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "expectedAttendees")) {
      proposal.expectedAttendees = normalizeExpectedAttendees(
        req.body.expectedAttendees,
      );
    }

    proposal.attachments = [...retainedAttachments, ...newAttachments];

    await proposal.save();
    removeFiles(removedAttachments);

    return res.json({
      success: true,
      message: "Proposal updated successfully.",
      data: proposal,
    });
  } catch (error) {
    removeFiles(newAttachments);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return sendValidationError(res, error);
    }
    console.error("Error updating proposal:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not update proposal." });
  }
};

const getLeaderSignature = async (req, res) => {
  try {
    const digitalSignature = await resolveLeaderSignature(req.user);
    if (!digitalSignature) {
      return res.status(404).json({
        success: false,
        message: "No organization leader name is available for signing.",
      });
    }

    return res.json({ success: true, data: { digitalSignature } });
  } catch (error) {
    console.error("Error resolving leader signature:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve the organization leader signature.",
    });
  }
};

const getAdviserSignature = async (req, res) => {
  try {
    const digitalSignature = await resolveAdviserSignature(req.user);
    if (!digitalSignature) {
      return res.status(404).json({
        success: false,
        message: "No faculty adviser name is available for signing.",
      });
    }

    return res.json({ success: true, data: { digitalSignature } });
  } catch (error) {
    console.error("Error resolving adviser signature:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve the faculty adviser signature.",
    });
  }
};

const getDeanSignature = async (req, res) => {
  try {
    const digitalSignature = await resolveDeanSignature(req.user);
    if (!digitalSignature) {
      return res.status(404).json({
        success: false,
        message: "No department dean name is available for signing.",
      });
    }
    return res.json({ success: true, data: { digitalSignature } });
  } catch (error) {
    console.error("Error resolving dean signature:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve the department dean signature.",
    });
  }
};

const getOvpsasSignature = async (req, res) => {
  const digitalSignature = req.user.name?.trim() || "";
  if (!digitalSignature) {
    return res.status(404).json({
      success: false,
      message: "No OVPSAS administrator name is available for signing.",
    });
  }
  return res.json({ success: true, data: { digitalSignature } });
};

const REVIEW_RULES = {
  org_admin: {
    expectedStatus: "Submitted",
    nextStatus: "Pending Adviser Review",
    reviewField: "leaderReview",
    reviewerLabel: "organization leader",
    nextReviewerLabel: "faculty adviser",
    resolveSignature: resolveLeaderSignature,
  },
  adviser: {
    expectedStatus: "Pending Adviser Review",
    nextStatus: "Pending Dean Review",
    reviewField: "adviserReview",
    reviewerLabel: "faculty adviser",
    nextReviewerLabel: "department dean",
    resolveSignature: resolveAdviserSignature,
  },
  dean: {
    expectedStatus: "Pending Dean Review",
    nextStatus: "Pending OVPSAS Review",
    reviewField: "deanReview",
    reviewerLabel: "department dean",
    nextReviewerLabel: "OVPSAS",
    resolveSignature: resolveDeanSignature,
  },
  admin: {
    expectedStatus: "Pending OVPSAS Review",
    nextStatus: "Approved",
    reviewField: "ovpsasReview",
    reviewerLabel: "OVPSAS administrator",
    nextReviewerLabel: "",
    resolveSignature: async (user) => user.name?.trim() || "",
  },
};

const reviewProposal = async (req, res) => {
  const { decision, remarks = "" } = req.body;
  const rule = REVIEW_RULES[req.user.role];

  if (!["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "A valid approval decision is required.",
    });
  }

  if (!rule) {
    return res.status(403).json({
      success: false,
      message: "This account cannot review proposals.",
    });
  }

  try {
    const digitalSignature = await rule.resolveSignature(req.user);
    if (!digitalSignature) {
      return res.status(400).json({
        success: false,
        message: `Add the ${rule.reviewerLabel}'s full name before reviewing proposals.`,
      });
    }

    const query = { _id: req.params.id };
    if (req.user.role !== "admin") query.org = req.user.organization;
    const proposal = await Proposal.findOne(query);

    if (!proposal) {
      return res
        .status(404)
        .json({ success: false, message: "Proposal not found." });
    }

    if (["Approved", "Rejected"].includes(proposal.status)) {
      return res.status(409).json({
        success: false,
        message: "This proposal has already received a final decision.",
      });
    }

    if (proposal.status !== rule.expectedStatus) {
      return res.status(409).json({
        success: false,
        message: `This proposal is not ready for ${rule.reviewerLabel} review.`,
      });
    }

    proposal.status = decision === "Approved" ? rule.nextStatus : "Rejected";
    proposal[rule.reviewField] = {
      decision,
      digitalSignature,
      remarks: String(remarks).trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    await proposal.save();
    const message =
      decision === "Rejected"
        ? `Proposal rejected by the ${rule.reviewerLabel}.`
        : req.user.role === "admin"
          ? "Proposal received final OVPSAS approval."
          : `Proposal approved and forwarded to the ${rule.nextReviewerLabel}.`;
    return res.json({ success: true, message, data: proposal });
  } catch (error) {
    if (error.name === "CastError" || error.name === "ValidationError") {
      return sendValidationError(res, error);
    }
    console.error("Error reviewing proposal:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not review proposal." });
  }
};

const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!proposal) {
      return res
        .status(404)
        .json({ success: false, message: "Proposal not found." });
    }

    if (["Approved", "Rejected"].includes(proposal.status)) {
      return res.status(409).json({
        success: false,
        message: "Finalized proposals cannot be deleted.",
      });
    }

    await proposal.deleteOne();
    removeFiles(proposal.attachments);
    return res.json({
      success: true,
      message: "Proposal deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(404)
        .json({ success: false, message: "Proposal not found." });
    }
    console.error("Error deleting proposal:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not delete proposal." });
  }
};

module.exports = {
  createProposal,
  getProposals,
  updateProposal,
  getLeaderSignature,
  getAdviserSignature,
  getDeanSignature,
  getOvpsasSignature,
  reviewProposal,
  deleteProposal,
};
