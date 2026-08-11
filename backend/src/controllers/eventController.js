const Event = require("../models/Event");
const Proposal = require("../models/Proposal");

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

module.exports = { getEvents, createEvent, getLifecycle };
