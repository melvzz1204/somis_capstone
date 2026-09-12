const fs = require("fs");
const path = require("path");
const Resolution = require("../models/Resolution");
const Meeting = require("../models/Meeting");
const Member = require("../models/MemberOrganization");
const Organization = require("../models/OrganizationModels");

// A6: the referenced meeting must have already occurred before its resolution
// can be created or submitted. Kept as a single constant so it can be relaxed.
const REQUIRE_MEETING_ALREADY_OCCURRED = true;

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

const resolvePresidentSignature = async (user) => {
  const organizationId = user.organization;
  const normalizedEmail = String(user.email || "")
    .toLowerCase()
    .trim();

  let president = normalizedEmail
    ? await Member.findOne({
        organization: organizationId,
        email: normalizedEmail,
      }).select("name surname firstName middleInitial suffix role")
    : null;

  if (!president) {
    president = await Member.findOne({
      organization: organizationId,
      role: "President",
    }).select("name surname firstName middleInitial suffix role");
  }

  // A president must complete the structured name fields before signing. Other
  // legacy officer records may still contain a complete name in one field.
  if (
    president?.role === "President" &&
    !(president.surname && president.firstName)
  )
    return "";
  const memberSignature = formatMemberSignature(president);
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

const PROPOSAL_FIELDS = [
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
      "resolutions",
      attachment.filename,
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

const uploadedAttachments = (files = []) =>
  files.map((file) => ({
    originalName: file.originalname,
    filename: file.filename,
    path: `/uploads/resolutions/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    // Fall back to newline-separated plain text for non-JSON submissions.
    return String(value)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
};

const parseJsonObject = (value) => {
  if (value && typeof value === "object") return value;
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const parseRetainedAttachmentIds = (value) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch (_error) {
    return null;
  }
};

const buildActivityProposal = (raw = {}, attachments = []) => {
  const proposal = {};
  PROPOSAL_FIELDS.forEach((field) => {
    if (raw[field] !== undefined) proposal[field] = raw[field];
  });

  if (proposal.expectedAttendees !== undefined) {
    const count = Number(proposal.expectedAttendees);
    proposal.expectedAttendees = Number.isFinite(count)
      ? count
      : proposal.expectedAttendees;
  }
  if (proposal.totalBudgetAllocation !== undefined) {
    const budget = Number(proposal.totalBudgetAllocation);
    proposal.totalBudgetAllocation = Number.isFinite(budget)
      ? budget
      : proposal.totalBudgetAllocation;
  }
  if (proposal.sourceOfFunds !== undefined) {
    proposal.sourceOfFunds = String(proposal.sourceOfFunds || "").trim();
  }
  proposal.requiresFeeCollection =
    raw.requiresFeeCollection === true || raw.requiresFeeCollection === "true";
  proposal.attachments = attachments;
  return proposal;
};

const sendValidationError = (res, error) =>
  res.status(400).json({
    success: false,
    message:
      Object.values(error.errors || {})[0]?.message ||
      "The resolution contains invalid information.",
  });

// Validates the meeting-first rule (A6): the meeting must exist, belong to the
// organization, and (by default) have already occurred.
const findUsableMeeting = async (meetingId, organizationId) => {
  if (!meetingId) {
    return {
      error: "A meeting must be selected before creating a resolution.",
      statusCode: 400,
    };
  }

  let meeting = null;
  try {
    meeting = await Meeting.findOne({
      _id: meetingId,
      organization: organizationId,
    });
  } catch (_error) {
    meeting = null;
  }

  if (!meeting) {
    return {
      error: "The selected meeting was not found for this organization.",
      statusCode: 404,
    };
  }

  if (
    REQUIRE_MEETING_ALREADY_OCCURRED &&
    new Date(meeting.endDateTime).getTime() > Date.now()
  ) {
    return {
      error:
        "The referenced meeting must be held before its resolution can proceed.",
      statusCode: 400,
    };
  }

  return { meeting };
};

const REVIEW_RULES = {
  org_admin: {
    expectedStatus: "Submitted",
    nextStatus: "Pending Adviser Review",
    reviewField: "presidentReview",
    reviewerLabel: "organization president",
    nextReviewerLabel: "faculty adviser",
    resolveSignature: resolvePresidentSignature,
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
    nextStatus: "Adopted",
    reviewField: "deanReview",
    reviewerLabel: "department dean",
    nextReviewerLabel: "",
    resolveSignature: resolveDeanSignature,
  },
};

const createResolution = async (req, res) => {
  const newResolutionAttachments = uploadedAttachments(req.files?.attachments);
  const newProposalAttachments = uploadedAttachments(
    req.files?.proposalAttachments,
  );
  const cleanupAll = () =>
    removeFiles([...newResolutionAttachments, ...newProposalAttachments]);

  try {
    if (!req.user.organization) {
      cleanupAll();
      return res
        .status(400)
        .json({ success: false, message: "Organization context is required." });
    }

    const { meeting, error, statusCode } = await findUsableMeeting(
      req.body.meeting,
      req.user.organization,
    );
    if (error) {
      cleanupAll();
      return res.status(statusCode).json({ success: false, message: error });
    }

    const activityProposal = buildActivityProposal(
      parseJsonObject(req.body.activityProposal),
      newProposalAttachments,
    );

    const resolution = await Resolution.create({
      org: req.user.organization,
      meeting: meeting._id,
      title: req.body.title,
      subject: req.body.subject,
      whereasClauses: parseJsonArray(req.body.whereasClauses),
      resolvedClauses: parseJsonArray(req.body.resolvedClauses),
      activityProposal,
      attachments: newResolutionAttachments,
      createdBy: req.user._id,
      status: "Draft",
    });

    return res.status(201).json({
      success: true,
      message: "Resolution created successfully.",
      data: resolution,
    });
  } catch (error) {
    cleanupAll();
    if (error.name === "ValidationError" || error.name === "CastError") {
      return sendValidationError(res, error);
    }
    console.error("Error creating resolution:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not create resolution." });
  }
};

const getResolutions = async (req, res) => {
  try {
    if (!req.user.organization) {
      return res
        .status(400)
        .json({ success: false, message: "Organization context is required." });
    }

    const query = { org: req.user.organization };
    const visibleStatusesByRole = {
      adviser: [
        "Pending Adviser Review",
        "Pending Dean Review",
        "Adopted",
        "Rejected",
      ],
      dean: ["Pending Dean Review", "Adopted", "Rejected"],
    };
    const roleStatuses = visibleStatusesByRole[req.user.role];
    const requestedStatus = req.query.status
      ? String(req.query.status)
      : null;

    if (requestedStatus && (!roleStatuses || roleStatuses.includes(requestedStatus))) {
      query.status = requestedStatus;
    } else if (roleStatuses) {
      query.status = { $in: roleStatuses };
    }

    const resolutions = await Resolution.find(query)
      .populate("org", "name acronym college")
      .populate("meeting", "title startDateTime venue audience")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: resolutions.length,
      data: resolutions,
    });
  } catch (error) {
    console.error("Error retrieving resolutions:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not retrieve resolutions." });
  }
};

const getResolution = async (req, res) => {
  try {
    const resolution = await Resolution.findOne({
      _id: req.params.id,
      org: req.user.organization,
    })
      .populate("org", "name acronym college")
      .populate("meeting", "title startDateTime endDateTime venue audience");

    if (!resolution) {
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }

    return res.json({ success: true, data: resolution });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }
    console.error("Error retrieving resolution:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not retrieve resolution." });
  }
};

const updateResolution = async (req, res) => {
  const newResolutionAttachments = uploadedAttachments(req.files?.attachments);
  const newProposalAttachments = uploadedAttachments(
    req.files?.proposalAttachments,
  );
  const cleanupAll = () =>
    removeFiles([...newResolutionAttachments, ...newProposalAttachments]);

  try {
    const resolution = await Resolution.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!resolution) {
      cleanupAll();
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }

    if (!["Draft", "Submitted"].includes(resolution.status)) {
      cleanupAll();
      return res.status(409).json({
        success: false,
        message: "Only draft or submitted resolutions can be edited.",
      });
    }

    // Resolution-level attachments: retain or replace.
    const retainedIds = parseRetainedAttachmentIds(
      req.body.retainedAttachmentIds,
    );
    const retainedAttachments =
      retainedIds === null
        ? resolution.attachments
        : resolution.attachments.filter((attachment) =>
            retainedIds.includes(String(attachment._id)),
          );
    if (retainedAttachments.length + newResolutionAttachments.length > 5) {
      cleanupAll();
      return res.status(400).json({
        success: false,
        message: "A resolution can contain no more than 5 attachments.",
      });
    }
    const removedResolutionAttachments = resolution.attachments.filter(
      (attachment) =>
        !retainedAttachments.some(
          (retained) => String(retained._id) === String(attachment._id),
        ),
    );

    // Embedded proposal attachments: retain or replace.
    const retainedProposalIds = parseRetainedAttachmentIds(
      req.body.retainedProposalAttachmentIds,
    );
    const currentProposalAttachments =
      resolution.activityProposal?.attachments || [];
    const retainedProposalAttachments =
      retainedProposalIds === null
        ? currentProposalAttachments
        : currentProposalAttachments.filter((attachment) =>
            retainedProposalIds.includes(String(attachment._id)),
          );
    if (retainedProposalAttachments.length + newProposalAttachments.length > 5) {
      cleanupAll();
      return res.status(400).json({
        success: false,
        message: "An activity proposal can contain no more than 5 attachments.",
      });
    }
    const removedProposalAttachments = currentProposalAttachments.filter(
      (attachment) =>
        !retainedProposalAttachments.some(
          (retained) => String(retained._id) === String(attachment._id),
        ),
    );

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      resolution.title = req.body.title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "subject")) {
      resolution.subject = req.body.subject;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "whereasClauses")) {
      resolution.whereasClauses = parseJsonArray(req.body.whereasClauses);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "resolvedClauses")) {
      resolution.resolvedClauses = parseJsonArray(req.body.resolvedClauses);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "meeting")) {
      const meetingResult = await findUsableMeeting(
        req.body.meeting,
        req.user.organization,
      );
      if (meetingResult.error) {
        cleanupAll();
        return res
          .status(meetingResult.statusCode)
          .json({ success: false, message: meetingResult.error });
      }
      resolution.meeting = meetingResult.meeting._id;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "activityProposal")) {
      resolution.activityProposal = buildActivityProposal(
        parseJsonObject(req.body.activityProposal),
        [...retainedProposalAttachments, ...newProposalAttachments],
      );
    } else {
      resolution.activityProposal.attachments = [
        ...retainedProposalAttachments,
        ...newProposalAttachments,
      ];
    }

    resolution.attachments = [
      ...retainedAttachments,
      ...newResolutionAttachments,
    ];

    await resolution.save();
    removeFiles([
      ...removedResolutionAttachments,
      ...removedProposalAttachments,
    ]);

    return res.json({
      success: true,
      message: "Resolution updated successfully.",
      data: resolution,
    });
  } catch (error) {
    cleanupAll();
    if (error.name === "ValidationError" || error.name === "CastError") {
      return sendValidationError(res, error);
    }
    console.error("Error updating resolution:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not update resolution." });
  }
};

const submitResolution = async (req, res) => {
  try {
    const resolution = await Resolution.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!resolution) {
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }

    if (resolution.status !== "Draft") {
      return res.status(409).json({
        success: false,
        message: "Only draft resolutions can be submitted.",
      });
    }

    const meetingResult = await findUsableMeeting(
      resolution.meeting,
      req.user.organization,
    );
    if (meetingResult.error) {
      return res
        .status(meetingResult.statusCode)
        .json({ success: false, message: meetingResult.error });
    }

    const resolvedClauseCount = (resolution.resolvedClauses || []).filter(
      (clause) => String(clause).trim(),
    ).length;
    if (resolvedClauseCount < 1) {
      return res.status(400).json({
        success: false,
        message: "At least one RESOLVED clause is required before submitting.",
      });
    }

    const seriesYear = new Date().getFullYear();
    resolution.status = "Submitted";
    resolution.submittedAt = new Date();

    // Assign a unique per-org, per-year number, retrying once on a race.
    let saved = null;
    for (let attempt = 0; attempt < 2 && !saved; attempt += 1) {
      const sequence =
        (await Resolution.countDocuments({ org: resolution.org, seriesYear })) +
        1 +
        attempt;
      resolution.seriesYear = seriesYear;
      resolution.resolutionNumber = `RES-${seriesYear}-${String(sequence).padStart(3, "0")}`;
      try {
        saved = await resolution.save();
      } catch (saveError) {
        if (saveError.code === 11000 && attempt === 0) continue;
        throw saveError;
      }
    }

    return res.json({
      success: true,
      message: "Resolution submitted for president approval.",
      data: saved,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return sendValidationError(res, error);
    }
    console.error("Error submitting resolution:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not submit resolution." });
  }
};

const reviewResolution = async (req, res) => {
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
      message: "This account cannot review resolutions.",
    });
  }

  try {
    const digitalSignature = await rule.resolveSignature(req.user);
    if (!digitalSignature) {
      return res.status(400).json({
        success: false,
        message: `Add the ${rule.reviewerLabel}'s full name before reviewing resolutions.`,
      });
    }

    const resolution = await Resolution.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!resolution) {
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }

    if (["Adopted", "Rejected"].includes(resolution.status)) {
      return res.status(409).json({
        success: false,
        message: "This resolution has already received a final decision.",
      });
    }

    if (resolution.status !== rule.expectedStatus) {
      return res.status(409).json({
        success: false,
        message: `This resolution is not ready for ${rule.reviewerLabel} review.`,
      });
    }

    resolution.status = decision === "Approved" ? rule.nextStatus : "Rejected";
    resolution[rule.reviewField] = {
      decision,
      digitalSignature,
      remarks: String(remarks).trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    if (decision === "Approved" && rule.nextStatus === "Adopted") {
      resolution.adoptedAt = new Date();
      resolution.adoptedBy = req.user._id;
    }

    await resolution.save();

    const message =
      decision === "Rejected"
        ? `Resolution rejected by the ${rule.reviewerLabel}.`
        : rule.nextStatus === "Adopted"
          ? "Resolution adopted after dean approval."
          : `Resolution approved and forwarded to the ${rule.nextReviewerLabel}.`;
    return res.json({ success: true, message, data: resolution });
  } catch (error) {
    if (error.name === "CastError" || error.name === "ValidationError") {
      return sendValidationError(res, error);
    }
    console.error("Error reviewing resolution:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not review resolution." });
  }
};

const getPresidentSignature = async (req, res) => {
  try {
    const digitalSignature = await resolvePresidentSignature(req.user);
    if (!digitalSignature) {
      return res.status(404).json({
        success: false,
        message: "No organization president name is available for signing.",
      });
    }
    return res.json({ success: true, data: { digitalSignature } });
  } catch (error) {
    console.error("Error resolving president signature:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve the organization president signature.",
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

const deleteResolution = async (req, res) => {
  try {
    const resolution = await Resolution.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!resolution) {
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }

    if (resolution.status !== "Draft") {
      return res.status(409).json({
        success: false,
        message: "Only draft resolutions can be deleted.",
      });
    }

    await resolution.deleteOne();
    removeFiles([
      ...(resolution.attachments || []),
      ...(resolution.activityProposal?.attachments || []),
    ]);
    return res.json({
      success: true,
      message: "Resolution deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(404)
        .json({ success: false, message: "Resolution not found." });
    }
    console.error("Error deleting resolution:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not delete resolution." });
  }
};

const getAdoptableResolutions = async (req, res) => {
  try {
    if (!req.user.organization) {
      return res
        .status(400)
        .json({ success: false, message: "Organization context is required." });
    }

    const resolutions = await Resolution.find({
      org: req.user.organization,
      status: "Adopted",
    })
      .select("resolutionNumber title adoptedAt activityProposal.proposalTitle")
      .sort({ adoptedAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: resolutions.length,
      data: resolutions,
    });
  } catch (error) {
    console.error("Error retrieving adopted resolutions:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve adopted resolutions.",
    });
  }
};

module.exports = {
  createResolution,
  getResolutions,
  getResolution,
  updateResolution,
  submitResolution,
  reviewResolution,
  getPresidentSignature,
  getAdviserSignature,
  getDeanSignature,
  deleteResolution,
  getAdoptableResolutions,
  // Exported for unit tests and reuse.
  REVIEW_RULES,
  REQUIRE_MEETING_ALREADY_OCCURRED,
  PROPOSAL_FIELDS,
  buildActivityProposal,
  parseJsonArray,
  parseJsonObject,
  parseRetainedAttachmentIds,
  formatMemberSignature,
};
