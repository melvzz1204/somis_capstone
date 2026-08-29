const mongoose = require("mongoose");

const attendanceFineSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      default: "Absent from organization event",
      trim: true,
    },
    status: {
      type: String,
      enum: ["UNPAID", "WAIVED"],
      default: "UNPAID",
    },
  },
  { timestamps: true },
);

attendanceFineSchema.index({ event: 1, student: 1 }, { unique: true });
attendanceFineSchema.index({ org: 1, student: 1, status: 1 });

module.exports = mongoose.model("AttendanceFine", attendanceFineSchema);
