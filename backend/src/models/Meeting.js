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
    // Optional narrowing of the audience. Empty means "all" within the
    // selected audience (e.g. every year level / every section).
    targetYear: {
      type: String,
      trim: true,
      default: "",
    },
    targetSection: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Members who already opened the meeting details. A newly created (or
    // materially updated) meeting starts unseen except by its author, which
    // drives the "new meeting" notification badge.
    viewedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    // Self RSVP: members who tapped "Join" on the meeting.
    joins: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: { type: String, trim: true, default: "" },
          email: { type: String, lowercase: true, trim: true, default: "" },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    // Final record: the president's manual present/absent marking after
    // (or during) the meeting. Walk-ins are recorded here too.
    attendance: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          name: { type: String, trim: true, default: "" },
          email: { type: String, lowercase: true, trim: true, default: "" },
          present: { type: Boolean, default: false },
          markedAt: { type: Date, default: Date.now },
          markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      default: [],
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
