const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Models & Utilities
const Organization = require("../models/OrganizationModels");
const User = require("../models/User"); // 👈 Added User model to store setup token
const Member = require("../models/MemberOrganization");
const sendOrgInviteEmail = require("../util/sendEmail"); // Double-check folder is 'util' or 'utils'

// =========================================================
// GET /v1/organizations - Fetch all registered organizations
// =========================================================
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.college) {
      filter.college = req.query.college;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const organizations = await Organization.find(filter)
      .select("name acronym college adviser president email status")
      .sort({ name: 1 });
    return res.status(200).json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// =========================================================
// POST /v1/organizations - Register organization & send invite
// =========================================================
router.post("/", async (req, res) => {
  try {
    const { name, acronym, college, adviser, president, email } = req.body;
    const presidentSurname = String(president || "")
      .trim()
      .replace(/\s+/g, " ");

    // 1. Basic validation
    if (!name || !acronym || !college || !presidentSurname || !email) {
      return res.status(400).json({
        message:
          "Organization name, acronym, college, student leader/president surname, and email are required.",
      });
    }

    // 2. Check for duplicate acronym or name
    const existingOrg = await Organization.findOne({
      $or: [{ acronym: acronym.toUpperCase() }, { name }],
    });
    if (existingOrg) {
      return res.status(409).json({
        message: "An organization with this name or acronym already exists.",
      });
    }

    // 3. Save Organization record. OVPSAS supplies only the protected surname;
    // the president completes the rest of the name from their dashboard.
    const organization = new Organization({
      name,
      acronym,
      college,
      adviser,
      president: presidentSurname,
      email,
    });
    const savedOrg = await organization.save();

    // 4. Generate registration setup token (expires in 24h)
    const setupToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    // 5. Save pending User account with setupToken
    const newUser = new User({
      name: presidentSurname,
      email: email.toLowerCase(),
      role: "org_admin", // 👈 Works now that 'org_admin' is in the enum
      organization: savedOrg._id,
      setupToken,
      setupTokenExpires: tokenExpires,
    });
    await newUser.save(); // 👈 Password is no longer required when setupToken is present

    // The president is also part of the official roster. Their surname and
    // email come from OVPSAS, while they complete the other name fields after
    // signing in to the organization dashboard.
    await Member.create({
      name: presidentSurname,
      surname: presidentSurname,
      email: email.toLowerCase().trim(),
      role: "President",
      organization: savedOrg._id,
      hasAccount: true,
    });

    // 6. Send the email via Gmail SMTP
    let setupUrl = "";
    try {
      setupUrl = await sendOrgInviteEmail(email, name, setupToken);
      console.log(`✉️ Invite email sent successfully to ${email}`);
    } catch (emailErr) {
      console.error("⚠️ Email failed to send:", emailErr.message);
      // Organization is saved even if email fails
    }

    // 7. Return saved organization + demo URL backup
    return res.status(201).json({
      ...savedOrg.toObject(),
      demoSetupLink: setupUrl, // Backup setup link for presentation/testing
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
