import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import ResolutionReview from "../component/organization-main/resolutionReview";
import {
  ActivityPlanIcon,
  AnnualReportIcon,
} from "../component/organization-main/organizationDocumentIcons";
import OrganizationDocumentWorkspace from "../component/organization-main/organizationDocumentWorkspace";
import MeetingList from "../component/organization-main/meetingList";
import LogoutButton from "../component/logoutButton";
import NavCountBadge from "../component/navCountBadge";
import MobileTabBar from "../component/mobileTabBar";
import {
  formatAcademicPeriod,
  getEffectiveAcademicPeriod,
} from "../util/academicPeriod";

const DashboardIcon = ({ className = "w-4 h-4" }) => (
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
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
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

const ShieldIcon = ({ className = "w-5 h-5" }) => (
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
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622z"
    />
  </svg>
);

export default function AdviserDashboard({ portalRole = "adviser" }) {
  const navigate = useNavigate();
  const isDean = portalRole === "dean";
  const pendingStatus = isDean
    ? "Pending Dean Review"
    : "Pending Adviser Review";
  const portalTitle = isDean
    ? "Department Dean Portal"
    : "Faculty Adviser Portal";
  const reviewerLabel = isDean ? "Dean" : "Adviser";
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [resolutions, setResolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolutionActionId, setResolutionActionId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([API.get("/auth/me"), API.get("/resolutions")])
      .then(([currentUser, resolutionResponse]) => {
        if (!mounted) return;
        if (currentUser?.role !== portalRole) {
          navigate("/", { replace: true });
          return;
        }
        setUser(currentUser);
        // The backend already scopes resolutions to this reviewer's stage.
        setResolutions(
          Array.isArray(resolutionResponse.data)
            ? resolutionResponse.data
            : [],
        );
      })
      .catch((error) => {
        if (mounted)
          setNotice(error.message || "Unable to load the dashboard.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [navigate, pendingStatus, portalRole]);

  const handleResolutionReview = async (resolution, review) => {
    setResolutionActionId(resolution._id);
    setNotice("");
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
      setNotice(response.message || "Resolution decision saved.");
      return true;
    } catch (error) {
      setNotice(error.message || "Unable to save the resolution decision.");
      return false;
    } finally {
      setResolutionActionId("");
    }
  };

  if (!user) return null;

  const organization =
    typeof user.organization === "object" ? user.organization : null;
  const orgName = organization?.name || "Student Organization";
  const activePeriod = getEffectiveAcademicPeriod(organization);
  const pendingResolutionCount = resolutions.filter(
    (resolution) => resolution.status === pendingStatus,
  ).length;
  const forwardedResolutionStatuses = isDean
    ? ["Adopted"]
    : ["Pending Dean Review", "Adopted"];
  const forwardedResolutionCount = resolutions.filter((resolution) =>
    forwardedResolutionStatuses.includes(resolution.status),
  ).length;

  const navItems = [
    { id: "overview", label: "Overview", icon: <DashboardIcon /> },
    {
      id: "resolutions",
      label: "Resolution Review",
      shortLabel: "Resolutions",
      icon: <FileCheckIcon />,
      count: pendingResolutionCount,
    },
    ...(!isDean
      ? [
          {
            id: "meetings",
            label: "Meetings",
            icon: <MeetingIcon />,
          },
          {
            id: "annual-report",
            label: "Accomplishment Report",
            count: 0,
            shortLabel: "Accomp. Report",
            icon: <AnnualReportIcon />,
          },
          {
            id: "activity-plan",
            label: "Organization Plan",
            count: 0,
            shortLabel: "Org Plan",
            icon: <ActivityPlanIcon />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      <aside className="w-64 h-screen sticky top-0 self-start bg-[#4A0E17] border-r border-[#36080E] flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl overflow-y-auto">
        <div className="space-y-8">
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
                {portalTitle}
              </span>
            </div>
          </div>
          <nav className="space-y-1.5 text-xs font-medium">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                  activeTab === item.id
                    ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                    : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
                }`}
              >
                <span
                  className={
                    activeTab === item.id
                      ? "text-[#D4AF37]"
                      : "text-rose-200/60"
                  }
                >
                  {item.icon}
                </span>
                <span>
                  {item.label}
                  {item.id === "resolutions" && (
                    <NavCountBadge count={pendingResolutionCount} />
                  )}
                </span>
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              {(user.name || "A").charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-100 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-rose-300/70 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <LogoutButton variant="button" showConfirmModal={true} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4A0E17] text-[#D4AF37] shadow-sm">
                <ShieldIcon />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A610D]">
                  {portalTitle}
                </p>
                <h1 className="truncate text-base sm:text-lg font-extrabold text-[#4A0E17]">
                  Welcome back, {user.name}
                </h1>
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {orgName} <span className="mx-1 text-slate-300">•</span>{" "}
                  Proposal validation workspace
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
          items={navItems}
          label={`${reviewerLabel} portal navigation`}
        />

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8 max-w-6xl w-full mx-auto space-y-6">
          {notice && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-semibold text-amber-800">
              {notice}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[#4A0E17]">
                  {reviewerLabel} Overview
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Monitor resolutions forwarded for your validation and
                  approval.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Awaiting Review
                  </p>
                  <p className="text-xl font-bold text-[#8B6E10]">
                    {pendingResolutionCount} Resolutions
                  </p>
                </div>
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isDean ? "Adopted" : "Approved and Forwarded"}
                  </p>
                  <p className="text-xl font-bold text-emerald-700">
                    {forwardedResolutionCount} Resolutions
                  </p>
                </div>
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Signatory Status
                  </p>
                  <p className="text-sm font-bold text-[#4A0E17]">
                    {isDean
                      ? "President + Adviser + Dean"
                      : "President + Adviser"}
                  </p>
                </div>
              </div>
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#4A0E17]/10 p-3 text-[#4A0E17]">
                    <ShieldIcon />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#4A0E17]">
                      {reviewerLabel} Approval Responsibility
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Only resolutions that completed the required earlier
                      reviews appear in your queue. Your approval records an
                      e-signature and forwards the resolution to the next
                      reviewer.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("resolutions")}
                      className="mt-4 rounded-xl bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white hover:bg-[#601520]"
                    >
                      Open Resolution Review
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "resolutions" && (
            <ResolutionReview
              resolutions={resolutions}
              isLoading={isLoading}
              actionId={resolutionActionId}
              onReview={handleResolutionReview}
              reviewRole={portalRole}
            />
          )}

          {!isDean && activeTab === "annual-report" && (
            <OrganizationDocumentWorkspace
              documentType="Annual Report"
              reviewRole="adviser"
              academicPeriodKey={`${activePeriod.academicYear}:${activePeriod.semester}`}
            />
          )}

          {!isDean && activeTab === "activity-plan" && (
            <OrganizationDocumentWorkspace
              documentType="Activity Plan"
              reviewRole="adviser"
              academicPeriodKey={`${activePeriod.academicYear}:${activePeriod.semester}`}
            />
          )}

          {!isDean && activeTab === "meetings" && <MeetingList />}
        </main>
      </div>
    </div>
  );
}
