import React, { useState, useEffect } from "react";
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

const SearchIcon = ({ className = "" }) => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const PlusIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const SparklesIcon = ({ className = "" }) => (
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
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

export default function StudentDashboard({ user: propsUser }) {
  // Resolve User from Props or LocalStorage
  const currentUser =
    propsUser || JSON.parse(localStorage.getItem("user") || "null");

  // Identity variables
  const userName = currentUser?.name || "Student";
  const upperName = userName.toUpperCase();
  const userEmail = currentUser?.email || "No email registered";
  const studentId =
    currentUser?.studentId || currentUser?.idNumber || "2026-MSU-0000";

  // Dynamic Academic Year Calculation
  const currentYear = new Date().getFullYear();
  const dynamicAcademicYear = `AY ${currentYear}–${currentYear + 1}`;

  // Dashboard State
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [memberships, setMemberships] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [clearanceItems, setClearanceItems] = useState([]);

  // Modal State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const [orgsRes, eventsRes, clearanceRes] = await Promise.allSettled([
          API.get("/student/organizations"),
          API.get("/events?upcoming=true"),
          API.get("/student/clearance"),
        ]);

        if (orgsRes.status === "fulfilled") {
          setMemberships(orgsRes.value.data?.data || orgsRes.value.data || []);
        }
        if (eventsRes.status === "fulfilled") {
          setUpcomingEvents(
            eventsRes.value.data?.data || eventsRes.value.data || [],
          );
        }
        if (clearanceRes.status === "fulfilled") {
          setClearanceItems(
            clearanceRes.value.data?.data || clearanceRes.value.data || [],
          );
        }
      } catch (err) {
        console.error("Error fetching student dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser?._id]);

  // Derived Calculations
  const activeMembershipsCount = memberships.filter(
    (m) => m.status === "Active" || !m.status,
  ).length;
  const pendingAppsCount = memberships.filter(
    (m) => m.status === "Pending",
  ).length;
  const clearedCount = clearanceItems.filter(
    (c) => c.status === "Cleared",
  ).length;
  const isFullyCleared =
    clearanceItems.length > 0 && clearedCount === clearanceItems.length;

  // Organization Application Submission
  const handleApplyOrg = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setIsSubmitting(true);
    try {
      await API.post(`/organizations/${selectedOrg}/apply`, {
        studentId: currentUser?._id,
      });
      // Mock push to UI state
      setMemberships((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          orgName: selectedOrg,
          role: "Member Candidate",
          status: "Pending",
          joinedDate: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to apply for organization:", err);
    } finally {
      setIsSubmitting(false);
      setIsJoinModalOpen(false);
      setSelectedOrg(null);
    }
  };

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
              <span>My Organizations ({memberships.length})</span>
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
                Track your active campus memberships, event participation, and
                end-of-term clearance records.
              </p>
            </div>

            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30 self-start sm:self-center"
            >
              <PlusIcon className="text-[#36080E]" />
              <span>Join Organization</span>
            </button>
          </div>

          {/* METRIC CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Pending Applications
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {pendingAppsCount}
                </h2>
                <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                  Under Review
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

          {/* TAB 1: OVERVIEW & HIGHLIGHTS */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Joined Orgs Overview */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-[#4A0E17]">
                    My Joined Organizations
                  </h3>
                  <button
                    onClick={() => setActiveTab("orgs")}
                    className="text-xs font-bold text-[#7A610D] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {memberships.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      Not enrolled in any organization yet
                    </p>
                    <p className="text-xs text-slate-400">
                      Click "Join Organization" above to apply for student orgs.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {memberships.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.orgName ||
                              item.name ||
                              "Student Organization"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.role || "Member"} • Joined{" "}
                            {formatDate(item.joinedDate)}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.status || "Active"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Quick Notice */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-[#4A0E17] font-bold text-sm">
                  <SparklesIcon className="text-[#D4AF37]" />
                  <span>Student Reminders</span>
                </div>
                <ul className="text-xs space-y-3 text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1 shrink-0"></span>
                    <span>
                      Ensure attendance scanning at mandatory org assemblies for
                      clearance validation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4A0E17] mt-1 shrink-0"></span>
                    <span>
                      Settle organization membership dues with your designated
                      Org Treasurer.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: MY ORGANIZATIONS */}
          {activeTab === "orgs" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Student Organization Memberships
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View active memberships and manage pending applications.
                  </p>
                </div>

                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37] text-[#36080E] font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
                >
                  <PlusIcon className="text-[#36080E]" />
                  <span>Apply to Join Org</span>
                </button>
              </div>

              {memberships.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Active Memberships Found
                  </p>
                  <p className="text-xs text-slate-400">
                    Explore accredited MSU student organizations and submit an
                    application.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {memberships.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-[#4A0E17] text-sm">
                            {m.orgName || m.name || "Student Org"}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {m.role || "Regular Member"}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            m.status === "Active" || !m.status
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {m.status || "Active"}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Joined:{" "}
                        {formatDate(m.joinedDate || new Date().toISOString())}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVENTS & ACTIVITIES */}
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

          {/* TAB 4: CLEARANCE STATUS */}
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
      </div>

      {/* JOIN ORGANIZATION MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  Apply for Organization Membership
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select an accredited student organization to submit your
                  membership form.
                </p>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyOrg} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Organization <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={selectedOrg || ""}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] bg-white font-medium"
                >
                  <option value="" disabled>
                    Choose an organization...
                  </option>
                  <option value="College Council of Engineering (CCPE)">
                    College Council of Engineering (CCPE)
                  </option>
                  <option value="Society of Computer Studies (SCS)">
                    Society of Computer Studies (SCS)
                  </option>
                  <option value="Junior Executives (JEX)">
                    Junior Executives (JEX)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student ID Number
                </label>
                <input
                  type="text"
                  disabled
                  value={studentId}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedOrg}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold rounded-lg transition-all cursor-pointer border border-[#B8860B]/30 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
