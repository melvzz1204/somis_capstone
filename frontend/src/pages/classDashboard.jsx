import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import LogoutButton from "../component/logoutButton";
import MobileTabBar from "../component/mobileTabBar";
import OrganizationMembers from "../component/organization-main/organizationMembers";

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
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"
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

export default function ClassDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [roster, setRoster] = useState([]);
  const [notice, setNotice] = useState("");
  // Parent organization details, resolved dynamically so the header shows
  // the main org name (e.g. CICSSO) instead of a raw id.
  const [parentOrg, setParentOrg] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([API.get("/auth/me"), API.get("/orgmembers").catch(() => [])])
      .then(([currentUser, rosterResponse]) => {
        if (!mounted) return;
        const organization = currentUser?.organization;
        const organizationType =
          typeof organization === "object"
            ? organization?.organizationType
            : null;
        if (
          currentUser?.role !== "org_admin" ||
          organizationType !== "class"
        ) {
          navigate("/", { replace: true });
          return;
        }
        setUser(currentUser);
        const list = Array.isArray(rosterResponse)
          ? rosterResponse
          : rosterResponse?.data || [];
        setRoster(list);
      })
      .catch((error) => {
        if (mounted)
          setNotice(error.message || "Unable to load the dashboard.");
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const org =
      user?.organization && typeof user.organization === "object"
        ? user.organization
        : null;
    const ref = org?.parentOrganization;
    if (ref && typeof ref === "object" && ref.name) {
      setParentOrg(ref);
      return;
    }
    const parentId = ref?._id || ref;
    if (!parentId) {
      setParentOrg(null);
      return;
    }
    let active = true;
    API.get("/organizations")
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response) ? response : [];
        setParentOrg(
          list.find((item) => String(item._id) === String(parentId)) || null,
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const organization =
    typeof user.organization === "object" ? user.organization : null;
  const classmates = roster.filter((member) => member.role === "Member");
  const president = roster.find((member) => member.role === "President");
  const treasurer = roster.find((member) => member.role === "Treasurer");
  const parentName =
    parentOrg?.name || "Parent organization";

  const navItems = [
    { id: "overview", label: "Overview", icon: <DashboardIcon /> },
    {
      id: "roster",
      label: "Class Roster",
      shortLabel: "Roster",
      icon: <UserGroupIcon />,
    },
    {
      id: "officers",
      label: "Class Officers",
      shortLabel: "Officers",
      icon: <ShieldIcon className="w-4 h-4" />,
    },
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
                Class President Portal
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
                <span className="flex flex-1 items-center gap-2">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              {(user.name || "C").charAt(0)}
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
                  Class President Portal
                </p>
                <h1 className="truncate text-base sm:text-lg font-extrabold text-[#4A0E17]">
                  {organization?.name || "My Class"}
                </h1>
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {parentName}{" "}
                  <span className="mx-1 text-slate-300">•</span>{" "}
                  {organization?.college || ""}
                </p>
              </div>
            </div>
          </div>
        </header>

        <MobileTabBar
          activeItem={activeTab}
          onChange={setActiveTab}
          items={navItems}
          label="Class president portal navigation"
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
                  Welcome back, {user.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Register your classmates below so the class roster stays
                  complete. Students join with their own accounts after you
                  list them.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Classmates Listed
                  </p>
                  <p className="text-xl font-bold text-[#4A0E17]">
                    {classmates.length}
                  </p>
                </div>
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Class President
                  </p>
                  <p className="text-sm font-bold text-[#4A0E17] truncate">
                    {president?.name || user.name}
                  </p>
                </div>
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Class Treasurer
                  </p>
                  <p className="text-sm font-bold text-[#4A0E17] truncate">
                    {treasurer?.name || "Not assigned"}
                  </p>
                </div>
              </div>
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#4A0E17]/10 p-3 text-[#4A0E17]">
                    <UserGroupIcon />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#4A0E17]">
                      Build the class roster
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Add every classmate with their student details. Listed
                      students can then register their own accounts and appear
                      in organization rosters.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("roster")}
                      className="mt-4 rounded-xl bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white hover:bg-[#601520]"
                    >
                      Open Class Roster
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "roster" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <OrganizationMembers
                user={user}
                org={organization}
                view="members"
                manageMembers
                defaultProgram={organization?.program || ""}
                defaultSection={organization?.section || ""}
              />
            </div>
          )}

          {activeTab === "officers" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <OrganizationMembers
                user={user}
                org={organization}
                view="officers"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
