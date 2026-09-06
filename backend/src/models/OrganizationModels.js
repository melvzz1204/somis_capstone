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
    organizationType: {
      type: String,
      enum: ["parent", "suborganization"],
      default: "parent",
      required: true,
    },
    parentOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    adviser: {
      type: String,
      default: "",
      trim: true,
    },
    attendanceFineAmount: {
      type: Number,
      min: 0,
      default: 0,
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

organizationSchema.index({ parentOrganization: 1, status: 1, name: 1 });
organizationSchema.index({ organizationType: 1, college: 1 });

organizationSchema.pre("validate", function validateHierarchy() {
  if (this.organizationType === "suborganization" && !this.parentOrganization) {
    this.invalidate(
      "parentOrganization",
      "A suborganization must have a parent organization.",
    );
  }

  if (this.organizationType !== "suborganization" && this.parentOrganization) {
    this.invalidate(
      "parentOrganization",
      "Only suborganizations may have a parent organization.",
    );
  }

  if (
    this.parentOrganization &&
    this._id &&
    this.parentOrganization.equals(this._id)
  ) {
    this.invalidate(
      "parentOrganization",
      "An organization cannot be its own parent.",
    );
  }
});

module.exports = mongoose.model("Organization", organizationSchema);
