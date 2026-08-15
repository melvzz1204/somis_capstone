const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SUBMITTER_ROLES,
  REVIEW_RULES,
  normalizeDocumentType,
  isValidSchoolYear,
  getDocumentPeriodFilter,
  validateFields,
} = require("../src/controllers/organizationDocumentController");
const {
  MAX_DOCUMENT_FILES,
  MAX_DOCUMENT_FILE_SIZE,
  allowedFileTypes,
} = require("../src/middleware/organizationDocumentUpload");

test("normalizeDocumentType returns canonical document categories", () => {
  assert.equal(normalizeDocumentType(" Annual_Report "), "Annual Report");
  assert.equal(normalizeDocumentType("activity-plan"), "Activity Plan");
  assert.equal(normalizeDocumentType("organization plan"), "Activity Plan");
  assert.equal(normalizeDocumentType("organisational plan"), "Activity Plan");
  assert.equal(normalizeDocumentType("financial report"), "");
});

test("isValidSchoolYear accepts only consecutive YYYY-YYYY years", () => {
  assert.equal(isValidSchoolYear("2026-2027"), true);
  assert.equal(isValidSchoolYear(" 2026-2027 "), true);
  assert.equal(isValidSchoolYear("2026-2028"), false);
  assert.equal(isValidSchoolYear("26-27"), false);
  assert.equal(isValidSchoolYear("2026/2027"), false);
  assert.equal(isValidSchoolYear(""), false);
});

test("document period filter maps the active academic year to school year", () => {
  assert.deepEqual(
    getDocumentPeriodFilter({
      academicYear: "2029-2030",
      semester: "2nd Semester",
    }),
    {
      schoolYear: "2029-2030",
      semester: "2nd Semester",
    },
  );
});

test("validateFields trims and canonicalizes a valid submission", () => {
  assert.deepEqual(
    validateFields({
      documentType: "organization plan",
      title: "  Semester Activity Program  ",
      schoolYear: " 2026-2027 ",
      semester: " 1st Semester ",
    }),
    {
      data: {
        documentType: "Activity Plan",
        title: "Semester Activity Program",
        schoolYear: "2026-2027",
        semester: "1st Semester",
      },
    },
  );
});

test("validateFields rejects invalid metadata", () => {
  assert.match(
    validateFields({
      documentType: "memo",
      title: "Title",
      schoolYear: "2026-2027",
      semester: "1st Semester",
    }).error,
    /Annual Report or Activity Plan/,
  );

  assert.equal(
    validateFields({
      documentType: "Annual Report",
      title: "",
      schoolYear: "2026-2027",
      semester: "1st Semester",
    }).error,
    "Title is required.",
  );

  assert.match(
    validateFields({
      documentType: "Annual Report",
      title: "A".repeat(151),
      schoolYear: "2026-2027",
      semester: "1st Semester",
    }).error,
    /150 characters/,
  );

  assert.match(
    validateFields({
      documentType: "Annual Report",
      title: "Annual Accomplishment Report",
      schoolYear: "2026-2028",
      semester: "1st Semester",
    }).error,
    /consecutive years/,
  );

  assert.equal(
    validateFields({
      documentType: "Annual Report",
      title: "Annual Accomplishment Report",
      schoolYear: "2026-2027",
      semester: "Third Semester",
    }).error,
    "Select a valid semester.",
  );
});

test("submitter roles and review transitions match the required workflow", () => {
  assert.deepEqual([...SUBMITTER_ROLES].sort(), [
    "org_admin",
    "secretary",
    "treasurer",
  ]);
  assert.deepEqual(REVIEW_RULES.adviser, {
    expectedStatus: "Pending Adviser Review",
    nextStatus: "Pending OVPSAS Review",
    reviewField: "adviserReview",
    reviewerLabel: "faculty adviser",
    nextReviewerLabel: "OVPSAS administrator",
  });
  assert.deepEqual(REVIEW_RULES.admin, {
    expectedStatus: "Pending OVPSAS Review",
    nextStatus: "Approved",
    reviewField: "ovpsasReview",
    reviewerLabel: "OVPSAS administrator",
    nextReviewerLabel: "",
  });
  assert.equal(REVIEW_RULES.dean, undefined);
});

test("upload policy supports required formats with ten files at ten MB each", () => {
  assert.equal(MAX_DOCUMENT_FILES, 10);
  assert.equal(MAX_DOCUMENT_FILE_SIZE, 10 * 1024 * 1024);

  for (const extension of [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
  ]) {
    assert.equal(
      allowedFileTypes.has(extension),
      true,
      `${extension} is allowed`,
    );
  }

  assert.equal(allowedFileTypes.has(".exe"), false);
  assert.equal(allowedFileTypes.get(".pdf").has("application/pdf"), true);
  assert.equal(allowedFileTypes.get(".png").has("image/png"), true);
});
