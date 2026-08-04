import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OrganizationMembers from "../component/organization-main/organizationMembers";
import LogoutButton from "../component/logoutButton";

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

const AcademicCapIcon = ({ className = "w-5 h-5" }) => (
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
      d="M12 14l9-5-9-5-9 5 9 5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
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

export default function OrgDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Retrieve authenticated user & organization details from localStorage
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        // Redirect Secretary to their specialized dashboard
        if (parsedUser?.role === "secretary") {
          navigate("/secretary-dashboard", { replace: true });
          return;
        }

        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, [navigate]);

  // Safely extract organization data
  const org = user?.organization || {
    name: "Student Organization",
    acronym: "ORG",
    college: "College of Information and Computing Sciences",
    adviser: "N/A",
    president: user?.name || "Student Leader",
    email: user?.email || "org@marsu.edu.ph",
    status: "Active",
  };

  // Prevent flash of Org Admin content while redirecting
  if (user?.role === "secretary") {
    return null;
  }

  return (
    /* 60% DOMINANT: Off-White Canvas Background */
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* 30% SECONDARY: Deep Royal Burgundy Sidebar */}
      <aside className="w-64 bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl">
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
                Org Leader Portal
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
            </button>

            <button
              onClick={() => setActiveTab("activities")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "activities"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarEventIcon
                className={`w-4 h-4 ${activeTab === "activities" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Activity Proposals</span>
            </button>

            <button
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
            </button>
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
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[#4A0E17]" />
            <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider hidden sm:inline-block">
              Marinduque State University — OVPSAS Organization Portal
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs ml-auto">
            {/* 10% Gold Accent Badge */}
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] font-bold tracking-tight shadow-2xs">
              AY 2025–2026
            </span>
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Organization Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
                  {org.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 font-extrabold text-[#7A610D] border border-[#D4AF37]/30 tracking-wide">
                  {org.acronym}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <AcademicCapIcon className="w-4 h-4 text-slate-400 inline" />
                <span>{org.college}</span>
                <span>•</span>
                <span className="font-medium text-slate-600">
                  Recognized Student organization
                </span>
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Status: {org.status || "Recognized"}
              </span>
            </div>
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
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

              {/* Detail Profile Grid */}
              <div className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#4A0E17]/5 border-b border-slate-200/80 font-bold text-xs text-[#4A0E17]">
                  Organization Profile Summary
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

          {/* TAB CONTENT: ACTIVITIES */}
          {activeTab === "activities" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Activity Proposals & Approval Requests
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submit upcoming events and campus initiatives for OVPSAS
                    evaluation.
                  </p>
                </div>

                {/* 10% Gold Accent Button */}
                <button className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 border border-[#B8860B]/30 self-start sm:self-auto">
                  <PlusIcon className="w-4 h-4 text-[#36080E]" />
                  <span>Submit New Proposal</span>
                </button>
              </div>

              <div className="border border-slate-200/80 bg-white rounded-2xl p-12 text-center text-xs text-slate-400 space-y-3">
                <CalendarEventIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-medium">
                  No activity proposals submitted yet for AY 2025–2026.
                </p>
              </div>
            </div>
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
    </div>
  );
}
