const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

function getAutomaticAcademicPeriod(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 8 && month <= 12) {
    return {
      academicYear: `${year}-${year + 1}`,
      semester: "1st Semester",
    };
  }

  if (month >= 1 && month <= 5) {
    return {
      academicYear: `${year - 1}-${year}`,
      semester: "2nd Semester",
    };
  }

  // June and July are the inter-year transition. Use the upcoming AY and
  // first semester until an organization admin explicitly selects a period.
  return {
    academicYear: `${year}-${year + 1}`,
    semester: "1st Semester",
  };
}

function isValidAcademicYear(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{4})$/);
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
}

function getEffectiveAcademicPeriod(organization, date = new Date()) {
  const configured = organization?.academicPeriod || {};
  const automatic = getAutomaticAcademicPeriod(date);

  if (
    configured.mode === "manual" &&
    isValidAcademicYear(configured.academicYear) &&
    SEMESTERS.includes(configured.semester)
  ) {
    return {
      academicYear: configured.academicYear,
      semester: configured.semester,
      mode: "manual",
      source: "admin",
      updatedAt: configured.updatedAt || null,
    };
  }

  return {
    ...automatic,
    mode: "automatic",
    source: "calendar",
    updatedAt: configured.updatedAt || null,
  };
}

module.exports = {
  SEMESTERS,
  getAutomaticAcademicPeriod,
  getEffectiveAcademicPeriod,
  isValidAcademicYear,
};
