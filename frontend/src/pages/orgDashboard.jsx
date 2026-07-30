import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OrgDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Retrieve authenticated user & organization details from localStorage
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

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

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-50/70 border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0 p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MarSU Logo"
              className="h-7 w-auto object-contain"
            />
            <div>
              <span className="text-xs font-semibold tracking-widest text-slate-900 uppercase block">
                SOMIS
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider block">
                Org Portal
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Overview & Profile
            </button>
            <button
              onClick={() => setActiveTab("officers")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "officers"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Officer Roster
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "activities"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Activity Proposals
            </button>
            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Annual Clearance
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-900 truncate">
              {org.president}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{org.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors block cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <span className="text-xs text-slate-500 hidden md:block">
            Marinduque State University — OVPSAS Organization Portal
          </span>
          <div className="flex items-center gap-4 text-xs ml-auto">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              AY 2025–2026
            </span>
            <button
              onClick={handleLogout}
              className="md:hidden text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-light text-slate-900 tracking-tight">
                  {org.name}
                </h1>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700">
                  {org.acronym}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {org.college} • Recognized Student Organization
              </p>
            </div>
            <div>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                Status: {org.status || "Recognized"}
              </span>
            </div>
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Clearance Standing
                  </p>
                  <p className="text-xl font-light text-slate-900">
                    In Progress
                  </p>
                </div>
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Submitted Activities
                  </p>
                  <p className="text-xl font-light text-slate-900">
                    0 Submitted
                  </p>
                </div>
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Official Adviser
                  </p>
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {org.adviser || "Not Assigned"}
                  </p>
                </div>
              </div>

              {/* Organization Profile Details */}
              <div className="border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Organization Profile Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      Full Organization Name
                    </span>
                    <span className="font-medium text-slate-800">
                      {org.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      Acronym / Code
                    </span>
                    <span className="font-medium text-slate-800">
                      {org.acronym}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      College / Department
                    </span>
                    <span className="font-medium text-slate-800">
                      {org.college}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      Official Contact Email
                    </span>
                    <span className="font-medium text-slate-800">
                      {org.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      Current President / Student Leader
                    </span>
                    <span className="font-medium text-slate-800">
                      {org.president || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      Faculty Adviser
                    </span>
                    <span className="font-medium text-slate-800">
                      {org.adviser || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: OFFICERS */}
          {activeTab === "officers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Executive Officers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Listed leaders for the current academic year.
                  </p>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                  + Add Officer
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {org.president || "Student Leader"}
                    </p>
                    <p className="text-slate-500">President</p>
                  </div>
                  <span className="text-slate-400">{org.email}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {org.adviser || "Faculty Adviser"}
                    </p>
                    <p className="text-slate-500">Faculty Adviser</p>
                  </div>
                  <span className="text-slate-400">Official Adviser</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ACTIVITIES */}
          {activeTab === "activities" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Activity Proposals & Approval Requests
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submit events and activities for OVPSAS evaluation.
                  </p>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                  + Submit New Proposal
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                No activity proposals submitted yet.
              </div>
            </div>
          )}

          {/* TAB CONTENT: CLEARANCE */}
          {activeTab === "clearance" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Annual OVPSAS Clearance Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Complete required documents for year-end organization
                  recognition.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      Constitution & By-Laws
                    </p>
                    <p className="text-slate-500">Required annual submission</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-[11px] font-medium">
                    Pending Upload
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      Financial Report & Accomplishment Summary
                    </p>
                    <p className="text-slate-500">
                      Signed by Treasurer and President
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-[11px] font-medium">
                    Pending Upload
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
