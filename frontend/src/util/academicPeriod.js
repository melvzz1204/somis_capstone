export const ACADEMIC_PERIOD_SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "Summer",
];

export function getAutomaticAcademicPeriod(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 8) {
    return {
      academicYear: `${year}-${year + 1}`,
      semester: "1st Semester",
      mode: "automatic",
      source: "calendar",
    };
  }

  if (month <= 5) {
    return {
      academicYear: `${year - 1}-${year}`,
      semester: "2nd Semester",
      mode: "automatic",
      source: "calendar",
    };
  }

  return {
    academicYear: `${year}-${year + 1}`,
    semester: "1st Semester",
    mode: "automatic",
    source: "calendar",
  };
}

export function getEffectiveAcademicPeriod(organization, date = new Date()) {
  const configured = organization?.academicPeriod;
  if (
    configured?.mode === "manual" &&
    /^\d{4}-\d{4}$/.test(configured.academicYear || "") &&
    ACADEMIC_PERIOD_SEMESTERS.includes(configured.semester)
  ) {
    return { ...configured, source: "admin" };
  }

  return getAutomaticAcademicPeriod(date);
}

export function formatAcademicPeriod(period, includeSemester = true) {
  const academicYear = String(period?.academicYear || "").replace("-", "-");
  if (!academicYear) return "Academic period unavailable";
  return includeSemester
    ? `AY ${academicYear} / ${period.semester}`
    : `AY ${academicYear}`;
}

export function getAcademicYearOptions(activeAcademicYear, range = 2) {
  const activeStart = Number(String(activeAcademicYear || "").slice(0, 4));
  const currentYear = new Date().getFullYear();
  const center = Number.isInteger(activeStart) ? activeStart : currentYear;

  return Array.from({ length: range * 2 + 1 }, (_, index) => {
    const start = center - range + index;
    return `${start}-${start + 1}`;
  });
}
