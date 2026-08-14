import { useState, useEffect } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";
import {
  applySectionPrefix,
  getSectionPrefix,
} from "../../util/academicSection";

const OFFICER_ROLES = [
  "Faculty Adviser",
  "Department Dean",
  "Vice-President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Business Manager",
  "P.I.O",
  "Sgt. & Arms",
  "Muse",
  "Escort",
];
const getRootBackendUrl = () => {
  try {
    const rawUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
};
const BACKEND_URL = getRootBackendUrl();

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

const MailIcon = ({ className = "w-4 h-4" }) => (
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
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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

export default function OrganizationMembers({ user, org, view = "officers" }) {
  const { showToast } = useToast();
  const isMemberDirectory = view === "members";

  const [officers, setOfficers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [programError, setProgramError] = useState("");

  // Add/Edit Member Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    idNumber: "",
    name: "",
    surname: "",
    firstName: "",
    middleInitial: "",
    suffix: "",
    email: "",
    birthday: "",
    year: "1st Year",
    program: "",
    section: "",
    role: OFFICER_ROLES[0],
  });

  // --- SEND INVITATION EMAIL MODAL STATES ---
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [accountModalError, setAccountModalError] = useState("");
  const [accountModalSuccess, setAccountModalSuccess] = useState("");

  async function fetchMembers() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await API.get("/orgmembers");
      const roster = Array.isArray(data) ? data : [];
      const filteredRoster = roster.filter((member) =>
        isMemberDirectory ? member.role === "Member" : member.role !== "Member",
      );

      setOfficers(filteredRoster);
      setSelectedMemberId(filteredRoster[0]?._id || "");
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setErrorMessage(
        err.message ||
          (isMemberDirectory
            ? "Failed to load organization members."
            : "Failed to load officer roster."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPrograms(collegeName) {
    setIsLoadingPrograms(true);
    setProgramError("");

    try {
      const colleges = await API.get("/colleges");
      const organizationCollege = String(collegeName || "")
        .trim()
        .toLowerCase();
      const matchedCollege = Array.isArray(colleges)
        ? colleges.find(
            (college) =>
              String(college.name || "")
                .trim()
                .toLowerCase() === organizationCollege,
          )
        : null;

      setPrograms(matchedCollege?.programs || []);
      if (!matchedCollege) {
        setProgramError(
          "No OVPSAS program catalog was found for this organization's college.",
        );
      }
    } catch (err) {
      console.error("Failed to fetch college programs:", err);
      setPrograms([]);
      setProgramError(err.message || "Failed to load OVPSAS programs.");
    } finally {
      setIsLoadingPrograms(false);
    }
  }

  // Fetch roster and the OVPSAS-maintained academic catalog.
  useEffect(() => {
    const dataRequest = window.setTimeout(() => {
      fetchMembers();
      if (!isMemberDirectory) fetchPrograms(org?.college);
    }, 0);

    return () => window.clearTimeout(dataRequest);
  }, [isMemberDirectory, org?.college]);

  // Open Modal for Creating Officer
  const handleOpenAddModal = () => {
    setEditingOfficer(null);
    setFormData({
      idNumber: "",
      name: "",
      surname: "",
      firstName: "",
      middleInitial: "",
      suffix: "",
      email: "",
      birthday: "",
      year: "1st Year",
      program: "",
      section: "",
      role: OFFICER_ROLES[0],
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsModalOpen(true);
  };

  // Open Modal for Editing Member
  const handleOpenEditModal = (officer) => {
    setEditingOfficer(officer);
    const rawLegacyName = String(officer.name || "").trim();
    const legacyNameParts = rawLegacyName.split(",").map((part) => part.trim());
    const spaceSeparatedName = rawLegacyName.split(/\s+/).filter(Boolean);
    const legacySurname = rawLegacyName.includes(",")
      ? legacyNameParts[0] || ""
      : spaceSeparatedName.at(-1) || "";
    const legacyGivenParts = (
      rawLegacyName.includes(",")
        ? legacyNameParts[1] || ""
        : spaceSeparatedName.slice(0, -1).join(" ")
    )
      .split(" ")
      .filter(Boolean);
    const legacyMiddleInitial =
      legacyGivenParts.find((part) => /^\w\.$/.test(part)) || "";
    const legacyFirstName = legacyGivenParts
      .filter((part) => part !== legacyMiddleInitial)
      .join(" ");

    setFormData({
      idNumber: officer.idNumber || "",
      name: officer.name || "",
      surname: officer.surname || legacySurname,
      firstName: officer.firstName || legacyFirstName,
      middleInitial: officer.middleInitial || legacyMiddleInitial,
      suffix: officer.suffix || "",
      email: officer.email || "",
      birthday: officer.birthday ? officer.birthday.split("T")[0] : "",
      year: officer.year || "1st Year",
      program: officer.program || "",
      section: officer.section || "",
      role: officer.role || OFFICER_ROLES[0],
    });
    setAvatarFile(null);
    setAvatarPreview(officer.avatar ? getAvatarSrc(officer.avatar) : null);
    setIsModalOpen(true);
  };

  // --- OPEN SEND INVITE MODAL ---
  const handleOpenCreateAccount = () => {
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
    if (
      !formData.surname.trim() ||
      !formData.firstName.trim() ||
      !formData.email.trim()
    )
      return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const isFacultySignatory = [
        "Faculty Adviser",
        "Department Dean",
      ].includes(formData.role);
      const payload = new FormData();
      payload.append("surname", formData.surname.trim());
      payload.append("firstName", formData.firstName.trim());
      payload.append("middleInitial", formData.middleInitial.trim());
      payload.append("suffix", formData.suffix.trim());
      payload.append("email", formData.email.trim());
      payload.append("role", formData.role || OFFICER_ROLES[0]);
      payload.append(
        "idNumber",
        isFacultySignatory ? "" : formData.idNumber || "",
      );
      payload.append(
        "birthday",
        isFacultySignatory ? "" : formData.birthday || "",
      );
      payload.append(
        "year",
        isFacultySignatory ? "" : formData.year || "1st Year",
      );
      payload.append(
        "program",
        isFacultySignatory ? "" : formData.program || "",
      );
      payload.append(
        "section",
        isFacultySignatory ? "" : formData.section || "",
      );

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

        showToast?.("Officer updated successfully!", "success");
      } else {
        const response = await API.post("/orgmembers", payload, config);
        const created = response.data?.member || response.member || response;

        setOfficers((prev) => [created, ...prev]);

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
      showToast?.(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUBMIT HANDLER FOR SENDING ACCOUNT SETUP INVITATION EMAIL ---
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    setIsSendingInvite(true);
    setAccountModalError("");
    setAccountModalSuccess("");

    try {
      // Calls backend endpoint to generate setupToken & send invitation email
      const response = await API.post(
        `/orgmembers/${selectedMemberId}/send-invite`,
      );

      const successMsg =
        response.data?.message ||
        response.message ||
        "Account activation link emailed successfully!";

      setAccountModalSuccess(successMsg);
      showToast?.(successMsg, "success");
    } catch (err) {
      console.error("Invite sending error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to send invitation email.";
      setAccountModalError(errMsg);
      showToast?.(errMsg, "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Delete Member
  const handleDeleteOfficer = async (id) => {
    if (!window.confirm("Are you sure you want to remove this officer?"))
      return;

    try {
      await API.delete(`/orgmembers/${id}`);
      setOfficers((prev) => prev.filter((officer) => officer._id !== id));
      showToast?.("Officer removed successfully.", "success");
    } catch (err) {
      console.error("Failed to delete member:", err);
      showToast?.(err.message || "Failed to remove member.", "error");
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
  const isEditingPresident = editingOfficer?.role === "President";
  const isFacultySignatory = ["Faculty Adviser", "Department Dean"].includes(
    formData.role,
  );
  const signatoryLabel =
    formData.role === "Department Dean" ? "Dean" : "Adviser";

  return (
    <div className="space-y-5">
      {/* HEADER WITH ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#4A0E17]">
            {isMemberDirectory ? "Organization Members" : "Executive Officers"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isMemberDirectory
              ? "Regular student members registered under this organization."
              : "Organization officers registered for the current academic year."}
          </p>
        </div>

        {!isMemberDirectory && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#4A0E17] hover:bg-[#601520] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlusIcon className="w-4 h-4" />
              Add Officer
            </button>
            <button
              onClick={handleOpenCreateAccount}
              className="px-3.5 py-2 border border-[#4A0E17]/30 bg-white hover:bg-[#4A0E17]/5 text-[#4A0E17] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <MailIcon className="w-4 h-4" />
              Send Officer Invite
            </button>
          </div>
        )}
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
            {isMemberDirectory
              ? "No regular organization members registered yet."
              : "No organization officers registered yet."}
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
                      {!isMemberDirectory && officer.hasAccount && (
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

                  {!isMemberDirectory && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(officer)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                      >
                        <EditIcon />
                        Edit
                      </button>
                      {officer.role !== "President" && (
                        <button
                          onClick={() => handleDeleteOfficer(officer._id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 rounded-lg transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD / EDIT OFFICER */}
      {!isMemberDirectory && isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#4A0E17]/10 border border-[#4A0E17]/20 rounded-xl text-[#4A0E17]">
                  <UserPlusIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  {editingOfficer
                    ? `Edit ${isFacultySignatory ? signatoryLabel : "Officer"} Details`
                    : `Add ${isFacultySignatory ? signatoryLabel : "Officer"}`}
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
                  Position / Role
                </label>
                <select
                  value={formData.role}
                  disabled={isEditingPresident}
                  onChange={(e) => {
                    const role = e.target.value;
                    setFormData({
                      ...formData,
                      role,
                      ...(["Faculty Adviser", "Department Dean"].includes(role)
                        ? {
                            idNumber: "",
                            birthday: "",
                            year: "",
                            program: "",
                            section: "",
                          }
                        : { year: formData.year || "1st Year" }),
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {isEditingPresident && (
                    <option value="President">President</option>
                  )}
                  {OFFICER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {isEditingPresident && (
                  <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                    Complete the president's name. This full name will be used
                    as the digital signature on proposal decisions.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    ["surname", "Surname", "e.g. Dela Cruz", true],
                    ["firstName", "First Name", "e.g. Juan", true],
                    ["middleInitial", "M.I.", "e.g. P.", false],
                    ["suffix", "Suffix", "e.g. Jr.", false],
                  ].map(([field, label, placeholder, required]) => (
                    <label key={field} className="block">
                      <span className="block mb-1 font-bold text-slate-700">
                        {label}{" "}
                        {required && <span className="text-rose-600">*</span>}
                      </span>
                      <input
                        type="text"
                        required={required}
                        readOnly={isEditingPresident && field === "surname"}
                        placeholder={placeholder}
                        value={formData[field]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800 ${
                          isEditingPresident && field === "surname"
                            ? "bg-slate-100 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-[10px] font-medium text-slate-500">
                  Saved and signed as Surname, First Name, M.I., Suffix.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  readOnly={isEditingPresident}
                  placeholder="e.g. juan@marsu.edu.ph"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800 ${
                    isEditingPresident ? "bg-slate-100 cursor-not-allowed" : ""
                  }`}
                />
                {isEditingPresident && (
                  <p className="mt-1 text-[10px] font-medium text-slate-500">
                    Surname, email, and position are maintained by OVPSAS and
                    cannot be changed here.
                  </p>
                )}
              </div>

              {!isFacultySignatory && (
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
                      Birthday{" "}
                      <span className="font-medium text-slate-400">
                        (Optional)
                      </span>
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
              )}

              {!isFacultySignatory && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Year Level
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => {
                        const year = e.target.value;
                        setFormData({
                          ...formData,
                          year,
                          section: applySectionPrefix(
                            formData.section,
                            getSectionPrefix(formData.program, year),
                          ),
                        });
                      }}
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
                      Program
                    </label>
                    <select
                      value={formData.program}
                      disabled={isLoadingPrograms || programs.length === 0}
                      onChange={(e) => {
                        const program = e.target.value;
                        setFormData({
                          ...formData,
                          program,
                          section: applySectionPrefix(
                            formData.section,
                            getSectionPrefix(program, formData.year),
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {isLoadingPrograms
                          ? "Loading programs..."
                          : programs.length === 0
                            ? "No programs registered"
                            : "Select program"}
                      </option>
                      {formData.program &&
                        !programs.some(
                          (program) => program.name === formData.program,
                        ) && (
                          <option value={formData.program}>
                            {formData.program} (previously saved)
                          </option>
                        )}
                      {programs.map((program) => (
                        <option key={program._id} value={program.name}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                    {programError && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        {programError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!isFacultySignatory && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder={
                      getSectionPrefix(formData.program, formData.year) ||
                      "e.g. BSIS - 2 A"
                    }
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#4A0E17]/30 bg-white text-[#4A0E17] hover:bg-[#4A0E17]/5 transition-colors font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingOfficer
                      ? `Update ${isFacultySignatory ? signatoryLabel : "Officer"}`
                      : `Save ${isFacultySignatory ? signatoryLabel : "Officer"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EMAIL INVITATION SETUP FOR AN OFFICER */}
      {!isMemberDirectory && isAccountModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-xl text-[#7A610D]">
                  <MailIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  Send Account Setup Invitation
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
                  Select Officer
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
                    Target Email:{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedOfficerObj.email}
                    </span>
                  </p>
                </div>
              )}

              {/* Information Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <p className="font-bold text-slate-800">
                  📧 Invitation Setup Flow
                </p>
                <p>
                  An email containing a secure setup link will be sent to the
                  officer. They will use the link to set up their own password
                  and activate their account.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#4A0E17]/30 bg-white text-[#4A0E17] hover:bg-[#4A0E17]/5 transition-colors font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite || !selectedMemberId}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <MailIcon className="w-3.5 h-3.5" />
                  {isSendingInvite ? "Sending Email..." : "Send Setup Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
