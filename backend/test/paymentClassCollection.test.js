const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Payment = require("../src/models/Payment");

const basePayment = (overrides = {}) => ({
  member: new mongoose.Types.ObjectId(),
  organization: new mongoose.Types.ObjectId(),
  fee: new mongoose.Types.ObjectId(),
  claimedAmount: 550,
  paymentMethod: "CASH",
  recordedBy: new mongoose.Types.ObjectId(),
  status: "PENDING_MANUAL_REVIEW",
  verificationMethod: "CASH_MANUAL",
  ...overrides,
});

test("a class-collected payment starts unremitted and pending", async () => {
  const doc = new Payment(basePayment());
  await doc.validate();
  assert.equal(doc.remitted, false);
  assert.equal(doc.remittedAt, undefined);
  assert.equal(doc.status, "PENDING_MANUAL_REVIEW");
});

test("a class-collected e-wallet payment validates with a reference", async () => {
  const doc = new Payment(
    basePayment({
      paymentMethod: "GCASH",
      referenceNumber: "1234567890123",
      verificationMethod: "MANUAL",
    }),
  );
  await doc.validate();
  assert.equal(doc.referenceNumber, "1234567890123");
});

test("a class-collected payment requires a member or student", async () => {
  const doc = new Payment(basePayment({ member: undefined }));
  await assert.rejects(doc.validate(), (error) => {
    assert.ok(error.errors.student);
    return true;
  });
});
