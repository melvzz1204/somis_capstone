import test from "node:test";
import assert from "node:assert/strict";

import {
  getAttendanceScanCount,
  getCreatedAttendanceCheckpoints,
  groupAttendanceCheckpointsByDay,
} from "../src/util/eventAttendance.js";

const event = {
  startDateTime: "2026-08-29T00:00:00.000Z",
  attendanceDays: [
    {
      day: 1,
      date: "2026-08-29T00:00:00.000Z",
      attendanceQr: {
        morning_in: { generatedAt: "2026-08-28T10:00:00.000Z" },
        lunch_out: { generatedAt: "2026-08-28T10:01:00.000Z" },
        afternoon_in: {},
        afternoon_out: {},
      },
    },
  ],
};

test("attendance reflects only QR checkpoints created by the secretary", () => {
  const checkpoints = getCreatedAttendanceCheckpoints(event);

  assert.deepEqual(
    checkpoints.map(({ key, field, label }) => ({ key, field, label })),
    [
      { key: "morning_in", field: "morningInAt", label: "Morning in" },
      { key: "lunch_out", field: "lunchOutAt", label: "Morning out" },
    ],
  );
});

test("scan totals use only created QR checkpoints", () => {
  const checkpoints = getCreatedAttendanceCheckpoints(event);
  const record = {
    days: [
      {
        day: 1,
        morningInAt: "2026-08-29T00:05:00.000Z",
        afternoonInAt: "2026-08-29T05:05:00.000Z",
      },
    ],
  };

  assert.equal(getAttendanceScanCount(record, checkpoints), 1);
});

test("created checkpoints are grouped by their configured event day", () => {
  const groups = groupAttendanceCheckpointsByDay(
    getCreatedAttendanceCheckpoints(event),
  );

  assert.equal(groups.length, 1);
  assert.equal(groups[0].day, 1);
  assert.equal(groups[0].checkpoints.length, 2);
});
