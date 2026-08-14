import { useEffect, useMemo, useState } from "react";
import DigitalClearance from "./DigitalClearance";
import {
  CLEARANCE_ACADEMIC_YEAR,
  CLEARANCE_REQUIREMENTS,
} from "../../util/clearanceStatus";

const demoOrganization = {
  name: "College of Information and Computing Sciences Student Organization - Boac",
  acronym: "CICSSO",
  president: "MARIA L. SANTOS",
  adviser: "PROF. ANA R. DELA CRUZ",
};

const demoMembership = {
  name: "DELA CRUZ, JUAN M.",
  surname: "Dela Cruz",
  firstName: "Juan",
  middleInitial: "M.",
  idNumber: "22-00000",
  year: "3rd Year",
  program: "BS Information Technology",
  section: "A",
};

const demoProfile = {
  firstName: "Juan",
  middleInitial: "M.",
  lastName: "Dela Cruz",
  suffix: "",
  studentIdNumber: "22-00000",
  contactNumber: "0912 345 6789",
  yearLevel: "3rd Year",
  program: "BS Information Technology",
  section: "A",
};

const demoRoster = [
  { role: "Treasurer", name: "JOHN P. REYES" },
  { role: "President", name: "MARIA L. SANTOS" },
  { role: "Faculty Adviser", name: "PROF. ANA R. DELA CRUZ" },
  { role: "Department Dean", name: "DR. PEDRO T. RAMOS" },
];

const demoFees = CLEARANCE_REQUIREMENTS.map((requirement, index) => ({
  _id: `clearance-fee-${index + 1}`,
  title: requirement.label,
  category: requirement.feeCategories[0],
  academicYear: CLEARANCE_ACADEMIC_YEAR,
  applicableToStudent: true,
}));

const demoPayments = demoFees.map((fee) => ({
  _id: `payment-${fee._id}`,
  fee: fee._id,
  status: "VERIFIED",
}));

export default function ClearanceVisualHarness() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [viewport, setViewport] = useState(
    () => query.get("viewport") || "desktop",
  );
  const data = useMemo(
    () => ({
      organization: demoOrganization,
      membership: demoMembership,
      studentProfile: demoProfile,
      roster: demoRoster,
      fees: demoFees,
      payments:
        query.get("status") === "progress"
          ? demoPayments.slice(0, 2)
          : demoPayments,
    }),
    [query],
  );

  useEffect(() => {
    document.documentElement.dataset.clearanceHarness = viewport;
    return () => {
      delete document.documentElement.dataset.clearanceHarness;
    };
  }, [viewport]);

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-sm font-bold text-slate-700">
          Clearance visual verification harness
        </p>
        <button
          type="button"
          onClick={() =>
            setViewport((current) =>
              current === "desktop" ? "mobile" : "desktop",
            )
          }
          className="rounded-lg bg-[#4A0E17] px-3 py-2 text-xs font-bold text-white"
        >
          Simulate {viewport === "desktop" ? "mobile" : "desktop"}
        </button>
      </div>
      <div className={viewport === "mobile" ? "mx-auto max-w-[390px]" : ""}>
        <DigitalClearance {...data} />
      </div>
    </main>
  );
}
