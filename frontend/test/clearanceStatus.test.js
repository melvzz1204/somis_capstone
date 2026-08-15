import test from "node:test";
import assert from "node:assert/strict";

import {
  CLEARANCE_ACADEMIC_YEAR,
  getClearanceRequirements,
  getClearanceSummary,
} from "../src/util/clearanceStatus.js";

const organization = {
  acronym: "CICSSO",
  name: "College of Information and Computing Sciences Student Organization",
};

const createFee = (id, category, overrides = {}) => ({
  _id: id,
  title: category,
  category,
  academicYear: CLEARANCE_ACADEMIC_YEAR,
  applicableToStudent: true,
  ...overrides,
});

const createPayment = (id, fee, status = "VERIFIED") => ({
  _id: id,
  fee,
  status,
});

test("verified organization and PAF payments advance clearance to two of five", () => {
  const fees = [
    createFee("organization-fee", "organization_fee", {
      title: "CICSSO Fee",
    }),
    createFee("paf-fee", "paf", { title: "CICSSO PAF" }),
    createFee("other-fee", "others", { title: "ID lace" }),
  ];
  const payments = [
    createPayment("organization-payment", "organization-fee"),
    createPayment("paf-payment", { _id: "paf-fee" }),
    createPayment("other-payment", "other-fee"),
  ];

  const summary = getClearanceSummary(organization, fees, payments);

  assert.equal(summary.satisfiedCount, 2);
  assert.equal(summary.isCleared, false);
  assert.equal(summary.requirements[0].status, "Paid");
  assert.equal(summary.requirements[1].status, "Paid");
  assert.equal(summary.requirements[2].status, "Not encoded");
});

test("a pending payment remains incomplete until it is verified", () => {
  const fee = createFee("organization-fee", "organization_fee");
  const payments = [
    createPayment(
      "pending-organization-payment",
      fee._id,
      "PENDING_MANUAL_REVIEW",
    ),
  ];

  const [requirement] = getClearanceRequirements([fee], payments);

  assert.equal(requirement.status, "For review");
  assert.equal(requirement.isSatisfied, false);
  assert.equal(requirement.payment._id, "pending-organization-payment");
});

test("only exemptible requirements are satisfied when a fee does not apply", () => {
  const fees = [
    createFee("organization-fee", "organization_fee", {
      applicableToStudent: false,
    }),
    createFee("attendance-fee", "attendance_fines", {
      applicableToStudent: false,
    }),
  ];

  const requirements = getClearanceRequirements(fees, []);

  assert.equal(requirements[0].status, "Unpaid");
  assert.equal(requirements[0].isSatisfied, false);
  assert.equal(requirements[3].status, "Exempted");
  assert.equal(requirements[3].isSatisfied, true);
});

test("a verified duplicate drive satisfies its category despite another unpaid drive", () => {
  const archivedFee = createFee("archived-paf-fee", "paf", {
    title: "CICSSO PAF",
    status: "Archived",
  });
  const replacementFee = createFee("replacement-paf-fee", "paf", {
    title: "CICSSO PAF",
    status: "Active",
  });
  const payments = [createPayment("archived-paf-payment", archivedFee._id)];

  const requirement = getClearanceRequirements(
    [replacementFee, archivedFee],
    payments,
  )[1];

  assert.equal(requirement.status, "Paid");
  assert.equal(requirement.isSatisfied, true);
  assert.equal(requirement.fee._id, archivedFee._id);
  assert.equal(requirement.fees.length, 2);
});

test("unrelated and different-year payments cannot satisfy a requirement", () => {
  const previousYearFee = createFee(
    "previous-organization-fee",
    "organization_fee",
    {
      academicYear: "2025-2026",
    },
  );
  const unrelatedFee = createFee("other-fee", "others", {
    title: "General contribution",
  });
  const payments = [
    createPayment("previous-payment", previousYearFee._id),
    createPayment("unrelated-payment", unrelatedFee._id),
  ];

  const [requirement] = getClearanceRequirements(
    [previousYearFee, unrelatedFee],
    payments,
  );

  assert.equal(requirement.status, "Not encoded");
  assert.equal(requirement.isSatisfied, false);
});

test("annual clearance combines requirements from both semesters of the selected year", () => {
  const academicYear = "2026-2027";
  const firstSemesterFee = createFee("organization-fee", "organization_fee", {
    academicYear,
    semester: "1st Semester",
  });
  const secondSemesterFee = createFee("paf-fee", "paf", {
    academicYear,
    semester: "2nd Semester",
  });
  const nextYearFee = createFee("next-year-fee", "organization_week_fee", {
    academicYear: "2027-2028",
    semester: "1st Semester",
  });
  const payments = [
    createPayment("first-semester-payment", firstSemesterFee._id),
    createPayment("second-semester-payment", secondSemesterFee._id),
    createPayment("next-year-payment", nextYearFee._id),
  ];

  const summary = getClearanceSummary(
    organization,
    [firstSemesterFee, secondSemesterFee, nextYearFee],
    payments,
    academicYear,
  );

  assert.equal(summary.academicYear, academicYear);
  assert.equal(summary.satisfiedCount, 2);
  assert.equal(summary.requirements[0].status, "Paid");
  assert.equal(summary.requirements[1].status, "Paid");
  assert.equal(summary.requirements[2].status, "Not encoded");
});
