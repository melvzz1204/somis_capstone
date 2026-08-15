const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getAutomaticAcademicPeriod,
  getEffectiveAcademicPeriod,
  getAcademicPeriodFilter,
  getAcademicPeriodDateRange,
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

test("academic period filter preserves the selected year and semester", () => {
  assert.deepEqual(
    getAcademicPeriodFilter({
      academicYear: "2029-2030",
      semester: "1st Semester",
      mode: "manual",
    }),
    { academicYear: "2029-2030", semester: "1st Semester" },
  );
});

test("legacy transaction date ranges are isolated by academic term", () => {
  assert.deepEqual(
    getAcademicPeriodDateRange({
      academicYear: "2029-2030",
      semester: "1st Semester",
    }),
    {
      start: new Date("2029-08-01T00:00:00.000Z"),
      end: new Date("2030-01-01T00:00:00.000Z"),
    },
  );
  assert.deepEqual(
    getAcademicPeriodDateRange({
      academicYear: "2029-2030",
      semester: "2nd Semester",
    }),
    {
      start: new Date("2030-01-01T00:00:00.000Z"),
      end: new Date("2030-06-01T00:00:00.000Z"),
    },
  );
});
