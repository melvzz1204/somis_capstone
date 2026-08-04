const { sendEmail } = require("../config/nodeMailer.js");
const crypto = require("crypto");
const Member = require("../models/MemberOrganization.js");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ==========================================
// 1. GET MEMBERS BY ORGANIZATION
// ==========================================
exports.getMembersByOrg = async (req, res) => {
  try {
    const orgId =
      req.user?.orgId ||
      req.user?.organization ||
      req.user?._id ||
      req.params.orgId;

    if (!orgId) {
      return res.status(400).json({ message: "Organization ID is required." });
    }

    const members = await Member.find({ organization: orgId }).sort({
      createdAt: -1,
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ message: "Failed to retrieve roster." });
  }
};

// ==========================================
// 2. ADD NEW MEMBER / OFFICER WITH AVATAR
// ==========================================
exports.addMember = async (req, res) => {
  try {
    console.log("ADD MEMBER REQ.BODY:", req.body);
    console.log("ADD MEMBER REQ.FILE:", req.file);
    const { idNumber, name, email, birthday, year, section, role } = req.body;

    const orgId =
      req.user?.orgId ||
      req.user?.organization ||
      req.body.organization ||
      req.user?._id;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and position are required." });
    }

    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/${req.file.filename}`;
    }

    const newMember = await Member.create({
      idNumber,
      name,
      email,
      birthday: birthday ? new Date(birthday) : null,
      year,
      section,
      role,
      avatar: avatarPath,
      organization: orgId,
    });

    return res.status(201).json({
      message: "Officer/Member added successfully!",
      member: newMember,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    return res.status(500).json({ message: "Failed to save member." });
  }
};

// ==========================================
// 3. DELETE MEMBER
// ==========================================
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMember = await Member.findByIdAndDelete(id);

    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found." });
    }

    return res.status(200).json({ message: "Member removed successfully." });
  } catch (error) {
    console.error("Error deleting member:", error);
    return res.status(500).json({ message: "Failed to delete member." });
  }
};

// ==========================================
// 4. UPDATE MEMBER / OFFICER DETAILS
// ==========================================
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { idNumber, name, email, birthday, year, section, role } = req.body;

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    if (idNumber !== undefined) member.idNumber = idNumber;
    if (name) member.name = name;
    if (email) member.email = email;
    if (birthday !== undefined)
      member.birthday = birthday ? new Date(birthday) : null;
    if (year !== undefined) member.year = year;
    if (section !== undefined) member.section = section;
    if (role) member.role = role;

    if (req.file) {
      member.avatar = `/uploads/${req.file.filename}`;
    }

    await member.save();

    return res.status(200).json({
      message: "Member updated successfully!",
      member,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({ message: "Failed to update member." });
  }
};

// ==========================================
// HELPER: Map Member positions to User enums
// ==========================================
const mapMemberRoleToUserRole = (memberRole) => {
  if (!memberRole) return "student";

  const roleLower = memberRole.toLowerCase().trim();

  if (roleLower.includes("secretary")) return "secretary";
  if (roleLower.includes("treasurer")) return "treasurer";
  if (roleLower.includes("adviser") || roleLower.includes("advisor"))
    return "adviser";
  if (roleLower.includes("president")) return "org_admin";

  return "student";
};

// ==========================================
// 5. CREATE LOGIN USER ACCOUNT FOR AN OFFICER
// ==========================================
exports.createOfficerAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: "Member record not found." });
    }

    const cleanEmail = member.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "A user account with this email already exists." });
    }

    const assignedUserRole = mapMemberRoleToUserRole(member.role);

    const newUser = await User.create({
      name: member.name,
      email: cleanEmail,
      password: password,
      role: assignedUserRole,
      organization: member.organization,
      status: "Active",
    });

    member.hasAccount = true;
    await member.save();

    return res.status(201).json({
      message: `User account created successfully for ${member.name}!`,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Error creating officer account:", error);
    return res.status(500).json({
      message: error.message || "Failed to create user account.",
    });
  }
};

// ==========================================
// 6. SEND ACCOUNT INVITATION EMAIL
// ==========================================
exports.sendMemberInvite = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📩 Processing sendMemberInvite for ID:", id);

    const member = await Member.findById(id);
    if (!member) {
      console.warn(`⚠️ Member with ID ${id} was not found in the database.`);
      return res
        .status(404)
        .json({ message: `Member with ID ${id} was not found.` });
    }

    // 1. Generate random setup token (24h expiry)
    const setupToken = crypto.randomBytes(32).toString("hex");
    const setupTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cleanEmail = member.email.toLowerCase().trim();

    // 2. Map role using helper function
    const assignedRole = mapMemberRoleToUserRole(member.role); // 👈 FIX 2: Used role mapping helper

    // 3. Create or find User record
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = new User({
        name: member.name,
        email: cleanEmail,
        role: assignedRole,
        organization: member.organization,
        setupToken,
        setupTokenExpires,
      });
    } else {
      user.setupToken = setupToken;
      user.setupTokenExpires = setupTokenExpires;
    }

    await user.save();

    // 4. Construct activation link
    const setupUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/setup-account?token=${setupToken}`;

    await sendEmail({
      to: member.email,
      subject: "Action Required: Set Up Your Account Credentials",
      html: `
    <h2>Welcome to MarSU SOMIS</h2>
    <p>Hello ${member.name},</p>
    <p>An account setup request has been created for your role as <strong>${member.role}</strong>.</p>
    <p>Please click the button below to set up your password and activate your account:</p>
    <a href="${setupUrl}" style="display:inline-block; padding:10px 20px; background-color:#4A0E17; color:#fff; text-decoration:none; border-radius:8px;">Set Up Password</a>
    <p>This link will expire in 24 hours.</p>
  `,
    });

    return res.status(200).json({
      message: `Setup invitation email sent to ${member.email}!`,
    });
  } catch (error) {
    console.error("❌ Invite error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to send invitation email." });
  }
};

exports.setupAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    // 1. Find user by valid, non-expired setup token
    const user = await User.findOne({
      setupToken: token,
      setupTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired setup token." });
    }

    // 2. Set password (pre-save hook in User schema will hash it) and clear setup token
    user.password = password;
    user.setupToken = undefined;
    user.setupTokenExpires = undefined;
    user.status = "Active";

    await user.save();

    return res.status(200).json({
      message: "Account activated successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("❌ Setup account error:", error);
    return res.status(500).json({
      message: error.message || "Failed to setup account.",
    });
  }
};
