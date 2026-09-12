const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    resolution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resolution",
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
    attendanceSchedule: {
      morningIn: { type: String, trim: true, default: "08:00" },
      morningOut: { type: String, trim: true, default: "12:00" },
      afternoonIn: { type: String, trim: true, default: "13:00" },
      afternoonOut: { type: String, trim: true, default: "17:00" },
      configuredAt: { type: Date, default: null },
      configuredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    attendanceDays: [
      {
        day: { type: Number, required: true, min: 1 },
        date: { type: Date, required: true },
        schedule: {
          morningIn: { type: String, trim: true, default: "08:00" },
          morningOut: { type: String, trim: true, default: "12:00" },
          afternoonIn: { type: String, trim: true, default: "13:00" },
          afternoonOut: { type: String, trim: true, default: "17:00" },
        },
        attendanceQr: {
          morning_in: {
            tokenHash: { type: String, select: false, default: null },
            code: { type: String, select: false, default: null },
            generatedAt: Date,
            generatedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
          },
          lunch_out: {
            tokenHash: { type: String, select: false, default: null },
            code: { type: String, select: false, default: null },
            generatedAt: Date,
            generatedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
          },
          afternoon_in: {
            tokenHash: { type: String, select: false, default: null },
            code: { type: String, select: false, default: null },
            generatedAt: Date,
            generatedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
          },
          afternoon_out: {
            tokenHash: { type: String, select: false, default: null },
            code: { type: String, select: false, default: null },
            generatedAt: Date,
            generatedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
          },
        },
      },
    ],
    attendanceQr: {
      morning_in: {
        tokenHash: { type: String, select: false, default: null },
        code: { type: String, select: false, default: null },
        generatedAt: { type: Date, default: null },
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
      lunch_out: {
        tokenHash: { type: String, select: false, default: null },
        code: { type: String, select: false, default: null },
        generatedAt: { type: Date, default: null },
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
      afternoon_in: {
        tokenHash: { type: String, select: false, default: null },
        code: { type: String, select: false, default: null },
        generatedAt: { type: Date, default: null },
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
      afternoon_out: {
        tokenHash: { type: String, select: false, default: null },
        code: { type: String, select: false, default: null },
        generatedAt: { type: Date, default: null },
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
    },
    attendanceFineAmount: {
      type: Number,
      min: 0,
      default: null,
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
