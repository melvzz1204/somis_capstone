const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Meeting title is required."],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    venue: {
      type: String,
      required: [true, "Meeting venue is required."],
      trim: true,
      maxlength: 250,
    },
    audience: {
      type: String,
      enum: ["All Members", "Officers", "Students"],
      default: "All Members",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

meetingSchema.index({ organization: 1, startDateTime: 1 });

meetingSchema.pre("validate", function validateMeetingTime() {
  if (
    this.startDateTime &&
    this.endDateTime &&
    this.endDateTime <= this.startDateTime
  ) {
    this.invalidate(
      "endDateTime",
      "Meeting end time must be after its start time.",
    );
  }
});

module.exports = mongoose.model("Meeting", meetingSchema);
