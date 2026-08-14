const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    venue: { type: String, required: true, trim: true },
    targetAudience: { type: String, required: true, trim: true },
    expectedAttendees: { type: Number, required: true, min: 1 },
    projectLeadPerson: { type: String, required: true, trim: true },
    projectLeadContact: { type: String, required: true, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendanceQr: {
      onsite: {
        tokenHash: { type: String, select: false, default: null },
        generatedAt: { type: Date, default: null },
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
    },
    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true },
);

eventSchema.pre("validate", function () {
  if (
    this.startDateTime &&
    this.endDateTime &&
    this.endDateTime <= this.startDateTime
  ) {
    this.invalidate(
      "endDateTime",
      "Event end time must be after its start time.",
    );
  }
});

module.exports = mongoose.model("Event", eventSchema);
