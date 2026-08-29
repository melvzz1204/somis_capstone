const crypto = require("crypto");
const Event = require("../models/Event");
const EventAttendance = require("../models/EventAttendance");
const Member = require("../models/MemberOrganization");
const Proposal = require("../models/Proposal");
const Organization = require("../models/OrganizationModels");
const AttendanceFine = require("../models/AttendanceFine");
const User = require("../models/User");

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

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SCHEDULE_FIELDS = [
  "morningIn",
  "morningOut",
  "afternoonIn",
  "afternoonOut",
];

const normalizeAttendanceSchedule = (
  schedule = {},
  { allowPartial = false } = {},
) => {
  const values = Object.fromEntries(
    SCHEDULE_FIELDS.map((field) => [
      field,
      String(schedule[field] || "").trim(),
    ]),
  );
  const fieldsToValidate = allowPartial
    ? SCHEDULE_FIELDS.filter((field) => values[field])
    : SCHEDULE_FIELDS;
  if (
    !fieldsToValidate.length ||
    fieldsToValidate.some((field) => !TIME_PATTERN.test(values[field]))
  ) {
    return null;
  }
  const minutes = fieldsToValidate.map((field) => {
    const [hours, mins] = values[field].split(":").map(Number);
    return hours * 60 + mins;
  });
  if (minutes.some((value, index) => index > 0 && value <= minutes[index - 1]))
    return null;
  return allowPartial
    ? values
    : Object.fromEntries(
        SCHEDULE_FIELDS.map((field) => [field, values[field]]),
      );
};

const EVENT_TIME_ZONE_OFFSET_MINUTES = 8 * 60;
const DEFAULT_ATTENDANCE_SCHEDULE = {
  morningIn: "08:00",
  morningOut: "12:00",
  afternoonIn: "13:00",
  afternoonOut: "17:00",
};
const PHASE_SCHEDULE_FIELDS = {
  morning_in: "morningIn",
  lunch_out: "morningOut",
  afternoon_in: "afternoonIn",
  afternoon_out: "afternoonOut",
};
const NEXT_PHASE_SCHEDULE_FIELDS = {
  morning_in: "morningOut",
  lunch_out: "afternoonIn",
  afternoon_in: "afternoonOut",
};

const toEventDateKey = (value) =>
  new Date(new Date(value).getTime() + EVENT_TIME_ZONE_OFFSET_MINUTES * 60_000)
    .toISOString()
    .slice(0, 10);

const getCreatedAttendanceCheckpoints = (event) => {
  const checkpoints = [];
  for (const attendanceDay of event?.attendanceDays || []) {
    for (const phase of ATTENDANCE_PHASES) {
      const qr = attendanceDay.attendanceQr?.[phase];
      if (!qr?.generatedAt && !qr?.code && !qr?.tokenHash) continue;
      checkpoints.push({
        day: attendanceDay.day,
        date: attendanceDay.date,
        phase,
        field: ATTENDANCE_PHASE_FIELDS[phase],
        label: ATTENDANCE_PHASE_LABELS[phase],
        generatedAt: qr.generatedAt,
      });
    }
  }
  return checkpoints;
};

const addDaysToDateKey = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const eventDateTime = (dateKey, time = "00:00") => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes) -
      EVENT_TIME_ZONE_OFFSET_MINUTES * 60_000,
  );
};

const buildAttendanceDays = (event) => {
  const startKey = toEventDateKey(event.startDateTime);
  const endKey = toEventDateKey(event.endDateTime);
  const existingDays = new Map(
    (event.attendanceDays || []).map((entry) => [
      toEventDateKey(entry.date),
      entry,
    ]),
  );
  const days = [];
  for (
    let dateKey = startKey;
    dateKey <= endKey;
    dateKey = addDaysToDateKey(dateKey, 1)
  ) {
    const existing = existingDays.get(dateKey);
    days.push(
      existing || {
        day: days.length + 1,
        date: new Date(`${dateKey}T00:00:00.000Z`),
        schedule: { ...DEFAULT_ATTENDANCE_SCHEDULE },
      },
    );
  }
  days.forEach((entry, index) => {
    entry.day = index + 1;
  });
  return days;
};

const ensureAttendanceDays = (event) => {
  const days = buildAttendanceDays(event);
  event.attendanceDays = days;
  return days;
};

const parseAttendanceCode = (code) => {
  try {
    const payload = JSON.parse(String(code || ""));
    const validVersion = payload?.version === 1 || payload?.version === 2;
    const validDay =
      payload?.version === 1 ||
      (Number.isInteger(Number(payload?.day)) &&
        Number(payload.day) > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(payload?.date || "")));
    if (
      payload?.type !== "somis-event-attendance" ||
      !validVersion ||
      !validDay ||
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
    const attendanceDays = buildAttendanceDays({
      startDateTime,
      endDateTime,
      attendanceDays: [],
    });
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
      attendanceDays,
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

const configureAttendanceSchedule = async (req, res) => {
  try {
    const dayNumber = Number(req.body?.day);
    const schedule = normalizeAttendanceSchedule(req.body?.schedule, {
      allowPartial: true,
    });
    if (!Number.isInteger(dayNumber) || dayNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid event day.",
      });
    }
    if (!schedule) {
      return res.status(400).json({
        success: false,
        message:
          "Set at least one valid checkpoint time. Selected times must be chronological.",
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
    if (event.status === "Cancelled" || new Date() >= event.endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Attendance settings cannot be changed for a closed event.",
      });
    }

    const attendanceDays = ensureAttendanceDays(event);
    const attendanceDay = attendanceDays.find(
      (entry) => entry.day === dayNumber,
    );
    if (!attendanceDay) {
      return res.status(400).json({
        success: false,
        message: "The selected day is outside this event's date range.",
      });
    }
    const mergedSchedule = {
      ...DEFAULT_ATTENDANCE_SCHEDULE,
      ...(attendanceDay.schedule?.toObject?.() || attendanceDay.schedule || {}),
      ...Object.fromEntries(
        SCHEDULE_FIELDS.filter((field) => schedule[field]).map((field) => [
          field,
          schedule[field],
        ]),
      ),
    };
    attendanceDay.schedule = mergedSchedule;
    event.attendanceSchedule = {
      ...mergedSchedule,
      configuredAt: new Date(),
      configuredBy: req.user._id,
    };
    await event.save();
    return res.json({
      success: true,
      message: `Day ${dayNumber} attendance schedule saved.`,
      data: {
        day: dayNumber,
        date: attendanceDay.date,
        schedule: attendanceDay.schedule,
      },
    });
  } catch (error) {
    console.error("Error configuring attendance schedule:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save the attendance schedule.",
    });
  }
};

const generateAttendanceQr = async (req, res) => {
  try {
    const phase = String(req.body?.phase || "").toLowerCase();
    const requestedDay = req.body?.day == null ? null : Number(req.body.day);
    if (!ATTENDANCE_PHASES.has(phase)) {
      return res.status(400).json({
        success: false,
        message: "Choose one of the four attendance QR checkpoints.",
      });
    }
    if (
      requestedDay !== null &&
      (!Number.isInteger(requestedDay) || requestedDay < 1)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Choose a valid event day." });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      org: req.user.organization,
    }).select(
      "+attendanceQr.morning_in.tokenHash +attendanceQr.lunch_out.tokenHash +attendanceQr.afternoon_in.tokenHash +attendanceQr.afternoon_out.tokenHash +attendanceDays.attendanceQr.morning_in.tokenHash +attendanceDays.attendanceQr.lunch_out.tokenHash +attendanceDays.attendanceQr.afternoon_in.tokenHash +attendanceDays.attendanceQr.afternoon_out.tokenHash",
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

    const attendanceDays = ensureAttendanceDays(event);
    const day = requestedDay || 1;
    const attendanceDay = attendanceDays.find((entry) => entry.day === day);
    if (!attendanceDay) {
      return res.status(400).json({
        success: false,
        message: "The selected day is outside this event's date range.",
      });
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const date = toEventDateKey(attendanceDay.date);
    const code = JSON.stringify({
      type: "somis-event-attendance",
      version: requestedDay === null ? 1 : 2,
      eventId: String(event._id),
      ...(requestedDay === null ? {} : { day, date }),
      phase,
      token,
    });
    if (requestedDay === null) {
      event.attendanceQr[phase] = {
        tokenHash: hashAttendanceToken(token),
        code,
        generatedAt: now,
        generatedBy: req.user._id,
      };
    } else {
      attendanceDay.attendanceQr[phase] = {
        tokenHash: hashAttendanceToken(token),
        code,
        generatedAt: now,
        generatedBy: req.user._id,
      };
    }
    await event.save();

    return res.json({
      success: true,
      message: `${ATTENDANCE_PHASE_LABELS[phase]} QR generated for Day ${day}.`,
      data: { eventId: event._id, day, date, phase, code, generatedAt: now },
    });
  } catch (error) {
    console.error("Error generating attendance QR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not generate the attendance QR code.",
    });
  }
};

const getCreatedAttendanceQrs = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      org: req.user.organization,
    }).select(
      "+attendanceDays.attendanceQr.morning_in.code +attendanceDays.attendanceQr.lunch_out.code +attendanceDays.attendanceQr.afternoon_in.code +attendanceDays.attendanceQr.afternoon_out.code",
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found for your organization.",
      });
    }

    const records = [];
    for (const attendanceDay of event.attendanceDays || []) {
      for (const phase of ATTENDANCE_PHASES) {
        const qr = attendanceDay.attendanceQr?.[phase];
        if (!qr?.code) continue;
        records.push({
          day: attendanceDay.day,
          date: toEventDateKey(attendanceDay.date),
          phase,
          label: ATTENDANCE_PHASE_LABELS[phase],
          code: qr.code,
          generatedAt: qr.generatedAt,
        });
      }
    }
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching created attendance QRs:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch created attendance QR codes.",
    });
  }
};

const revokeAttendanceQr = async (req, res) => {
  try {
    const day = Number(req.body?.day);
    const phase = String(req.body?.phase || "").toLowerCase();
    if (!Number.isInteger(day) || day < 1 || !ATTENDANCE_PHASES.has(phase)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid event date and attendance checkpoint.",
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      org: req.user.organization,
    }).select(
      "+attendanceDays.attendanceQr.morning_in.tokenHash +attendanceDays.attendanceQr.morning_in.code +attendanceDays.attendanceQr.lunch_out.tokenHash +attendanceDays.attendanceQr.lunch_out.code +attendanceDays.attendanceQr.afternoon_in.tokenHash +attendanceDays.attendanceQr.afternoon_in.code +attendanceDays.attendanceQr.afternoon_out.tokenHash +attendanceDays.attendanceQr.afternoon_out.code",
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found for your organization.",
      });
    }
    if (event.status === "Cancelled" || new Date() >= event.endDateTime) {
      return res.status(400).json({
        success: false,
        message: "QR codes cannot be changed for a closed event.",
      });
    }

    const attendanceDay = (event.attendanceDays || []).find(
      (entry) => entry.day === day,
    );
    if (!attendanceDay) {
      return res.status(400).json({
        success: false,
        message: "The selected date is outside this event's date range.",
      });
    }
    const qr = attendanceDay.attendanceQr?.[phase];
    if (!qr?.tokenHash && !qr?.code) {
      return res.status(404).json({
        success: false,
        message: "No QR code exists for the selected date and checkpoint.",
      });
    }

    qr.tokenHash = null;
    qr.code = null;
    qr.generatedAt = null;
    qr.generatedBy = null;
    await event.save();
    return res.json({
      success: true,
      message: `Day ${day} ${ATTENDANCE_PHASE_LABELS[phase]} QR revoked.`,
      data: { day, phase },
    });
  } catch (error) {
    console.error("Error revoking attendance QR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not revoke the attendance QR code.",
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
      "+attendanceQr.morning_in.tokenHash +attendanceQr.lunch_out.tokenHash +attendanceQr.afternoon_in.tokenHash +attendanceQr.afternoon_out.tokenHash +attendanceDays.attendanceQr.morning_in.tokenHash +attendanceDays.attendanceQr.lunch_out.tokenHash +attendanceDays.attendanceQr.afternoon_in.tokenHash +attendanceDays.attendanceQr.afternoon_out.tokenHash",
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

    const attendanceDays = ensureAttendanceDays(event);
    const day = payload.version === 2 ? Number(payload.day) : 1;
    const attendanceDay = attendanceDays.find((entry) => entry.day === day);
    const storedHash =
      payload.version === 2
        ? attendanceDay?.attendanceQr?.[payload.phase]?.tokenHash
        : event.attendanceQr?.[payload.phase]?.tokenHash;
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
    if (
      event.status === "Cancelled" ||
      now >= event.endDateTime ||
      !attendanceDay
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance for this event is closed or the QR day is invalid.",
      });
    }
    if (
      payload.version === 2 &&
      payload.date !== toEventDateKey(attendanceDay.date)
    ) {
      return res.status(400).json({
        success: false,
        message: "This QR code does not match its configured event day.",
      });
    }
    if (payload.version === 2 && toEventDateKey(now) !== payload.date) {
      return res.status(400).json({
        success: false,
        message: "This QR code is only valid on its configured event date.",
      });
    }

    let attendance = await EventAttendance.findOne({
      event: event._id,
      student: req.user._id,
    });

    const schedule =
      payload.version === 2
        ? attendanceDay.schedule || DEFAULT_ATTENDANCE_SCHEDULE
        : event.attendanceSchedule || DEFAULT_ATTENDANCE_SCHEDULE;
    const checkpointTime = schedule[PHASE_SCHEDULE_FIELDS[payload.phase]];
    const eventDateKey =
      payload.version === 2
        ? toEventDateKey(attendanceDay.date)
        : toEventDateKey(event.startDateTime);
    const checkpointStart = eventDateTime(eventDateKey, checkpointTime);
    const nextTime = NEXT_PHASE_SCHEDULE_FIELDS[payload.phase]
      ? schedule[NEXT_PHASE_SCHEDULE_FIELDS[payload.phase]]
      : null;
    const checkpointEnd = nextTime
      ? eventDateTime(eventDateKey, nextTime)
      : payload.version === 2 && day < attendanceDays.length
        ? eventDateTime(toEventDateKey(attendanceDays[day].date), "00:00")
        : event.endDateTime;
    if (now < checkpointStart || now >= checkpointEnd) {
      return res.status(400).json({
        success: false,
        message: `This QR code is only valid from ${checkpointTime} until ${nextTime || "the event ends"}.`,
      });
    }
    if (!attendance) {
      return res.status(409).json({
        success: false,
        message: "Join this event before scanning an attendance QR code.",
      });
    }
    const checkpointField = ATTENDANCE_PHASE_FIELDS[payload.phase];
    if (payload.version === 2) {
      let dailyRecord = attendance.days.find((entry) => entry.day === day);
      if (!dailyRecord) {
        attendance.days.push({ day, date: attendanceDay.date });
        dailyRecord = attendance.days[attendance.days.length - 1];
      }
      if (dailyRecord[checkpointField]) {
        return res.json({
          success: true,
          message: `${ATTENDANCE_PHASE_LABELS[payload.phase]} was already recorded.`,
          data: attendance,
        });
      }
      dailyRecord[checkpointField] = now;
      dailyRecord.presentAt = dailyRecord.presentAt || now;
    } else {
      if (attendance[checkpointField]) {
        return res.json({
          success: true,
          message: `${ATTENDANCE_PHASE_LABELS[payload.phase]} was already recorded.`,
          data: attendance,
        });
      }
      attendance[checkpointField] = now;
      attendance.presentAt = attendance.presentAt || now;
    }
    attendance.status = "Present";
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

const getMyAttendanceFines = async (req, res) => {
  try {
    const fines = await AttendanceFine.find({
      org: req.user.organization,
      student: req.user._id,
      status: "UNPAID",
    })
      .populate("event", "title startDateTime")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      data: fines,
      total: fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0),
    });
  } catch (error) {
    console.error("Error fetching student attendance fines:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch attendance fines.",
    });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const records = await EventAttendance.find({
      student: req.user._id,
    }).select(
      "event status joinedAt days morningInAt lunchOutAt afternoonInAt afternoonOutAt presentAt updatedAt",
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

const configureAttendanceFine = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Fine amount must be zero or greater.",
      });
    }
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, org: req.user.organization },
      { $set: { attendanceFineAmount: amount } },
      { new: true, runValidators: true },
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found for your organization.",
      });
    }
    return res.json({
      success: true,
      data: {
        eventId: event._id,
        attendanceFineAmount: event.attendanceFineAmount,
      },
    });
  } catch (error) {
    console.error("Error configuring attendance fine:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save attendance fine.",
    });
  }
};

const finalizeEventAttendanceFines = async (req, res) => {
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
    if (new Date() < event.endDateTime && event.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Attendance fines can be generated after the event ends.",
      });
    }
    const organization = await Organization.findById(event.org).select(
      "attendanceFineAmount",
    );
    const amount = Number(
      event.attendanceFineAmount ?? organization?.attendanceFineAmount ?? 0,
    );
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Set an attendance fine amount before finalizing.",
      });
    }

    const attendees = await EventAttendance.find({ event: event._id })
      .select("student member status")
      .lean();
    const fines = [];
    for (const record of attendees) {
      if (record.status === "Present") {
        await AttendanceFine.deleteOne({
          event: event._id,
          student: record.student,
        });
        continue;
      }
      fines.push(
        await AttendanceFine.findOneAndUpdate(
          { event: event._id, student: record.student },
          {
            $set: {
              org: event.org,
              member: record.member,
              amount,
              reason: `Absent from ${event.title}`,
              status: "UNPAID",
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          },
        ),
      );
    }
    return res.json({ success: true, count: fines.length, data: fines });
  } catch (error) {
    console.error("Error finalizing attendance fines:", error);
    return res.status(500).json({
      success: false,
      message: "Could not generate attendance fines.",
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

    return res.json({
      success: true,
      data: records,
      summary,
      checkpoints: getCreatedAttendanceCheckpoints(event),
    });
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
  getCreatedAttendanceQrs,
  revokeAttendanceQr,
  configureAttendanceSchedule,
  joinEvent,
  scanAttendanceQr,
  getMyAttendance,
  getMyAttendanceFines,
  getEventAttendance,
  configureAttendanceFine,
  finalizeEventAttendanceFines,
  parseAttendanceCode,
  getCreatedAttendanceCheckpoints,
};
