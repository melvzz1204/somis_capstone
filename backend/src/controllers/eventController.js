const crypto = require("crypto");
const Event = require("../models/Event");
const EventAttendance = require("../models/EventAttendance");
const Member = require("../models/MemberOrganization");
const Proposal = require("../models/Proposal");

const ATTENDANCE_PHASES = new Set([
  "morning_in",
  "lunch_out",
  "afternoon_in",
  "afternoon_out",
]);

const ATTENDANCE_PHASE_LABELS = {
  morning_in: "Morning time in",
  lunch_out: "Lunch break time out",
  afternoon_in: "Afternoon time in",
  afternoon_out: "Afternoon time out",
};

const ATTENDANCE_PHASE_FIELDS = {
  morning_in: "morningInAt",
  lunch_out: "lunchOutAt",
  afternoon_in: "afternoonInAt",
  afternoon_out: "afternoonOutAt",
};

const hashAttendanceToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const parseAttendanceCode = (code) => {
  try {
    const payload = JSON.parse(String(code || ""));
    if (
      payload?.type !== "somis-event-attendance" ||
      payload?.version !== 1 ||
      !payload.eventId ||
      !ATTENDANCE_PHASES.has(payload.phase) ||
      !payload.token
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

const getLifecycle = (event, now = Date.now()) => {
  const start = new Date(event.startDateTime).getTime();
  const end = new Date(event.endDateTime).getTime();

  if (event.status === "Cancelled") {
    return { lifecycleStatus: "Cancelled", countdownTo: null };
  }
  if (event.status === "Completed" || now >= end) {
    return { lifecycleStatus: "Ended", countdownTo: null };
  }
  if (now >= start) {
    return { lifecycleStatus: "Ongoing", countdownTo: event.endDateTime };
  }
  return { lifecycleStatus: "Upcoming", countdownTo: event.startDateTime };
};

const serializeEvent = (event, now = Date.now()) => {
  const value = event.toObject ? event.toObject() : event;
  return { ...value, ...getLifecycle(value, now) };
};

const getEvents = async (req, res) => {
  try {
    if (!req.user.organization) {
      return res.status(200).json({ success: true, data: [] });
    }

    const events = await Event.find({ org: req.user.organization })
      .populate("org", "name acronym")
      .populate("proposal", "proposalTitle status")
      .populate("createdBy", "name role")
      .sort({ startDateTime: 1, createdAt: -1 });
    const now = Date.now();
    res.json({
      success: true,
      data: events.map((event) => serializeEvent(event, now)),
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res
      .status(500)
      .json({ success: false, message: "Could not fetch events." });
  }
};

const createEvent = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      _id: req.body?.proposal,
      org: req.user.organization,
      status: "Approved",
    });

    if (!proposal) {
      return res.status(400).json({
        success: false,
        message: "Only a final approved proposal can be scheduled as an event.",
      });
    }

    const existingEvent = await Event.findOne({
      proposal: proposal._id,
      org: req.user.organization,
    });
    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: "An event has already been created for this proposal.",
      });
    }

    const startDateTime = new Date(proposal.requestedStartDateTime);
    const endDateTime = new Date(proposal.requestedEndDateTime);
    const event = await Event.create({
      org: req.user.organization,
      proposal: proposal._id,
      title: proposal.proposalTitle,
      category: proposal.activityCategory,
      description: proposal.projectDescription,
      startDateTime,
      endDateTime,
      venue: proposal.targetVenue,
      targetAudience: proposal.targetAudience,
      expectedAttendees: proposal.expectedAttendees,
      projectLeadPerson: proposal.projectLeadPerson,
      projectLeadContact: proposal.projectLeadContact,
      createdBy: req.user._id,
    });

    await event.populate([
      { path: "org", select: "name acronym" },
      { path: "proposal", select: "proposalTitle status" },
      { path: "createdBy", select: "name role" },
    ]);
    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: serializeEvent(event),
    });
  } catch (error) {
    console.error("Error creating event:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res
      .status(500)
      .json({ success: false, message: "Could not create event." });
  }
};

const generateAttendanceQr = async (req, res) => {
  try {
    const phase = String(req.body?.phase || "").toLowerCase();
    if (!ATTENDANCE_PHASES.has(phase)) {
      return res.status(400).json({
        success: false,
        message: "Choose one of the four attendance QR checkpoints.",
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      org: req.user.organization,
    }).select(
      "+attendanceQr.morning_in.tokenHash +attendanceQr.lunch_out.tokenHash +attendanceQr.afternoon_in.tokenHash +attendanceQr.afternoon_out.tokenHash",
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found for your organization.",
      });
    }

    const now = new Date();
    if (event.status === "Cancelled" || now >= event.endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Attendance QR codes cannot be generated for a closed event.",
      });
    }
    if (now < event.startDateTime) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance QR codes can only be generated when the event starts.",
      });
    }

    const token = crypto.randomBytes(32).toString("base64url");
    event.attendanceQr[phase] = {
      tokenHash: hashAttendanceToken(token),
      generatedAt: now,
      generatedBy: req.user._id,
    };
    await event.save();

    const code = JSON.stringify({
      type: "somis-event-attendance",
      version: 1,
      eventId: String(event._id),
      phase,
      token,
    });

    return res.json({
      success: true,
      message: `${ATTENDANCE_PHASE_LABELS[phase]} QR generated.`,
      data: { eventId: event._id, phase, code, generatedAt: now },
    });
  } catch (error) {
    console.error("Error generating attendance QR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not generate the attendance QR code.",
    });
  }
};

const joinEvent = async (req, res) => {
  try {
    if (!Event.db.base.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event identifier.",
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found for your organization.",
      });
    }

    const member = await Member.findOne({
      organization: event.org,
      email: req.user.email.toLowerCase().trim(),
    });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Only registered student members can join this event.",
      });
    }

    const now = new Date();
    if (
      event.status === "Cancelled" ||
      now >= event.startDateTime ||
      now >= event.endDateTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Joining has closed because this event is no longer upcoming.",
      });
    }

    const attendance = await EventAttendance.findOneAndUpdate(
      { event: event._id, student: req.user._id },
      {
        $setOnInsert: {
          org: event.org,
          member: member._id,
          status: "Pending",
          joinedAt: now,
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    return res.json({
      success: true,
      message:
        "You joined the event. Attendance is pending on-site verification.",
      data: attendance,
    });
  } catch (error) {
    console.error("Error joining event:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this event.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not join this event.",
    });
  }
};

const scanAttendanceQr = async (req, res) => {
  try {
    const payload = parseAttendanceCode(req.body?.code);
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "This is not a valid SOMIS attendance QR code.",
      });
    }

    if (!Event.db.base.Types.ObjectId.isValid(payload.eventId)) {
      return res.status(400).json({
        success: false,
        message: "This attendance QR contains an invalid event identifier.",
      });
    }

    const event = await Event.findById(payload.eventId).select(
      "+attendanceQr.morning_in.tokenHash +attendanceQr.lunch_out.tokenHash +attendanceQr.afternoon_in.tokenHash +attendanceQr.afternoon_out.tokenHash",
    );
    if (!event || String(event.org) !== String(req.user.organization || "")) {
      return res.status(404).json({
        success: false,
        message: "This event is not available to your organization.",
      });
    }

    const member = await Member.findOne({
      organization: event.org,
      email: req.user.email.toLowerCase().trim(),
    });
    if (!member || req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only registered student members can record attendance.",
      });
    }

    const storedHash = event.attendanceQr?.[payload.phase]?.tokenHash;
    const suppliedHash = hashAttendanceToken(payload.token);
    if (
      !storedHash ||
      storedHash.length !== suppliedHash.length ||
      !crypto.timingSafeEqual(
        Buffer.from(storedHash),
        Buffer.from(suppliedHash),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "This attendance QR has expired or was replaced.",
      });
    }

    const now = new Date();
    if (event.status === "Cancelled" || now >= event.endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Attendance for this event is closed.",
      });
    }

    let attendance = await EventAttendance.findOne({
      event: event._id,
      student: req.user._id,
    });

    if (now < event.startDateTime) {
      return res.status(400).json({
        success: false,
        message: "Attendance opens when the event starts.",
      });
    }
    if (!attendance) {
      return res.status(409).json({
        success: false,
        message: "Join this event before scanning an attendance QR code.",
      });
    }
    const checkpointField = ATTENDANCE_PHASE_FIELDS[payload.phase];
    if (attendance[checkpointField]) {
      return res.json({
        success: true,
        message: `${ATTENDANCE_PHASE_LABELS[payload.phase]} was already recorded.`,
        data: attendance,
      });
    }

    attendance[checkpointField] = now;
    attendance.status = "Present";
    attendance.presentAt = attendance.presentAt || now;
    await attendance.save();

    return res.json({
      success: true,
      message: `${ATTENDANCE_PHASE_LABELS[payload.phase]} recorded successfully.`,
      data: attendance,
    });
  } catch (error) {
    console.error("Error scanning attendance QR:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Your attendance was already recorded. Refresh to see its status.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not record attendance.",
    });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const records = await EventAttendance.find({
      student: req.user._id,
    }).select(
      "event status joinedAt morningInAt lunchOutAt afternoonInAt afternoonOutAt presentAt updatedAt",
    );
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch your attendance records.",
    });
  }
};

const getEventAttendance = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found for your organization.",
      });
    }

    const records = await EventAttendance.find({ event: event._id })
      .populate("student", "name email")
      .populate("member", "idNumber name year program section")
      .sort({ status: 1, joinedAt: 1 });
    const summary = records.reduce(
      (counts, record) => {
        counts.joined += 1;
        counts[record.status.toLowerCase()] += 1;
        return counts;
      },
      {
        total: event.expectedAttendees,
        joined: 0,
        pending: 0,
        present: 0,
      },
    );

    return res.json({ success: true, data: records, summary });
  } catch (error) {
    console.error("Error fetching event attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch event attendance.",
    });
  }
};

module.exports = {
  getEvents,
  createEvent,
  getLifecycle,
  generateAttendanceQr,
  joinEvent,
  scanAttendanceQr,
  getMyAttendance,
  getEventAttendance,
  parseAttendanceCode,
};
