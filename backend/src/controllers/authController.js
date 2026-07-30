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

    // Populate organization details so frontend knows who logged in
    const user = await User.findOne({ email: email.toLowerCase() }).populate(
      "organization",
    );
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check if user clicked email link yet
    if (!user.password && user.setupToken) {
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

// POST /v1/auth/setup-account
exports.setupAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Setup token and password are required." });
    }

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      setupToken: token,
      setupTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired setup token. Please contact OVPSAS Admin.",
      });
    }

    // Assign password (pre-save hook in User model automatically hashes this)
    user.password = password;
    user.setupToken = undefined;
    user.setupTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: "Password created successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// GET /v1/auth/me
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
