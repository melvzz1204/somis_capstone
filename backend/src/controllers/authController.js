const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST /v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // 👈 Added .select("+password") so bcrypt gets the hashed password string
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("organization");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 👈 Check if account lacks a password (setup not completed)
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
