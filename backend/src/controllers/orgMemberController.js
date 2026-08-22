const { sendEmail } = require("../config/nodeMailer.js");
const { createSetupUrl } = require("../config/frontendUrl");
const crypto = require("crypto");
const Member = require("../models/MemberOrganization.js");
const User = require("../models/User");
const StudentProfile = require("../models/studentProfile");
const Organization = require("../models/OrganizationModels");
const bcrypt = require("bcryptjs");

const cleanNamePart = (value = "") => String(value).trim().replace(/\s+/g, " ");

const normalizeMiddleInitial = (value = "") => {
  const initial = cleanNamePart(value)
    .replace(/\./g, "")
    .charAt(0)
    .toUpperCase();
  return initial ? `${initial}.` : "";
};

const formatMemberName = ({ surname, firstName, middleInitial, suffix }) => {
  const cleanSurname = cleanNamePart(surname);
  const cleanFirstName = cleanNamePart(firstName);
  const cleanMiddleInitial = normalizeMiddleInitial(middleInitial);
  const cleanSuffix = cleanNamePart(suffix);

  const givenName = [cleanFirstName, cleanMiddleInitial]
    .filter(Boolean)
    .join(" ");
  const baseName =
    cleanSurname && givenName ? `${cleanSurname}, ${givenName}` : "";

  return [baseName, cleanSuffix].filter(Boolean).join(", ");
};

// ==========================================
// 1. GET MEMBERS BY ORGANIZATION
// ==========================================
exports.getMembersByOrg = async (req, res) => {
  try {
    const orgId =
      req.user?.orgId ||
      req.user?.organization ||
      req.params.orgId ||
      req.user?._id;

    if (!orgId) {
      return res.status(400).json({ message: "Organization ID is required." });
    }

    // Older organizations may have been created before presidents were also
    // stored in the official roster. Backfill the record from the OVPSAS-entered
    // organization details without overwriting a profile already completed by
    // the president.
    const organization =
      await Organization.findById(orgId).select("president email");
    if (organization?.president && organization?.email) {
      const normalizedPresidentEmail = organization.email.toLowerCase().trim();
      const existingPresident = await Member.findOne({
        organization: organization._id,
        email: normalizedPresidentEmail,
      });

      if (!existingPresident) {
        const presidentSurname = cleanNamePart(organization.president);
        await Member.create({
          name: presidentSurname,
          surname: presidentSurname,
          email: normalizedPresidentEmail,
          role: "President",
          organization: organization._id,
          hasAccount: true,
        });
      } else {
        existingPresident.role = "President";
        existingPresident.hasAccount = true;
        await existingPresident.save();
      }
    }

    // Reconcile legacy officer records with active login accounts so the
    // dashboard can reliably display their account status.
    const activeAccountEmails = await User.find({
      organization: orgId,
      status: "Active",
    }).distinct("email");

    if (activeAccountEmails.length > 0) {
      await Member.updateMany(
        {
          organization: orgId,
          email: { $in: activeAccountEmails },
          hasAccount: { $ne: true },
        },
        { $set: { hasAccount: true } },
      );
    }

    const members = await Member.find({ organization: orgId }).sort({
      role: 1,
      createdAt: -1,
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ message: "Failed to retrieve roster." });
  }
};

// ==========================================
// 2. GET THE LOGGED-IN STUDENT'S ORGANIZATION AND ROSTER
// ==========================================
exports.getMyOrganization = async (req, res) => {
  try {
    const normalizedEmail = req.user.email.toLowerCase().trim();
    let organization = req.user.organization
      ? await Organization.findById(req.user.organization)
      : null;
    let membership = null;

    if (organization) {
      membership = await Member.findOne({
        organization: organization._id,
        email: normalizedEmail,
      });
    } else {
      // Preserve access for legacy accounts created before organization
      // selection became part of student registration.
      membership = await Member.findOne({ email: normalizedEmail }).populate(
        "organization",
      );

      if (membership?.organization) {
        organization = membership.organization;
        await Promise.all([
          User.findByIdAndUpdate(req.user._id, {
            organization: organization._id,
          }),
          StudentProfile.findOneAndUpdate(
            { user: req.user._id },
            { organization: organization._id },
          ),
        ]);
      }
    }

    const studentProfile = await StudentProfile.findOne({ user: req.user._id });

    if (!organization) {
      return res.status(200).json({
        organization: null,
        membership: null,
        roster: [],
        studentProfile,
      });
    }

    const roster = await Member.find({
      organization: organization._id,
    }).sort({ role: 1, name: 1 });

    return res.status(200).json({
      organization,
      membership,
      roster,
      studentProfile,
    });
  } catch (error) {
    console.error("Error fetching student organization:", error);
    return res.status(500).json({
      message: "Failed to retrieve your organization details.",
    });
  }
};

// ==========================================
// 3. ADD NEW MEMBER / OFFICER WITH AVATAR
// ==========================================
exports.addMember = async (req, res) => {
  try {
    console.log("ADD MEMBER REQ.BODY:", req.body);
    console.log("ADD MEMBER REQ.FILE:", req.file);
    const {
      idNumber,
      name,
      surname,
      firstName,
      middleInitial,
      suffix,
      email,
      birthday,
      year,
      program,
      section,
      role,
    } = req.body;

    const orgId =
      req.user?.orgId ||
      req.user?.organization ||
      req.body.organization ||
      req.user?._id;
    const normalizedRole = String(role || "").trim();
    const isFacultySignatory = ["Faculty Adviser", "Department Dean"].includes(
      normalizedRole,
    );

    const hasStructuredName = Boolean(
      cleanNamePart(surname) && cleanNamePart(firstName),
    );
    const displayName = hasStructuredName
      ? formatMemberName({ surname, firstName, middleInitial, suffix })
      : cleanNamePart(name);

    if (!displayName || !email || !normalizedRole) {
      return res.status(400).json({
        message: "Surname, first name, email, and position are required.",
      });
    }

    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/${req.file.filename}`;
    }

    if (normalizedRole === "Department Dean") {
      const existingDean = await Member.findOne({
        organization: orgId,
        role: "Department Dean",
      });
      if (existingDean) {
        return res.status(409).json({
          message:
            "A department dean is already registered for this organization.",
        });
      }
    }

    const newMember = await Member.create({
      idNumber: isFacultySignatory ? "" : idNumber || "",
      name: displayName,
      surname: hasStructuredName ? cleanNamePart(surname) : "",
      firstName: hasStructuredName ? cleanNamePart(firstName) : "",
      middleInitial: hasStructuredName
        ? normalizeMiddleInitial(middleInitial)
        : "",
      suffix: hasStructuredName ? cleanNamePart(suffix) : "",
      email,
      birthday: isFacultySignatory
        ? null
        : birthday
          ? new Date(birthday)
          : null,
      year: isFacultySignatory ? "" : year || "",
      program: isFacultySignatory ? "" : program || "",
      section: isFacultySignatory ? "" : section || "",
      role: normalizedRole,
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
    const {
      idNumber,
      name,
      surname,
      firstName,
      middleInitial,
      suffix,
      email,
      birthday,
      year,
      program,
      section,
      role,
    } = req.body;

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    if (idNumber !== undefined) member.idNumber = idNumber;

    const isPresident = member.role === "President";
    const preservedPresidentSurname = isPresident
      ? member.surname || cleanNamePart(String(member.name || "").split(",")[0])
      : "";
    const structuredNameWasSubmitted =
      surname !== undefined ||
      firstName !== undefined ||
      middleInitial !== undefined ||
      suffix !== undefined;

    if (structuredNameWasSubmitted) {
      const nextName = {
        surname: isPresident
          ? preservedPresidentSurname
          : surname !== undefined
            ? cleanNamePart(surname)
            : member.surname,
        firstName:
          firstName !== undefined ? cleanNamePart(firstName) : member.firstName,
        middleInitial:
          middleInitial !== undefined
            ? normalizeMiddleInitial(middleInitial)
            : member.middleInitial,
        suffix: suffix !== undefined ? cleanNamePart(suffix) : member.suffix,
      };

      if (!nextName.surname || !nextName.firstName) {
        return res
          .status(400)
          .json({ message: "Surname and first name are required." });
      }

      member.surname = nextName.surname;
      member.firstName = nextName.firstName;
      member.middleInitial = nextName.middleInitial;
      member.suffix = nextName.suffix;
      member.name = formatMemberName(nextName);
    } else if (name && !isPresident) {
      member.name = cleanNamePart(name);
    }

    if (email && !isPresident) member.email = email;
    if (birthday !== undefined)
      member.birthday = birthday ? new Date(birthday) : null;
    if (year !== undefined) member.year = year;
    if (program !== undefined) member.program = program;
    if (section !== undefined) member.section = section;
    if (role && !isPresident) {
      const normalizedRole = String(role).trim();
      if (
        normalizedRole === "Department Dean" &&
        member.role !== "Department Dean"
      ) {
        const existingDean = await Member.findOne({
          organization: member.organization,
          role: "Department Dean",
          _id: { $ne: member._id },
        });
        if (existingDean) {
          return res.status(409).json({
            message:
              "A department dean is already registered for this organization.",
          });
        }
      }

      member.role = normalizedRole;
      if (["Faculty Adviser", "Department Dean"].includes(normalizedRole)) {
        member.idNumber = "";
        member.birthday = null;
        member.year = "";
        member.program = "";
        member.section = "";
      }
    }

    if (req.file) {
      member.avatar = `/uploads/${req.file.filename}`;
    }

    await member.save();

    if (isPresident) {
      await Promise.all([
        Organization.findByIdAndUpdate(member.organization, {
          president: member.name,
        }),
        User.findOneAndUpdate(
          {
            organization: member.organization,
            email: member.email.toLowerCase().trim(),
          },
          { name: member.name },
        ),
      ]);
    }

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
  if (roleLower === "p.i.o" || roleLower.includes("information officer"))
    return "pio";
  if (roleLower.includes("dean")) return "dean";
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

    if (member.role === "Member") {
      return res.status(400).json({
        message:
          "Regular members already create their own student accounts and do not need an officer invitation.",
      });
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

    // 4. Construct activation link using the configured production frontend URL.
    const setupUrl = createSetupUrl(setupToken);

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
