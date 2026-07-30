import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("organizations");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  // Form state for creating a new organization
  const [newOrg, setNewOrg] = useState({
    name: "",
    acronym: "",
    college: "College of Information and Computing Sciences",
    adviser: "",
    president: "",
    email: "",
  });

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser.name || "Administrator";
  const adminEmail = storedUser.email || "admin@marsu.edu.ph";

  // Fetch registered organizations from backend
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await API.get("/v1/organizations");
        // Handle both unwrapped response or standard axios object
        const orgsList = Array.isArray(response) ? response : response.data;
        if (Array.isArray(orgsList)) {
          setOrganizations(orgsList);
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      }
    };

    fetchOrganizations();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrg((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/v1/organizations", newOrg);
      // Handle both unwrapped response or standard axios object
      const savedOrg = response.data || response;

      // Update state with newly registered organization
      setOrganizations((prev) => [savedOrg, ...prev]);

      // Reset form & close modal
      setNewOrg({
        name: "",
        acronym: "",
        college: "College of Information and Computing Sciences",
        adviser: "",
        president: "",
        email: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Error saving organization",
      );
    }
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
                OVPSAS Admin
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-medium">
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
          </nav>
        </div>

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
        <header className="border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <span className="text-xs text-slate-500 hidden md:block">
            Marinduque State University — OVPSAS
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
              <h1 className="text-2xl font-light text-slate-900 tracking-tight">
                Student Organizations
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Register and manage recognized student entities under OVPSAS.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
            >
              + Register Organization
            </button>
          </div>

          <section className="space-y-4">
            <div className="divide-y divide-slate-100 border-y border-slate-200">
              {Array.isArray(organizations) && organizations.length > 0 ? (
                organizations.map((org) => (
                  <div
                    key={org._id || org.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {org.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                          {org.acronym}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {org.college} • Adviser: {org.adviser || "N/A"} •
                        Leader: {org.president || "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium">
                        {org.status || "Active"}
                      </span>
                      <button className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No registered organizations found.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* REGISTER ORGANIZATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-lg font-light text-slate-900">
                Register Student Organization
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter details to add a new recognized student organization.
              </p>
            </div>

            <form
              onSubmit={handleCreateOrganization}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Society of Information Technology Enthusiasts"
                  value={newOrg.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Acronym / Code
                  </label>
                  <input
                    type="text"
                    name="acronym"
                    required
                    placeholder="e.g. SITE"
                    value={newOrg.acronym}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    College
                  </label>
                  <select
                    name="college"
                    value={newOrg.college}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-white truncate"
                  >
                    <option value="College of Information and Computing Sciences">
                      College of Information and Computing Sciences
                    </option>
                    <option value="College of Engineering">
                      College of Engineering
                    </option>
                    <option value="College of Business and Accountancy">
                      College of Business and Accountancy
                    </option>
                    <option value="College of Education">
                      College of Education
                    </option>
                    <option value="College of Arts and Social Sciences">
                      College of Arts and Social Sciences
                    </option>
                    <option value="College of Allied Health Sciences">
                      College of Allied Health Sciences
                    </option>
                    <option value="College of Industrial Technology">
                      College of Industrial Technology
                    </option>
                    <option value="University-Wide">University-Wide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Faculty Adviser
                </label>
                <input
                  type="text"
                  name="adviser"
                  placeholder="e.g. Dr. Jane Doe"
                  value={newOrg.adviser}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Student Leader / President
                  </label>
                  <input
                    type="text"
                    name="president"
                    placeholder="e.g. Juan Cruz"
                    value={newOrg.president}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="site@marsu.edu.ph"
                    value={newOrg.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
