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
    date: { type: Date, required: true },
    reference: { type: String, trim: true, maxlength: 100, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

transactionSchema.index({ organization: 1, date: -1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
