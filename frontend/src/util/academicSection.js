const YEAR_LEVEL_NUMBER = {
  "1st Year": "1",
  "2nd Year": "2",
  "3rd Year": "3",
  "4th Year": "4",
  "5th Year": "5",
};

export function getProgramAcronym(programName = "") {
  const words = String(programName).trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "";
  if (words.length === 1) return words[0].toUpperCase();

  return words
    .map((word, index) =>
      index === 0 ? word.replace(/[^a-zA-Z0-9]/g, "") : word.charAt(0),
    )
    .join("")
    .toUpperCase();
}

export function getSectionPrefix(programName = "", yearLevel = "") {
  const acronym = getProgramAcronym(programName);
  const yearNumber =
    YEAR_LEVEL_NUMBER[yearLevel] || String(yearLevel).match(/\d+/)?.[0] || "";
  return acronym && yearNumber ? `${acronym} - ${yearNumber}` : "";
}

export function applySectionPrefix(section = "", prefix = "") {
  const currentSection = String(section).trim();
  if (!prefix) return currentSection;
  if (currentSection === prefix || currentSection.startsWith(`${prefix} `)) {
    return currentSection;
  }

  const existingSuffix = currentSection
    .replace(/^[A-Z0-9]+\s*-\s*\d+\s*/i, "")
    .trim();
  return existingSuffix ? `${prefix}${existingSuffix}` : prefix;
}
