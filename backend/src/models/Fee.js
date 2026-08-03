const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    // Organization scoping field (CRITICAL FOR MULTI-TENANCY)
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required to create a fee drive"],
      index: true, // Speeds up queries when searching fees by org
    },
    title: {
      type: String,
      required: [true, "Fee title is required"],
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic Year is required"],
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
    },
    targetYearLevel: {
      type: String,
      default: "All",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Fee", feeSchema);
