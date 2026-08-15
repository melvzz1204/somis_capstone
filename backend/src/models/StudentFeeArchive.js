const mongoose = require("mongoose");

const studentFeeArchiveSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    state: {
      type: String,
      enum: ["archived", "deleted"],
      default: "archived",
      required: true,
    },
  },
  { timestamps: true },
);

studentFeeArchiveSchema.index({ student: 1, fee: 1 }, { unique: true });

module.exports = mongoose.model("StudentFeeArchive", studentFeeArchiveSchema);
