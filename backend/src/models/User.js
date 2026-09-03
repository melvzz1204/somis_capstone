const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Prevents password hash leaks in API responses
      required: function () {
        return !this.setupToken;
      },
    },
    role: {
      type: String,
      enum: [
        "admin",
        "org_admin",
        "student",
        "secretary",
        "treasurer",
        "pio",
        "adviser",
        "dean",
      ],
      default: "student",
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive"],
      default: "Pending",
    },
    avatar: {
      type: String,
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    setupToken: {
      type: String,
    },
    setupTokenExpires: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Hash password automatically before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
