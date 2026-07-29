import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Get user profile from localStorage or use fallback
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser.name || "OVPSAS Administrator";
  const adminEmail = storedUser.email || "admin@marsu.edu.ph";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Mock data for OVPSAS administrative overview
  const stats = [
    {
      title: "Active Organizations",
      value: "42",
      change: "+3 this term",
      icon: "orgs",
    },
    {
      title: "Pending Approvals",
      value: "7",
      change: "Requires action",
      icon: "pending",
      alert: true,
    },
    {
      title: "Clearance Requests",
      value: "18",
      change: "12 reviewed",
      icon: "clearance",
    },
    {
      title: "Total Registered Students",
      value: "12,450",
      change: "Across all campuses",
      icon: "students",
    },
  ];

  const pendingApprovals = [
    {
      id: 1,
      org: "Supreme Student Council (SSC)",
      type: "Semester Clearance",
      date: "Jul 28, 2026",
      status: "Pending Review",
    },
    {
      id: 2,
      org: "Association of Computer Studies Students",
      type: "Event Proposal: CodeFest 2026",
      date: "Jul 27, 2026",
      status: "Pending Review",
    },
    {
      id: 3,
      org: "MarSU Cultural Dance Troupe",
      type: "Annual Roster Renewal",
      date: "Jul 25, 2026",
      status: "Under Audit",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#141414] border-r border-[#660033] flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo Branding */}
          <div className="p-6 border-b border-[#660033] flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center font-bold text-[#FFD700] text-lg">
              <img
                src="/logo.png"
                alt="MarSU Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wider leading-none">
                SOMIS ADMIN
              </h1>
              <span className="text-[10px] font-bold text-[#FFD700] tracking-widest uppercase">
                OVPSAS Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 font-bold"
                  : "text-slate-300 hover:bg-[#1A000D] hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
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
              Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab("organizations")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                activeTab === "organizations"
                  ? "bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 font-bold"
                  : "text-slate-300 hover:bg-[#1A000D] hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Organizations
            </button>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 font-bold"
                  : "text-slate-300 hover:bg-[#1A000D] hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
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
              OVPSAS Clearance
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                activeTab === "reports"
                  ? "bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 font-bold"
                  : "text-slate-300 hover:bg-[#1A000D] hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Audit Reports
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#660033]">
          <div className="bg-[#0A0A0A] p-3 rounded-xl border border-[#660033] mb-3">
            <p className="text-xs font-bold text-white truncate">{adminName}</p>
            <p className="text-[10px] text-slate-400 truncate">{adminEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-red-400 bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-[#141414]/90 backdrop-blur-md border-b border-[#660033] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Office of Student Affairs (OVPSAS)
            </h2>
            <p className="text-xs text-slate-400">
              Marinduque State University - SOMIS Portal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
              Academic Term 2025-2026
            </span>
            <button
              onClick={handleLogout}
              className="md:hidden px-3 py-1.5 rounded-lg font-bold text-xs text-red-400 bg-red-950/40 border border-red-800/40"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-8">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#141414] border border-[#660033] rounded-2xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-medium text-slate-400">
                    {stat.title}
                  </span>
                  {stat.alert && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FFD700] animate-pulse" />
                  )}
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-[11px] font-semibold text-[#FFD700]">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* PENDING APPROVALS QUEUE */}
          <section className="bg-[#141414] border border-[#660033] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#660033] pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Pending Clearance & Action Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Submissions requiring direct OVPSAS administrative approval
                </p>
              </div>
              <button className="text-xs font-bold text-[#FFD700] hover:underline self-start sm:self-auto cursor-pointer">
                View All Pending &rarr;
              </button>
            </div>

            {/* Approvals Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-[#0A0A0A] text-[#FFD700] border-b border-[#660033]">
                  <tr>
                    <th className="px-4 py-3">Organization Name</th>
                    <th className="px-4 py-3">Submission Type</th>
                    <th className="px-4 py-3">Date Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#660033]/50">
                  {pendingApprovals.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#33001A]/30 transition-colors"
                    >
                      <td className="px-4 py-4 font-bold text-white">
                        {item.org}
                      </td>
                      <td className="px-4 py-4 text-xs">{item.type}</td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {item.date}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <button className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-xs font-bold hover:bg-[#FFE033] transition-all cursor-pointer">
                          Approve
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-[#33001A] text-slate-300 border border-[#660033] text-xs font-medium hover:text-white transition-all cursor-pointer">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* QUICK SYSTEM ACTIONS */}
          <section className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#141414] border border-[#660033] rounded-2xl p-6">
              <h4 className="font-bold text-white mb-2">
                Generate End-of-Semester Clearance
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Compile institutional clearance certificates for all registered
                student leaders.
              </p>
              <button className="w-full py-2.5 rounded-xl text-xs font-bold text-black bg-[#FFD700] hover:bg-[#FFE033] transition-all cursor-pointer">
                Export Clearance PDF
              </button>
            </div>

            <div className="bg-[#141414] border border-[#660033] rounded-2xl p-6">
              <h4 className="font-bold text-white mb-2">
                Organization Roster Directory
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Access and audit verified member lists and officer designations.
              </p>
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#33001A] border border-[#660033] hover:border-[#FFD700] transition-all cursor-pointer">
                Browse Directory
              </button>
            </div>

            <div className="bg-[#141414] border border-[#660033] rounded-2xl p-6">
              <h4 className="font-bold text-white mb-2">System Audit Logs</h4>
              <p className="text-xs text-slate-400 mb-4">
                Track all administrative approvals, modifications, and clearance
                sign-offs.
              </p>
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#33001A] border border-[#660033] hover:border-[#FFD700] transition-all cursor-pointer">
                View Activity Logs
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
