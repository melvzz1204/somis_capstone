import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser.name || "Administrator";
  const adminEmail = storedUser.email || "admin@marsu.edu.ph";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const pendingItems = [
    {
      id: 1,
      org: "Supreme Student Council",
      task: "Semester Clearance",
      date: "Jul 28",
    },
    {
      id: 2,
      org: "Association of Computer Studies",
      task: "Event Proposal",
      date: "Jul 27",
    },
    {
      id: 3,
      org: "Cultural Dance Troupe",
      task: "Roster Renewal",
      date: "Jul 25",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex">
      {/* MINIMALIST SIDEBAR */}
      <aside className="w-64 bg-slate-50/70 border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0 p-6">
        <div className="space-y-8">
          {/* Logo & Institution Branding */}
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
                OVPSAS Admin
              </span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("organizations")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "organizations"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Organizations
            </button>
            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Clearance
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                activeTab === "audit"
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              Audit Logs
            </button>
          </nav>
        </div>

        {/* Admin Profile & Logout */}
        <div className="pt-6 border-t border-slate-200 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-900 truncate">
              {adminName}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{adminEmail}</p>
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
        {/* Header Bar */}
        <header className="border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <img src="/logo.png" alt="MarSU Logo" className="h-6 w-auto" />
            <span className="text-xs font-bold uppercase text-slate-900">
              SOMIS
            </span>
          </div>

          <span className="text-xs text-slate-500 hidden md:block">
            Marinduque State University — OVPSAS
          </span>

          <div className="flex items-center gap-4 text-xs">
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

        {/* Dashboard Body */}
        <main className="p-8 max-w-5xl w-full mx-auto space-y-12">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-light text-slate-900 tracking-tight">
              Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Administrative portal for organization governance and clearance
              validation.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block mb-1">
                Active Orgs
              </span>
              <span className="text-3xl font-light text-slate-900">42</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">
                Pending Requests
              </span>
              <span className="text-3xl font-light text-amber-600">03</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">
                Clearances
              </span>
              <span className="text-3xl font-light text-slate-900">18</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">
                Total Students
              </span>
              <span className="text-3xl font-light text-slate-900">12,450</span>
            </div>
          </div>

          {/* Action Queue */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Pending Approvals
              </h2>
              <span className="text-xs text-slate-400">
                {pendingItems.length} items
              </span>
            </div>

            <div className="divide-y divide-slate-100 border-y border-slate-200">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.org}
                    </p>
                    <p className="text-xs text-slate-500">{item.task}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 mr-2">{item.date}</span>
                    <button className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer">
                      Approve
                    </button>
                    <button className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="pt-2 flex flex-wrap gap-3 text-xs">
            <button className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              Export Clearance PDF
            </button>
            <button className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              Organization Directory
            </button>
            <button className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              System Activity Logs
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
