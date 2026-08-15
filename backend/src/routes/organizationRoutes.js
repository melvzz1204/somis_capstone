const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Models & Utilities
const Organization = require("../models/OrganizationModels");
const User = require("../models/User");
const Member = require("../models/MemberOrganization");
const StudentProfile = require("../models/studentProfile");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const StudentFeeArchive = require("../models/StudentFeeArchive");
const Proposal = require("../models/Proposal");
const OrganizationDocument = require("../models/OrganizationDocument");
const {
  removeOrganizationDocumentFiles,
} = require("../controllers/organizationDocumentController");
const { protect, authorize } = require("../middleware/authMiddileware");
const sendOrgInviteEmail = require("../util/sendEmail");

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
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, acronym, college, president, email } = req.body;
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

    // 3. Save Organization record. The organization leader adds the adviser
    // from the organization dashboard after registration.
    const organization = new Organization({
      name,
      acronym,
      college,
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

// =========================================================
// PUT /v1/organizations/:organizationId - Edit organization
// =========================================================
router.put(
  "/:organizationId",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const organization = await Organization.findById(
        req.params.organizationId,
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }

      const name = String(req.body.name || "").trim();
      const acronym = String(req.body.acronym || "")
        .trim()
        .toUpperCase();
      const college = String(req.body.college || "").trim();
      const president = String(req.body.president || "")
        .trim()
        .replace(/\s+/g, " ");
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();

      if (!name || !acronym || !college || !president || !email) {
        return res.status(400).json({
          message:
            "Organization name, acronym, college, student leader/president surname, and email are required.",
        });
      }

      const duplicate = await Organization.findOne({
        _id: { $ne: organization._id },
        $or: [{ name }, { acronym }],
      }).collation({ locale: "en", strength: 2 });
      if (duplicate) {
        return res.status(409).json({
          message: "An organization with this name or acronym already exists.",
        });
      }

      const emailOwner = await User.findOne({
        _id: {
          $nin: await User.find({ organization: organization._id }).distinct(
            "_id",
          ),
        },
        email,
      });
      if (emailOwner) {
        return res.status(409).json({
          message: "That email address is already assigned to another account.",
        });
      }

      const previousEmail = organization.email;
      Object.assign(organization, {
        name,
        acronym,
        college,
        president,
        email,
      });
      await organization.save();

      // Keep the leader account and official president roster entry synchronized.
      const leaderUser = await User.findOne({
        organization: organization._id,
        role: "org_admin",
      });
      if (leaderUser) {
        leaderUser.name = president;
        leaderUser.email = email;
        await leaderUser.save();
      }
      await Member.findOneAndUpdate(
        {
          organization: organization._id,
          $or: [{ role: "President" }, { email: previousEmail }],
        },
        { name: president, surname: president, email },
      );

      return res.status(200).json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "That email address is already assigned to another account.",
        });
      }
      return res
        .status(500)
        .json({ message: "Failed to update organization." });
    }
  },
);

// =========================================================
// PATCH /v1/organizations/:organizationId/status - Activate/deactivate
// =========================================================
router.patch(
  "/:organizationId/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const status = req.body.status;
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          message: "Organization status must be Active or Inactive.",
        });
      }

      const organization = await Organization.findByIdAndUpdate(
        req.params.organizationId,
        { status },
        { new: true, runValidators: true },
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }

      // Deactivation immediately blocks every non-admin account under the org.
      await User.updateMany({ organization: organization._id }, { status });

      return res.status(200).json(organization);
    } catch (error) {
      console.error("Error changing organization status:", error);
      return res
        .status(500)
        .json({ message: "Failed to change organization status." });
    }
  },
);

// =========================================================
// DELETE /v1/organizations/:organizationId - Delete org and related records
// =========================================================
router.delete(
  "/:organizationId",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const organization = await Organization.findById(
        req.params.organizationId,
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }

      await removeOrganizationDocumentFiles(organization._id);
      await Promise.all([
        User.deleteMany({ organization: organization._id }),
        Member.deleteMany({ organization: organization._id }),
        StudentProfile.deleteMany({ organization: organization._id }),
        Fee.deleteMany({ org: organization._id }),
        Payment.deleteMany({ organization: organization._id }),
        StudentFeeArchive.deleteMany({ organization: organization._id }),
        Proposal.deleteMany({ org: organization._id }),
        OrganizationDocument.deleteMany({ org: organization._id }),
      ]);
      await organization.deleteOne();

      return res.status(200).json({
        message:
          "Organization and its related records were deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting organization:", error);
      return res
        .status(500)
        .json({ message: "Failed to delete organization." });
    }
  },
);

module.exports = router;
