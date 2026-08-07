const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
    },
  },
  { timestamps: true },
);

const collegeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "College code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, "College name is required"],
      unique: true,
      trim: true,
      maxlength: 200,
    },
    programs: {
      type: [programSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("College", collegeSchema);
