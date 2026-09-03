import test from "node:test";
import assert from "node:assert/strict";

import {
  PAST,
  UPCOMING,
  getMeetingStatus,
  getUpcomingMeetingNotice,
  partitionMeetingsByStatus,
} from "../src/util/meetingStatus.js";

const NOW = new Date("2026-09-03T04:00:00.000Z").getTime();

test("meetings that have not ended are upcoming", () => {
  const future = { endDateTime: "2026-09-10T00:00:00.000Z" };
  const ongoing = {
    startDateTime: "2026-09-03T03:00:00.000Z",
    endDateTime: "2026-09-03T05:00:00.000Z",
  };

  assert.equal(getMeetingStatus(future, NOW), UPCOMING);
  assert.equal(getMeetingStatus(ongoing, NOW), UPCOMING);
});

test("meetings whose end time has passed are past", () => {
  const ended = { endDateTime: "2026-09-03T03:59:59.000Z" };

  assert.equal(getMeetingStatus(ended, NOW), PAST);
});

test("invalid end dates are treated as upcoming so they stay visible", () => {
  assert.equal(getMeetingStatus({}, NOW), UPCOMING);
  assert.equal(getMeetingStatus({ endDateTime: "not-a-date" }, NOW), UPCOMING);
});

test("meetings are partitioned and sorted per tab", () => {
  const meetings = [
    {
      _id: "later",
      startDateTime: "2026-09-20T00:00:00.000Z",
      endDateTime: "2026-09-20T01:00:00.000Z",
    },
    {
      _id: "soonest",
      startDateTime: "2026-09-04T00:00:00.000Z",
      endDateTime: "2026-09-04T01:00:00.000Z",
    },
    {
      _id: "oldest",
      startDateTime: "2026-08-01T00:00:00.000Z",
      endDateTime: "2026-08-01T01:00:00.000Z",
    },
    {
      _id: "recent",
      startDateTime: "2026-09-01T00:00:00.000Z",
      endDateTime: "2026-09-01T01:00:00.000Z",
    },
  ];

  const { upcoming, past } = partitionMeetingsByStatus(meetings, NOW);

  assert.deepEqual(
    upcoming.map((meeting) => meeting._id),
    ["soonest", "later"],
  );
  assert.deepEqual(
    past.map((meeting) => meeting._id),
    ["recent", "oldest"],
  );
});

test("partitioning handles null or empty meeting lists", () => {
  assert.deepEqual(partitionMeetingsByStatus(null, NOW), {
    upcoming: [],
    past: [],
  });
  assert.deepEqual(partitionMeetingsByStatus([], NOW), {
    upcoming: [],
    past: [],
  });
});

test("ongoing meetings are announced as happening now", () => {
  const meeting = {
    title: "General Assembly",
    startDateTime: "2026-09-03T03:00:00.000Z",
    endDateTime: "2026-09-03T05:00:00.000Z",
  };

  assert.deepEqual(getUpcomingMeetingNotice(meeting, NOW), {
    tone: "ongoing",
    label: "Happening now",
  });
});

test("meetings starting within 24 hours show a countdown", () => {
  const meeting = {
    title: "Officer huddle",
    startDateTime: "2026-09-03T07:30:00.000Z",
    endDateTime: "2026-09-03T08:30:00.000Z",
  };

  const notice = getUpcomingMeetingNotice(meeting, NOW);

  assert.equal(notice.tone, "soon");
  assert.match(notice.label, /^Starts in /);
});

test("meetings beyond 24 hours are announced as next upcoming", () => {
  const meeting = {
    title: "Planning session",
    startDateTime: "2026-09-10T00:00:00.000Z",
    endDateTime: "2026-09-10T01:00:00.000Z",
  };

  assert.deepEqual(getUpcomingMeetingNotice(meeting, NOW), {
    tone: "later",
    label: "Next upcoming meeting",
  });
});

test("no notice for ended meetings or invalid data", () => {
  const ended = {
    startDateTime: "2026-09-01T00:00:00.000Z",
    endDateTime: "2026-09-01T01:00:00.000Z",
  };

  assert.equal(getUpcomingMeetingNotice(ended, NOW), null);
  assert.equal(getUpcomingMeetingNotice(null, NOW), null);
  assert.equal(getUpcomingMeetingNotice({ startDateTime: "nope" }, NOW), null);
});
