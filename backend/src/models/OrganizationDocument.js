const mongoose = require("mongoose");

const DOCUMENT_TYPES = ["Annual Report", "Activity Plan"];
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const DOCUMENT_STATUSES = [
  "Pending Adviser Review",
  "Pending OVPSAS Review",
  "Approved",
  "Rejected",
];

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    mimetype: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const reviewSchema = new mongoose.Schema(
  {
    decision: {
      type: String,
      enum: ["Approved", "Rejected"],
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
  { _id: false },
);

const organizationDocumentSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    schoolYear: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{4}$/, "School year must use the YYYY-YYYY format."],
    },
    semester: {
      type: String,
      enum: SEMESTERS,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      required: true,
      validate: [
        {
          validator: (attachments) => attachments.length >= 1,
          message: "At least one attachment is required.",
        },
        {
          validator: (attachments) => attachments.length <= 10,
          message: "A submission can contain at most 10 attachments.",
        },
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: "Pending Adviser Review",
      index: true,
    },
    adviserReview: {
      type: reviewSchema,
      default: undefined,
    },
    ovpsasReview: {
      type: reviewSchema,
      default: undefined,
    },
  },
  { timestamps: true },
);

organizationDocumentSchema.index({ org: 1, documentType: 1, createdAt: -1 });
organizationDocumentSchema.index({ status: 1, createdAt: -1 });

organizationDocumentSchema.pre("validate", function validateSchoolYear() {
  const match = /^(\d{4})-(\d{4})$/.exec(this.schoolYear || "");
  if (match && Number(match[2]) !== Number(match[1]) + 1) {
    this.invalidate(
      "schoolYear",
      "School year must contain consecutive years, for example 2026-2027.",
    );
  }
});

const OrganizationDocument = mongoose.model(
  "OrganizationDocument",
  organizationDocumentSchema,
);

module.exports = OrganizationDocument;
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
module.exports.SEMESTERS = SEMESTERS;
module.exports.DOCUMENT_STATUSES = DOCUMENT_STATUSES;
