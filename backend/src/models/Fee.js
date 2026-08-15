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
    baseCost: {
      type: Number,
      min: [0, "Base cost cannot be negative"],
      default: 0,
    },
    marginPerMember: {
      type: Number,
      min: [0, "Margin cannot be negative"],
      default: 0,
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
      enum: [
        "All",
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year+",
      ],
      default: "All",
    },
    targetMembers: [
      {
        _id: false,
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Member",
          default: null,
        },
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        studentIdNumber: { type: String, trim: true, default: "" },
        yearLevel: { type: String, trim: true, default: "" },
        program: { type: String, trim: true, default: "" },
        section: { type: String, trim: true, default: "" },
        role: { type: String, trim: true, default: "Member" },
      },
    ],
    targetMemberCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    expectedCollection: {
      type: Number,
      min: 0,
      default: 0,
    },
    expectedCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    expectedMargin: {
      type: Number,
      min: 0,
      default: 0,
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
    // Treasurer-only organization view state. This must not hide the fee from students.
    treasurerArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

feeSchema.index({ org: 1, status: 1, dueDate: 1 });
feeSchema.index({ org: 1, "targetMembers.member": 1 });
feeSchema.index({ org: 1, "targetMembers.student": 1 });

module.exports = mongoose.model("Fee", feeSchema);
