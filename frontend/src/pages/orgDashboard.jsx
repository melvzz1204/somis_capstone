import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../util/toastContext";
import MobileTabBar from "../component/mobileTabBar";
import NavCountBadge from "../component/navCountBadge";
import OrganizationMembers from "../component/organization-main/organizationMembers";
import ResolutionReview from "../component/organization-main/resolutionReview";
import MeetingManager from "../component/organization-main/meetingManager";
import {
  ActivityPlanIcon,
  AnnualReportIcon,
} from "../component/organization-main/organizationDocumentIcons";
import OrganizationDocumentWorkspace from "../component/organization-main/organizationDocumentWorkspace";
import AcademicPeriodSettings from "../component/organization-main/AcademicPeriodSettings";
import FeeModal from "../component/organization-main/feesModal";
import LogoutButton from "../component/logoutButton";
import {
  formatAcademicPeriod,
  getEffectiveAcademicPeriod,
} from "../util/academicPeriod";

// --- SVG ICON COMPONENTS ---
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

const UserPlusIcon = ({ className = "w-4 h-4" }) => (
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
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
);

const UserGroupIcon = ({ className = "w-4 h-4" }) => (
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
      d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h3a4 4 0 014 4v2zm-3-9a4 4 0 100-8 4 4 0 000 8zm7 0a3 3 0 100-6"
    />
  </svg>
);

const CalendarEventIcon = ({ className = "w-4 h-4" }) => (
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

const FileCheckIcon = ({ className = "w-4 h-4" }) => (
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

const UploadCloudIcon = ({ className = "w-4 h-4" }) => (
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
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
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

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("Failed to parse cached user data:", err);
      return null;
    }
  });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [isLoadingResolutions, setIsLoadingResolutions] = useState(true);
  const [resolutionActionId, setResolutionActionId] = useState("");
  const [resolutionNotice, setResolutionNotice] = useState("");
  const [isSuborganizationModalOpen, setIsSuborganizationModalOpen] =
    useState(false);
  const [isSuborganizationSubmitting, setIsSuborganizationSubmitting] =
    useState(false);
  const [suborganizationForm, setSuborganizationForm] = useState({
    name: "",
    acronym: "",
    president: "",
    email: "",
  });
  // President-initiated dues collections (require adviser approval).
  const [feeDrives, setFeeDrives] = useState([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [feeNotice, setFeeNotice] = useState("");
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeView, setFeeView] = useState("active");

  const loadFeeDrives = useCallback(async () => {
    setIsLoadingFees(true);
    setFeeNotice("");
    try {
      const response = await API.get("/fees", {
        params: { includeArchived: "true" },
      });
      const data = response.data || response;
      setFeeDrives(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeeDrives([]);
      setFeeNotice(err.message || "Unable to load dues collections.");
    } finally {
      setIsLoadingFees(false);
    }
  }, []);

  const handleFeeSuccess = useCallback(
    (createdFee) => {
      if (createdFee?._id && !editingFee) {
        setFeeDrives((current) => [createdFee, ...current]);
      } else {
        loadFeeDrives();
      }
      setEditingFee(null);
      setIsFeeModalOpen(false);
    },
    [editingFee, loadFeeDrives],
  );

  const handleArchiveFee = async (fee) => {
    try {
      const response = await API.patch(`/fees/${fee._id}/archive`);
      const archived = response.data || response;
      setFeeDrives((current) =>
        current.map((item) => (item._id === fee._id ? archived : item)),
      );
      showToast("Dues collection archived.", "success");
    } catch (err) {
      showToast(err.message || "Failed to archive dues collection.", "error");
    }
  };

  const handleRestoreFee = async (fee) => {
    try {
      const response = await API.patch(`/fees/${fee._id}/restore`);
      const restored = response.data || response;
      setFeeDrives((current) =>
        current.map((item) => (item._id === fee._id ? restored : item)),
      );
      showToast("Dues collection restored.", "success");
    } catch (err) {
      showToast(err.message || "Failed to restore dues collection.", "error");
    }
  };

  const handleDeleteFee = async (fee) => {
    if (
      !window.confirm(
        "Permanently delete this archived collection and its linked payment records?",
      )
    )
      return;
    try {
      await API.delete(`/fees/${fee._id}`);
      setFeeDrives((current) =>
        current.filter((item) => item._id !== fee._id),
      );
      showToast("Archived collection permanently deleted.", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete archived collection.", "error");
    }
  };

  const loadOrganizationProfile = useCallback(async () => {
    setIsProfileLoading(true);
    setProfileError("");

    try {
      const authenticatedUser = await API.get("/auth/me");

      if (authenticatedUser?.role === "secretary") {
        navigate("/org-secretary", { replace: true });
        return;
      }

      setUser(authenticatedUser);
      localStorage.setItem("user", JSON.stringify(authenticatedUser));
    } catch (err) {
      console.error("Failed to fetch organization profile:", err);
      setProfileError(
        err.message || "Unable to load the latest organization profile.",
      );
    } finally {
      setIsProfileLoading(false);
    }
  }, [navigate]);

  const loadResolutions = useCallback(async () => {
    setIsLoadingResolutions(true);
    setResolutionNotice("");
    try {
      const response = await API.get("/resolutions");
      setResolutions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setResolutions([]);
      setResolutionNotice(err.message || "Unable to load resolutions.");
    } finally {
      setIsLoadingResolutions(false);
    }
  }, []);

  const loadOrganizationMembers = useCallback(async () => {
    try {
      const response = await API.get("/orgmembers");
      setOrganizationMembers(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Failed to fetch organization member counts:", err);
      setOrganizationMembers([]);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "secretary") {
      navigate("/org-secretary", { replace: true });
      return undefined;
    }

    const profileRequest = window.setTimeout(() => {
      loadOrganizationProfile();
      loadResolutions();
      loadOrganizationMembers();
      loadFeeDrives();
    }, 0);

    return () => window.clearTimeout(profileRequest);
  }, [
    loadOrganizationProfile,
    loadResolutions,
    loadOrganizationMembers,
    loadFeeDrives,
    navigate,
    user?.role,
  ]);

  const officerCount = organizationMembers.filter(
    (member) => member.role !== "Member",
  ).length;
  const memberCount = organizationMembers.filter(
    (member) => member.role === "Member",
  ).length;

  const handleResolutionReview = async (resolution, review) => {
    setResolutionActionId(resolution._id);
    setResolutionNotice("");
    try {
      const response = await API.patch(
        `/resolutions/${resolution._id}/review`,
        review,
      );
      setResolutions((current) =>
        current.map((item) =>
          item._id === resolution._id ? response.data : item,
        ),
      );
      const successMessage = response.message || "Resolution decision saved.";
      setResolutionNotice(successMessage);
      showToast(successMessage, "success");
      return true;
    } catch (err) {
      const errorMessage =
        err.message || "Unable to save the resolution decision.";
      setResolutionNotice(errorMessage);
      showToast(errorMessage, "error");
      return false;
    } finally {
      setResolutionActionId("");
    }
  };

  const handleSuborganizationInput = (event) => {
    const { name, value } = event.target;
    setSuborganizationForm((current) => ({ ...current, [name]: value }));
  };

  const handleSuborganizationSubmit = async (event) => {
    event.preventDefault();
    setIsSuborganizationSubmitting(true);
    try {
      const response = await API.post("/organizations/suborganizations", {
        ...suborganizationForm,
        president: suborganizationForm.president.trim().replace(/\s+/g, " "),
      });
      setIsSuborganizationModalOpen(false);
      setSuborganizationForm({
        name: "",
        acronym: "",
        president: "",
        email: "",
      });
      showToast(
        response.emailStatus === "failed"
          ? "Suborganization registered, but the invitation email could not be sent."
          : "Suborganization registered and invitation sent.",
        response.emailStatus === "failed" ? "warning" : "success",
      );
    } catch (err) {
      const errorMessage =
        err.message ||
        err.response?.data?.message ||
        "Unable to register suborganization.";
      console.error("Suborganization registration failed:", err);
      showToast(errorMessage, "error", 15000);
    } finally {
      setIsSuborganizationSubmitting(false);
    }
  };

  const organization =
    user?.organization && typeof user.organization === "object"
      ? user.organization
      : null;
  const activePeriod = getEffectiveAcademicPeriod(organization);

  // Keep the page usable from cached account data while the API request runs.
  const org = {
    _id: organization?._id || user?.organization || "",
    name: organization?.name || "Student Organization",
    acronym: organization?.acronym || "ORG",
    college:
      organization?.college || "College of Information and Computing Sciences",
    adviser: organization?.adviser || "",
    president: organization?.president || user?.name || "Student Leader",
    email: organization?.email || user?.email || "org@marsu.edu.ph",
    status: organization?.status || "Active",
    academicPeriod: organization?.academicPeriod,
    organizationType: organization?.organizationType || "parent",
    parentOrganization: organization?.parentOrganization || null,
  };

  const organizationNeeds = [
    !organization?.adviser && "Assign an official faculty adviser",
    !organization?.president &&
      "Confirm the current president or student leader",
    !organization?.email && "Add an official organization contact email",
  ].filter(Boolean);

  const activeFees = feeDrives.filter((fee) => !fee.treasurerArchived);
  const archivedFees = feeDrives.filter((fee) => fee.treasurerArchived);
  const visibleFees = feeView === "archived" ? archivedFees : activeFees;

  // Prevent flash of Org Admin content while redirecting
  if (user?.role === "secretary") {
    return null;
  }

  return (
    /* 60% DOMINANT: Off-White Canvas Background */
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* 30% SECONDARY: Deep Royal Burgundy Sidebar */}
      <aside className="w-64 h-screen sticky top-0 self-start bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl overflow-y-auto">
        <div className="space-y-8">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#601520]">
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="MarSU Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase block">
                SOMIS
              </span>
              <span className="text-[10px] font-medium text-rose-200/70 tracking-wider block">
                {org.organizationType === "suborganization"
                  ? "Sub-Org Leader Portal"
                  : "Org Leader Portal"}
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
              <span>Overview & Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("officers")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "officers"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <UserPlusIcon
                className={`w-4 h-4 ${activeTab === "officers" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Manage Officers</span>
              <NavCountBadge count={officerCount} />
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "members"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <UserGroupIcon
                className={`w-4 h-4 ${activeTab === "members" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Organization Members</span>
              <NavCountBadge count={memberCount} />
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
                    (resolution) => resolution.status === "Submitted",
                  ).length
                }
              />
            </button>

            <button
              onClick={() => setActiveTab("dues")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "dues"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <ResolutionIcon
                className={`w-4 h-4 ${activeTab === "dues" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Dues Collection</span>
              <NavCountBadge
                count={
                  feeDrives.filter(
                    (fee) => fee.approvalStatus === "pending_adviser",
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
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "meetings"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarEventIcon
                className={`w-4 h-4 ${activeTab === "meetings" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Meetings</span>
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

            {/*    <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <FileCheckIcon
                className={`w-4 h-4 ${activeTab === "clearance" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Annual Clearance</span>
              <NavCountBadge count={organizationNeeds.length} />
            </button> */}
          </nav>
        </div>

        {/* User Info & Logout Button */}
        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              {(org.president || "L").charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-100 truncate">
                {org.president}
              </p>
              <p className="text-[10px] text-rose-300/70 truncate">
                {org.email}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <LogoutButton variant="button" showConfirmModal={true} />
          </div>
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
                  Organization Portal
                </p>
                <h1 className="truncate text-base sm:text-lg font-extrabold text-[#4A0E17]">
                  Welcome back, {org.president}
                </h1>
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {org.name} <span className="mx-1 text-slate-300">•</span>{" "}
                  Manage your organization workspace
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
            { id: "officers", label: "Officers", icon: <UserPlusIcon /> },
            { id: "members", label: "Members", icon: <UserGroupIcon /> },
            {
              id: "resolutions",
              label: "Resolutions",
              shortLabel: "Resolutions",
              icon: <ResolutionIcon />,
              count: resolutions.filter(
                (resolution) => resolution.status === "Submitted",
              ).length,
            },
            {
              id: "dues",
              label: "Dues",
              shortLabel: "Dues",
              icon: <ResolutionIcon />,
              count: feeDrives.filter(
                (fee) => fee.approvalStatus === "pending_adviser",
              ).length,
            },
            {
              id: "annual-report",
              label: "Accomplishment Report",
              shortLabel: "Accomp. Report",
              icon: <AnnualReportIcon />,
            },
            {
              id: "meetings",
              label: "Meetings",
              icon: <CalendarEventIcon />,
            },
            {
              id: "activity-plan",
              label: "Organization Plan",
              shortLabel: "Org Plan",
              icon: <ActivityPlanIcon />,
            },
            {
              id: "clearance",
              label: "Clearance",
              shortLabel: "Clear",
              icon: <FileCheckIcon />,
              count: organizationNeeds.length,
            },
          ]}
        />

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8 max-w-6xl w-full mx-auto space-y-8">
          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {profileError && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-900">
                  <div>
                    <p className="font-bold">
                      Profile refresh was unsuccessful
                    </p>
                    <p className="mt-0.5 text-amber-700">
                      {profileError} Cached organization details are shown
                      below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadOrganizationProfile}
                    className="self-start sm:self-auto rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-900 transition-colors hover:bg-amber-100 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Clearance Standing
                  </p>
                  <p className="text-xl font-bold text-[#8B6E10] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                    In Progress
                  </p>
                </div>

                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Submitted Activities
                  </p>
                  <p className="text-xl font-bold text-[#4A0E17]">
                    0 Activities
                  </p>
                </div>

                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Official Adviser
                  </p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {org.adviser || "Not Assigned"}
                  </p>
                </div>
              </div>

              <AcademicPeriodSettings organization={organization} readOnly />

              {org.organizationType !== "suborganization" && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-[#4A0E17]">
                      Register a sub-organization
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Create an organization under {org.name}. It will inherit
                      the college and receive its own leader invitation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSuborganizationModalOpen(true)}
                    disabled={org.status !== "Active"}
                    className="shrink-0 rounded-xl bg-[#4A0E17] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Register Sub-Organization
                  </button>
                </div>
              )}

              {/* Detail Profile Grid */}
              <div className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#4A0E17]/5 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs text-[#4A0E17]">
                  <span className="font-bold">
                    Organization Profile Summary
                  </span>
                  <span
                    className={`flex items-center gap-1.5 font-semibold ${
                      isProfileLoading ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isProfileLoading
                          ? "bg-amber-500 animate-pulse"
                          : "bg-emerald-500"
                      }`}
                    ></span>
                    {isProfileLoading
                      ? "Refreshing profile"
                      : "Profile updated"}
                  </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      Full Organization Name
                    </span>
                    <span className="font-bold text-[#4A0E17] text-sm">
                      {org.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      Acronym / Designation
                    </span>
                    <span className="font-bold text-slate-800">
                      {org.acronym}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      College / Department
                    </span>
                    <span className="font-bold text-slate-800">
                      {org.college}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      Official Contact Email
                    </span>
                    <span className="font-bold text-slate-800">
                      {org.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      Current President / Student Leader
                    </span>
                    <span className="font-bold text-slate-800">
                      {org.president || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      Faculty Adviser
                    </span>
                    <span className="font-bold text-slate-800">
                      {org.adviser || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">
                      Recognition Status
                    </span>
                    <span className="font-bold text-slate-800">
                      {org.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#D4AF37]/10 border-b border-slate-200/80 flex items-center justify-between gap-3">
                  <span className="font-bold text-xs text-[#4A0E17]">
                    Organization Needs
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {organizationNeeds.length === 0
                      ? "Profile is complete"
                      : `${organizationNeeds.length} item${organizationNeeds.length === 1 ? "" : "s"} to review`}
                  </span>
                </div>
                <div className="p-6">
                  {organizationNeeds.length === 0 ? (
                    <p className="text-xs font-medium text-emerald-700">
                      No missing profile details were found.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-xs text-slate-600">
                      {organizationNeeds.map((need) => (
                        <li key={need} className="flex items-start gap-2.5">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                          <span>{need}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: OFFICERS */}
          {activeTab === "officers" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <OrganizationMembers user={user} org={org} />
            </div>
          )}

          {/* TAB CONTENT: ORGANIZATION MEMBERS */}
          {activeTab === "members" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <OrganizationMembers user={user} org={org} view="members" />
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
              <ResolutionReview
                resolutions={resolutions}
                isLoading={isLoadingResolutions}
                actionId={resolutionActionId}
                onReview={handleResolutionReview}
                reviewRole="president"
              />
            </div>
          )}

          {/* TAB CONTENT: DUES COLLECTION (President initiates, Adviser approves) */}
          {activeTab === "dues" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#4A0E17]">
                      Dues Collection
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      As Organization President, set the dues amount. Each
                      collection requires an adopted resolution and Faculty
                      Adviser approval before it is finalized for students.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Once this collection is created and a student or member has paid, it cannot be edited. Do you want to continue?",
                        )
                      )
                        return;
                      setEditingFee(null);
                      setIsFeeModalOpen(true);
                    }}
                    className="shrink-0 rounded-xl bg-[#4A0E17] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#601520]"
                  >
                    Create Dues Collection
                  </button>
                </div>
                {feeNotice && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    {feeNotice}
                  </p>
                )}
              </div>

              <div
                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
                role="tablist"
                aria-label="Dues collection views"
              >
                {[
                  { key: "active", label: "Active", count: activeFees.length },
                  {
                    key: "archived",
                    label: "Archived",
                    count: archivedFees.length,
                  },
                ].map((view) => (
                  <button
                    key={view.key}
                    type="button"
                    role="tab"
                    aria-selected={feeView === view.key}
                    onClick={() => setFeeView(view.key)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                      feeView === view.key
                        ? "bg-[#4A0E17] text-white shadow-sm"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {view.label} ({view.count})
                  </button>
                ))}
              </div>

              {isLoadingFees ? (
                <p className="text-xs text-slate-500">
                  Loading dues collections...
                </p>
              ) : visibleFees.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                  <p className="text-xs font-bold text-slate-700">
                    {feeView === "archived"
                      ? "No archived collections"
                      : "No dues collections yet"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {feeView === "archived"
                      ? "Collections you archive will be stored here and can be restored anytime."
                      : "Create the first collection. It will be sent for adviser approval."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {visibleFees.map((fee) => (
                    <div
                      key={fee._id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#4A0E17]">
                          {fee.title}
                        </h4>
                        <span className="shrink-0 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2.5 py-1 text-xs font-black text-[#7A610D]">
                          ₱
                          {Number(fee.amount || 0).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                          {fee.status === "active" ? "Active" : fee.status}
                        </span>
                        <span
                          className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                            fee.approvalStatus === "approved"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : fee.approvalStatus === "rejected"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {fee.approvalStatus === "approved"
                            ? "Adviser Approved"
                            : fee.approvalStatus === "rejected"
                              ? "Adviser Rejected"
                              : "Pending Adviser Approval"}
                        </span>
                      </div>
                      {fee.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {fee.description}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {fee.paidMemberCount || 0} of{" "}
                        {fee.targetMemberCount || 0} paid •{" "}
                        {fee.collectionPercentage || 0}% collected
                      </p>
                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        {fee.approvalStatus !== "approved" &&
                          Number(fee.paidMemberCount || 0) === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFee(fee);
                                setIsFeeModalOpen(true);
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                          )}
                        {!fee.treasurerArchived ? (
                          <button
                            type="button"
                            onClick={() => handleArchiveFee(fee)}
                            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-50"
                          >
                            Archive
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestoreFee(fee)}
                              className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFee(fee)}
                              className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "meetings" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <MeetingManager />
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
              reviewRole="president"
              academicPeriodKey={`${activePeriod.academicYear}:${activePeriod.semester}`}
            />
          )}

          {/* TAB CONTENT: CLEARANCE */}
          {activeTab === "clearance" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Annual OVPSAS Clearance Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete required document submissions for year-end
                  organization recognition.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs divide-y divide-slate-100 text-xs overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-[#4A0E17] text-sm">
                      Constitution & By-Laws
                    </p>
                    <p className="text-slate-500">
                      Required annual submission updated for the current
                      academic term.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      Pending Upload
                    </span>
                    <button className="px-3 py-1.5 rounded-lg border border-[#4A0E17]/20 text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition-all cursor-pointer font-semibold flex items-center gap-1.5">
                      <UploadCloudIcon className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-[#4A0E17] text-sm">
                      Financial Report & Accomplishment Summary
                    </p>
                    <p className="text-slate-500">
                      Must be formally signed by the Organization Treasurer and
                      President.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      Pending Upload
                    </span>
                    <button className="px-3 py-1.5 rounded-lg border border-[#4A0E17]/20 text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition-all cursor-pointer font-semibold flex items-center gap-1.5">
                      <UploadCloudIcon className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <FeeModal
        isOpen={isFeeModalOpen}
        onClose={() => {
          setIsFeeModalOpen(false);
          setEditingFee(null);
        }}
        onSubmitSuccess={handleFeeSuccess}
        org={org}
        user={user}
        fee={editingFee}
      />

      {isSuborganizationModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Register Sub-Organization
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Main Org {org.name} · College: {org.college}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSuborganizationModalOpen(false)}
                disabled={isSuborganizationSubmitting}
                className="text-sm font-bold text-slate-400 hover:text-[#4A0E17]"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSuborganizationSubmit}
              className="space-y-4 text-xs"
            >
              <label className="block font-bold text-[#4A0E17]">
                Organization Full Name
                <input
                  name="name"
                  required
                  value={suborganizationForm.name}
                  onChange={handleSuborganizationInput}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                />
              </label>
              <label className="block font-bold text-[#4A0E17]">
                Acronym / Code
                <input
                  name="acronym"
                  required
                  value={suborganizationForm.acronym}
                  onChange={handleSuborganizationInput}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                />
              </label>
              <label className="block font-bold text-[#4A0E17]">
                Surname of Student Leader / President
                <input
                  name="president"
                  required
                  value={suborganizationForm.president}
                  onChange={handleSuborganizationInput}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                />
              </label>
              <label className="block font-bold text-[#4A0E17]">
                Official Organization Email
                <input
                  type="email"
                  name="email"
                  required
                  value={suborganizationForm.email}
                  onChange={handleSuborganizationInput}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSuborganizationModalOpen(false)}
                  disabled={isSuborganizationSubmitting}
                  className="rounded-xl border border-[#4A0E17]/30 bg-white px-4 py-2.5 font-semibold text-[#4A0E17]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSuborganizationSubmitting}
                  className="rounded-xl bg-[#4A0E17] px-4 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {isSuborganizationSubmitting
                    ? "Registering..."
                    : "Register Sub-Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
