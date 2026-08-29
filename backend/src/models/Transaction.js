const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      default: null,
      index: true,
    },
    fundingFee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      default: null,
      index: true,
    },
    receiptImageUrl: {
      type: String,
      trim: true,
      required: [
        function requireReceiptForExpense() {
          return this.type === "expense";
        },
        "Receipt image URL is required for expense entries",
      ],
    },
    unitPriceSnapshot: { type: Number, min: 0, default: 0 },
    baseCostSnapshot: { type: Number, min: 0, default: 0 },
    estimatedCost: { type: Number, min: 0, default: 0 },
    netIncome: { type: Number, default: 0 },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    semester: {
      type: String,
      enum: ["1st Semester", "2nd Semester", "Summer"],
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    reference: { type: String, trim: true, maxlength: 100, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

transactionSchema.index({
  organization: 1,
  academicYear: 1,
  semester: 1,
  date: -1,
  createdAt: -1,
});
transactionSchema.index({ organization: 1, fee: 1, type: 1 });
transactionSchema.index({ organization: 1, fundingFee: 1, type: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
