const Meeting = require("../models/Meeting");

const MANAGER_ROLES = ["org_admin", "admin"];
const AUDIENCES = ["All Members", "Officers", "Students"];

const getOrganizationId = (req) =>
  req.user?.organization?._id || req.user?.organization || null;

const populateMeeting = (query) =>
  query
    .populate("organization", "name acronym")
    .populate("createdBy", "name role");

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

exports.getMeetings = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    if (!organization) return res.json({ success: true, data: [] });

    const query = { organization };
    const managementView = req.query.view === "manage";

    if (!managementView || !MANAGER_ROLES.includes(req.user.role)) {
      if (req.user.role === "student") {
        query.audience = { $in: ["All Members", "Students"] };
      } else if (req.user.role !== "org_admin" && req.user.role !== "admin") {
        query.audience = { $in: ["All Members", "Officers"] };
      }
    }

    const meetings = await populateMeeting(
      Meeting.find(query).sort({ startDateTime: 1, createdAt: -1 }),
    );
    return res.json({ success: true, data: meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not fetch meetings." });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to an organization.",
      });
    }

    const { title, description, startDateTime, endDateTime, venue, audience } =
      req.body || {};
    if (!AUDIENCES.includes(audience || "All Members")) {
      return res
        .status(400)
        .json({ success: false, message: "Choose a valid meeting audience." });
    }

    const start = parseDate(startDateTime);
    const end = parseDate(endDateTime);
    if (!start || !end) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Enter valid meeting date and time values.",
        });
    }
    if (end <= start) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Meeting end time must be after its start time.",
        });
    }

    const meeting = await Meeting.create({
      organization,
      title,
      description,
      startDateTime: start,
      endDateTime: end,
      venue,
      audience: audience || "All Members",
      createdBy: req.user._id,
    });

    const populatedMeeting = await populateMeeting(
      Meeting.findById(meeting._id),
    );
    return res.status(201).json({
      success: true,
      message: "Meeting created successfully.",
      data: populatedMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    const status = error.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({
      success: false,
      message:
        status === 400
          ? Object.values(error.errors)[0]?.message || error.message
          : "Could not create the meeting.",
    });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      organization: getOrganizationId(req),
    });
    if (!meeting)
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    return res.json({
      success: true,
      message: "Meeting deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not delete the meeting." });
  }
};
