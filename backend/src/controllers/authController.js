const User = require("../models/User");
const StudentProfile = require("../models/studentProfile");
const Organization = require("../models/OrganizationModels");
const College = require("../models/College");
const Member = require("../models/MemberOrganization");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../config/nodeMailer");

// ==========================================
// 1. REGISTER STUDENT FUNCTION
// ==========================================
exports.registerStudent = async (req, res) => {
  try {
    const {
      firstName,
      middleInitial,
      lastName,
      suffix,
      studentIdNumber,
      contactNumber,
      birthDate,
      officialEmail,
      college,
      organizationId,
      program,
      section,
      yearLevel,
    } = req.body;

    // 1. Validate email domain
    const normalizedEmail = String(officialEmail || "")
      .toLowerCase()
      .trim();
    const isApprovedEmail = [
      "@marsu.edu.ph",
      "@marstateu.edu.ph",
      "@gmail.com",
    ].some((domain) => normalizedEmail.endsWith(domain));

    if (!isApprovedEmail) {
      return res.status(400).json({
        message:
          "Use your MarSU email (@marsu.edu.ph or @marstateu.edu.ph), or an approved Gmail address.",
      });
    }

    // 2. Verify the selected organization belongs to the selected college.
    if (!organizationId) {
      return res.status(400).json({
        message: "Select the organization you belong to.",
      });
    }

    const selectedOrganization = await Organization.findOne({
      _id: organizationId,
      college,
      status: "Active",
    });

    if (!selectedOrganization) {
      return res.status(400).json({
        message:
          "The selected organization is unavailable or does not belong to your college.",
      });
    }

    const normalizedProgram = String(program || "").trim();
    const normalizedSection = String(section || "").trim();
    const selectedCollege = await College.findOne({ name: college });
    const isRegisteredProgram = selectedCollege?.programs.some(
      (registeredProgram) =>
        registeredProgram.name.toLowerCase() ===
        normalizedProgram.toLowerCase(),
    );

    if (!selectedCollege || !isRegisteredProgram) {
      return res.status(400).json({
        message: "Select a college and program registered by OVPSAS.",
      });
    }

    if (!normalizedSection) {
      return res.status(400).json({
        message: "Student section is required (for example, BSIT 3B).",
      });
    }

    // 3. Check for duplicate email or Student ID
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    const existingID = await StudentProfile.findOne({ studentIdNumber });
    if (existingID) {
      return res
        .status(400)
        .json({ message: "This Student ID number is already registered." });
    }

    // 4. Format full name
    const formattedName = `${firstName.trim()} ${
      middleInitial ? middleInitial.trim() + " " : ""
    }${lastName.trim()}${suffix ? " " + suffix.trim() : ""}`.trim();

    // 5. Generate setup token and expiration (24 Hours)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 6. Create an unverified student account linked to the organization.
    const newUser = await User.create({
      name: formattedName,
      email: normalizedEmail,
      role: "student",
      status: "Pending",
      organization: selectedOrganization._id,
      setupToken: rawToken,
      setupTokenExpires: tokenExpires,
    });

    // 7. Store the academic profile with the same organization relationship.
    await StudentProfile.create({
      user: newUser._id,
      firstName,
      middleInitial,
      lastName,
      suffix,
      studentIdNumber,
      contactNumber: String(contactNumber || "").trim(),
      birthDate,
      college,
      organization: selectedOrganization._id,
      program: normalizedProgram,
      section: normalizedSection,
      yearLevel,
    });

    // 8. Add or synchronize the student in the organization's official roster.
    await Member.findOneAndUpdate(
      {
        organization: selectedOrganization._id,
        email: normalizedEmail,
      },
      {
        $set: {
          idNumber: studentIdNumber,
          name: formattedName,
          birthday: birthDate,
          year: yearLevel,
          program: normalizedProgram,
          section: normalizedSection,
          hasAccount: true,
        },
        $setOnInsert: {
          role: "Member",
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    // 9. Send setup email using your existing sendEmail helper
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const setupLink = `${clientUrl}/setup-account?token=${rawToken}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "MarSU SOMIS - Account Setup Link",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4A0E17;">Welcome to MarSU SOMIS Portal</h2>
          <p>Your student registration request has been received. Please click the button below to configure your account password and activate access:</p>
          <p style="margin: 25px 0;">
            <a href="${setupLink}" style="background-color: #4A0E17; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Set Up Account Password
            </a>
          </p>
          <p style="font-size: 12px; color: #777;">This link will expire in 24 hours.</p>
        </div>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Setup link sent to email.",
      organization: {
        _id: selectedOrganization._id,
        name: selectedOrganization.name,
        acronym: selectedOrganization.acronym,
      },
    });
  } catch (error) {
    console.error("Register Student Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

// ==========================================
// 2. LOGIN FUNCTION
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
// 3. SETUP ACCOUNT FUNCTION
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
    user.password = password; // Pre-save hook in User model handles hashing
    user.setupToken = undefined;
    user.setupTokenExpires = undefined;
    user.status = "Active";

    await user.save();

    // Keep the organization roster synchronized so active officers receive
    // the account badge as soon as setup succeeds.
    if (user.organization) {
      await Member.findOneAndUpdate(
        {
          organization: user.organization,
          email: user.email.toLowerCase().trim(),
        },
        { $set: { hasAccount: true } },
      );
    }

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
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Setup account error:", error);
    return res.status(500).json({ message: "Failed to setup account." });
  }
};

// ==========================================
// 4. GET ME FUNCTION
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
