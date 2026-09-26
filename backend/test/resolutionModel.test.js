const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Resolution = require("../src/models/Resolution");

const baseProposal = () => ({
  proposalTitle: "Leadership Summit",
  activityCategory: "Academic",
  projectObjectives: "Raise leadership competencies.",
  projectDescription: "A full-day officer training summit.",
  requestedStartDateTime: new Date("2026-03-01T01:00:00.000Z"),
  requestedEndDateTime: new Date("2026-03-01T05:00:00.000Z"),
  targetVenue: "AVR",
  expectedAttendees: 50,
  targetAudience: "Org Members Only",
  totalBudgetAllocation: 1000,
  sourceOfFunds: "Organization funds",
  projectLeadPerson: "Jane Doe",
  projectLeadContact: "jane@example.com",
});

const baseResolution = (overrides = {}) => ({
  org: new mongoose.Types.ObjectId(),
  meeting: new mongoose.Types.ObjectId(),
  title: "A Resolution Adopting the Leadership Summit",
  resolvedClauses: ["RESOLVED, that the leadership summit be adopted."],
  activityProposal: baseProposal(),
  createdBy: new mongoose.Types.ObjectId(),
  status: "Draft",
  ...overrides,
});

test("a well-formed draft resolution passes validation", async () => {
  await new Resolution(baseResolution()).validate();
});

test("new resolutions start with no resubmission lineage", async () => {
  const doc = new Resolution(baseResolution());
  await doc.validate();
  assert.equal(doc.resubmissionOf, null);
  assert.equal(doc.resubmitCount, 0);
  assert.equal(doc.baseResolutionNumber, "");
});

test("embedded proposal end before start is rejected", async () => {
  const doc = new Resolution(
    baseResolution({
      activityProposal: {
        ...baseProposal(),
        requestedStartDateTime: new Date("2026-03-01T05:00:00.000Z"),
        requestedEndDateTime: new Date("2026-03-01T01:00:00.000Z"),
      },
    }),
  );

  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors["activityProposal.requestedEndDateTime"]);
    return true;
  });
});

test("a resolution with no clauses is accepted (text lives in the attachment)", async () => {
  const doc = new Resolution(
    baseResolution({ resolvedClauses: [], whereasClauses: [] }),
  );

  await doc.validate();
  assert.deepEqual(doc.resolvedClauses, []);
});

test("blank clauses are trimmed away, leaving only real clauses", async () => {
  const doc = new Resolution(
    baseResolution({
      whereasClauses: ["  ", "WHEREAS, the org has planned a summit;"],
      resolvedClauses: ["   ", "RESOLVED, that it proceed."],
    }),
  );

  await doc.validate();
  assert.deepEqual(doc.whereasClauses, [
    "WHEREAS, the org has planned a summit;",
  ]);
  assert.deepEqual(doc.resolvedClauses, ["RESOLVED, that it proceed."]);
});

test("a non-draft resolution requires a resolution number", async () => {
  const doc = new Resolution(
    baseResolution({ status: "Submitted", resolutionNumber: "" }),
  );

  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.resolutionNumber);
    return true;
  });
});

test("adopting a resolution without an approved OVPSAS review is rejected", async () => {
  const doc = new Resolution(
    baseResolution({
      status: "Adopted",
      resolutionNumber: "RES-2026-001",
    }),
  );

  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.status);
    return true;
  });
});

test("an adopted resolution with an approved OVPSAS review validates", async () => {
  const doc = new Resolution(
    baseResolution({
      status: "Adopted",
      resolutionNumber: "RES-2026-001",
      deanReview: {
        decision: "Approved",
        digitalSignature: "Dean, Alex",
        reviewedAt: new Date("2026-03-02T00:00:00.000Z"),
      },
      directorReview: {
        decision: "Approved",
        digitalSignature: "Director, Sam",
        reviewedAt: new Date("2026-03-03T00:00:00.000Z"),
      },
      ovpsasReview: {
        decision: "Approved",
        digitalSignature: "OVPSAS Admin",
        reviewedAt: new Date("2026-03-04T00:00:00.000Z"),
      },
    }),
  );

  await doc.validate();
});
