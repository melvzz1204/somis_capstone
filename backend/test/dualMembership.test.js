const test = require("node:test");
const assert = require("node:assert/strict");

const {
  OFFICER_PORTAL_ROLES,
  checkDualMembership,
} = require("../src/controllers/authController");

test("officer portal roles cover the student officer accounts", () => {
  assert.deepEqual([...OFFICER_PORTAL_ROLES].sort(), [
    "org_admin",
    "pio",
    "secretary",
    "treasurer",
  ]);
});

test("non-officer accounts are never offered a portal choice", async () => {
  for (const role of ["student", "admin", "adviser", "dean", "director", undefined, null]) {
    assert.equal(await checkDualMembership({ role }), false);
  }
});

test("missing or invalid accounts are never offered a portal choice", async () => {
  assert.equal(await checkDualMembership(null), false);
  assert.equal(await checkDualMembership(undefined), false);
  assert.equal(await checkDualMembership({}), false);
});
