import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import LogoutButton from "../component/logoutButton";
import { useToast } from "../util/toastContext";

// --- SVG ICON COMPONENTS ---
const BuildingIcon = ({ className = "w-5 h-5" }) => (
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
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7m4 0v10m4-10v10"
    />
  </svg>
);

const FileCheckIcon = ({ className = "w-5 h-5" }) => (
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

const UserGroupIcon = ({ className = "w-5 h-5" }) => (
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

const ExternalLinkIcon = ({ className = "w-4 h-4" }) => (
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
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("organizations");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await API.get("/organizations");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrg((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await API.post("/v1/organizations", newOrg);
      const savedOrg = response.data || response;

      setOrganizations((prev) => [savedOrg, ...prev]);

      setNewOrg({
        name: "",
        acronym: "",
        college: "College of Information and Computing Sciences",
        adviser: "",
        president: "",
        email: "",
      });

      showToast("Organization saved successfully!", "success");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Error saving organization",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl">
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
                OVPSAS Portal
              </span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab("organizations")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "organizations"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <BuildingIcon
                className={`w-4 h-4 ${activeTab === "organizations" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Recognized Organizations</span>
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
              <span>Clearance Approvals</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs">
              {adminName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-100 truncate">
                {adminName}
              </p>
              <p className="text-[10px] text-rose-300/70 truncate">
                {adminEmail}
              </p>
            </div>
          </div>
          <LogoutButton variant="sidebar" showConfirmModal={true} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[#4A0E17]" />
            <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider hidden sm:inline-block">
              Marinduque State University — OVPSAS Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs ml-auto">
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] font-bold tracking-tight shadow-2xs">
              AY 2025–2026
            </span>
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Recognized
                </p>
                <h3 className="text-2xl font-black text-[#4A0E17] mt-1">
                  {organizations.length}
                </h3>
              </div>
              <div className="p-3 bg-[#4A0E17]/5 rounded-xl text-[#4A0E17]">
                <BuildingIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Clearance Status
                </p>
                <h3 className="text-2xl font-black text-emerald-700 mt-1">
                  Operational
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                <FileCheckIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Advisers Assigned
                </p>
                <h3 className="text-2xl font-black text-[#8B6E10] mt-1">
                  {organizations.filter((o) => o.adviser).length}
                </h3>
              </div>
              <div className="p-3 bg-[#D4AF37]/15 rounded-xl text-[#8B6E10]">
                <UserGroupIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
                Recognized Student Organizations
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Official directory and accreditation management under OVPSAS
                guidelines.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer self-start sm:self-auto flex items-center gap-2 border border-[#B8860B]/30 active:scale-98"
            >
              <PlusIcon className="w-4 h-4 text-[#36080E]" />
              <span>Register Organization</span>
            </button>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#4A0E17]/5 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-[#4A0E17]">
              <span>Organization Directory</span>
              <span className="text-slate-400 font-normal">
                Showing {organizations.length} entry/entries
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {Array.isArray(organizations) && organizations.length > 0 ? (
                organizations.map((org) => (
                  <div
                    key={org._id || org.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#4A0E17]/[0.02] transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-[#4A0E17]">
                          {org.name}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#7A610D] font-extrabold border border-[#D4AF37]/30 tracking-wide">
                          {org.acronym}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {org.college} <br className="sm:hidden" />
                        <span className="hidden sm:inline"> • </span>
                        Adviser:{" "}
                        <span className="text-slate-700 font-medium">
                          {org.adviser || "N/A"}
                        </span>
                        <span className="mx-1">•</span>
                        President:{" "}
                        <span className="text-slate-700 font-medium">
                          {org.president || "N/A"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs self-end sm:self-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {org.status || "Active"}
                      </span>
                      <button className="px-3.5 py-2 rounded-lg border border-[#4A0E17]/20 text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition-all cursor-pointer font-semibold flex items-center gap-1.5">
                        <span>Details</span>
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                  <BuildingIcon className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-medium">
                    No registered student organizations found.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* MODAL: REGISTER ORGANIZATION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#36080E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-900/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Register Student Organization
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accredit a new student entity under OVPSAS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-[#4A0E17] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateOrganization}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#4A0E17] font-bold mb-1">
                  Organization Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Society of Information Technology Enthusiasts"
                  value={newOrg.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A0E17] font-bold mb-1">
                    Acronym / Code
                  </label>
                  <input
                    type="text"
                    name="acronym"
                    required
                    placeholder="e.g. SITE"
                    value={newOrg.acronym}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                  />
                </div>

                <div>
                  <label className="block text-[#4A0E17] font-bold mb-1">
                    College Unit
                  </label>
                  <select
                    name="college"
                    value={newOrg.college}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] bg-white truncate"
                  >
                    <option value="College of Information and Computing Sciences">
                      College of Info & Computing Sciences
                    </option>
                    <option value="College of Engineering">
                      College of Engineering
                    </option>
                    <option value="College of Business and Accountancy">
                      College of Business & Accountancy
                    </option>
                    <option value="College of Education">
                      College of Education
                    </option>
                    <option value="College of Arts and Social Sciences">
                      College of Arts & Social Sciences
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
                <label className="block text-[#4A0E17] font-bold mb-1">
                  Faculty Adviser
                </label>
                <input
                  type="text"
                  name="adviser"
                  placeholder="e.g. Dr. Jane Doe"
                  value={newOrg.adviser}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A0E17] font-bold mb-1">
                    Student Leader / President
                  </label>
                  <input
                    type="text"
                    name="president"
                    placeholder="e.g. Juan Cruz"
                    value={newOrg.president}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A0E17] font-bold mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="site@marsu.edu.ph"
                    value={newOrg.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#36080E] text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
