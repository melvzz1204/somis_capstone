const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Models & Utilities
const Organization = require("../models/OrganizationModels");
const AcademicPeriodSettings = require("../models/AcademicPeriodSettings");
const User = require("../models/User");
const Member = require("../models/MemberOrganization");
const StudentProfile = require("../models/studentProfile");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const StudentFeeArchive = require("../models/StudentFeeArchive");
const Resolution = require("../models/Resolution");
const OrganizationDocument = require("../models/OrganizationDocument");
const {
  removeOrganizationDocumentFiles,
} = require("../controllers/organizationDocumentController");
const { protect, authorize } = require("../middleware/authMiddileware");
const sendOrgInviteEmail = require("../util/sendEmail");
const { createSetupUrl } = require("../config/frontendUrl");
const {
  SEMESTERS,
  getEffectiveAcademicPeriod,
  isValidAcademicYear,
} = require("../util/academicPeriod");

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
      .select(
        "name acronym college adviser president email status organizationType parentOrganization",
      )
      .populate("parentOrganization", "name acronym college organizationType")
      .sort({ college: 1, name: 1 });
    return res.status(200).json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// =========================================================
// GET /v1/organizations/advisers - List all assigned faculty
// advisers across organizations (OVPSAS admin only)
// =========================================================
router.get("/advisers", protect, authorize("admin"), async (req, res) => {
  try {
    const advisers = await Member.find({ role: "Faculty Adviser" })
      .select(
        "name surname firstName middleInitial suffix email hasAccount organization createdAt",
      )
      .populate("organization", "name acronym college status")
      .sort({ name: 1 });

    return res.status(200).json(advisers);
  } catch (error) {
    console.error("Error fetching advisers:", error);
    return res.status(500).json({ message: "Failed to fetch advisers." });
  }
});

router.get("/academic-period", protect, async (req, res) => {
  try {
    const settings = await AcademicPeriodSettings.findOneAndUpdate(
      { key: "global" },
      { $setOnInsert: { key: "global", mode: "automatic" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      ...getEffectiveAcademicPeriod({ academicPeriod: settings }),
      configured: settings.mode === "manual",
    });
  } catch (error) {
    console.error("Error fetching academic period:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch academic period." });
  }
});

router.patch(
  "/academic-period",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const mode = String(req.body.mode || "")
        .trim()
        .toLowerCase();
      if (!["automatic", "manual"].includes(mode)) {
        return res.status(400).json({
          message: "Academic period mode must be automatic or manual.",
        });
      }

      const updatedAt = new Date();
      const update = {
        key: "global",
        mode,
        updatedBy: req.user._id,
        updatedAt,
      };

      if (mode === "manual") {
        const academicYear = String(req.body.academicYear || "").trim();
        const semester = String(req.body.semester || "").trim();
        if (!isValidAcademicYear(academicYear)) {
          return res.status(400).json({
            message: "Academic year must use consecutive years (YYYY-YYYY).",
          });
        }
        if (!SEMESTERS.includes(semester)) {
          return res.status(400).json({ message: "Select a valid semester." });
        }
        update.academicYear = academicYear;
        update.semester = semester;
      }

      const settings = await AcademicPeriodSettings.findOneAndUpdate(
        { key: "global" },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      const effectivePeriod = getEffectiveAcademicPeriod({
        academicPeriod: settings,
      });

      await Organization.updateMany(
        {},
        {
          $set: {
            academicPeriod: {
              academicYear: effectivePeriod.academicYear,
              semester: effectivePeriod.semester,
              mode,
              updatedBy: req.user._id,
              updatedAt,
            },
          },
        },
      );

      return res.status(200).json({
        ...effectivePeriod,
        configured: mode === "manual",
      });
    } catch (error) {
      console.error("Error updating academic period:", error);
      return res
        .status(500)
        .json({ message: "Failed to update academic period." });
    }
  },
);

// =========================================================
// POST /v1/organizations - Register organization & send invite
// =========================================================
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, acronym, president, email } = req.body;
    const organizationType = String(req.body.organizationType || "parent")
      .trim()
      .toLowerCase();
    const college = String(req.body.college || "").trim();
    const presidentSurname = String(president || "")
      .trim()
      .replace(/\s+/g, " ");

    // Child organizations are registered by their parent organization leader.
    if (organizationType === "suborganization") {
      return res.status(403).json({
        message:
          "Suborganizations must be registered by an organization leader.",
      });
    }

    if (organizationType !== "parent") {
      return res.status(400).json({
        message: "Only parent organizations may be registered by OVPSAS.",
      });
    }

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
      organizationType: "parent",
      parentOrganization: null,
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

    // 6. Attempt delivery with bounded SMTP timeouts. Awaiting this prevents
    // serverless runtimes from terminating the request before the email sends.
    const setupUrl = createSetupUrl(setupToken);
    let emailStatus = "sent";
    try {
      await sendOrgInviteEmail(email, name, setupToken);
      console.log(`Invite email sent successfully to ${email}`);
    } catch (emailErr) {
      emailStatus = "failed";
      console.error(`Invite email failed for ${email}:`, emailErr.message);
    }

    // 7. Return the recovery link even when SMTP credentials/provider fail.
    return res.status(201).json({
      ...savedOrg.toObject(),
      demoSetupLink: setupUrl,
      emailStatus,
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// =========================================================
// POST /v1/organizations/suborganizations - Org leader registration
// =========================================================
router.post(
  "/suborganizations",
  protect,
  authorize("org_admin"),
  async (req, res) => {
    try {
      const { name, acronym, president, email } = req.body;
      const parentOrganizationId =
        req.user.organization?._id || req.user.organization;
      const parentOrganization =
        await Organization.findById(parentOrganizationId);

      if (!parentOrganization || parentOrganization.status !== "Active") {
        return res.status(403).json({
          message:
            "Only an active organization can register a suborganization.",
        });
      }

      const normalizedName = String(name || "").trim();
      const normalizedAcronym = String(acronym || "")
        .trim()
        .toUpperCase();
      const normalizedPresident = String(president || "")
        .trim()
        .replace(/\s+/g, " ");
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();

      if (
        !normalizedName ||
        !normalizedAcronym ||
        !normalizedPresident ||
        !normalizedEmail
      ) {
        return res.status(400).json({
          message:
            "Suborganization name, acronym, leader surname, and email are required.",
        });
      }

      const escapeRegex = (value) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Organization.findOne({
        $or: [
          { name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i") },
          { acronym: new RegExp(`^${escapeRegex(normalizedAcronym)}$`, "i") },
        ],
      });
      if (duplicate) {
        return res.status(409).json({
          message: "An organization with this name or acronym already exists.",
        });
      }

      const emailOwner = await User.findOne({ email: normalizedEmail });
      if (emailOwner) {
        return res.status(409).json({
          message: "That email address is already assigned to another account.",
        });
      }

      // Mongoose's default collation is not available on every local MongoDB
      // setup, so validate the parent relationship explicitly before writing.
      if (parentOrganization.organizationType === "suborganization") {
        return res.status(403).json({
          message: "A suborganization cannot register another suborganization.",
        });
      }

      const organization = await Organization.create({
        name: normalizedName,
        acronym: normalizedAcronym,
        college: parentOrganization.college,
        organizationType: "suborganization",
        parentOrganization: parentOrganization._id,
        president: normalizedPresident,
        email: normalizedEmail,
        status: "Active",
      });

      const setupToken = crypto.randomBytes(32).toString("hex");
      const newUser = await User.create({
        name: normalizedPresident,
        email: normalizedEmail,
        role: "org_admin",
        organization: organization._id,
        setupToken,
        setupTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      });

      await Member.create({
        name: normalizedPresident,
        surname: normalizedPresident,
        email: normalizedEmail,
        role: "President",
        organization: organization._id,
        hasAccount: true,
      });

      const setupUrl = createSetupUrl(setupToken);
      let emailStatus = "sent";
      try {
        await sendOrgInviteEmail(normalizedEmail, normalizedName, setupToken, {
          registeredBy: parentOrganization.name,
          organizationType: "suborganization",
        });
      } catch (emailErr) {
        emailStatus = "failed";
        console.error(
          `Suborganization invite failed for ${normalizedEmail}:`,
          emailErr.message,
        );
      }

      return res.status(201).json({
        ...organization.toObject(),
        demoSetupLink: setupUrl,
        emailStatus,
        userId: newUser._id,
      });
    } catch (error) {
      console.error("Error creating suborganization:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          message: "That email address is already assigned to another account.",
        });
      }
      return res.status(500).json({
        message:
          process.env.NODE_ENV === "development"
            ? `Failed to create suborganization: ${error.message}`
            : "Failed to create suborganization.",
      });
    }
  },
);

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
      let college = String(req.body.college || "").trim();
      const organizationType = String(
        req.body.organizationType || organization.organizationType || "parent",
      )
        .trim()
        .toLowerCase();
      const president = String(req.body.president || "")
        .trim()
        .replace(/\s+/g, " ");
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();

      if (!["parent", "suborganization"].includes(organizationType)) {
        return res.status(400).json({
          message: "Organization type must be parent or suborganization.",
        });
      }

      let parentOrganization = null;
      if (organizationType === "suborganization") {
        const parentId =
          req.body.parentOrganization || organization.parentOrganization;
        if (!parentId) {
          return res.status(400).json({
            message: "A parent organization is required for a suborganization.",
          });
        }
        parentOrganization = await Organization.findById(parentId);
        if (
          !parentOrganization ||
          String(parentOrganization._id) === String(organization._id)
        ) {
          return res
            .status(400)
            .json({ message: "Select a valid parent organization." });
        }
        if (parentOrganization.status !== "Active") {
          return res
            .status(400)
            .json({ message: "The parent organization must be active." });
        }
        college = parentOrganization.college;
      }

      const childCount = await Organization.countDocuments({
        parentOrganization: organization._id,
      });
      if (childCount > 0 && college !== organization.college) {
        return res.status(400).json({
          message:
            "A parent organization with suborganizations cannot change colleges.",
        });
      }

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
        organizationType,
        parentOrganization: parentOrganization?._id || null,
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

      const organization = await Organization.findById(
        req.params.organizationId,
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }
      organization.status = status;
      await organization.save();

      // A parent organization controls the availability of its child organizations.
      const childOrganizations = await Organization.find({
        parentOrganization: organization._id,
      }).select("_id");
      const organizationIds = [
        organization._id,
        ...childOrganizations.map((child) => child._id),
      ];
      await Organization.updateMany(
        { _id: { $in: organizationIds } },
        { $set: { status } },
      );

      // Deactivation immediately blocks every non-admin account under the org.
      await User.updateMany(
        { organization: { $in: organizationIds } },
        { status },
      );

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

      const childCount = await Organization.countDocuments({
        parentOrganization: organization._id,
      });
      if (childCount > 0) {
        return res.status(409).json({
          message:
            "Delete all suborganizations before deleting their parent organization.",
        });
      }

      await removeOrganizationDocumentFiles(organization._id);
      await Promise.all([
        User.deleteMany({ organization: organization._id }),
        Member.deleteMany({ organization: organization._id }),
        StudentProfile.deleteMany({ organization: organization._id }),
        Fee.deleteMany({ org: organization._id }),
        Payment.deleteMany({ organization: organization._id }),
        StudentFeeArchive.deleteMany({ organization: organization._id }),
        Resolution.deleteMany({ org: organization._id }),
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
