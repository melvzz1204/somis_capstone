const mongoose = require("mongoose");

const PAYMENT_STATUSES = Object.freeze([
  "VERIFIED",
  "PENDING_MANUAL_REVIEW",
  "REJECTED",
]);

const VERIFICATION_METHODS = Object.freeze([
  "MANUAL",
  "AUTOMATE_SMS",
  "BULK_STATEMENT",
  "PAYMONGO",
  "CASH_MANUAL",
]);

const PAYMENT_METHODS = Object.freeze(["GCASH", "CASH"]);

/**
 * Converts a user-entered GCash reference to its canonical database form.
 *
 * @param {unknown} value
 * @returns {string}
 */
const normalizeReferenceNumber = (value) =>
  String(value ?? "").replace(/\D/g, "");

const finitePositiveNumber = {
  validator: (value) => Number.isFinite(value) && value > 0,
  message: "Amount must be a finite number greater than zero",
};

const smsVerificationChecksSchema = new mongoose.Schema(
  {
    referenceMatched: { type: Boolean, required: true },
    amountMatched: { type: Boolean, required: true },
    senderTrusted: { type: Boolean, required: true },
    recipientMatched: { type: Boolean, required: true },
    transactionTimeValid: { type: Boolean, required: true },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },
    claimedAmount: {
      type: Number,
      required: [true, "Claimed amount is required"],
      validate: finitePositiveNumber,
    },
    // Deprecated compatibility field used by the original fee/SMS payment UI.
    amount: {
      type: Number,
      select: false,
    },
    extractedAmount: {
      type: Number,
      min: [0, "Extracted amount cannot be negative"],
      validate: {
        validator: (value) => value == null || Number.isFinite(value),
        message: "Extracted amount must be a finite number",
      },
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "GCASH",
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      set: normalizeReferenceNumber,
      validate: {
        validator: (value) => value == null || /^\d{10,13}$/.test(value),
        message: "GCash reference number must contain 10 to 13 digits",
      },
    },
    cashReceiptNumber: {
      type: String,
      trim: true,
      maxlength: [100, "Cash receipt number is too long"],
    },
    cashNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Cash payment notes are too long"],
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paidAt: Date,
    receiptImageUrl: {
      type: String,
      required: [
        function requireReceiptForOcr() {
          return this.verificationMethod === "OCR";
        },
        "Receipt image URL is required",
      ],
      trim: true,
    },
    ocrRawText: {
      type: String,
      maxlength: [20000, "OCR audit text is too long"],
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "PENDING_MANUAL_REVIEW",
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Failure reason is too long"],
    },

    // Existing fee/SMS fields remain optional so current SOMIS workflows can migrate safely.
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: [...VERIFICATION_METHODS, "OCR"],
      default: "OCR",
    },
    rawSmsMessage: {
      type: String,
      trim: true,
      maxlength: [5000, "SMS audit message is too long"],
    },
    smsSender: {
      type: String,
      trim: true,
      maxlength: [100, "SMS sender is too long"],
    },
    smsAmount: {
      type: Number,
      min: [0, "SMS amount cannot be negative"],
      validate: {
        validator: (value) => value == null || Number.isFinite(value),
        message: "SMS amount must be a finite number",
      },
    },
    smsRecipient: {
      type: String,
      trim: true,
      maxlength: [100, "SMS recipient is too long"],
    },
    smsReceivedAt: Date,
    verificationChecks: smsVerificationChecksSchema,
    verifiedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { versionKey: false, virtuals: true },
    toObject: { versionKey: false, virtuals: true },
  },
);

// Keep legacy and canonical amount fields synchronized during future writes.
paymentSchema.pre("validate", function syncAmountFields() {
  if (!this.student && !this.member) {
    this.invalidate("student", "A user or roster member is required");
  }
  if (this.claimedAmount == null && this.amount != null) {
    this.claimedAmount = this.amount;
  }
  if (this.amount == null && this.claimedAmount != null) {
    this.amount = this.claimedAmount;
  }
});

// Only verified references are globally reserved. Rejected duplicate attempts remain auditable.
paymentSchema.index(
  { referenceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "VERIFIED",
      referenceNumber: { $type: "string" },
    },
  },
);
paymentSchema.index({
  organization: 1,
  status: 1,
  verifiedAt: -1,
  createdAt: -1,
});
paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ member: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.VERIFICATION_METHODS = VERIFICATION_METHODS;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.normalizeReferenceNumber = normalizeReferenceNumber;
