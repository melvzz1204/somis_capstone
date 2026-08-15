const currentAcademicYearStart = new Date().getFullYear();

export const CLEARANCE_ACADEMIC_YEAR = `${currentAcademicYearStart} - ${currentAcademicYearStart + 1}`;

export const CLEARANCE_REQUIREMENTS = [
  {
    id: "cicsso-fee",
    label: "CICSSO Fee",
    feeCategories: ["organization_fee"],
    exemptible: false,
  },
  {
    id: "cicsso-paf",
    label: "CICSSO PAF",
    feeCategories: ["paf"],
    exemptible: false,
  },
  {
    id: "cics-study-center",
    label: "CICS Study Center",
    feeCategories: ["study_center"],
    exemptible: false,
  },
  {
    id: "cics-attendance-fines",
    label: "CICS Attendance Fines",
    feeCategories: ["attendance_fines"],
    exemptible: true,
  },
  {
    id: "cics-week-fee",
    label: "CICS Week Fee",
    feeCategories: ["organization_week_fee"],
    exemptible: true,
  },
];

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
    "cicsso-fee":
      title.includes("cicsso fee") ||
      title.includes("organization fee") ||
      title.includes("membership fee"),
    "cicsso-paf": title.includes("paf"),
    "cics-study-center": title.includes("study center"),
    "cics-attendance-fines": title.includes("attendance fine"),
    "cics-week-fee":
      title.includes("cics week") ||
      title.includes("cicsso week") ||
      title.includes("organization week"),
  };

  return Boolean(legacyTitleMatches[requirement.id]);
};

export function getClearanceRequirements(
  fees = [],
  payments = [],
  academicYear = CLEARANCE_ACADEMIC_YEAR,
) {
  const requestedYear = academicYearKey(academicYear);
  const eligibleFees = fees.filter(
    (fee) => academicYearKey(fee.academicYear) === requestedYear,
  );

  return CLEARANCE_REQUIREMENTS.map((requirement) => {
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
  const normalizedOrganization = normalizeClearanceText(
    `${organization?.acronym || ""} ${organization?.name || ""}`,
  );

  return (
    normalizedOrganization.includes("cicsso") ||
    normalizedOrganization.includes(
      "college of information and computing sciences student organization",
    )
  );
}

export function getClearanceSummary(
  organization,
  fees = [],
  payments = [],
  academicYear = CLEARANCE_ACADEMIC_YEAR,
) {
  const requirements = getClearanceRequirements(fees, payments, academicYear);
  const satisfiedCount = requirements.filter(
    (requirement) => requirement.isSatisfied,
  ).length;
  const isCicsso = isCicssoOrganization(organization);

  return {
    requirements,
    satisfiedCount,
    isCicsso,
    academicYear,
    isCleared:
      isCicsso &&
      requirements.length === CLEARANCE_REQUIREMENTS.length &&
      satisfiedCount === requirements.length,
  };
}
