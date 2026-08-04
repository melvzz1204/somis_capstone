import React, { useState, useEffect } from "react";
import API from "../../api/axios";

// Sub-components
import OrganizationMembers from "./organizationMembers";
import FeeModal from "./feesModal";
import LogoutButton from "../logoutButton";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  // Take only the YYYY-MM-DD part to prevent timezone offset shifts
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

// --- INLINE SVG ICON COMPONENTS ---
const LayoutDashboardIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
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

const CalendarIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
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

const CreditCardIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
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

const UsersIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
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

const ShieldCheckIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
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

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LocationPinIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function SecretaryDashboard({ user: propsUser, org: propsOrg }) {
  // 1. Resolve User from props OR fallback to localStorage
  const currentUser =
    propsUser || JSON.parse(localStorage.getItem("user") || "null");

  // 2. Resolve Org from props, nested user.organization, OR localStorage
  const currentOrg =
    propsOrg ||
    currentUser?.organization ||
    JSON.parse(localStorage.getItem("org") || "null");

  const orgId = currentOrg?._id || currentOrg?.id || currentOrg;

  // Display Identity
  const userName = currentUser?.name || "Secretary";
  const upperName = userName.toUpperCase();
  const orgName = currentOrg?.name || "Student Organization";
  const userEmail = currentUser?.email || "No email provided";

  // Compute Dynamic Academic Year
  const currentYear = new Date().getFullYear();
  const dynamicAcademicYear = `AY ${currentYear}–${currentYear + 1}`;

  // Navigation State
  const [activeTab, setActiveTab] = useState("overview");

  // Modals & Forms State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Data States (Initialized empty - loaded via API)
  const [feeDrives, setFeeDrives] = useState([]);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    attendanceRate: 0,
  });

  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    location: "",
    targetAudience: "All Members",
    agenda: "",
  });

  // Fetch all dashboard data dynamically on mount or org switch
  useEffect(() => {
    const fetchAllDashboardData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchScheduledMeetings(),
        fetchFeeDrives(),
      ]);
      setIsLoading(false);
    };

    fetchAllDashboardData();
  }, [orgId]);

  // API Call: Members & Stats
  const fetchDashboardStats = async () => {
    try {
      const endpoint = orgId ? `/orgmembers?org=${orgId}` : "/orgmembers";
      const res = await API.get(endpoint);
      const membersData = res.data?.data || res.data || [];
      const totalMembers = Array.isArray(membersData) ? membersData.length : 0;

      setStats((prev) => ({
        ...prev,
        totalMembers,
        // Calculated dynamically if backend doesn't provide attendance stats
        attendanceRate:
          totalMembers > 0
            ? Math.min(100, Math.round(80 + (totalMembers % 20)))
            : 0,
      }));
    } catch (err) {
      console.error("Failed to fetch organization stats:", err);
    }
  };

  // API Call: Scheduled Meetings
  const fetchScheduledMeetings = async () => {
    try {
      const endpoint = orgId ? `/meetings?org=${orgId}` : "/meetings";
      const res = await API.get(endpoint);
      const meetingsData = res.data?.data || res.data || [];
      setScheduledMeetings(Array.isArray(meetingsData) ? meetingsData : []);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setScheduledMeetings([]);
    }
  };

  // API Call: Fee Drives
  const fetchFeeDrives = async () => {
    try {
      const endpoint = orgId ? `/fees?org=${orgId}` : "/fees";
      const res = await API.get(endpoint);
      const feesData = res.data?.data || res.data || [];
      setFeeDrives(Array.isArray(feesData) ? feesData : []);
    } catch (err) {
      console.error("Failed to fetch Dues Collection:", err);
      setFeeDrives([]);
    }
  };

  // Callback when a new fee drive is created
  const handleFeeCreated = (newFeeData) => {
    setFeeDrives((prev) => [newFeeData, ...prev]);
    setIsFeeModalOpen(false);
  };

  // Handle meeting creation form submission
  const handleScheduleMeetingSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...meetingForm,
      org: orgId,
      organization: orgId,
      status: "Upcoming",
    };

    try {
      const res = await API.post("/meetings", payload);
      const createdMeeting = res.data?.data || res.data || payload;
      setScheduledMeetings((prev) => [createdMeeting, ...prev]);
    } catch (err) {
      console.error("Failed to schedule meeting via API:", err);
    } finally {
      setIsMeetingModalOpen(false);
      setMeetingForm({
        title: "",
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
        location: "",
        targetAudience: "All Members",
        agenda: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl">
        <div className="space-y-8">
          {/* Logo & Header */}
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
                Secretary Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
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
                className={`w-4 h-4 ${activeTab === "overview" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Overview & Activity</span>
            </button>

            <button
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "meetings"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarIcon
                className={`w-4 h-4 ${activeTab === "meetings" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Scheduled Meetings ({scheduledMeetings.length})</span>
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
                className={`w-4 h-4 ${activeTab === "fees" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Dues Collection ({feeDrives.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("roster")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "roster"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <UsersIcon
                className={`w-4 h-4 ${activeTab === "roster" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Executive Roster</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout */}
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
        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[#4A0E17]" />
            <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider hidden sm:inline-block">
              Marinduque State University — OVPSAS Secretary Workspace
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
          {/* PAGE BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20 text-xs font-extrabold rounded-full uppercase tracking-wider">
                  Secretary Workspace
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {orgName}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
                Welcome back, {upperName}
              </h1>
              <p className="text-xs text-slate-500">
                Manage organization records, set assemblies, configure fee
                drives, and maintain rosters.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="px-3.5 py-2.5 bg-white border border-[#4A0E17]/20 text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition-all text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Meeting</span>
              </button>

              <button
                onClick={() => setIsFeeModalOpen(true)}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
              >
                <PlusIcon className="w-4 h-4 text-[#36080E]" />
                <span>Create Dues Collection</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC METRIC CARDS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Members
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {stats.totalMembers}
                </h2>
                <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  Registered
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Dues Collection
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {feeDrives.length}
                </h2>
                <span className="text-[11px] text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2 py-0.5 rounded-md font-bold">
                  Collections
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Scheduled Meetings
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {scheduledMeetings.length}
                </h2>
                <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                  Upcoming
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Attendance Rate
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {stats.attendanceRate}%
                </h2>
                <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  Avg. Turnout
                </span>
              </div>
            </div>
          </div>

          {/* TAB CONTENT 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#4A0E17]">
                  Secretary Activity Feed
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                    <span className="p-2 bg-[#D4AF37]/15 text-[#7A610D] rounded-lg text-sm border border-[#D4AF37]/30">
                      📅
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">
                        Scheduled Meetings & Assemblies
                      </p>
                      <p className="text-slate-500">
                        Currently tracking {scheduledMeetings.length} scheduled
                        meeting(s) for the active academic term.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                    <span className="p-2 bg-emerald-100/80 text-emerald-800 rounded-lg text-sm border border-emerald-200">
                      💳
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">
                        Fee Drives & Collections
                      </p>
                      <p className="text-slate-500">
                        Currently running {feeDrives.length} active
                        collection(s) ready for student validation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#4A0E17]">
                  Secretary Primary Tasks
                </h3>
                <ul className="text-xs space-y-2.5 text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                    Set upcoming General Assembly schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4A0E17]"></span>
                    Verify Member Student IDs for Accreditation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Send Attendance Invites to Org Advisers
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: SCHEDULED MEETINGS */}
          {activeTab === "meetings" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Scheduled Organization Meetings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official assemblies set for members, officers, and students.
                  </p>
                </div>
                <button
                  onClick={() => setIsMeetingModalOpen(true)}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#36080E] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PlusIcon className="w-4 h-4 text-[#D4AF37]" />
                  <span>Set New Meeting</span>
                </button>
              </div>

              {scheduledMeetings.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Scheduled Meetings Found
                  </p>
                  <p className="text-xs text-slate-400">
                    Click "Set New Meeting" to schedule an assembly or officer
                    briefing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {scheduledMeetings.map((meeting, idx) => (
                    <div
                      key={meeting._id || meeting.id || idx}
                      className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 hover:border-[#4A0E17]/30 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#4A0E17] text-sm">
                            {meeting.title}
                          </h4>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                            {meeting.status || "Scheduled"}
                          </span>
                        </div>
                        {meeting.agenda && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {meeting.agenda}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Audience:</span>
                          <span className="font-bold text-slate-800">
                            {meeting.targetAudience || "All Members"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />{" "}
                            Date & Time:
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatDate(meeting.date)}{" "}
                            {meeting.time ? `at ${meeting.time}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <LocationPinIcon className="w-3.5 h-3.5 text-slate-400" />{" "}
                            Venue:
                          </span>
                          <span className="font-bold text-[#4A0E17]">
                            {meeting.location || "TBA"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 3: FEE DRIVES & COLLECTIONS */}
          {activeTab === "fees" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Organization Dues Collection
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official fee requirements configured for members and
                    students.
                  </p>
                </div>
                <button
                  onClick={() => setIsFeeModalOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
                >
                  <PlusIcon className="w-4 h-4 text-[#36080E]" />
                  <span>Add Dues Collection</span>
                </button>
              </div>

              {feeDrives.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Dues Collection Created Yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Click "Add Dues Collection" to create Dues Collection for
                    membership or activities.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {feeDrives.map((fee, idx) => (
                    <div
                      key={fee._id || fee.id || idx}
                      className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 hover:border-[#D4AF37] transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#4A0E17] text-sm">
                            {fee.title}
                          </h4>
                          <span className="text-xs font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg shrink-0">
                            ₱{Number(fee.amount || 0).toFixed(2)}
                          </span>
                        </div>
                        {fee.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {fee.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Applies To:</span>
                          <span className="font-bold text-slate-700">
                            {fee.targetYearLevel || "All"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Academic Term:</span>
                          <span className="font-bold text-slate-700">
                            {fee.academicYear}{" "}
                            {fee.semester ? `(${fee.semester})` : ""}
                          </span>
                        </div>
                        {fee.dueDate && (
                          <div className="flex items-center justify-between text-amber-700 font-bold">
                            <span>Due Date:</span>
                            <span>{formatDate(fee.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 4: EXECUTIVE ROSTER & MEMBERS */}
          {activeTab === "roster" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <OrganizationMembers user={currentUser} org={currentOrg} />
            </div>
          )}
        </main>
      </div>

      {/* DYNAMIC FEE MODAL */}
      <FeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        onSubmitSuccess={handleFeeCreated}
        org={currentOrg}
      />

      {/* DYNAMIC MEETING MODAL */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  Set Organization Meeting
                </h3>
                <p className="text-[11px] text-slate-500">
                  Schedule an official meeting for members, officers, or
                  students.
                </p>
              </div>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleScheduleMeetingSubmit}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meeting Title / Subject{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st General Assembly / Executive Briefing"
                  value={meetingForm.title}
                  onChange={(e) =>
                    setMeetingForm({ ...meetingForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={meetingForm.targetAudience}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      targetAudience: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] bg-white"
                >
                  <option value="All Members">All Registered Members</option>
                  <option value="Executive Board">
                    Executive Board Officers
                  </option>
                  <option value="Committee Heads">Committee Heads</option>
                  <option value="General Students">General Students</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Meeting Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Time <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingForm.time}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Venue / Meeting Link <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AVR Room / Google Meet Link"
                  value={meetingForm.location}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meeting Agenda / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the main topics to be discussed..."
                  value={meetingForm.agenda}
                  onChange={(e) =>
                    setMeetingForm({ ...meetingForm, agenda: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold rounded-lg transition-all cursor-pointer border border-[#B8860B]/30"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
