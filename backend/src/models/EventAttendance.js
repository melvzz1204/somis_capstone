const mongoose = require("mongoose");

const eventAttendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
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
    status: {
      type: String,
      enum: ["Pending", "Present"],
      required: true,
      default: "Pending",
    },
    joinedAt: { type: Date, default: null },
    presentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

eventAttendanceSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("EventAttendance", eventAttendanceSchema);
