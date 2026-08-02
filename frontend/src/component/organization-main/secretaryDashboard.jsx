import React, { useState, useEffect } from "react";
import API from "../../api/axios"; // Adjust path to your axios instance
import OrganizationMembers from "./OrganizationMembers"; // The roster component we built

export default function SecretaryDashboard({ user, org }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'roster' | 'minutes' | 'attendance'

  // Summary Metrics State
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalMeetings: 0,
    documentsCount: 0,
    pendingNotices: 0,
  });

  // Meeting Minutes State
  const [minutesList, setMinutesList] = useState([]);
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [minutesForm, setMinutesForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    attendeesCount: 0,
    content: "",
  });

  // Fetch Summary Data
  useEffect(() => {
    fetchDashboardStats();
    fetchMeetingMinutes();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Replace with your real endpoints as you build them
      const membersRes = await API.get("/orgmembers");
      setStats((prev) => ({
        ...prev,
        totalMembers: membersRes.data?.length || membersRes.length || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  const fetchMeetingMinutes = async () => {
    try {
      const res = await API.get("/meeting-minutes");
      setMinutesList(res.data || []);
      setStats((prev) => ({ ...prev, totalMeetings: (res.data || []).length }));
    } catch (err) {
      console.log("Meeting minutes endpoint pending or empty.");
    }
  };

  const handleAddMinutesSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/meeting-minutes", minutesForm);
      setMinutesList((prev) => [res.data?.minutes || minutesForm, ...prev]);
      setIsMinutesModalOpen(false);
      setMinutesForm({
        title: "",
        date: new Date().toISOString().split("T")[0],
        location: "",
        attendeesCount: 0,
        content: "",
      });
    } catch (err) {
      console.error("Failed to save meeting minutes:", err);
      // Local fallback for UI demo before backend endpoint is created
      setMinutesList((prev) => [{ ...minutesForm, _id: Date.now() }, ...prev]);
      setIsMinutesModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-full uppercase tracking-wider">
              Secretary Workspace
            </span>
            <span className="text-xs text-slate-400">
              {org?.name || "Student Organization"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {user?.name || "Secretary"}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization records, document meeting minutes, and update
            member rosters.
          </p>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("roster")}
            className="px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            📋 Manage Roster
          </button>
          <button
            onClick={() => setIsMinutesModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            ✍️ Log Meeting Minutes
          </button>
        </div>
      </div>

      {/* METRIC CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Active Members</p>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {stats.totalMembers}
            </h2>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
              Registered
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Meetings Logged</p>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {minutesList.length}
            </h2>
            <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
              Minutes Saved
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">
            Official Documents
          </p>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {stats.documentsCount || 12}
            </h2>
            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
              Archived
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500">Attendance Rate</p>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900">88%</h2>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
              Avg. Turnout
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-medium text-slate-500">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent hover:text-slate-800"
          }`}
        >
          Overview & Activity
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "roster"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent hover:text-slate-800"
          }`}
        >
          Executive Roster & Members
        </button>
        <button
          onClick={() => setActiveTab("minutes")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "minutes"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent hover:text-slate-800"
          }`}
        >
          Meeting Minutes (MOM)
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Log */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Secretary Activity Feed
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md text-xs">
                  📝
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-800">
                    Logged General Assembly Meeting Minutes
                  </p>
                  <p className="text-slate-500">
                    Recorded attendance and key resolutions.
                  </p>
                  <span className="text-[10px] text-slate-400">
                    2 hours ago
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md text-xs">
                  👤
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-800">
                    Updated Executive Roster Details
                  </p>
                  <p className="text-slate-500">
                    Added ID numbers and year levels for new officers.
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Yesterday at 4:30 PM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Upcoming Duties
            </h3>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Prepare Minutes for Executive Board Meeting
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Verify Member ID Numbers for Accreditation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Send Attendance Summary to Adviser
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MEMBER ROSTER */}
      {activeTab === "roster" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <OrganizationMembers user={user} org={org} />
        </div>
      )}

      {/* TAB CONTENT 3: MEETING MINUTES LIST */}
      {activeTab === "minutes" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Meeting Minutes Repository
              </h3>
              <p className="text-xs text-slate-500">
                Archived records of proceedings, resolutions, and discussions.
              </p>
            </div>
            <button
              onClick={() => setIsMinutesModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + Add Minutes
            </button>
          </div>

          {minutesList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No meeting minutes recorded yet. Click "+ Add Minutes" to log a
              meeting.
            </p>
          ) : (
            <div className="space-y-3">
              {minutesList.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50/50 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {item.title}
                    </h4>
                    <span className="text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                    <span>📍 {item.location || "Online"}</span>
                    <span>👥 Attendees: {item.attendeesCount || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: RECORD MEETING MINUTES */}
      {isMinutesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Record Meeting Minutes
              </h3>
              <button
                onClick={() => setIsMinutesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddMinutesSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Meeting Title / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Regular Executive Board Meeting"
                  value={minutesForm.title}
                  onChange={(e) =>
                    setMinutesForm({ ...minutesForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={minutesForm.date}
                    onChange={(e) =>
                      setMinutesForm({ ...minutesForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AVR Room / Zoom"
                    value={minutesForm.location}
                    onChange={(e) =>
                      setMinutesForm({
                        ...minutesForm,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Meeting Content / Key Resolutions
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Summarize key discussions, motions passed, and action items..."
                  value={minutesForm.content}
                  onChange={(e) =>
                    setMinutesForm({ ...minutesForm, content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMinutesModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Save Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
