const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractStatementReferences,
} = require("../src/controllers/paymentController");

test("extracts continuous 10-to-13-digit GCash references", () => {
  const text =
    "Transaction Reference Number: 100234567891. Another reference: 1234567890.";

  assert.deepEqual(extractStatementReferences(text), [
    "100234567891",
    "1234567890",
  ]);
});

test("normalizes spaces and hyphens inside statement references", () => {
  const text = "Reference No. 1002 3456 7891\nReference No. 1234-567-8901";

  assert.deepEqual(extractStatementReferences(text), [
    "100234567891",
    "12345678901",
  ]);
});

test("deduplicates references and ignores invalid digit runs", () => {
  const text =
    "Ref 100234567891 Ref 1002 3456 7891 Short 123456789 Long 12345678901234";

  assert.deepEqual(extractStatementReferences(text), ["100234567891"]);
});

test("does not treat labeled phone and contact numbers as references", () => {
  const text =
    "Mobile: 09171234567 Contact Number: 09981234567 Reference: 100234567891";

  assert.deepEqual(extractStatementReferences(text), ["100234567891"]);
});

test("does not extract digits embedded in longer numeric values", () => {
  assert.deepEqual(
    extractStatementReferences("Amount 12345678901234 and ID 123456789012345"),
    [],
  );
});
