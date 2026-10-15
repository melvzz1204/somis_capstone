const mongoose = require("mongoose");
const Meeting = require("../models/Meeting");
const StudentProfile = require("../models/studentProfile");
const Member = require("../models/MemberOrganization");

const MANAGER_ROLES = ["org_admin", "admin"];
const AUDIENCES = ["All Members", "Officers", "Students"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

// Staff oversee every meeting in their org; only students/officers get
// narrowed by year/section targets.
const isAcademicScopedViewer = (user) =>
  !["org_admin", "admin", "adviser", "dean", "director"].includes(user?.role);

const normalizeTargetYear = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const withoutPlus = text.endsWith("+") ? text.slice(0, -1) : text;
  const match = YEAR_LEVELS.find(
    (level) => level.toLowerCase() === withoutPlus.toLowerCase(),
  );
  return match || null;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Year/section of the viewer (student profile first, roster row fallback).
// Returns null for staff, who see every meeting in their org.
const getViewerAcademics = async (user, organization) => {
  if (!isAcademicScopedViewer(user)) return null;
  let year = "";
  let section = "";
  try {
    const profile = await StudentProfile.findOne({ user: user._id }).select(
      "yearLevel section",
    );
    if (profile) {
      year = normalizeTargetYear(profile.yearLevel) || "";
      section = String(profile.section || "").trim();
    }
    if ((!year || !section) && user.email && organization) {
      const row = await Member.findOne({
        organization,
        email: String(user.email).toLowerCase().trim(),
      }).select("year section");
      if (row) {
        if (!year) year = normalizeTargetYear(row.year) || "";
        if (!section) section = String(row.section || "").trim();
      }
    }
  } catch {
    // Academics unknown: viewer only sees untargeted meetings.
  }
  return { year, section };
};

// Narrows a meeting query by the optional year/section targets. A meeting
// passes when its target is blank (or missing on legacy records) or matches
// the viewer. Staff skip narrowing entirely.
const applyAcademicScope = async (query, user, organization) => {
  const academics = await getViewerAcademics(user, organization);
  if (!academics) return query;
  const scoped = { ...query };
  scoped.$and = [...(query.$and || [])];
  if (academics.year) {
    scoped.$and.push({
      $or: [
        { targetYear: { $in: ["", null] } },
        { targetYear: academics.year },
      ],
    });
  } else {
    scoped.$and.push({ targetYear: { $in: ["", null] } });
  }
  if (academics.section) {
    scoped.$and.push({
      $or: [
        { targetSection: { $in: ["", null] } },
        {
          targetSection: new RegExp(
            `^${escapeRegExp(academics.section)}$`,
            "i",
          ),
        },
      ],
    });
  } else {
    scoped.$and.push({ targetSection: { $in: ["", null] } });
  }
  return scoped;
};

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

// Annotates plain meeting objects with the caller's join state plus
// attendance counts. Raw join/attendance rows are only kept for the
// management view; everyone else gets counts and joiner names.
const withJoinInfo = (meetings, userId, options = {}) => {
  const { includeDetails = false } = options;
  return meetings.map((meeting) => {
    const joins = Array.isArray(meeting.joins) ? meeting.joins : [];
    const attendance = Array.isArray(meeting.attendance)
      ? meeting.attendance
      : [];
    const annotated = {
      ...meeting,
      joinCount: joins.length,
      joined: joins.some((join) => String(join.user) === String(userId)),
      joinNames: joins.map((join) => join.name).filter(Boolean),
      presentCount: attendance.filter((record) => record.present).length,
    };
    if (!includeDetails) {
      delete annotated.joins;
      delete annotated.attendance;
    }
    return annotated;
  });
};

const populateMeeting = (query) =>
  query
    .populate("organization", "name acronym")
    .populate("createdBy", "name role");

const parseDate = (value) => {
  if (!value) return null;
  let normalized = String(value).trim();
  // `datetime-local` inputs (e.g. "2026-10-04T14:00") carry no timezone.
  // The browser means Asia/Manila wall time, but a UTC-hosted server would
  // parse it as UTC and shift display by +8 hours. Assume Manila when no
  // offset/Z is present; ISO strings with timezone pass through unchanged.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?$/.test(normalized)) {
    normalized += "+08:00";
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

exports.getMeetings = async (req, res) => {
  try {
    const organization = getOrganizationId(req);
    if (!organization) return res.json({ success: true, data: [] });

    let query = { organization };
    const managementView = req.query.view === "manage";

    if (!managementView || !MANAGER_ROLES.includes(req.user.role)) {
      applyAudienceScope(query, req.user);
      query = await applyAcademicScope(query, req.user, organization);
    }

    const meetings = await populateMeeting(
      Meeting.find(query).sort({ startDateTime: 1, createdAt: -1 }),
    ).lean();
    const isManager =
      managementView && MANAGER_ROLES.includes(req.user.role);
    return res.json({
      success: true,
      data: withJoinInfo(withViewedFlag(meetings, req.user._id), req.user._id, {
        includeDetails: isManager,
      }),
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
    const targetYear = normalizeTargetYear(req.body?.targetYear);
    if (req.body?.targetYear && targetYear === null) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid year level target.",
      });
    }
    const targetSection = String(req.body?.targetSection || "").trim();
    if (targetSection.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Section target must be 60 characters or fewer.",
      });
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
      targetYear: targetYear || "",
      targetSection,
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
    if (req.body?.targetYear !== undefined) {
      const normalizedYear = normalizeTargetYear(req.body.targetYear);
      if (req.body.targetYear && normalizedYear === null) {
        return res.status(400).json({
          success: false,
          message: "Choose a valid year level target.",
        });
      }
      meeting.targetYear = normalizedYear || "";
    }
    if (req.body?.targetSection !== undefined) {
      const normalizedSection = String(req.body.targetSection || "").trim();
      if (normalizedSection.length > 60) {
        return res.status(400).json({
          success: false,
          message: "Section target must be 60 characters or fewer.",
        });
      }
      meeting.targetSection = normalizedSection;
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
    const scopedQuery = await applyAcademicScope(query, req.user, organization);

    const count = await Meeting.countDocuments(scopedQuery);
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
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ success: false, message: "Meeting not found." });
  }
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

// Finds a meeting the caller is allowed to see (org + audience +
// year/section scoped).
const findVisibleMeeting = async (req) => {
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return null;
  }
  let query = { _id: req.params.id, organization: getOrganizationId(req) };
  applyAudienceScope(query, req.user);
  query = await applyAcademicScope(query, req.user, getOrganizationId(req));
  return Meeting.findOne(query);
};

const toJoinPayload = (meeting, userId) => ({
  joined: meeting.joins.some((join) => String(join.user) === String(userId)),
  joinCount: meeting.joins.length,
  joinNames: meeting.joins.map((join) => join.name).filter(Boolean),
});

// Self RSVP: the caller taps "Join" on an upcoming/ongoing meeting.
exports.joinMeeting = async (req, res) => {
  try {
    const meeting = await findVisibleMeeting(req);
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    }
    if (new Date(meeting.endDateTime).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "This meeting has already ended.",
      });
    }
    const alreadyJoined = meeting.joins.some(
      (join) => String(join.user) === String(req.user._id),
    );
    if (!alreadyJoined) {
      meeting.joins.push({
        user: req.user._id,
        name: req.user.name || "",
        email: String(req.user.email || "").toLowerCase(),
      });
      await meeting.save();
    }
    return res.json({ success: true, data: toJoinPayload(meeting, req.user._id) });
  } catch (error) {
    console.error("Error joining meeting:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not join the meeting." });
  }
};

// Cancels the caller's RSVP.
exports.leaveMeeting = async (req, res) => {
  try {
    const meeting = await findVisibleMeeting(req);
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    }
    meeting.joins = meeting.joins.filter(
      (join) => String(join.user) !== String(req.user._id),
    );
    await meeting.save();
    return res.json({ success: true, data: toJoinPayload(meeting, req.user._id) });
  } catch (error) {
    console.error("Error leaving meeting:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not cancel your RSVP." });
  }
};

// Management view of RSVPs plus the saved final attendance record.
exports.getAttendance = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      organization: getOrganizationId(req),
    }).lean();
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    }
    return res.json({
      success: true,
      data: {
        meeting: {
          _id: meeting._id,
          title: meeting.title,
          startDateTime: meeting.startDateTime,
          endDateTime: meeting.endDateTime,
        },
        joins: meeting.joins || [],
        attendance: meeting.attendance || [],
      },
    });
  } catch (error) {
    console.error("Error fetching meeting attendance:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not fetch attendance." });
  }
};

// Saves the president's final present/absent marking (walk-ins included).
exports.saveAttendance = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      organization: getOrganizationId(req),
    });
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found." });
    }
    const records = Array.isArray(req.body?.records) ? req.body.records : [];
    const seen = new Set();
    const normalized = [];
    for (const record of records) {
      const email = String(record?.email || "")
        .toLowerCase()
        .trim();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      const userId =
        record?.user && mongoose.Types.ObjectId.isValid(record.user)
          ? record.user
          : null;
      normalized.push({
        user: userId,
        name: String(record?.name || "").trim(),
        email,
        present: Boolean(record?.present),
        markedAt: new Date(),
        markedBy: req.user._id,
      });
    }
    meeting.attendance = normalized;
    await meeting.save();
    return res.json({
      success: true,
      message: "Attendance saved successfully.",
      data: {
        attendance: meeting.attendance,
        presentCount: normalized.filter((record) => record.present).length,
        absentCount: normalized.filter((record) => !record.present).length,
      },
    });
  } catch (error) {
    console.error("Error saving meeting attendance:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not save attendance." });
  }
};

// Exported for unit tests and reuse.
exports.applyAudienceScope = applyAudienceScope;
exports.applyAcademicScope = applyAcademicScope;
exports.normalizeTargetYear = normalizeTargetYear;
exports.withViewedFlag = withViewedFlag;
exports.withJoinInfo = withJoinInfo;
