const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    proposalTitle: { type: String, required: true, trim: true, maxlength: 150 },
    activityCategory: {
      type: String,
      required: true,
      enum: [
        "Academic",
        "Non-Academic",
        "Community Service",
        "Fundraiser",
        "Sports & Recreation",
        "General Assembly / Meeting",
      ],
    },
    projectObjectives: { type: String, required: true, trim: true },
    projectDescription: { type: String, required: true, trim: true },
    requestedStartDateTime: { type: Date, required: true },
    requestedEndDateTime: { type: Date, required: true },
    targetVenue: {
      type: String,
      required: true,
      enum: [
        "AVR",
        "Gymnasium",
        "Student Center",
        "Classroom",
        "Outdoor Grounds",
        "Off-Campus / Virtual",
      ],
    },
    expectedAttendees: { type: Number, required: true, min: 1 },
    targetAudience: {
      type: String,
      required: true,
      enum: [
        "Org Members Only",
        "All University Students",
        "Faculty & Staff",
        "Open to External Public",
      ],
    },
    totalBudgetAllocation: { type: Number, required: true, min: 0 },
    sourceOfFunds: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    projectLeadPerson: { type: String, required: true, trim: true },
    projectLeadContact: { type: String, required: true, trim: true },
    attachments: [
      {
        originalName: String,
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Pending Adviser Review",
        "Pending Dean Review",
        "Pending OVPSAS Review",
        "Approved",
        "Rejected",
      ],
      default: "Submitted",
    },
    leaderReview: {
      decision: {
        type: String,
        enum: ["Approved", "Rejected"],
      },
      digitalSignature: {
        type: String,
        trim: true,
        maxlength: 150,
      },
      remarks: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
    },
    adviserReview: {
      decision: {
        type: String,
        enum: ["Approved", "Rejected"],
      },
      digitalSignature: { type: String, trim: true, maxlength: 150 },
      remarks: { type: String, trim: true, maxlength: 500, default: "" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
    },
    deanReview: {
      decision: {
        type: String,
        enum: ["Approved", "Rejected"],
      },
      digitalSignature: { type: String, trim: true, maxlength: 150 },
      remarks: { type: String, trim: true, maxlength: 500, default: "" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
    },
    ovpsasReview: {
      decision: {
        type: String,
        enum: ["Approved", "Rejected"],
      },
      digitalSignature: { type: String, trim: true, maxlength: 150 },
      remarks: { type: String, trim: true, maxlength: 500, default: "" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
    },
  },
  { timestamps: true },
);

proposalSchema.pre("validate", function () {
  if (
    this.requestedStartDateTime &&
    this.requestedEndDateTime &&
    this.requestedEndDateTime <= this.requestedStartDateTime
  ) {
    this.invalidate(
      "requestedEndDateTime",
      "End date and time must be after the start date and time.",
    );
  }
});

module.exports = mongoose.model("Proposal", proposalSchema);
