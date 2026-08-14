const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Announcement title is required."],
      trim: true,
      maxlength: 140,
    },
    content: {
      type: String,
      required: [true, "Announcement content is required."],
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: [
        "Clearance Issuance",
        "General",
        "Event",
        "Deadline",
        "Academic",
        "Emergency",
      ],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },
    audience: {
      type: String,
      enum: ["All Members", "Officers", "Students"],
      default: "All Members",
    },
    status: {
      type: String,
      enum: ["Draft", "Scheduled", "Published", "Archived"],
      default: "Draft",
      index: true,
    },
    publishAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    actionLabel: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

announcementSchema.index({ organization: 1, status: 1, createdAt: -1 });
announcementSchema.index({ organization: 1, publishAt: 1 });

announcementSchema.pre("validate", function () {
  if (this.status === "Scheduled" && !this.publishAt) {
    this.invalidate(
      "publishAt",
      "A scheduled announcement needs a publish date.",
    );
  }

  if (this.expiresAt && this.publishAt && this.expiresAt <= this.publishAt) {
    this.invalidate(
      "expiresAt",
      "The expiry date must be after the publication date.",
    );
  }

  if (Boolean(this.actionLabel) !== Boolean(this.actionUrl)) {
    this.invalidate(
      "actionUrl",
      "An action label and action URL must be provided together.",
    );
  }
});

module.exports = mongoose.model("Announcement", announcementSchema);
