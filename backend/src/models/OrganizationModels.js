const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    acronym: {
      type: String,
      required: [true, "Acronym is required"],
      uppercase: true,
      trim: true,
    },
    college: {
      type: String,
      required: [true, "College assignment is required"],
      trim: true,
    },
    adviser: {
      type: String,
      default: "",
      trim: true,
    },
    academicPeriod: {
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
      updatedAt: {
        type: Date,
      },
    },
    president: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Organization", organizationSchema);
