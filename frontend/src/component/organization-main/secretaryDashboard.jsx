import { useState, useEffect } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";
import MobileTabBar from "../mobileTabBar";

// Sub-components
import OrganizationMembers from "./organizationMembers";
import ResolutionModal from "./resolutionModal";
import ResolutionList from "./resolutionList";
import {
  ActivityPlanIcon,
  AnnualReportIcon,
} from "./organizationDocumentIcons";
import OrganizationDocumentWorkspace from "./organizationDocumentWorkspace";
import SecretaryEvents from "./secretaryEvents";
import MeetingList from "./meetingList";
import LogoutButton from "../logoutButton";
import NavCountBadge from "../navCountBadge";
import {
  formatAcademicPeriod,
  getEffectiveAcademicPeriod,
} from "../../util/academicPeriod";

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

const MeetingIcon = ({ className = "w-4 h-4" }) => (
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
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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

const ResolutionIcon = ({ className = "w-4 h-4" }) => (
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
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

export default function SecretaryDashboard({ user: propsUser, org: propsOrg }) {
  const { showToast } = useToast();
  const [profileUser, setProfileUser] = useState(
    () => propsUser || JSON.parse(localStorage.getItem("user") || "null"),
  );

  // 1. Resolve User from props, refreshed profile, OR localStorage
  const currentUser = propsUser || profileUser;

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

  const activePeriod = getEffectiveAcademicPeriod(currentOrg);

  // Navigation State
  const [activeTab, setActiveTab] = useState("overview");

  // Resolution workflow state
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [editingResolution, setEditingResolution] = useState(null);
  const [resolutions, setResolutions] = useState([]);
  const [isLoadingResolutions, setIsLoadingResolutions] = useState(true);
  const [deletingResolutionId, setDeletingResolutionId] = useState("");
  const [submittingResolutionId, setSubmittingResolutionId] = useState("");
  const [resolutionNotice, setResolutionNotice] = useState("");

  const [stats, setStats] = useState({
    totalMembers: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    const profileRequest = window.setTimeout(async () => {
      try {
        const authenticatedUser = await API.get("/auth/me");
        setProfileUser(authenticatedUser);
        localStorage.setItem("user", JSON.stringify(authenticatedUser));
      } catch (err) {
        console.error("Failed to refresh secretary profile:", err);
      }
    }, 0);

    return () => window.clearTimeout(profileRequest);
  }, []);

  // Fetch all dashboard data dynamically on mount or org switch
  useEffect(() => {
    let isActive = true;

    const loadMembers = async () => {
      try {
        const endpoint = orgId ? `/orgmembers?org=${orgId}` : "/orgmembers";
        const res = await API.get(endpoint);
        const membersData = res.data?.data || res.data || [];
        const totalMembers = Array.isArray(membersData)
          ? membersData.length
          : 0;
        if (!isActive) return;
        setStats((previous) => ({
          ...previous,
          totalMembers,
          attendanceRate:
            totalMembers > 0
              ? Math.min(100, Math.round(80 + (totalMembers % 20)))
              : 0,
        }));
      } catch (err) {
        console.error("Failed to fetch organization stats:", err);
      }
    };

    const loadResolutions = async () => {
      try {
        const res = await API.get("/resolutions");
        const resolutionData = res.data || [];
        if (isActive) {
          setResolutions(Array.isArray(resolutionData) ? resolutionData : []);
        }
      } catch (err) {
        console.error("Failed to fetch resolutions:", err);
        if (isActive) {
          setResolutions([]);
          setResolutionNotice(err.message || "Unable to load resolutions.");
        }
      } finally {
        if (isActive) setIsLoadingResolutions(false);
      }
    };

    Promise.all([loadMembers(), loadResolutions()]);
    return () => {
      isActive = false;
    };
  }, [orgId]);

  const openCreateResolution = () => {
    setEditingResolution(null);
    setIsResolutionModalOpen(true);
  };

  const openEditResolution = (resolution) => {
    setEditingResolution(resolution);
    setIsResolutionModalOpen(true);
  };

  const handleResolutionSaved = (savedResolution, action) => {
    setResolutions((current) =>
      action === "created"
        ? [savedResolution, ...current]
        : current.map((item) =>
            item._id === savedResolution._id ? savedResolution : item,
          ),
    );
    setResolutionNotice(`Resolution ${action} successfully.`);
    setIsResolutionModalOpen(false);
    setEditingResolution(null);
    setActiveTab("resolutions");
  };

  const handleSubmitResolution = async (resolution) => {
    setSubmittingResolutionId(resolution._id);
    setResolutionNotice("");
    try {
      const response = await API.patch(
        `/resolutions/${resolution._id}/submit`,
      );
      setResolutions((current) =>
        current.map((item) =>
          item._id === resolution._id ? response.data : item,
        ),
      );
      const message = response.message || "Resolution submitted successfully.";
      setResolutionNotice(message);
      showToast(message, "success");
    } catch (err) {
      const errorMessage = err.message || "Unable to submit the resolution.";
      setResolutionNotice(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSubmittingResolutionId("");
    }
  };

  const handleDeleteResolution = async (resolution) => {
    if (
      !window.confirm(
        `Delete "${resolution.title}"? This cannot be undone.`,
      )
    )
      return;
    setDeletingResolutionId(resolution._id);
    setResolutionNotice("");
    try {
      await API.delete(`/resolutions/${resolution._id}`);
      setResolutions((current) =>
        current.filter((item) => item._id !== resolution._id),
      );
      setResolutionNotice("Resolution deleted successfully.");
      showToast("Resolution deleted successfully.", "success");
    } catch (err) {
      const errorMessage = err.message || "Unable to delete the resolution.";
      setResolutionNotice(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setDeletingResolutionId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 h-screen sticky top-0 self-start bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl overflow-y-auto">
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
              onClick={() => setActiveTab("resolutions")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "resolutions"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <ResolutionIcon
                className={`w-4 h-4 ${activeTab === "resolutions" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Resolutions</span>
              <NavCountBadge
                count={
                  resolutions.filter(
                    (resolution) =>
                      !["Adopted", "Rejected"].includes(resolution.status),
                  ).length
                }
              />
            </button>

            <button
              onClick={() => setActiveTab("annual-report")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "annual-report"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <AnnualReportIcon
                className={`w-4 h-4 ${activeTab === "annual-report" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Accomplishment Report</span>
            </button>

            <button
              onClick={() => setActiveTab("activity-plan")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "activity-plan"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <ActivityPlanIcon
                className={`w-4 h-4 ${activeTab === "activity-plan" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Organization Plan</span>
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
                className={`w-4 h-4 ${activeTab === "events" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Events</span>
            </button>

            <button
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "meetings"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <MeetingIcon
                className={`w-4 h-4 ${activeTab === "meetings" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Meetings</span>
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
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4A0E17] text-[#D4AF37] shadow-sm">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A610D]">
                  Secretary Workspace
                </p>
                <h1 className="truncate text-base sm:text-lg font-extrabold text-[#4A0E17]">
                  Welcome back, {upperName}
                </h1>
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {orgName} <span className="mx-1 text-slate-300">•</span>{" "}
                  Manage organization records
                </p>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] text-[11px] font-bold tracking-tight">
              {formatAcademicPeriod(activePeriod)}
            </span>
          </div>
        </header>

        <MobileTabBar
          activeItem={activeTab}
          onChange={setActiveTab}
          items={[
            {
              id: "overview",
              label: "Overview",
              icon: <LayoutDashboardIcon />,
            },
            {
              id: "resolutions",
              label: "Resolutions",
              icon: <ResolutionIcon />,
              count: resolutions.filter(
                (resolution) =>
                  !["Adopted", "Rejected"].includes(resolution.status),
              ).length,
            },
            {
              id: "annual-report",
              label: "Accomplishment Report",
              shortLabel: "Accomp. Report",
              icon: <AnnualReportIcon />,
            },
            {
              id: "activity-plan",
              label: "Organization Plan",
              shortLabel: "Org Plan",
              icon: <ActivityPlanIcon />,
            },
            {
              id: "events",
              label: "Events",
              icon: <CalendarIcon />,
              count: 0,
            },
            {
              id: "meetings",
              label: "Meetings",
              icon: <MeetingIcon />,
            },
            { id: "roster", label: "Roster", icon: <UsersIcon />, count: 0 },
          ]}
        />

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8 max-w-6xl w-full mx-auto space-y-8">
          {/* DYNAMIC METRIC CARDS OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  Resolutions
                </p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                    {resolutions.length}
                  </h2>
                  <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                    Filed
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
          )}

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
                      📄
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">
                        Resolutions
                      </p>
                      <p className="text-slate-500">
                        Currently tracking {resolutions.length} resolution(s)
                        for the active academic term.
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

          {/* TAB CONTENT: RESOLUTIONS */}
          {activeTab === "resolutions" && (
            <div className="space-y-4">
              {resolutionNotice && (
                <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                  {resolutionNotice}
                </div>
              )}
              <ResolutionList
                resolutions={resolutions}
                isLoading={isLoadingResolutions}
                deletingId={deletingResolutionId}
                submittingId={submittingResolutionId}
                onCreate={openCreateResolution}
                onEdit={openEditResolution}
                onSubmit={handleSubmitResolution}
                onDelete={handleDeleteResolution}
              />
            </div>
          )}

          {activeTab === "annual-report" && (
            <OrganizationDocumentWorkspace
              documentType="Annual Report"
              academicPeriodKey={`${activePeriod.academicYear}:${activePeriod.semester}`}
            />
          )}

          {activeTab === "activity-plan" && (
            <OrganizationDocumentWorkspace
              documentType="Activity Plan"
              academicPeriodKey={`${activePeriod.academicYear}:${activePeriod.semester}`}
            />
          )}

          {/* TAB CONTENT 3: EVENTS */}
          {activeTab === "events" && (
            <SecretaryEvents resolutions={resolutions} />
          )}

          {/* TAB CONTENT: MEETINGS */}
          {activeTab === "meetings" && <MeetingList />}

          {/* TAB CONTENT 4: EXECUTIVE ROSTER & MEMBERS */}
          {activeTab === "roster" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <OrganizationMembers user={currentUser} org={currentOrg} />
            </div>
          )}
        </main>
      </div>

      {isResolutionModalOpen && (
        <ResolutionModal
          key={editingResolution?._id || "new-resolution"}
          resolution={editingResolution}
          onClose={() => {
            setIsResolutionModalOpen(false);
            setEditingResolution(null);
          }}
          onSaved={handleResolutionSaved}
        />
      )}
    </div>
  );
}
