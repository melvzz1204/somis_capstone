const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    idNumber: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
    },
    surname: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    middleInitial: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
      default: "",
    },
    suffix: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      lowercase: true,
      trim: true,
    },
    birthday: {
      type: Date,
      default: null,
    },
    year: {
      type: String, // e.g., "1st Year", "2nd Year", "3rd Year", "4th Year"
      trim: true,
      default: "",
    },
    program: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String, // e.g., "BSIT 3-A"
      trim: true,
      default: "",
    },
    role: {
      type: String,
      required: [true, "Role/Position is required"],
      enum: [
        "President",
        "Vice-President",
        "Secretary",
        "Treasurer",
        "Auditor",
        "Business Manager",
        "P.I.O",
        "Sgt. & Arms",
        "Muse",
        "Escort",
        "Member",
        "Faculty Adviser",
      ],
    },
    avatar: {
      type: String,
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    hasAccount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Member", memberSchema);
