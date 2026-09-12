import test from "node:test";
import assert from "node:assert/strict";

import {
  RESOLUTION_STATUSES,
  STATUS_CLASSES,
  STATUS_LABELS,
  PENDING_REVIEWER_BY_STATUS,
  isTerminal,
  getStatusClass,
} from "../src/util/resolutionStatus.js";

test("isTerminal is true only for adopted and rejected resolutions", () => {
  assert.equal(isTerminal("Adopted"), true);
  assert.equal(isTerminal("Rejected"), true);

  assert.equal(isTerminal("Draft"), false);
  assert.equal(isTerminal("Submitted"), false);
  assert.equal(isTerminal("Pending Adviser Review"), false);
  assert.equal(isTerminal("Pending Dean Review"), false);
});

test("pending reviewer mapping follows president -> adviser -> dean", () => {
  assert.equal(PENDING_REVIEWER_BY_STATUS.Submitted, "president");
  assert.equal(
    PENDING_REVIEWER_BY_STATUS["Pending Adviser Review"],
    "adviser",
  );
  assert.equal(PENDING_REVIEWER_BY_STATUS["Pending Dean Review"], "dean");
});

test("status labels and classes are defined for all six statuses", () => {
  assert.equal(RESOLUTION_STATUSES.length, 6);
  for (const status of RESOLUTION_STATUSES) {
    assert.equal(typeof STATUS_LABELS[status], "string");
    assert.equal(typeof STATUS_CLASSES[status], "string");
    assert.ok(STATUS_CLASSES[status].length > 0);
  }
});

test("getStatusClass falls back to a neutral class for unknown statuses", () => {
  assert.equal(getStatusClass("Adopted"), STATUS_CLASSES.Adopted);
  assert.equal(
    getStatusClass("Nonexistent"),
    "border-slate-200 bg-slate-50 text-slate-700",
  );
});
