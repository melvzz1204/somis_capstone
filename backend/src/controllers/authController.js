const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// 1. LOGIN FUNCTION
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("organization");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "Account setup is incomplete. Please check your email for the setup link.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, orgId: user.organization?._id },
      process.env.JWT_SECRET || "capstone_secret_key_123",
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 2. SETUP ACCOUNT FUNCTION (Missing previously)
// ==========================================
exports.setupAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      setupToken: token,
      setupTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired setup token." });
    }

    // Hash password and clear tokens
    user.password = password; // User model pre-save hook handles hashing
    user.setupToken = undefined;
    user.setupTokenExpires = undefined;
    user.status = "Active";

    await user.save();

    // Generate JWT token for auto-login
    const authToken = jwt.sign(
      { id: user._id, role: user.role, orgId: user.organization?._id },
      process.env.JWT_SECRET || "capstone_secret_key_123",
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Account setup successful!",
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // e.g. "treasurer"
        organization: user.organization,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to setup account." });
  }
};

// ==========================================
// 3. GET ME FUNCTION (Missing previously)
// ==========================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("organization");
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error." });
  }
};
