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

const formatDueDate = (dateString) => {
  if (!dateString) return "N/A";

  // Take only the YYYY-MM-DD part to prevent timezone offset shifts
  const cleanDateStr = String(dateString).split("T")[0];
  const [year, month, day] = cleanDateStr.split("-");

  if (!year || !month || !day) return String(dateString);

  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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
  const [rosterView, setRosterView] = useState("officers");
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
  // Class registration (president + treasurer accounts).
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isClassSubmitting, setIsClassSubmitting] = useState(false);
  const [classForm, setClassForm] = useState({
    program: "",
    section: "",
    presidentSurname: "",
    presidentFirstName: "",
    presidentMiddleInitial: "",
    presidentSuffix: "",
    presidentEmail: "",
    treasurerSurname: "",
    treasurerFirstName: "",
    treasurerMiddleInitial: "",
    treasurerSuffix: "",
    treasurerEmail: "",
  });
  const resetClassForm = () =>
    setClassForm({
      program: "",
      section: "",
      presidentSurname: "",
      presidentFirstName: "",
      presidentMiddleInitial: "",
      presidentSuffix: "",
      presidentEmail: "",
      treasurerSurname: "",
      treasurerFirstName: "",
      treasurerMiddleInitial: "",
      treasurerSuffix: "",
      treasurerEmail: "",
    });
  // Organization roster options for picking class officers.
  const [rosterOptions, setRosterOptions] = useState([]);
  const [isLoadingRosterOptions, setIsLoadingRosterOptions] = useState(false);
  // OVPSAS program catalog for the org's college (class program dropdown).
  const [collegePrograms, setCollegePrograms] = useState([]);
  // Live search state per officer slot (president / treasurer).
  const [officerSearch, setOfficerSearch] = useState({
    president: "",
    treasurer: "",
  });
  const [openOfficerSearch, setOpenOfficerSearch] = useState(null);

  const filterRosterOptions = (query) => {
    const q = String(query || "").trim().toLowerCase();
    const matches = (member) =>
      [member.name, member.email, member.idNumber, member.section].some(
        (value) => String(value || "").toLowerCase().includes(q),
      );
    const list = q ? rosterOptions.filter(matches) : rosterOptions;
    return list.slice(0, 8);
  };

  const openClassModal = async () => {
    resetClassForm();
    setOfficerSearch({ president: "", treasurer: "" });
    setOpenOfficerSearch(null);
    setIsClassModalOpen(true);
    setIsLoadingRosterOptions(true);
    try {
      const [rosterResponse, collegesResponse] = await Promise.all([
        API.get("/orgmembers"),
        API.get("/colleges").catch(() => []),
      ]);
      const list = Array.isArray(rosterResponse) ? rosterResponse : [];
      setRosterOptions(
        list
          // Only regular members can be picked: existing officers already
          // serve and cannot take a class post.
          .filter((member) => member.role === "Member")
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || "")),
          ),
      );
      // Program options come from the OVPSAS catalog for this org's
      // college, so the class program tallies with Add Classmate.
      const colleges = Array.isArray(collegesResponse) ? collegesResponse : [];
      const orgCollege = String(user?.organization?.college || "")
        .trim()
        .toLowerCase();
      const matched = colleges.find(
        (college) =>
          String(college.name || "").trim().toLowerCase() === orgCollege,
      );
      setCollegePrograms(
        Array.isArray(matched?.programs) ? matched.programs : [],
      );
    } catch {
      setRosterOptions([]);
      setCollegePrograms([]);
    } finally {
      setIsLoadingRosterOptions(false);
    }
  };

  const applyRosterPick = (memberId, prefix) => {
    const picked = rosterOptions.find(
      (member) => String(member._id) === String(memberId),
    );
    if (!picked) return;
    setClassForm((current) => ({
      ...current,
      [`${prefix}Surname`]: picked.surname || "",
      [`${prefix}FirstName`]: picked.firstName || "",
      [`${prefix}MiddleInitial`]: picked.middleInitial || "",
      [`${prefix}Suffix`]: picked.suffix || "",
      [`${prefix}Email`]: picked.email || "",
    }));
    setOfficerSearch((current) => ({ ...current, [prefix]: picked.name || "" }));
    setOpenOfficerSearch(null);
  };

  const renderOfficerSearch = (prefix, title) => {
    const query = officerSearch[prefix] || "";
    const results = filterRosterOptions(query);
    const isOpen = openOfficerSearch === prefix;
    return (
      <div className="relative">
        <input
          type="text"
          aria-label={`Search ${title} from organization roster`}
          placeholder={
            isLoadingRosterOptions
              ? "Loading organization roster..."
              : `Search registered members for ${title}...`
          }
          disabled={isLoadingRosterOptions}
          value={query}
          onChange={(event) => {
            setOfficerSearch((current) => ({
              ...current,
              [prefix]: event.target.value,
            }));
            setOpenOfficerSearch(prefix);
          }}
          onFocus={() => setOpenOfficerSearch(prefix)}
          onBlur={() => setOpenOfficerSearch(null)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none bg-white disabled:bg-slate-100"
        />
        {isOpen && !isLoadingRosterOptions && (
          <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {results.length === 0 ? (
              <p className="px-3 py-2.5 text-[11px] text-slate-400">
                {query.trim()
                  ? "No matching members. Fill the fields manually below."
                  : "No roster members available. Fill the fields manually below."}
              </p>
            ) : (
              results.map((member) => (
                <button
                  key={member._id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyRosterPick(member._id, prefix)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-[#4A0E17]/5 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800">
                    {member.name}
                    <span className="ml-1.5 font-semibold text-slate-400">
                      {member.hasAccount ? "Has account" : "No account yet"}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {[member.role, member.email].filter(Boolean).join(" — ")}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };
  const [classSetupLinks, setClassSetupLinks] = useState(null);
  // Classes registered under this organization (parent orgs only).
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  // President-initiated dues collections (require adviser approval).
  const [feeDrives, setFeeDrives] = useState([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [feeNotice, setFeeNotice] = useState("");
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeView, setFeeView] = useState("active");
  const [expandedFeeIds, setExpandedFeeIds] = useState({});

  const toggleFeeDetails = (feeId) =>
    setExpandedFeeIds((current) => ({
      ...current,
      [feeId]: !current[feeId],
    }));

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

      // Class accounts have their own slim portals; never serve them the
      // full organization workspace (stale sessions, bookmarks, manual URLs).
      const authOrgType =
        typeof authenticatedUser?.organization === "object"
          ? authenticatedUser.organization?.organizationType
          : null;
      if (
        authenticatedUser?.role === "org_admin" &&
        authOrgType === "class"
      ) {
        navigate("/class-dashboard", { replace: true });
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

  const loadClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const response = await API.get("/organizations/classes");
      setClasses(Array.isArray(response) ? response : []);
    } catch {
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  // Class detail modal (view officers + roster per class).
  const [viewingClassId, setViewingClassId] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [isLoadingClassDetail, setIsLoadingClassDetail] = useState(false);

  const openClassDetail = async (classOrg) => {
    setViewingClassId(classOrg._id);
    setClassDetail(null);
    setIsLoadingClassDetail(true);
    try {
      const response = await API.get(
        `/organizations/classes/${classOrg._id}`,
      );
      setClassDetail(response || null);
    } catch {
      setClassDetail(null);
    } finally {
      setIsLoadingClassDetail(false);
    }
  };

  const closeClassDetail = () => {
    setViewingClassId(null);
    setClassDetail(null);
  };

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

  // Load classes registered under this organization once the profile resolves.
  useEffect(() => {
    const orgRef = user?.organization;
    const orgId = orgRef?._id || orgRef;
    const orgType = orgRef?.organizationType;
    if (!user || !orgId || orgType === "suborganization" || orgType === "class") {
      if (user) setClasses([]);
      return;
    }
    loadClasses();
  }, [user, loadClasses]);

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

  const handleSuborganizationSubmit = async (event) => {    event.preventDefault();
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

  const handleClassInput = (event) => {
    const { name, value } = event.target;
    setClassForm((current) => ({ ...current, [name]: value }));
  };

  const handleClassSubmit = async (event) => {
    event.preventDefault();
    setIsClassSubmitting(true);
    setClassSetupLinks(null);
    try {
      const response = await API.post("/organizations/classes", classForm);
      setIsClassModalOpen(false);
      resetClassForm();
      if (response?._id) {
        setClasses((current) => [response, ...current]);
      } else {
        loadClasses();
      }
      if (response.emailStatus === "failed" && response.demoSetupLinks) {
        setClassSetupLinks(response.demoSetupLinks);
      }
      showToast(
        response.emailStatus === "failed"
          ? "Class registered, but invitation emails could not be sent. Share the setup links below."
          : "Class registered and invitations sent to president and treasurer.",
        response.emailStatus === "failed" ? "warning" : "success",
      );
    } catch (err) {
      const errorMessage =
        err.message ||
        err.response?.data?.message ||
        "Unable to register class.";
      console.error("Class registration failed:", err);
      showToast(errorMessage, "error", 15000);
    } finally {
      setIsClassSubmitting(false);
    }
  };

  const handleDeleteClass = async (classOrg) => {
    if (
      !window.confirm(
        `Delete class ${classOrg.name}? This permanently removes its users and roster.`,
      )
    )
      return;
    try {
      await API.delete(`/organizations/classes/${classOrg._id}`);
      setClasses((current) =>
        current.filter((item) => item._id !== classOrg._id),
      );
      showToast("Class deleted successfully.", "success");
    } catch (err) {
      showToast(err.message || "Unable to delete class.", "error");
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

            {org.organizationType === "parent" && (
              <button
                onClick={() => setActiveTab("classes")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                  activeTab === "classes"
                    ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                    : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
                }`}
              >
                <UserGroupIcon
                  className={`w-4 h-4 ${activeTab === "classes" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
                />
                <span>Manage Classes</span>
                {classes.length > 0 && <NavCountBadge count={classes.length} />}
              </button>
            )}

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
            ...(org.organizationType === "parent"
              ? [
                  {
                    id: "classes",
                    label: "Manage Classes",
                    shortLabel: "Classes",
                    icon: <UserGroupIcon />,
                    count:
                      classes.length > 0 ? classes.length : undefined,
                  },
                ]
              : []),
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

          {/* TAB CONTENT: ORGANIZATION MEMBERS */}
          {activeTab === "members" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="mb-5 flex flex-wrap gap-2">
                {[
                  { id: "officers", label: "Organization Officers" },
                  { id: "members", label: "Regular Members" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRosterView(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rosterView === tab.id
                        ? "bg-[#4A0E17] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {rosterView === "officers" ? (
                <OrganizationMembers
                  user={user}
                  org={org}
                  view="officers"
                  readOnly
                />
              ) : (
                <OrganizationMembers user={user} org={org} view="members" />
              )}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
                  {visibleFees.map((fee, idx) => {
                    // Unique per rendered card so one toggle can never open
                    // another card, even if an id is missing.
                    const cardFeeId = fee._id || `dues-${idx}`;
                    return (
                    <div
                      key={cardFeeId}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-bold leading-snug text-[#4A0E17]">
                          {fee.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2.5 py-1 text-xs font-black text-[#7A610D]">
                            ₱
                            {Number(fee.amount || 0).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
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
                      </div>
                      {fee.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {fee.description}
                        </p>
                      )}
                      <div className="pt-3 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-500">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-white p-2 border border-slate-200">
                            <p className="text-[9px] font-bold uppercase text-slate-400">
                              Target
                            </p>
                            <p className="font-black text-slate-800">
                              ₱
                              {Number(
                                fee.expectedCollection || 0,
                              ).toLocaleString("en-PH")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200">
                            <p className="text-[9px] font-bold uppercase text-emerald-600">
                              Received
                            </p>
                            <p className="font-black text-emerald-800">
                              ₱
                              {Number(
                                fee.collectedAmount || 0,
                              ).toLocaleString("en-PH")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-2 border border-amber-200">
                            <p className="text-[9px] font-bold uppercase text-amber-600">
                              Balance
                            </p>
                            <p className="font-black text-amber-900">
                              ₱
                              {Number(
                                fee.remainingAmount || 0,
                              ).toLocaleString("en-PH")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between font-bold">
                            <span>
                              {fee.paidMemberCount || 0} of{" "}
                              {fee.targetMemberCount || 0} paid
                            </span>
                            <span>{fee.collectionPercentage || 0}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all"
                              style={{
                                width: `${fee.collectionPercentage || 0}%`,
                              }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFeeDetails(cardFeeId)}
                          aria-expanded={Boolean(expandedFeeIds[cardFeeId])}
                          className="flex items-center justify-between w-full pt-1 font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <span>
                            {expandedFeeIds[cardFeeId]
                              ? "Hide details"
                              : "Show details"}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedFeeIds[cardFeeId] ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {expandedFeeIds[cardFeeId] && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/60">
                            <div className="flex items-center justify-between">
                              <span>Applies To:</span>
                              <span className="font-bold text-slate-700">
                                {fee.targetYearLevel === "All"
                                  ? "All Students"
                                  : fee.targetYearLevel}
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
                                <span>{formatDueDate(fee.dueDate)}</span>
                              </div>
                            )}
                            <div className="pt-2 flex items-center justify-end gap-2">
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
                        )}
                      </div>
                    </div>
                    );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: MANAGE CLASSES */}
          {activeTab === "classes" && org.organizationType === "parent" && (
            <div className="space-y-6">
              {classSetupLinks && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-extrabold text-emerald-800">
                      Class registered — share these single-use setup links
                      (expire in 24 hours):
                    </p>
                    <button
                      type="button"
                      onClick={() => setClassSetupLinks(null)}
                      className="text-emerald-600 hover:text-emerald-800 text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {Object.entries(classSetupLinks).map(([label, link]) => (
                    <p
                      key={label}
                      className="text-[11px] text-emerald-700 break-all select-all"
                    >
                      <span className="font-bold capitalize">{label}:</span>{" "}
                      {link}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
                    Manage Classes
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Classes under {org.name} with their own president,
                    treasurer, and roster.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openClassModal}
                  disabled={org.status !== "Active"}
                  className="px-4 py-2.5 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer self-start sm:self-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Register Class
                </button>
              </div>

              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#4A0E17]/5 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-[#4A0E17]">
                  <span>Registered Classes</span>
                  <span className="text-slate-400 font-normal">
                    Showing {classes.length} class
                    {classes.length === 1 ? "" : "es"}
                  </span>
                </div>
                {isLoadingClasses ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Loading classes...
                  </div>
                ) : classes.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {classes.map((classOrg) => (
                      <div
                        key={classOrg._id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#4A0E17]/[0.02] transition-colors pl-9 border-l-4 border-[#D4AF37]/50"
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-[#4A0E17]">
                              {classOrg.name}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold border border-slate-200 tracking-wide">
                              CLASS
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#7A610D] font-extrabold border border-[#D4AF37]/30 tracking-wide">
                              {classOrg.acronym}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            President:{" "}
                            <span className="text-slate-700 font-medium">
                              {classOrg.president || "N/A"}
                            </span>
                            <span className="mx-1">•</span>
                            {classOrg.members ?? 0} member
                            {classOrg.members === 1 ? "" : "s"}
                            <span className="mx-1">•</span>
                            <span
                              className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${
                                classOrg.status === "Inactive"
                                  ? "bg-slate-100 border-slate-200 text-slate-600"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
                              }`}
                            >
                              {classOrg.status || "Active"}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs self-end sm:self-center justify-end">
                          <button
                            type="button"
                            onClick={() => openClassDetail(classOrg)}
                            className="px-3 py-2 rounded-lg border border-[#4A0E17] bg-white text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition-all cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(classOrg)}
                            className="px-3 py-2 rounded-lg border border-[#4A0E17]/30 bg-white text-[#4A0E17] hover:bg-[#4A0E17]/5 transition-all cursor-pointer font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                    <UserGroupIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-medium">No classes registered yet.</p>
                    <p className="text-[10px]">
                      Register the first class to give it a president,
                      treasurer, and roster.
                    </p>
                  </div>
                )}
              </section>
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

      {isClassModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Register Class
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Under {org.name} · College: {org.college}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                disabled={isClassSubmitting}
                className="text-sm font-bold text-slate-400 hover:text-[#4A0E17]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleClassSubmit} className="space-y-4 text-xs">
              <label className="block font-bold text-[#4A0E17]">
                Program
                {collegePrograms.length > 0 ? (
                  <select
                    name="program"
                    required
                    value={classForm.program}
                    onChange={handleClassInput}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none bg-white"
                  >
                    <option value="" disabled>
                      Select program
                    </option>
                    {collegePrograms.map((program) => (
                      <option
                        key={program._id || program.name}
                        value={program.name}
                      >
                        {program.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="program"
                    required
                    placeholder="e.g. BSIT"
                    value={classForm.program}
                    onChange={handleClassInput}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                  />
                )}
              </label>
              <label className="block font-bold text-[#4A0E17]">
                Section
                <input
                  name="section"
                  required
                  placeholder="e.g. 3B"
                  value={classForm.section}
                  onChange={handleClassInput}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block font-bold text-[#4A0E17] sm:col-span-2">
                  Class President
                  <span className="block mt-1 font-normal">
                    {renderOfficerSearch("president", "president")}
                  </span>
                </label>
                {[
                  ["presidentSurname", "Surname", "e.g. Dela Cruz", true],
                  ["presidentFirstName", "First Name", "e.g. Juan", true],
                  ["presidentMiddleInitial", "M.I.", "e.g. P.", false],
                  ["presidentSuffix", "Suffix", "e.g. Jr.", false],
                ].map(([field, label, placeholder, required]) => (
                  <label key={field} className="block font-bold text-[#4A0E17]">
                    {label} {required && <span className="text-rose-600">*</span>}
                    <input
                      name={field}
                      required={required}
                      placeholder={placeholder}
                      value={classForm[field]}
                      onChange={handleClassInput}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                    />
                  </label>
                ))}
                <label className="block font-bold text-[#4A0E17] sm:col-span-2">
                  President Email <span className="text-rose-600">*</span>
                  <input
                    type="email"
                    name="presidentEmail"
                    required
                    placeholder="president@marsu.edu.ph"
                    value={classForm.presidentEmail}
                    onChange={handleClassInput}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block font-bold text-[#4A0E17] sm:col-span-2">
                  Class Treasurer
                  <span className="block mt-1 font-normal">
                    {renderOfficerSearch("treasurer", "treasurer")}
                  </span>
                </label>
                {[
                  ["treasurerSurname", "Surname", "e.g. Santos", true],
                  ["treasurerFirstName", "First Name", "e.g. Maria", true],
                  ["treasurerMiddleInitial", "M.I.", "e.g. C.", false],
                  ["treasurerSuffix", "Suffix", "e.g. III", false],
                ].map(([field, label, placeholder, required]) => (
                  <label key={field} className="block font-bold text-[#4A0E17]">
                    {label} {required && <span className="text-rose-600">*</span>}
                    <input
                      name={field}
                      required={required}
                      placeholder={placeholder}
                      value={classForm[field]}
                      onChange={handleClassInput}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                    />
                  </label>
                ))}
                <label className="block font-bold text-[#4A0E17] sm:col-span-2">
                  Treasurer Email <span className="text-rose-600">*</span>
                  <input
                    type="email"
                    name="treasurerEmail"
                    required
                    placeholder="treasurer@marsu.edu.ph"
                    value={classForm.treasurerEmail}
                    onChange={handleClassInput}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal focus:border-[#4A0E17] focus:outline-none"
                  />
                </label>
              </div>
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  disabled={isClassSubmitting}
                  className="px-4 py-2.5 border border-[#4A0E17]/30 bg-white rounded-xl text-[#4A0E17] hover:bg-[#4A0E17]/5 transition-colors cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClassSubmitting}
                  className="rounded-xl bg-[#4A0E17] px-4 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {isClassSubmitting ? "Registering..." : "Register Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingClassId && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4A0E17]">
                  {classDetail?.name || "Class Detail"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {classDetail
                    ? `${classDetail.program || ""} · Section ${classDetail.section || ""} · ${classDetail.college || ""}`
                    : "Loading class details..."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeClassDetail}
                className="text-slate-400 hover:text-[#4A0E17] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isLoadingClassDetail ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Loading class details...
              </p>
            ) : !classDetail ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Unable to load class details.
              </p>
            ) : (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Classmates", classDetail.memberCount ?? 0, "text-[#4A0E17]"],
                    ["Officers", classDetail.officerCount ?? 0, "text-[#8B6E10]"],
                    ["Total", classDetail.totalCount ?? 0, "text-emerald-700"],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className={`mt-1 text-xl font-black ${color}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-2">
                    Class Officers
                  </p>
                  {(classDetail.officers || []).length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No officers assigned.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {classDetail.officers.map((officer) => (
                        <div
                          key={officer._id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {officer.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {officer.role} • {officer.email}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              officer.hasAccount
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {officer.hasAccount ? "Account Active" : "No Account"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-2">
                    Classmates ({(classDetail.members || []).length})
                  </p>
                  {(classDetail.members || []).length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No classmates listed yet.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {classDetail.members.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {[member.idNumber, member.email]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                            {member.section || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-1 flex items-center justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeClassDetail}
                    className="px-4 py-2.5 border border-[#4A0E17]/30 bg-white rounded-xl text-[#4A0E17] hover:bg-[#4A0E17]/5 transition-colors cursor-pointer font-semibold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
