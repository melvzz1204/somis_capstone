import { useState, useEffect } from "react";
import API from "../../api/axios";

// Sub-components
import LogoutButton from "../logoutButton";

// Helper Date Formatter
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const cleanDateStr = dateString.split("T")[0];
  const [year, month, day] = cleanDateStr.split("-");
  if (!year || !month || !day) return dateString;

  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// --- INLINE SVG ICON COMPONENTS (With Sizing Guarantees) ---
const LayoutDashboardIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const UserGroupIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const CalendarIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CreditCardIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckCircleIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ShieldCheckIcon = ({ className = "" }) => (
  <svg
    className={`w-5 h-5 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const getRootBackendUrl = () => {
  try {
    const rawUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
};

const BACKEND_URL = getRootBackendUrl();

const getAvatarSrc = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http") || avatarPath.startsWith("blob:")) {
    return avatarPath;
  }
  return `${BACKEND_URL}${avatarPath}`;
};

export default function StudentDashboard({ user: propsUser }) {
  const currentUser =
    propsUser || JSON.parse(localStorage.getItem("user") || "null");
  const userName = currentUser?.name || "Student";
  const upperName = userName.toUpperCase();
  const userEmail = currentUser?.email || "No email registered";

  const currentYear = new Date().getFullYear();
  const dynamicAcademicYear = `AY ${currentYear}–${currentYear + 1}`;

  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [roster, setRoster] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeError, setFeeError] = useState("");
  const [selectedFee, setSelectedFee] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [upcomingEvents] = useState([]);
  const [clearanceItems] = useState([]);

  useEffect(() => {
    const request = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await API.get("/orgmembers/mine");
        setOrganization(data.organization || null);
        setMembership(data.membership || null);
        setRoster(data.roster || []);
        setStudentProfile(data.studentProfile || null);

        if (data.organization?._id) {
          try {
            const feeResponse = await API.get("/fees");
            setFees(feeResponse.data || []);
            setFeeError("");
          } catch (feeErr) {
            console.error("Error fetching organization fees:", feeErr);
            setFees([]);
            setFeeError(feeErr.message || "Unable to load organization fees.");
          }
        } else {
          setFees([]);
        }
      } catch (err) {
        console.error("Error fetching student organization data:", err);
        setLoadError(err.message || "Unable to load organization details.");
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(request);
  }, [currentUser?._id]);

  const studentId =
    studentProfile?.studentIdNumber || membership?.idNumber || "Not recorded";
  const officerRoster = roster.filter(
    (member) => member.role?.trim().toLowerCase() !== "member",
  );
  const activeMembershipsCount = organization ? 1 : 0;
  const clearedCount = clearanceItems.filter(
    (item) => item.status === "Cleared",
  ).length;
  const isFullyCleared =
    clearanceItems.length === 0 || clearedCount === clearanceItems.length;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl">
        <div className="space-y-8">
          {/* Logo & Portal Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#601520]">
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase block">
                SOMIS
              </span>
              <span className="text-[10px] font-medium text-rose-200/70 tracking-wider block">
                Student Portal
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <LayoutDashboardIcon
                className={
                  activeTab === "overview"
                    ? "text-[#D4AF37]"
                    : "text-rose-200/60"
                }
              />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("orgs")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "orgs"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <UserGroupIcon
                className={
                  activeTab === "orgs" ? "text-[#D4AF37]" : "text-rose-200/60"
                }
              />
              <span>My Organization</span>
            </button>

            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "events"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarIcon
                className={
                  activeTab === "events" ? "text-[#D4AF37]" : "text-rose-200/60"
                }
              />
              <span>Events & Activities</span>
            </button>

            <button
              onClick={() => setActiveTab("fees")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "fees"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CreditCardIcon
                className={
                  activeTab === "fees" ? "text-[#D4AF37]" : "text-rose-200/60"
                }
              />
              <span>Organization Fees</span>
            </button>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CheckCircleIcon
                className={
                  activeTab === "clearance"
                    ? "text-[#D4AF37]"
                    : "text-rose-200/60"
                }
              />
              <span>Org Clearance Status</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Email */}
        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-100 truncate">
                {userName}
              </p>
              <p className="text-[10px] text-rose-300/70 truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <LogoutButton variant="button" showConfirmModal={true} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="text-[#4A0E17]" />
            <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider hidden sm:inline-block">
              Marinduque State University — OVPSAS Student Services
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs ml-auto">
            {/* Dynamic Academic Year Badge */}
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] font-bold tracking-tight shadow-2xs">
              {dynamicAcademicYear}
            </span>
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* WELCOME BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20 text-xs font-extrabold rounded-full uppercase tracking-wider">
                  Student Member
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ID: {studentId}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
                Welcome back, {upperName}
              </h1>
              <p className="text-xs text-slate-500">
                {organization
                  ? `${membership?.role || "Member"} of ${organization.name}`
                  : "Your organization assignment and roster will appear here once recorded."}
              </p>
            </div>
          </div>

          {/* METRIC CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Memberships
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {activeMembershipsCount}
                </h2>
                <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  Enrolled
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Upcoming Events
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {upcomingEvents.length}
                </h2>
                <span className="text-[11px] text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2 py-0.5 rounded-md font-bold">
                  Scheduled
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Clearance Status
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {isFullyCleared ? "Cleared" : "Pending"}
                </h2>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                    isFullyCleared
                      ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                      : "text-rose-800 bg-rose-50 border border-rose-200"
                  }`}
                >
                  {isFullyCleared ? "100%" : "Action Needed"}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 2: MY ORGANIZATION */}
          {activeTab === "orgs" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                  <p className="text-xs font-bold text-slate-600">
                    Loading your organization and roster...
                  </p>
                </div>
              ) : loadError ? (
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 shadow-xs">
                  <h3 className="text-sm font-bold text-rose-800">
                    Unable to load My Organization
                  </h3>
                  <p className="text-xs text-rose-700 mt-1">{loadError}</p>
                </div>
              ) : !organization ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2 shadow-xs">
                  <p className="text-sm font-bold text-slate-700">
                    No Organization Assigned
                  </p>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    No roster record matches your account email yet. Contact
                    your organization secretary or the student services office
                    to have your membership recorded.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A610D]">
                            My Organization
                          </p>
                          <h3 className="text-xl font-extrabold text-[#4A0E17] mt-1">
                            {organization.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {[organization.acronym, organization.college]
                              .filter(Boolean)
                              .join(" • ") || "University student organization"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start">
                          {organization.status || "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Your Role
                        </p>
                        <p className="font-bold text-slate-800 mt-1">
                          {membership?.role || "Member"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Faculty Adviser
                        </p>
                        <p className="font-bold text-slate-800 mt-1">
                          {organization.adviser || "Not recorded"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          President
                        </p>
                        <p className="font-bold text-slate-800 mt-1">
                          {organization.president || "Not recorded"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Contact Email
                        </p>
                        <p className="font-bold text-slate-800 mt-1 break-all">
                          {organization.email || "Not recorded"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-[#4A0E17]">
                          Organization Officers
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Meet the registered officers of{" "}
                          {organization.acronym || organization.name}.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#6f1c1c] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 rounded-full shrink-0">
                        {officerRoster.length}{" "}
                        {officerRoster.length === 1 ? "Officer" : "Officers"}
                      </span>
                    </div>

                    {officerRoster.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
                        <p className="text-xs text-slate-400">
                          No organization officers are currently recorded.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {officerRoster.map((officer) => {
                          const avatarUrl = getAvatarSrc(officer.avatar);

                          return (
                            <article
                              key={officer._id}
                              className="flex flex-col overflow-hidden border rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Avatar / Photo */}
                              <div className="relative aspect-square w-full bg-[#4A0E17]/10 overflow-hidden">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={`${officer.name || "Officer"}, ${officer.role || ""}`}
                                    className="h-full w-full object-cover object-top"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-3xl font-extrabold text-[#4A0E17] uppercase">
                                    {officer.name?.charAt(0) || "?"}
                                  </div>
                                )}
                              </div>

                              {/* Officer Information */}
                              <div className="p-3.5 flex flex-col flex-1 space-y-2">
                                <div>
                                  {/* Role Badge */}
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-[#4A0E17] bg-[#4A0E17]/10 uppercase tracking-wider mb-1">
                                    {officer.role || "Officer"}
                                  </span>

                                  {/* Name */}
                                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1">
                                    {officer.name}
                                  </h4>

                                  {/* Email */}
                                  {officer.email && (
                                    <p
                                      className="text-[11px] text-slate-500 truncate mt-0.5"
                                      title={officer.email}
                                    >
                                      {officer.email}
                                    </p>
                                  )}
                                </div>

                                {/* Year & Section */}
                                {(officer.year || officer.section) && (
                                  <p className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2 mt-auto">
                                    {[officer.year, officer.section]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: ORGANIZATION FEES */}
          {activeTab === "fees" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  {organization?.acronym ||
                    organization?.name ||
                    "Organization"}{" "}
                  Fees
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fees created by your organization secretary and applicable to
                  your membership.
                </p>
              </div>

              {feeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {feeError}
                </div>
              )}

              {fees.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No active fees available
                  </p>
                  <p className="text-xs text-slate-400">
                    Your organization has not published an applicable fee yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {fees.map((fee) => (
                    <article
                      key={fee._id}
                      className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 hover:border-[#D4AF37] transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-[#7A610D]">
                            {fee.category || "Organization Fee"}
                          </p>
                          <h4 className="font-bold text-[#4A0E17] text-sm mt-1">
                            {fee.title}
                          </h4>
                        </div>
                        <span className="text-sm font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg shrink-0">
                          ₱{Number(fee.amount || 0).toFixed(2)}
                        </span>
                      </div>

                      {fee.description && (
                        <p className="text-xs text-slate-600">
                          {fee.description}
                        </p>
                      )}

                      <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Academic Term:</span>
                          <span className="font-bold text-slate-700">
                            {fee.academicYear}{" "}
                            {fee.semester ? `(${fee.semester})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-amber-700 font-bold">
                          <span>Due Date:</span>
                          <span>{formatDate(fee.dueDate)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedFee(fee)}
                        className="w-full px-3 py-2.5 bg-[#4A0E17] hover:bg-[#601520] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Pay Now
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVENTS & ACTIVITIES */}
          {activeTab === "events" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Campus & Organization Events
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Discover upcoming student activities and track your event
                  participation.
                </p>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Upcoming Events
                  </p>
                  <p className="text-xs text-slate-400">
                    Check back later for newly approved activities from your
                    organizations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {upcomingEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-[#4A0E17]/10 text-[#4A0E17] text-[10px] font-bold rounded-md">
                          {evt.orgName || "Campus Event"}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {evt.title || evt.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          📍 {evt.location || "MSU Main Campus"} • 📅{" "}
                          {formatDate(evt.date)}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 bg-[#4A0E17] text-white font-bold rounded-lg hover:bg-[#601520] transition-colors shrink-0">
                        View Ticket
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CLEARANCE STATUS */}
          {activeTab === "clearance" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  End-of-Term Organization Clearance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify clearance sign-offs required by your student
                  organizations.
                </p>
              </div>

              {clearanceItems.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircleIcon className="text-emerald-700 w-5 h-5" />
                  <p className="text-xs text-emerald-800 font-bold">
                    No active clearance holds recorded. You are fully cleared
                    for the current academic term.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {clearanceItems.map((c, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {c.orgName || "Organization Clearance"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {c.requirement || "Dues & Assembly Attendance"}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          c.status === "Cleared"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {c.status || "Cleared"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {selectedFee && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#4A0E17]">
                    Payment for {selectedFee.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Amount due: ₱{Number(selectedFee.amount || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFee(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  aria-label="Close payment dialog"
                >
                  X
                </button>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Online payment processing is not connected yet. This fee is
                displayed for payment setup and validation.
              </div>
              <button
                type="button"
                onClick={() => setSelectedFee(null)}
                className="w-full px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
