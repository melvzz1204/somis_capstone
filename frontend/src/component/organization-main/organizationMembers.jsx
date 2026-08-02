import React, { useState, useEffect } from "react";
import API from "../../api/axios"; // Adjust path if needed

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

export default function OrganizationMembers({ user, org }) {
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
      } else {
        const response = await API.post("/orgmembers", payload, config);
        const created = response.data?.member || response.member || response;

        setOfficers((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          "Failed to save officer details.",
      );
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

      // Update local roster list to reflect account creation
      setOfficers((prev) =>
        prev.map((off) =>
          off._id === selectedMemberId ? { ...off, hasAccount: true } : off,
        ),
      );
    } catch (err) {
      console.error("Account creation error:", err);
      setAccountModalError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create user account.",
      );
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
    <div className="space-y-4">
      {/* HEADER WITH ACTION BUTTONS */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Executive Officers & Members
          </h3>
          <p className="text-xs text-slate-500">
            Listed leaders and members for the current academic year.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            + Add Officer
          </button>
          <button
            onClick={handleOpenCreateAccount}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            + Create Account
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {errorMessage}
        </div>
      )}

      {/* ROSTER TABLE / LIST */}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading roster...
          </div>
        ) : officers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No officers or members registered yet.
          </div>
        ) : (
          officers.map((officer) => {
            const avatarUrl = getAvatarSrc(officer.avatar);

            return (
              <div
                key={officer._id || officer.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={officer.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center border border-slate-200 uppercase">
                      {officer.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {officer.name}
                      </p>
                      {officer.hasAccount && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium rounded-md">
                          Account Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500">
                      {officer.role}{" "}
                      {officer.section ? `• ${officer.section}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{officer.email}</span>

                  {/* ACTIONS: EDIT & DELETE */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(officer)}
                      className="px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors cursor-pointer text-[11px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOfficer(officer._id)}
                      className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors cursor-pointer text-[11px]"
                    >
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingOfficer
                  ? "Edit Officer Account"
                  : "Add Officer / Member"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Avatar Upload Field */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">Photo</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Profile Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan Cruz"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. juan@marsu.edu.ph"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Position / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
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
                  <label className="block font-medium text-slate-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20-12345"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, idNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Year Level & Section Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Year Level
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BSIT 3-A"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Provision Officer User Account
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {accountModalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {accountModalError}
              </div>
            )}

            {accountModalSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                {accountModalSuccess}
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-4 text-xs">
              {/* Select Officer Dropdown */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Select Officer / Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="text-slate-700 font-medium">
                    Role Position:{" "}
                    <span className="text-indigo-600">
                      {selectedOfficerObj.role}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Login Email: {selectedOfficerObj.email}
                  </p>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Assign Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount || !selectedMemberId}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
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
