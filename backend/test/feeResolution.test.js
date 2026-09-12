const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Fee = require("../src/models/Fee");

// A8: `Fee.resolution` is enforced for new documents only, protecting legacy
// fee records that predate the resolution workflow.
const baseFee = () => ({
  org: new mongoose.Types.ObjectId(),
  title: "Organization Fee",
  amount: 100,
  academicYear: "2026-2027",
  semester: "1st Semester",
  dueDate: new Date("2027-01-01T00:00:00.000Z"),
});

test("a new fee without a resolution fails validation", async () => {
  await assert.rejects(new Fee(baseFee()).validate(), (error) => {
    assert.ok(error.errors.resolution);
    return true;
  });
});

test("a new fee that references a resolution passes the resolution guard", async () => {
  const fee = new Fee({
    ...baseFee(),
    resolution: new mongoose.Types.ObjectId(),
  });

  await fee.validate();
  assert.ok(fee.resolution);
});

test("legacy fees (not new) remain valid without a resolution", async () => {
  const fee = new Fee(baseFee());
  // Simulate a persisted record loaded from the database.
  fee.isNew = false;

  await fee.validate();
  assert.equal(fee.resolution, null);
});
