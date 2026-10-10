const mongoose = require("mongoose");

const checkinSourceSchema = {
  type: String,
  enum: ["qr", "manual"],
  default: null,
};

const dailyAttendanceSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    morningInAt: { type: Date, default: null },
    lunchOutAt: { type: Date, default: null },
    afternoonInAt: { type: Date, default: null },
    afternoonOutAt: { type: Date, default: null },
    presentAt: { type: Date, default: null },
    morningInVia: checkinSourceSchema,
    lunchOutVia: checkinSourceSchema,
    afternoonInVia: checkinSourceSchema,
    afternoonOutVia: checkinSourceSchema,
  },
  { _id: false },
);

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
    days: { type: [dailyAttendanceSchema], default: [] },
    morningInAt: { type: Date, default: null },
    lunchOutAt: { type: Date, default: null },
    afternoonInAt: { type: Date, default: null },
    afternoonOutAt: { type: Date, default: null },
    presentAt: { type: Date, default: null },
    morningInVia: checkinSourceSchema,
    lunchOutVia: checkinSourceSchema,
    afternoonInVia: checkinSourceSchema,
    afternoonOutVia: checkinSourceSchema,
    lastMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastMarkedVia: checkinSourceSchema,
    lastManualReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

eventAttendanceSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("EventAttendance", eventAttendanceSchema);
