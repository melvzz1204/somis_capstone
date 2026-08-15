const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getAutomaticAcademicPeriod,
  getEffectiveAcademicPeriod,
  isValidAcademicYear,
} = require("../src/util/academicPeriod");

const date = (value) => new Date(`${value}T12:00:00.000Z`);

test("automatic mode maps August through December to first semester", () => {
  assert.deepEqual(getAutomaticAcademicPeriod(date("2026-08-15")), {
    academicYear: "2026-2027",
    semester: "1st Semester",
  });
  assert.deepEqual(getAutomaticAcademicPeriod(date("2026-12-15")), {
    academicYear: "2026-2027",
    semester: "1st Semester",
  });
});

test("automatic mode maps January through May to second semester", () => {
  assert.deepEqual(getAutomaticAcademicPeriod(date("2027-01-15")), {
    academicYear: "2026-2027",
    semester: "2nd Semester",
  });
  assert.deepEqual(getAutomaticAcademicPeriod(date("2027-05-15")), {
    academicYear: "2026-2027",
    semester: "2nd Semester",
  });
});

test("June and July use the upcoming academic year first semester", () => {
  assert.deepEqual(getAutomaticAcademicPeriod(date("2027-06-15")), {
    academicYear: "2027-2028",
    semester: "1st Semester",
  });
});

test("valid manual configuration overrides the calendar", () => {
  assert.deepEqual(
    getEffectiveAcademicPeriod(
      {
        academicPeriod: {
          academicYear: "2025-2026",
          semester: "Summer",
          mode: "manual",
        },
      },
      date("2027-01-15"),
    ),
    {
      academicYear: "2025-2026",
      semester: "Summer",
      mode: "manual",
      source: "admin",
      updatedAt: null,
    },
  );
});

test("academic years must contain consecutive years", () => {
  assert.equal(isValidAcademicYear("2025-2026"), true);
  assert.equal(isValidAcademicYear("2025-2027"), false);
  assert.equal(isValidAcademicYear("2025/2026"), false);
});
