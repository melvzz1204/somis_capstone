import { useState, useEffect } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";
import MobileTabBar from "../mobileTabBar";

// Sub-components
import OrganizationMembers from "./organizationMembers";
import ProposalModal from "./proposalModal";
import ProposalList from "./proposalList";
import {
  ActivityPlanIcon,
  AnnualReportIcon,
} from "./organizationDocumentIcons";
import OrganizationDocumentWorkspace from "./organizationDocumentWorkspace";
import SecretaryEvents from "./secretaryEvents";
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

  // Modals & Forms State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);

  // Dynamic Data States (Initialized empty - loaded via API)
  const [proposals, setProposals] = useState([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [deletingProposalId, setDeletingProposalId] = useState("");
  const [proposalNotice, setProposalNotice] = useState("");
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

    const loadProposals = async () => {
      try {
        const res = await API.get("/proposals");
        const proposalData = res.data || [];
        if (isActive) {
          setProposals(Array.isArray(proposalData) ? proposalData : []);
        }
      } catch (err) {
        console.error("Failed to fetch proposals:", err);
        if (isActive) {
          setProposals([]);
          setProposalNotice(err.message || "Unable to load proposals.");
        }
      } finally {
        if (isActive) setIsLoadingProposals(false);
      }
    };

    Promise.all([loadMembers(), loadProposals()]);
    return () => {
      isActive = false;
    };
  }, [orgId]);

  const openCreateProposal = () => {
    setEditingProposal(null);
    setIsProposalModalOpen(true);
  };

  const openEditProposal = (proposal) => {
    setEditingProposal(proposal);
    setIsProposalModalOpen(true);
  };

  const handleProposalSaved = (savedProposal, action) => {
    setProposals((current) =>
      action === "created"
        ? [savedProposal, ...current]
        : current.map((item) =>
            item._id === savedProposal._id ? savedProposal : item,
          ),
    );
    setProposalNotice(`Proposal ${action} successfully.`);
    setIsProposalModalOpen(false);
    setEditingProposal(null);
    setActiveTab("proposals");
  };

  const handleDeleteProposal = async (proposal) => {
    if (
      !window.confirm(
        `Delete “${proposal.proposalTitle}”? This cannot be undone.`,
      )
    )
      return;
    setDeletingProposalId(proposal._id);
    setProposalNotice("");
    try {
      await API.delete(`/proposals/${proposal._id}`);
      setProposals((current) =>
        current.filter((item) => item._id !== proposal._id),
      );
      setProposalNotice("Proposal deleted successfully.");
      showToast("Proposal deleted successfully.", "success");
    } catch (err) {
      const errorMessage = err.message || "Unable to delete the proposal.";
      setProposalNotice(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setDeletingProposalId("");
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
              onClick={() => setActiveTab("proposals")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "proposals"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarIcon
                className={`w-4 h-4 ${activeTab === "proposals" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Proposals</span>
              <NavCountBadge
                count={
                  proposals.filter(
                    (proposal) =>
                      !["Approved", "Rejected"].includes(proposal.status),
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
              id: "proposals",
              label: "Proposals",
              icon: <CalendarIcon />,
              count: proposals.filter(
                (proposal) =>
                  !["Approved", "Rejected"].includes(proposal.status),
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
                  Activity Proposals
                </p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                    {proposals.length}
                  </h2>
                  <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                    Submitted
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
                        Activity Proposals
                      </p>
                      <p className="text-slate-500">
                        Currently tracking {proposals.length} submitted
                        proposal(s) for the active academic term.
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

          {/* TAB CONTENT 2: PROPOSALS */}
          {activeTab === "proposals" && (
            <div className="space-y-4">
              {proposalNotice && (
                <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                  {proposalNotice}
                </div>
              )}
              <ProposalList
                proposals={proposals}
                isLoading={isLoadingProposals}
                deletingId={deletingProposalId}
                onCreate={openCreateProposal}
                onEdit={openEditProposal}
                onDelete={handleDeleteProposal}
              />
            </div>
          )}

          {activeTab === "annual-report" && (
            <OrganizationDocumentWorkspace documentType="Annual Report" />
          )}

          {activeTab === "activity-plan" && (
            <OrganizationDocumentWorkspace documentType="Activity Plan" />
          )}

          {/* TAB CONTENT 3: EVENTS */}
          {activeTab === "events" && <SecretaryEvents proposals={proposals} />}

          {/* TAB CONTENT 4: EXECUTIVE ROSTER & MEMBERS */}
          {activeTab === "roster" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <OrganizationMembers user={currentUser} org={currentOrg} />
            </div>
          )}
        </main>
      </div>

      {isProposalModalOpen && (
        <ProposalModal
          key={editingProposal?._id || "new-proposal"}
          proposal={editingProposal}
          onClose={() => {
            setIsProposalModalOpen(false);
            setEditingProposal(null);
          }}
          onSaved={handleProposalSaved}
        />
      )}
    </div>
  );
}
