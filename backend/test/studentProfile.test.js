const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const StudentProfile = require("../src/models/studentProfile");

const baseProfile = (overrides = {}) => ({
  user: new mongoose.Types.ObjectId(),
  firstName: "Juan",
  lastName: "Dela Cruz",
  studentIdNumber: `TEST-${new mongoose.Types.ObjectId().toString().slice(-6)}`,
  contactNumber: "09171234567",
  birthDate: new Date("2004-01-01"),
  college: "College of Information and Computing Sciences",
  organization: new mongoose.Types.ObjectId(),
  program: "BSIT",
  section: "BSIT 3A",
  yearLevel: "3rd Year",
  ...overrides,
});

test("an empty contact number is allowed (adopted officer profiles)", async () => {
  await new StudentProfile(baseProfile({ contactNumber: "" })).validate();
});

test("a valid 11-digit contact number passes", async () => {
  await new StudentProfile(baseProfile()).validate();
});

test("a malformed contact number is rejected", async () => {
  const doc = new StudentProfile(baseProfile({ contactNumber: "12345" }));
  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.contactNumber);
    return true;
  });
});
