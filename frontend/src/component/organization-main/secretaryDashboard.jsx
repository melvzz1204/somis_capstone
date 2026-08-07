<<<<<<< HEAD
import React, { useState, useEffect } from "react";
=======
import { useState, useEffect } from "react";
>>>>>>> origin/module-1
import API from "../../api/axios";

// Sub-components
import OrganizationMembers from "./organizationMembers";
<<<<<<< HEAD
import FeeModal from "./feesModal";
=======
import ProposalModal from "./proposalModal";
import ProposalList from "./proposalList";
>>>>>>> origin/module-1
import LogoutButton from "../logoutButton";

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

<<<<<<< HEAD
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

=======
>>>>>>> origin/module-1
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

<<<<<<< HEAD
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
=======
export default function SecretaryDashboard({ user: propsUser, org: propsOrg }) {
  const [profileUser, setProfileUser] = useState(
    () => propsUser || JSON.parse(localStorage.getItem("user") || "null"),
  );

  // 1. Resolve User from props, refreshed profile, OR localStorage
  const currentUser = propsUser || profileUser;
>>>>>>> origin/module-1

  // 2. Resolve Org from props, nested user.organization, OR localStorage
  const currentOrg =
    propsOrg ||
    currentUser?.organization ||
    JSON.parse(localStorage.getItem("org") || "null");

<<<<<<< HEAD
  // 3. Extract exact display values matching user JSON
  const userName = currentUser?.name || "Secretary";
  const orgName = currentOrg?.name || "Student Organization";

  // Navigation Tabs: 'overview' | 'meetings' | 'fees' | 'roster'
=======
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
>>>>>>> origin/module-1
  const [activeTab, setActiveTab] = useState("overview");

  // Modals & Forms State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);

<<<<<<< HEAD
  // Fee Drives Collection State
  const [feeDrives, setFeeDrives] = useState([
    {
      id: 1,
      title: "Cisco PAF",
      category: "cisco_paf",
      amount: 150,
      academicYear: "2025-2026",
      semester: "1st Semester",
      targetYearLevel: "All CICS Students",
      dueDate: "2026-08-15",
      description: "Program Alignment Fee for technical laboratory support.",
    },
  ]);

  // Scheduled Meetings State
  const [scheduledMeetings, setScheduledMeetings] = useState([
    {
      id: 1,
      title: "1st General Assembly 2026",
      date: "2026-08-20",
      time: "14:00",
      location: "College AVR / Zoom",
      targetAudience: "All CICS Students",
      agenda:
        "Discussion of semester activities, fee breakdown, and committee sign-ups.",
      status: "Upcoming",
    },
  ]);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    location: "",
    targetAudience: "All Members",
    agenda: "",
  });

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalMembers: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchScheduledMeetings();
=======
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
>>>>>>> origin/module-1
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

<<<<<<< HEAD
  const fetchScheduledMeetings = async () => {
    try {
      const res = await API.get("/meetings");
      if (res.data && res.data.length > 0) {
        setScheduledMeetings(res.data);
      }
    } catch (err) {
      console.log("Meetings endpoint pending or using fallback state.");
    }
  };

  // Fee Created Handler
  const handleFeeCreated = (newFeeData) => {
    setFeeDrives((prev) => [{ id: Date.now(), ...newFeeData }, ...prev]);
    setIsFeeModalOpen(false);
  };

  // Set / Schedule Meeting Form Submit Handler
  const handleScheduleMeetingSubmit = async (e) => {
    e.preventDefault();
    const newMeeting = {
      ...meetingForm,
      id: Date.now(),
      status: "Upcoming",
    };

    try {
      const res = await API.post("/meetings", newMeeting);
      setScheduledMeetings((prev) => [res.data || newMeeting, ...prev]);
    } catch (err) {
      console.error("Failed to schedule meeting via API, saving locally:", err);
      setScheduledMeetings((prev) => [newMeeting, ...prev]);
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
=======
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
    } catch (err) {
      setProposalNotice(err.message || "Unable to delete the proposal.");
    } finally {
      setDeletingProposalId("");
>>>>>>> origin/module-1
    }
  };

  return (
<<<<<<< HEAD
    /* 60% DOMINANT: Off-White Canvas Background */
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* 30% SECONDARY: Deep Royal Burgundy Sidebar */}
=======
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
>>>>>>> origin/module-1
      <aside className="w-64 bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl">
        <div className="space-y-8">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#601520]">
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 flex items-center justify-center">
              <img
                src="/logo.png"
<<<<<<< HEAD
                alt="MarSU Logo"
=======
                alt="Logo"
>>>>>>> origin/module-1
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
<<<<<<< HEAD
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "meetings"
=======
              onClick={() => setActiveTab("proposals")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "proposals"
>>>>>>> origin/module-1
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarIcon
<<<<<<< HEAD
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
              <span>Fee Drives ({feeDrives.length})</span>
=======
                className={`w-4 h-4 ${activeTab === "proposals" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Proposals ({proposals.length})</span>
>>>>>>> origin/module-1
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
<<<<<<< HEAD
              <p className="text-[10px] text-rose-300/70 truncate">{orgName}</p>
=======
              <p className="text-[10px] text-rose-300/70 truncate">
                {userEmail}
              </p>
>>>>>>> origin/module-1
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
<<<<<<< HEAD
            {/* 10% Gold Accent Badge */}
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] font-bold tracking-tight shadow-2xs">
              AY 2025–2026
=======
            {/* Dynamic Academic Year Badge */}
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] font-bold tracking-tight shadow-2xs">
              {dynamicAcademicYear}
>>>>>>> origin/module-1
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
<<<<<<< HEAD
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-xs text-slate-500">
                Manage organization records, set assemblies, configure fee
                drives, and maintain rosters.
              </p>
            </div>

            {/* Action Buttons (10% Warm Gold) */}
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
                <span>Create Fee Drive</span>
              </button>
            </div>
          </div>

          {/* METRIC CARDS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
=======
                Welcome back, {upperName}
              </h1>
              <p className="text-xs text-slate-500">
                Manage organization records, prepare proposals, and maintain
                executive rosters.
              </p>
            </div>

            <button
              onClick={openCreateProposal}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30 self-start sm:self-center"
            >
              <PlusIcon className="w-4 h-4 text-[#36080E]" />
              <span>Create Proposal</span>
            </button>
          </div>

          {/* DYNAMIC METRIC CARDS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
>>>>>>> origin/module-1
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
<<<<<<< HEAD
                Active Fee Drives
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
=======
                Activity Proposals
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {proposals.length}
                </h2>
                <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                  Submitted
>>>>>>> origin/module-1
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Attendance Rate
              </p>
              <div className="flex items-baseline justify-between">
<<<<<<< HEAD
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">88%</h2>
=======
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  {stats.attendanceRate}%
                </h2>
>>>>>>> origin/module-1
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
<<<<<<< HEAD
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
                        Active fee collections configured and ready for student
                        validation.
                      </p>
=======
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
>>>>>>> origin/module-1
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

<<<<<<< HEAD
          {/* TAB CONTENT 2: SCHEDULED MEETINGS */}
          {activeTab === "meetings" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Scheduled Organization Meetings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official assemblies set for members, officers, and CICS
                    students.
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
                  {scheduledMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
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
                            {meeting.targetAudience}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />{" "}
                            Date & Time:
                          </span>
                          <span className="font-bold text-slate-800">
                            {meeting.date} at {meeting.time}
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
                    Organization Fee Drives
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official fee requirements configured for members and
                    department students.
                  </p>
                </div>
                <button
                  onClick={() => setIsFeeModalOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
                >
                  <PlusIcon className="w-4 h-4 text-[#36080E]" />
                  <span>Add Fee Drive</span>
                </button>
              </div>

              {feeDrives.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Fee Drives Created Yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Click "Add Fee Drive" to create collections for Cisco Fee,
                    PAF, or CICS Week.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {feeDrives.map((fee) => (
                    <div
                      key={fee.id}
                      className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 hover:border-[#D4AF37] transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#4A0E17] text-sm">
                            {fee.title}
                          </h4>
                          <span className="text-xs font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg shrink-0">
                            ₱{Number(fee.amount).toFixed(2)}
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
                            {fee.academicYear} ({fee.semester})
                          </span>
                        </div>
                        {fee.dueDate && (
                          <div className="flex items-center justify-between text-amber-700 font-bold">
                            <span>Due Date:</span>
                            <span>{fee.dueDate}</span>
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

      {/* MOUNTED FEE MODAL WITH ORG CONTEXT */}
      <FeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        onSubmitSuccess={handleFeeCreated}
        org={currentOrg}
      />

      {/* MODAL: SET / SCHEDULE MEETING */}
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
=======
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

          {/* TAB CONTENT 3: EXECUTIVE ROSTER & MEMBERS */}
          {activeTab === "roster" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <OrganizationMembers user={currentUser} org={currentOrg} />
>>>>>>> origin/module-1
            </div>
          )}
        </main>
      </div>

<<<<<<< HEAD
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
                  <option value="All CICS Students">All CICS Students</option>
                  <option value="Committee Heads">Committee Heads</option>
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
                  placeholder="e.g. CICS AVR Room / Zoom Link"
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
=======
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
>>>>>>> origin/module-1
      )}
    </div>
  );
}
