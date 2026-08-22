const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getLifecycle,
  parseAttendanceCode,
} = require("../src/controllers/eventController");

const validCode = (phase = "invalid") =>
  JSON.stringify({
    type: "somis-event-attendance",
    version: 1,
    eventId: "64b000000000000000000001",
    phase,
    token: "random-secret-token",
  });

test("parseAttendanceCode accepts each attendance checkpoint", () => {
  for (const phase of [
    "morning_in",
    "lunch_out",
    "afternoon_in",
    "afternoon_out",
  ]) {
    assert.equal(parseAttendanceCode(validCode(phase)).phase, phase);
  }
});

test("parseAttendanceCode rejects malformed and unsupported payloads", () => {
  assert.equal(parseAttendanceCode("not-json"), null);
  assert.equal(parseAttendanceCode(JSON.stringify({})), null);
  assert.equal(
    parseAttendanceCode(
      JSON.stringify({
        type: "another-system",
        version: 1,
        eventId: "64b000000000000000000001",
        phase: "advance",
        token: "secret",
      }),
    ),
    null,
  );
  assert.equal(parseAttendanceCode(validCode("onsite")), null);
  assert.equal(parseAttendanceCode(validCode("advance")), null);
  assert.equal(parseAttendanceCode(validCode("final")), null);
});

test("getLifecycle reports upcoming, ongoing, ended, and cancelled events", () => {
  const now = Date.parse("2026-08-14T10:00:00.000Z");
  const baseEvent = {
    startDateTime: new Date(now + 60_000),
    endDateTime: new Date(now + 120_000),
    status: "Scheduled",
  };

  assert.deepEqual(getLifecycle(baseEvent, now), {
    lifecycleStatus: "Upcoming",
    countdownTo: baseEvent.startDateTime,
  });
  assert.deepEqual(
    getLifecycle(
      {
        ...baseEvent,
        startDateTime: new Date(now),
      },
      now,
    ),
    { lifecycleStatus: "Ongoing", countdownTo: baseEvent.endDateTime },
  );
  assert.deepEqual(
    getLifecycle(
      {
        ...baseEvent,
        startDateTime: new Date(now - 120_000),
        endDateTime: new Date(now),
      },
      now,
    ),
    { lifecycleStatus: "Ended", countdownTo: null },
  );
  assert.deepEqual(getLifecycle({ ...baseEvent, status: "Cancelled" }, now), {
    lifecycleStatus: "Cancelled",
    countdownTo: null,
  });
});
