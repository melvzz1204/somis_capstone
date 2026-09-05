const currentAcademicYearStart = new Date().getFullYear();

export const CLEARANCE_ACADEMIC_YEAR = `${currentAcademicYearStart} - ${currentAcademicYearStart + 1}`;

export const CLEARANCE_REQUIREMENTS = [
  {
    id: "organization-fee",
    label: "Organization Fee",
    feeCategories: ["organization_fee"],
    exemptible: false,
  },
  {
    id: "paf",
    label: "PAF",
    feeCategories: ["paf"],
    exemptible: false,
  },
  {
    id: "study-center",
    label: "Study Center",
    feeCategories: ["study_center"],
    exemptible: false,
  },
  {
    id: "attendance-fines",
    label: "Attendance Fines",
    feeCategories: ["attendance_fines"],
    exemptible: true,
  },
  {
    id: "organization-week-fee",
    label: "Organization Week Fee",
    feeCategories: ["organization_week_fee"],
    exemptible: true,
  },
];

export function getOrganizationClearanceConfig(organization) {
  const acronym = String(organization?.acronym || "ORG")
    .trim()
    .toUpperCase();
  const college = String(organization?.college || "").trim();
  const name = String(organization?.name || `${acronym} Organization`).trim();

  return {
    acronym,
    college,
    name,
    title: `${acronym} Annual Clearance`,
    organizationFeeLabel: `${acronym} Fee`,
    organizationWeekFeeLabel: `${acronym} Week Fee`,
  };
}

export function getOrganizationRequirements(organization) {
  const config = getOrganizationClearanceConfig(organization);
  return CLEARANCE_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    label:
      requirement.id === "organization-fee"
        ? config.organizationFeeLabel
        : requirement.id === "organization-week-fee"
          ? config.organizationWeekFeeLabel
          : requirement.label,
  }));
}

export const normalizeClearanceText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const academicYearKey = (value) =>
  String(value || "")
    .match(/\d{4}/g)
    ?.slice(0, 2)
    .join("-") || "";

const feeIdFor = (fee) => String(fee?._id || "");

const paymentFeeIdFor = (payment) =>
  String(payment?.fee?._id || payment?.fee || "");

const isMatchingFee = (requirement, fee) => {
  const category = String(fee?.category || "")
    .trim()
    .toLowerCase();
  if (requirement.feeCategories.includes(category)) return true;

  // Preserve historical custom dues created before the clearance categories
  // were added to the collection form.
  const title = normalizeClearanceText(fee?.title);
  const legacyTitleMatches = {
    "organization-fee":
      title.includes(" fee") ||
      title.includes("organization fee") ||
      title.includes("membership fee"),
    paf: title.includes("paf"),
    "study-center": title.includes("study center"),
    "attendance-fines": title.includes("attendance fine"),
    "organization-week-fee":
      title.includes("week fee") || title.includes("organization week"),
  };

  return Boolean(legacyTitleMatches[requirement.id]);
};

export function getClearanceRequirements(
  fees = [],
  payments = [],
  academicYear = CLEARANCE_ACADEMIC_YEAR,
  organization = null,
) {
  const requestedYear = academicYearKey(academicYear);
  const eligibleFees = fees.filter(
    (fee) => academicYearKey(fee.academicYear) === requestedYear,
  );

  return getOrganizationRequirements(organization).map((requirement) => {
    const matchingFees = eligibleFees.filter((candidate) =>
      isMatchingFee(requirement, candidate),
    );

    if (matchingFees.length === 0) {
      return {
        ...requirement,
        fee: null,
        fees: [],
        payment: null,
        status: "Not encoded",
        isSatisfied: false,
      };
    }

    const applicableFees = matchingFees.filter(
      (candidate) => candidate.applicableToStudent !== false,
    );
    const representativeFee = applicableFees[0] || matchingFees[0];

    if (applicableFees.length === 0) {
      return {
        ...requirement,
        fee: representativeFee,
        fees: matchingFees,
        payment: null,
        status: requirement.exemptible ? "Exempted" : "Unpaid",
        isSatisfied: requirement.exemptible,
      };
    }

    const paymentStates = applicableFees.map((fee) => {
      const feePayments = payments.filter(
        (payment) => paymentFeeIdFor(payment) === feeIdFor(fee),
      );

      return {
        fee,
        verified: feePayments.find((payment) => payment.status === "VERIFIED"),
        pending: feePayments.find(
          (payment) => payment.status === "PENDING_MANUAL_REVIEW",
        ),
        rejected: feePayments.find((payment) => payment.status === "REJECTED"),
      };
    });
    const verifiedState = paymentStates.find((state) => state.verified);

    // Multiple fee drives can represent the same clearance requirement. Once
    // one applicable drive is verified, the category-level requirement is paid.
    if (verifiedState) {
      return {
        ...requirement,
        fee: verifiedState.fee,
        fees: applicableFees,
        payment: verifiedState.verified,
        status: "Paid",
        isSatisfied: true,
      };
    }

    const unresolvedStates = paymentStates.filter((state) => !state.verified);
    const rejectedState = unresolvedStates.find((state) => state.rejected);
    const unpaidState = unresolvedStates.find(
      (state) => !state.pending && !state.rejected,
    );
    const pendingState = unresolvedStates.find((state) => state.pending);
    const status = rejectedState
      ? "Rejected"
      : unpaidState
        ? "Unpaid"
        : "For review";
    const statusState = rejectedState || unpaidState || pendingState;

    return {
      ...requirement,
      fee: statusState?.fee || representativeFee,
      fees: applicableFees,
      payment:
        statusState?.rejected ||
        statusState?.pending ||
        statusState?.verified ||
        null,
      status,
      isSatisfied: false,
    };
  });
}

export function isCicssoOrganization(organization) {
  return Boolean(
    organization?._id || organization?.name || organization?.acronym,
  );
}

export function getClearanceSummary(
  organization,
  fees = [],
  payments = [],
  academicYear = CLEARANCE_ACADEMIC_YEAR,
) {
  const requirements = getClearanceRequirements(
    fees,
    payments,
    academicYear,
    organization,
  );
  const satisfiedCount = requirements.filter(
    (requirement) => requirement.isSatisfied,
  ).length;
  const isCicsso = Boolean(
    organization?._id || organization?.name || organization?.acronym,
  );

  return {
    requirements,
    satisfiedCount,
    isCicsso,
    academicYear,
    isCleared:
      isCicsso &&
      requirements.length ===
        getOrganizationRequirements(organization).length &&
      satisfiedCount === requirements.length,
  };
}
