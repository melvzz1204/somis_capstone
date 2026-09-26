const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Meeting = require("../src/models/Meeting");
const {
  applyAudienceScope,
  withViewedFlag,
} = require("../src/controllers/meetingController");

test("new meetings start with an empty viewer list", async () => {
  const meeting = new Meeting({
    organization: new mongoose.Types.ObjectId(),
    title: "General Assembly",
    startDateTime: new Date("2026-10-01T01:00:00.000Z"),
    endDateTime: new Date("2026-10-01T03:00:00.000Z"),
    venue: "Gymnasium",
    createdBy: new mongoose.Types.ObjectId(),
  });

  await meeting.validate();
  assert.deepEqual(meeting.viewedBy, []);
});

test("students only see All Members and Students meetings", () => {
  const query = applyAudienceScope({}, { role: "student" });
  assert.deepEqual(query.audience, { $in: ["All Members", "Students"] });
});

test("officers see All Members and Officers meetings", () => {
  for (const role of ["secretary", "treasurer", "pio", "adviser", "dean"]) {
    const query = applyAudienceScope({}, { role });
    assert.deepEqual(query.audience, { $in: ["All Members", "Officers"] });
  }
});

test("managers keep the unscoped organization query", () => {
  for (const role of ["org_admin", "admin"]) {
    const query = applyAudienceScope({ organization: "org-1" }, { role });
    assert.deepEqual(query, { organization: "org-1" });
  }
});

test("withViewedFlag marks meetings viewed by the caller", () => {
  const userId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  const [seen, unseen] = withViewedFlag(
    [
      { _id: "a", title: "Seen", viewedBy: [userId] },
      { _id: "b", title: "Unseen", viewedBy: [otherId] },
      { _id: "c", title: "No viewers" },
    ],
    userId,
  );

  assert.equal(seen.viewed, true);
  assert.equal(unseen.viewed, false);
  assert.equal(withViewedFlag([{ _id: "c" }], userId)[0].viewed, false);
});

test("withViewedFlag strips the raw viewer list from responses", () => {
  const userId = new mongoose.Types.ObjectId();
  const [meeting] = withViewedFlag(
    [{ _id: "a", title: "Assembly", viewedBy: [userId] }],
    userId,
  );

  assert.equal("viewedBy" in meeting, false);
  assert.equal(meeting.title, "Assembly");
  assert.equal(meeting.viewed, true);
});
