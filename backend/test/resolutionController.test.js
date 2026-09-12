const test = require("node:test");
const assert = require("node:assert/strict");

const {
  REVIEW_RULES,
  REQUIRE_MEETING_ALREADY_OCCURRED,
  buildActivityProposal,
  parseJsonArray,
  parseJsonObject,
} = require("../src/controllers/resolutionController");

test("REVIEW_RULES defines exactly the president, adviser, and dean stages", () => {
  assert.deepEqual(Object.keys(REVIEW_RULES).sort(), [
    "adviser",
    "dean",
    "org_admin",
  ]);
  // A1: no OVPSAS/admin step exists for resolutions.
  assert.equal(REVIEW_RULES.admin, undefined);
});

test("president review moves a submitted resolution to adviser review", () => {
  assert.equal(REVIEW_RULES.org_admin.expectedStatus, "Submitted");
  assert.equal(REVIEW_RULES.org_admin.nextStatus, "Pending Adviser Review");
  assert.equal(REVIEW_RULES.org_admin.reviewField, "presidentReview");
});

test("adviser review forwards an approved resolution to dean review", () => {
  assert.equal(REVIEW_RULES.adviser.expectedStatus, "Pending Adviser Review");
  assert.equal(REVIEW_RULES.adviser.nextStatus, "Pending Dean Review");
  assert.equal(REVIEW_RULES.adviser.reviewField, "adviserReview");
});

test("dean approval adopts the resolution as the terminal success state", () => {
  assert.equal(REVIEW_RULES.dean.expectedStatus, "Pending Dean Review");
  assert.equal(REVIEW_RULES.dean.nextStatus, "Adopted");
  assert.equal(REVIEW_RULES.dean.reviewField, "deanReview");
});

test("each stage resolves a signature server-side", () => {
  for (const rule of Object.values(REVIEW_RULES)) {
    assert.equal(typeof rule.resolveSignature, "function");
  }
});

test("meeting-first enforcement (A6) is enabled by default", () => {
  assert.equal(REQUIRE_MEETING_ALREADY_OCCURRED, true);
});

test("parseJsonArray parses JSON arrays and falls back to newline text", () => {
  assert.deepEqual(parseJsonArray('["a","b"]'), ["a", "b"]);
  assert.deepEqual(parseJsonArray("first\n\nsecond"), ["first", "second"]);
  assert.deepEqual(parseJsonArray(""), []);
  assert.deepEqual(parseJsonArray(["x"]), ["x"]);
});

test("parseJsonObject parses JSON objects and rejects invalid input", () => {
  assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJsonObject("not json"), {});
  const existing = { already: true };
  assert.equal(parseJsonObject(existing), existing);
});

test("buildActivityProposal coerces numbers, trims funds, and attaches files", () => {
  const attachments = [{ filename: "a.pdf" }];
  const proposal = buildActivityProposal(
    {
      proposalTitle: "Summit",
      expectedAttendees: "45",
      totalBudgetAllocation: "1200.50",
      sourceOfFunds: "  Dues Collection: X  ",
      requiresFeeCollection: "true",
      unknownField: "ignored",
    },
    attachments,
  );

  assert.equal(proposal.expectedAttendees, 45);
  assert.equal(proposal.totalBudgetAllocation, 1200.5);
  assert.equal(proposal.sourceOfFunds, "Dues Collection: X");
  assert.equal(proposal.requiresFeeCollection, true);
  assert.equal(proposal.unknownField, undefined);
  assert.deepEqual(proposal.attachments, attachments);
});

test("buildActivityProposal defaults requiresFeeCollection to false", () => {
  const proposal = buildActivityProposal({ proposalTitle: "Summit" });
  assert.equal(proposal.requiresFeeCollection, false);
  assert.deepEqual(proposal.attachments, []);
});
