import { formatCountdown } from "./eventLifecycle.js";

const PAST = "past";
const UPCOMING = "upcoming";

const SOON_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the tab a meeting belongs to based on the current time.
 * A meeting is "past" only once its endDateTime has passed; meetings
 * that are upcoming or currently ongoing stay in the upcoming tab.
 */
const getMeetingStatus = (meeting, now = Date.now()) => {
  const end = new Date(meeting?.endDateTime).getTime();

  if (Number.isNaN(end) || end >= now) return UPCOMING;
  return PAST;
};

const partitionMeetingsByStatus = (meetings, now = Date.now()) => {
  const upcoming = [];
  const past = [];

  (meetings || []).forEach((meeting) => {
    if (getMeetingStatus(meeting, now) === PAST) past.push(meeting);
    else upcoming.push(meeting);
  });

  // Soonest first for upcoming, most recently ended first for past.
  const byStartAscending = (a, b) =>
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();

  upcoming.sort(byStartAscending);
  past.sort((a, b) => byStartAscending(b, a));

  return { upcoming, past };
};

/**
 * Builds the notification for the next upcoming meeting shown in the
 * meetings tab. Returns null when there is nothing worth announcing.
 */
const getUpcomingMeetingNotice = (meeting, now = Date.now()) => {
  if (!meeting) return null;

  const start = new Date(meeting.startDateTime).getTime();
  const end = new Date(meeting.endDateTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  if (now >= start && now < end) {
    return { tone: "ongoing", label: "Happening now" };
  }

  if (now < start) {
    const remaining = start - now;
    if (remaining <= SOON_THRESHOLD_MS) {
      return { tone: "soon", label: `Starts in ${formatCountdown(remaining)}` };
    }
    return { tone: "later", label: "Next upcoming meeting" };
  }

  return null;
};

export {
  PAST,
  UPCOMING,
  getMeetingStatus,
  getUpcomingMeetingNotice,
  partitionMeetingsByStatus,
};
