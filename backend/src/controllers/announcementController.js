const Announcement = require("../models/Announcement");

const MANAGER_ROLES = ["pio", "org_admin", "admin"];
const WRITABLE_FIELDS = [
  "title",
  "content",
  "category",
  "priority",
  "audience",
  "status",
  "publishAt",
  "expiresAt",
  "actionLabel",
  "actionUrl",
];

const getOrganizationId = (req) =>
  req.user?.organization?._id || req.user?.organization || null;

const canManageAnnouncements = (user) => MANAGER_ROLES.includes(user?.role);

const pickAnnouncementFields = (body = {}) =>
  WRITABLE_FIELDS.reduce((fields, key) => {
    if (body[key] !== undefined) fields[key] = body[key];
    return fields;
  }, {});

const normalizeDates = (fields) => {
  for (const key of ["publishAt", "expiresAt"]) {
    if (fields[key] === "" || fields[key] === null) fields[key] = null;
  }
  return fields;
};

const synchronizePublicationFields = (fields, existingAnnouncement = null) => {
  const nextStatus = fields.status || existingAnnouncement?.status || "Draft";

  if (nextStatus === "Published") {
    fields.publishAt =
      fields.publishAt || existingAnnouncement?.publishAt || new Date();
    fields.publishedAt = existingAnnouncement?.publishedAt || new Date();
  } else if (nextStatus === "Draft") {
    fields.publishAt = null;
    fields.publishedAt = null;
  } else if (nextStatus === "Scheduled") {
    fields.publishedAt = null;
  }

  return fields;
};

const publishDueAnnouncements = async (organization) => {
  const now = new Date();
  await Announcement.updateMany(
    {
      organization,
      status: "Scheduled",
      publishAt: { $lte: now },
    },
    {
      $set: {
        status: "Published",
        publishedAt: now,
      },
    },
  );
};

const populateAnnouncement = (query) =>
  query
    .populate("organization", "name acronym")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

exports.getAnnouncements = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    if (!organization) {
      return res.status(200).json({ success: true, data: [] });
    }

    await publishDueAnnouncements(organization);

    const query = { organization };
    const requestedStatus = String(req.query.status || "").trim();
    const managementView = req.query.view === "manage";

    if (managementView && canManageAnnouncements(req.user)) {
      if (requestedStatus && requestedStatus !== "All") {
        query.status = requestedStatus;
      }
    } else {
      query.status = "Published";
      query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
      if (req.user.role === "student") {
        query.audience = { $in: ["All Members", "Students"] };
      }
    }

    const announcements = await populateAnnouncement(
      Announcement.find(query).sort({
        priority: -1,
        publishedAt: -1,
        createdAt: -1,
      }),
    );

    return res.json({ success: true, data: announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch announcements.",
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to an organization.",
      });
    }

    const fields = synchronizePublicationFields(
      normalizeDates(pickAnnouncementFields(req.body)),
    );

    if (
      fields.status === "Scheduled" &&
      new Date(fields.publishAt).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Scheduled publication must be in the future.",
      });
    }

    const announcement = await Announcement.create({
      ...fields,
      organization,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const populatedAnnouncement = await populateAnnouncement(
      Announcement.findById(announcement._id),
    );

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data: populatedAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    const status = error.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? Object.values(error.errors)[0]?.message || error.message
          : "Could not create the announcement.",
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      organization,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    const fields = synchronizePublicationFields(
      normalizeDates(pickAnnouncementFields(req.body)),
      announcement,
    );

    if (
      fields.status === "Scheduled" &&
      new Date(fields.publishAt || announcement.publishAt).getTime() <=
        Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Scheduled publication must be in the future.",
      });
    }

    Object.assign(announcement, fields, { updatedBy: req.user._id });
    await announcement.save();

    const populatedAnnouncement = await populateAnnouncement(
      Announcement.findById(announcement._id),
    );

    return res.json({
      success: true,
      message: "Announcement updated successfully.",
      data: populatedAnnouncement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    const status = error.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? Object.values(error.errors)[0]?.message || error.message
          : "Could not update the announcement.",
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      organization: getOrganizationId(req),
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    return res.json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete the announcement.",
    });
  }
};
