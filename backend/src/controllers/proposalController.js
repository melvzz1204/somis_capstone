const fs = require("fs");
const path = require("path");
const Proposal = require("../models/Proposal");
const Member = require("../models/MemberOrganization");
const Organization = require("../models/OrganizationModels");

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

  if (leader?.surname) {
    if (!leader.firstName) return "";

    const givenName = [leader.firstName, leader.middleInitial]
      .filter(Boolean)
      .join(" ");
    return [`${leader.surname}, ${givenName}`, leader.suffix]
      .filter(Boolean)
      .join(", ");
  }

  // A president must complete the structured name fields before signing. Other
  // legacy officer records may still contain a complete name in one field.
  if (leader?.role === "President") return "";
  if (leader?.name?.trim()) return leader.name.trim();
  if (user.name?.trim()) return user.name.trim();

  const organization =
    await Organization.findById(organizationId).select("president");
  return organization?.president?.trim() || "";
};

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
    if (!req.user.organization) {
      return res
        .status(400)
        .json({ success: false, message: "Organization context is required." });
    }

    const proposals = await Proposal.find({ org: req.user.organization }).sort({
      createdAt: -1,
    });
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

const reviewProposal = async (req, res) => {
  const { decision, remarks = "" } = req.body;

  if (!["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "A valid approval decision is required.",
    });
  }

  try {
    const digitalSignature = await resolveLeaderSignature(req.user);
    if (!digitalSignature) {
      return res.status(400).json({
        success: false,
        message:
          "Add the organization leader's full name before reviewing proposals.",
      });
    }

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
        message: "This proposal has already received a final decision.",
      });
    }

    proposal.status = decision;
    proposal.leaderReview = {
      decision,
      digitalSignature,
      remarks: String(remarks).trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    await proposal.save();
    return res.json({
      success: true,
      message: `Proposal ${decision.toLowerCase()} successfully.`,
      data: proposal,
    });
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
  reviewProposal,
  deleteProposal,
};
