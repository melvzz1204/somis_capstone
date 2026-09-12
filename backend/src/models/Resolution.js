const mongoose = require("mongoose");

// Shared enums mirror the standalone Proposal model so an embedded activity
// proposal carries the exact same option sets as a legacy Proposal document.
const ACTIVITY_CATEGORIES = [
  "Academic",
  "Non-Academic",
  "Community Service",
  "Fundraiser",
  "Sports & Recreation",
  "General Assembly / Meeting",
];
const TARGET_VENUES = [
  "AVR",
  "Gymnasium",
  "Student Center",
  "Classroom",
  "Outdoor Grounds",
  "Off-Campus / Virtual",
];
const TARGET_AUDIENCES = [
  "Org Members Only",
  "All University Students",
  "Faculty & Staff",
  "Open to External Public",
];
const RESOLUTION_STATUSES = [
  "Draft",
  "Submitted",
  "Pending Adviser Review",
  "Pending Dean Review",
  "Adopted",
  "Rejected",
];

const attachmentSchema = new mongoose.Schema(
  {
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
  },
  { _id: true },
);

const reviewSchema = new mongoose.Schema(
  {
    decision: { type: String, enum: ["Approved", "Rejected"] },
    digitalSignature: { type: String, trim: true, maxlength: 150 },
    remarks: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { _id: false },
);

const activityProposalSchema = new mongoose.Schema(
  {
    proposalTitle: { type: String, required: true, trim: true, maxlength: 150 },
    activityCategory: {
      type: String,
      required: true,
      enum: ACTIVITY_CATEGORIES,
    },
    projectObjectives: { type: String, required: true, trim: true },
    projectDescription: { type: String, required: true, trim: true },
    requestedStartDateTime: { type: Date, required: true },
    requestedEndDateTime: { type: Date, required: true },
    targetVenue: {
      type: String,
      required: true,
      enum: TARGET_VENUES,
    },
    expectedAttendees: { type: Number, required: true, min: 1 },
    targetAudience: {
      type: String,
      required: true,
      enum: TARGET_AUDIENCES,
    },
    totalBudgetAllocation: { type: Number, required: true, min: 0 },
    sourceOfFunds: { type: String, required: true, trim: true, maxlength: 200 },
    projectLeadPerson: { type: String, required: true, trim: true },
    projectLeadContact: { type: String, required: true, trim: true },
    // Hints fee linkage; optional guard for the fee-collection step.
    requiresFeeCollection: { type: Boolean, default: false },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { _id: false },
);

const resolutionSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    // Meeting-first: a resolution is grounded in exactly one prior meeting.
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    resolutionNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    seriesYear: { type: Number },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, trim: true, maxlength: 300, default: "" },
    whereasClauses: { type: [String], default: [] },
    resolvedClauses: {
      type: [String],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.filter((clause) => String(clause).trim()).length >= 1,
        message: "At least one RESOLVED clause is required.",
      },
    },
    activityProposal: { type: activityProposalSchema, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: RESOLUTION_STATUSES,
      default: "Draft",
    },
    submittedAt: Date,

    presidentReview: reviewSchema, // step 2 (org_admin / president)
    adviserReview: reviewSchema, // step 3
    deanReview: reviewSchema, // step 5 -> Adopted

    adoptedAt: Date,
    adoptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

resolutionSchema.index({ org: 1, status: 1, createdAt: -1 });
resolutionSchema.index({ meeting: 1 });
resolutionSchema.index(
  { org: 1, resolutionNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { resolutionNumber: { $type: "string", $ne: "" } },
  },
);

resolutionSchema.pre("validate", function normalizeAndValidate() {
  // Trim clause arrays and drop blank entries before the built-in validators run.
  if (Array.isArray(this.whereasClauses)) {
    this.whereasClauses = this.whereasClauses
      .map((clause) => String(clause).trim())
      .filter(Boolean);
  }
  if (Array.isArray(this.resolvedClauses)) {
    this.resolvedClauses = this.resolvedClauses
      .map((clause) => String(clause).trim())
      .filter(Boolean);
  }

  // 1. Embedded proposal end must be after its start.
  const proposal = this.activityProposal;
  if (
    proposal?.requestedStartDateTime &&
    proposal?.requestedEndDateTime &&
    proposal.requestedEndDateTime <= proposal.requestedStartDateTime
  ) {
    this.invalidate(
      "activityProposal.requestedEndDateTime",
      "End date and time must be after the start date and time.",
    );
  }

  // 3. A resolution number is mandatory once it leaves the draft stage.
  if (this.status !== "Draft" && !String(this.resolutionNumber || "").trim()) {
    this.invalidate(
      "resolutionNumber",
      "A resolution number is required once a resolution is submitted.",
    );
  }

  // 4. Adoption requires an approved dean review with a timestamp.
  if (
    this.status === "Adopted" &&
    !(this.deanReview?.decision === "Approved" && this.deanReview?.reviewedAt)
  ) {
    this.invalidate(
      "status",
      "A resolution can only be adopted after the dean approves it.",
    );
  }
});

const Resolution = mongoose.model("Resolution", resolutionSchema);

Resolution.ACTIVITY_CATEGORIES = ACTIVITY_CATEGORIES;
Resolution.TARGET_VENUES = TARGET_VENUES;
Resolution.TARGET_AUDIENCES = TARGET_AUDIENCES;
Resolution.RESOLUTION_STATUSES = RESOLUTION_STATUSES;

module.exports = Resolution;
