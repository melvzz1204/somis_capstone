const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true, trim: true },
    middleInitial: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },
    suffix: { type: String, trim: true, default: "" },
    studentIdNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d{11}$/.test(value),
        message: "Contact number must be exactly 11 digits",
      },
    },
    birthDate: { type: Date, required: true },
    college: { type: String, required: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    program: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    yearLevel: {
      type: String,
      required: true,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+"],
    },
    // Students cannot change their section/year level/program on their own once
    // they have attendance or dues activity. An officer can temporarily unlock
    // editing per student; the unlock is consumed after the next successful save.
    academicEditUnlocked: {
      type: Boolean,
      default: false,
    },
    academicEditUnlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    academicEditUnlockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
