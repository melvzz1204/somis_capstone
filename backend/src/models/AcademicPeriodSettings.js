const mongoose = require("mongoose");

const academicPeriodSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "global",
    },
    academicYear: {
      type: String,
      trim: true,
      default: "",
    },
    semester: {
      type: String,
      enum: ["1st Semester", "2nd Semester", "Summer"],
      default: "1st Semester",
    },
    mode: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "AcademicPeriodSettings",
  academicPeriodSettingsSchema,
);
