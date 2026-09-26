const Meeting = require("../models/Meeting");

const MANAGER_ROLES = ["org_admin", "admin"];
const AUDIENCES = ["All Members", "Officers", "Students"];

const getOrganizationId = (req) =>
  req.user?.organization?._id || req.user?.organization || null;

// Meetings visible to the caller: managers see everything in the org, while
// members are scoped to their audience (mirrors the previous inline logic).
const applyAudienceScope = (query, user) => {
  if (user.role === "student") {
    query.audience = { $in: ["All Members", "Students"] };
  } else if (user.role !== "org_admin" && user.role !== "admin") {
    query.audience = { $in: ["All Members", "Officers"] };
  }
  return query;
};

// Annotates plain meeting objects with a per-user `viewed` flag and strips
// the raw viewer list so responses stay small.
const withViewedFlag = (meetings, userId) =>
  meetings.map((meeting) => {
    const viewedBy = Array.isArray(meeting.viewedBy) ? meeting.viewedBy : [];
    const viewed = viewedBy.some(
      (viewerId) => String(viewerId) === String(userId),
    );
    const { viewedBy: _viewedBy, ...rest } = meeting;
    return { ...rest, viewed };
  });

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
      applyAudienceScope(query, req.user);
    }

    const meetings = await populateMeeting(
      Meeting.find(query).sort({ startDateTime: 1, createdAt: -1 }),
    ).lean();
    return res.json({
      success: true,
      data: withViewedFlag(meetings, req.user._id),
    });
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
      return res.status(400).json({
        success: false,
        message: "Enter valid meeting date and time values.",
      });
    }
    if (end <= start) {
      return res.status(400).json({
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
      // The author has seen the meeting; every other member gets notified.
      viewedBy: [req.user._id],
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

exports.updateMeeting = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      organization,
    });
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    }

    const { title, description, startDateTime, endDateTime, venue, audience } =
      req.body || {};

    if (audience !== undefined && !AUDIENCES.includes(audience)) {
      return res
        .status(400)
        .json({ success: false, message: "Choose a valid meeting audience." });
    }

    const start = startDateTime !== undefined ? parseDate(startDateTime) : null;
    const end = endDateTime !== undefined ? parseDate(endDateTime) : null;
    if (startDateTime !== undefined && !start) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid meeting start time." });
    }
    if (endDateTime !== undefined && !end) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid meeting end time." });
    }

    const effectiveStart = start || meeting.startDateTime;
    const effectiveEnd = end || meeting.endDateTime;
    if (effectiveEnd <= effectiveStart) {
      return res.status(400).json({
        success: false,
        message: "Meeting end time must be after its start time.",
      });
    }

    if (title !== undefined) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (start) meeting.startDateTime = start;
    if (end) meeting.endDateTime = end;
    if (venue !== undefined) meeting.venue = venue;
    if (audience !== undefined) meeting.audience = audience;

    // An edited meeting is worth re-reading: re-notify every member except
    // the editor who just made the change.
    meeting.viewedBy = [req.user._id];

    await meeting.save();

    const populatedMeeting = await populateMeeting(
      Meeting.findById(meeting._id),
    );
    return res.json({
      success: true,
      message: "Meeting updated successfully.",
      data: populatedMeeting,
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    const status = error.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({
      success: false,
      message:
        status === 400
          ? Object.values(error.errors)[0]?.message || error.message
          : "Could not update the meeting.",
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

// Counts meetings the caller can see, has not opened yet, and can still
// attend. Powers the "new meeting" notification badge.
exports.getUnreadCount = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    if (!organization) return res.json({ success: true, count: 0, data: 0 });

    const query = {
      organization,
      endDateTime: { $gte: new Date() },
      viewedBy: { $ne: req.user._id },
    };
    applyAudienceScope(query, req.user);

    const count = await Meeting.countDocuments(query);
    return res.json({ success: true, count, data: count });
  } catch (error) {
    console.error("Error fetching unread meeting count:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not fetch notifications." });
  }
};

// Records that the caller opened a meeting, clearing its notification.
exports.markMeetingViewed = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, organization: getOrganizationId(req) },
      { $addToSet: { viewedBy: req.user._id } },
      { new: true },
    );
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    }
    return res.json({ success: true, data: { _id: meeting._id, viewed: true } });
  } catch (error) {
    console.error("Error marking meeting as viewed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not update notification." });
  }
};

// Exported for unit tests and reuse.
exports.applyAudienceScope = applyAudienceScope;
exports.withViewedFlag = withViewedFlag;
