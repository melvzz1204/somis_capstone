import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext"; // 👈 1. IMPORT YOUR TOAST HOOK (adjust path if needed)

const OFFICER_ROLES = [
  "Vice-President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Business Manager",
  "P.I.O",
  "Sgt. & Arms",
  "Muse",
  "Escort",
  "Member",
];

const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace("/api", "");

// Inline SVG Icons
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

const KeyIcon = ({ className = "w-4 h-4" }) => (
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
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

const EditIcon = ({ className = "w-3.5 h-3.5" }) => (
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
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = ({ className = "w-3.5 h-3.5" }) => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ShieldCheckIcon = ({ className = "w-3 h-3" }) => (
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

export default function OrganizationMembers({ user, org }) {
  // 👈 2. DESTRUCTURE SHOWTOAST FROM YOUR CONTEXT HOOK
  const { showToast } = useToast();

  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Add/Edit Member Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    idNumber: "",
    name: "",
    email: "",
    birthday: "",
    year: "1st Year",
    section: "",
    role: "Member",
  });

  // --- CREATE ACCOUNT MODAL STATES ---
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountModalError, setAccountModalError] = useState("");
  const [accountModalSuccess, setAccountModalSuccess] = useState("");

  // Fetch Roster
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await API.get("/orgmembers");
      setOfficers(data);
      if (data && data.length > 0) {
        setSelectedMemberId(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setErrorMessage("Failed to load officer roster.");
    } finally {
      setIsLoading(false);
    }
  };

  // Open Modal for Creating Member
  const handleOpenAddModal = () => {
    setEditingOfficer(null);
    setFormData({
      idNumber: "",
      name: "",
      email: "",
      birthday: "",
      year: "1st Year",
      section: "",
      role: "Member",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsModalOpen(true);
  };

  // Open Modal for Editing Member
  const handleOpenEditModal = (officer) => {
    setEditingOfficer(officer);
    setFormData({
      idNumber: officer.idNumber || "",
      name: officer.name || "",
      email: officer.email || "",
      birthday: officer.birthday ? officer.birthday.split("T")[0] : "",
      year: officer.year || "1st Year",
      section: officer.section || "",
      role: officer.role || "Member",
    });
    setAvatarFile(null);
    setAvatarPreview(officer.avatar ? getAvatarSrc(officer.avatar) : null);
    setIsModalOpen(true);
  };

  // --- OPEN CREATE ACCOUNT MODAL ---
  const handleOpenCreateAccount = () => {
    setAccountPassword("");
    setAccountModalError("");
    setAccountModalSuccess("");
    if (officers.length > 0 && !selectedMemberId) {
      setSelectedMemberId(officers[0]._id);
    }
    setIsAccountModalOpen(true);
  };

  // Handle Local File Selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Submit Handler for Member Add/Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("email", formData.email.trim());
      payload.append("role", formData.role || "Member");
      payload.append("idNumber", formData.idNumber || "");
      payload.append("birthday", formData.birthday || "");
      payload.append("year", formData.year || "1st Year");
      payload.append("section", formData.section || "");

      const orgId = org?._id || user?.organization?._id || user?._id;
      if (orgId) {
        payload.append("organization", orgId);
      }

      if (avatarFile) {
        payload.append("avatar", avatarFile);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingOfficer) {
        const response = await API.put(
          `/orgmembers/${editingOfficer._id}`,
          payload,
          config,
        );
        const updated = response.data?.member || response.member || response;

        setOfficers((prev) =>
          prev.map((off) => (off._id === editingOfficer._id ? updated : off)),
        );

        // 👈 3. TRIGGER TOAST FOR EDIT
        showToast?.("Officer updated successfully!", "success");
      } else {
        const response = await API.post("/orgmembers", payload, config);
        const created = response.data?.member || response.member || response;

        setOfficers((prev) => [created, ...prev]);

        // 👈 3. TRIGGER TOAST FOR NEW
        showToast?.("New officer saved successfully!", "success");
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Submit error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to save officer details.";

      setErrorMessage(errMsg);
      // 👈 OPTIONAL: Trigger error toast as well
      showToast?.(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUBMIT HANDLER FOR CREATING USER ACCOUNT ---
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !accountPassword) return;

    setIsCreatingAccount(true);
    setAccountModalError("");
    setAccountModalSuccess("");

    try {
      const response = await API.post(
        `/orgmembers/${selectedMemberId}/create-account`,
        { password: accountPassword },
      );

      const successMsg =
        response.data?.message ||
        response.message ||
        "Login account created successfully!";

      setAccountModalSuccess(successMsg);
      setAccountPassword("");

      // Trigger Toast for Account Provisioning
      showToast?.(successMsg, "success");

      // Update local roster list to reflect account creation
      setOfficers((prev) =>
        prev.map((off) =>
          off._id === selectedMemberId ? { ...off, hasAccount: true } : off,
        ),
      );
    } catch (err) {
      console.error("Account creation error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create user account.";
      setAccountModalError(errMsg);
      showToast?.(errMsg, "error");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Delete Member
  const handleDeleteOfficer = async (id) => {
    if (!window.confirm("Are you sure you want to remove this officer?"))
      return;

    try {
      await API.delete(`/orgmembers/${id}`);
      setOfficers((prev) => prev.filter((officer) => officer._id !== id));
      showToast?.("Officer removed successfully.", "info");
    } catch (err) {
      console.error("Failed to delete member:", err);
      alert(err.message || "Failed to remove member.");
    }
  };

  const getAvatarSrc = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http") || avatarPath.startsWith("blob:")) {
      return avatarPath;
    }
    return `${BACKEND_URL}${avatarPath}`;
  };

  const selectedOfficerObj = officers.find((o) => o._id === selectedMemberId);

  return (
    <div className="space-y-5">
      {/* HEADER WITH ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#4A0E17]">
            Executive Officers & Members
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Listed leaders and members registered for the current academic year.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-[#4A0E17] hover:bg-[#36080E] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlusIcon className="w-4 h-4" />
            Add Officer
          </button>
          <button
            onClick={handleOpenCreateAccount}
            className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-sm border border-[#B8860B]/30 flex items-center gap-1.5 cursor-pointer"
          >
            <KeyIcon className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* ROSTER TABLE / LIST */}
      <div className="border border-slate-200/80 rounded-2xl divide-y divide-slate-100 text-xs bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            Loading roster...
          </div>
        ) : officers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            No officers or members registered yet.
          </div>
        ) : (
          officers.map((officer) => {
            const avatarUrl = getAvatarSrc(officer.avatar);

            return (
              <div
                key={officer._id || officer.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  {/* 🖼️ LARGER RECTANGULAR AVATAR */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={officer.name}
                      className="w-14 h-16 rounded-xl object-cover border border-slate-200/90 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-16 rounded-xl bg-[#4A0E17]/10 text-[#4A0E17] font-extrabold text-base flex items-center justify-center border border-[#4A0E17]/20 uppercase shrink-0 shadow-xs">
                      {officer.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">
                        {officer.name}
                      </p>
                      {officer.hasAccount && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                          <ShieldCheckIcon className="w-3 h-3" />
                          Account Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium mt-0.5">
                      <span className="text-[#4A0E17] font-semibold">
                        {officer.role}
                      </span>
                      {officer.section ? ` • ${officer.section}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-slate-500 font-medium text-right">
                    {officer.email}
                  </span>

                  {/* ACTIONS: EDIT & DELETE */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(officer)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOfficer(officer._id)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 rounded-lg transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD / EDIT OFFICER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200/80 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#4A0E17]/10 border border-[#4A0E17]/20 rounded-xl text-[#4A0E17]">
                  <UserPlusIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  {editingOfficer
                    ? "Edit Officer Details"
                    : "Add Officer / Member"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* 🖼️ LARGER RECTANGULAR AVATAR PREVIEW IN MODAL */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-16 h-20 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 text-[10px] font-bold">
                      PHOTO
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profile Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#4A0E17]/10 file:text-[#4A0E17] hover:file:bg-[#4A0E17]/20 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surname, Firstname, M.I"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. juan@marsu.edu.ph"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Position / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
                >
                  {OFFICER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* ID Number & Birthday Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20-12345"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, idNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Year Level & Section Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Year Level
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BSIT 3-A"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#36080E] text-white font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingOfficer
                      ? "Update Officer"
                      : "Save Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE LOGIN ACCOUNT FOR AN OFFICER */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200/80 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-xl text-[#7A610D]">
                  <KeyIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  Provision Officer User Account
                </h3>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {accountModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {accountModalError}
              </div>
            )}

            {accountModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                {accountModalSuccess}
              </div>
            )}

            <form
              onSubmit={handleAccountSubmit}
              className="space-y-3.5 text-xs"
            >
              {/* Select Officer Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Officer / Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
                >
                  {officers.map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.name} — {officer.role} ({officer.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Officer Summary */}
              {selectedOfficerObj && (
                <div className="p-3 bg-[#4A0E17]/5 border border-[#4A0E17]/15 rounded-xl space-y-1">
                  <p className="text-slate-800 font-bold">
                    Role Position:{" "}
                    <span className="text-[#4A0E17] underline decoration-[#D4AF37]">
                      {selectedOfficerObj.role}
                    </span>
                  </p>
                  <p className="text-slate-600 font-medium">
                    Login Email:{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedOfficerObj.email}
                    </span>
                  </p>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount || !selectedMemberId}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm border border-[#B8860B]/30 cursor-pointer"
                >
                  {isCreatingAccount ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
