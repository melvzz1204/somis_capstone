import React, { useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext"; // 👈 1. IMPORT YOUR TOAST HOOK

// Inline Icon Components
const CreditCardIcon = ({ className = "w-4 h-4" }) => (
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
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
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

export default function FeeModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  org,
  user,
}) {
  // 👈 2. DESTRUCTURE SHOWTOAST
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    feeCategory: "cisco_fee",
    customFeeName: "",
    amount: "",
    academicYear: "2025-2026",
    semester: "1st Semester",
    targetYearLevel: "All",
    dueDate: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // 🔍 Helper to locate Org ID across all common object structures
  const getOrgId = () => {
    if (org) {
      if (typeof org === "string") return org;
      if (org._id) return org._id;
      if (org.id) return org.id;
    }

    const currentUser =
      user || JSON.parse(localStorage.getItem("user") || "{}");
    if (currentUser) {
      if (typeof currentUser.org === "string") return currentUser.org;
      if (currentUser.org?._id) return currentUser.org._id;
      if (currentUser.org?.id) return currentUser.org.id;
      if (currentUser.orgId) return currentUser.orgId;
      if (currentUser.organizationId) return currentUser.organizationId;
      if (currentUser.organization?._id) return currentUser.organization._id;
      if (currentUser.organization?.id) return currentUser.organization.id;
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      feeCategory: value,
      customFeeName: value === "others" ? prev.customFeeName : "",
    }));
  };

  const resolveTitle = () => {
    if (formData.feeCategory === "others") {
      return formData.customFeeName.trim();
    }
    const titles = {
      cisco_fee: "Cisco Networking Fee",
      paf: "Program Alignment Fee (PAF)",
      membership: "Organization Membership Fee",
      cics_week: "CICS Week Fee",
    };
    return titles[formData.feeCategory] || formData.feeCategory;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const targetOrgId = getOrgId();

    const payload = {
      org: targetOrgId,
      title: resolveTitle(),
      category: formData.feeCategory,
      amount: Number(formData.amount),
      academicYear: formData.academicYear,
      semester: formData.semester,
      targetYearLevel: formData.targetYearLevel,
      dueDate: formData.dueDate,
      description: formData.description.trim(),
    };

    try {
      const response = await API.post("/fees", payload);

      // 👈 3. TRIGGER SUCCESS TOAST
      showToast?.("Fee drive created successfully!", "success");

      if (onSubmitSuccess) onSubmitSuccess(response.data?.data || payload);
      onClose();
    } catch (error) {
      console.error("Failed to create fee drive:", error);
      const errMsg =
        error.response?.data?.message ||
        "Failed to create fee drive. Please check your network or inputs.";

      setErrorMsg(errMsg);

      // 👈 3. TRIGGER ERROR TOAST
      showToast?.(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const orgDisplayName =
    org?.name ||
    user?.organization?.name ||
    user?.org?.name ||
    "Active Organization";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200/80 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4A0E17]/10 border border-[#4A0E17]/20 rounded-xl text-[#4A0E17]">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#4A0E17]">
                Create New Fee Drive
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Organization:{" "}
                <span className="font-bold text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded-md inline-block">
                  {orgDisplayName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* CATEGORY SELECTOR */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Fee Category <span className="text-rose-600">*</span>
            </label>
            <select
              name="feeCategory"
              value={formData.feeCategory}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
            >
              <option value="cisco_fee">Cisco Networking Fee</option>
              <option value="paf">Program Alignment Fee (PAF)</option>
              <option value="membership">Organization Membership Fee</option>
              <option value="cics_week">CICS Week Fee</option>
              <option value="others">Others (Custom Fee)</option>
            </select>
          </div>

          {/* CUSTOM TITLE FIELD */}
          {formData.feeCategory === "others" && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Custom Fee Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="customFeeName"
                required
                placeholder="e.g. T-Shirt Collection Fee"
                value={formData.customFeeName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
              />
            </div>
          )}

          {/* AMOUNT & DUE DATE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Amount (₱) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₱
                </span>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  placeholder="150.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Due Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                required
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
              />
            </div>
          </div>

          {/* ACADEMIC YEAR & SEMESTER */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Academic Year <span className="text-rose-600">*</span>
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Semester <span className="text-rose-600">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          {/* TARGET LEVEL */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Target Level / Group
            </label>
            <select
              name="targetYearLevel"
              value={formData.targetYearLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] bg-white font-medium text-slate-800"
            >
              <option value="All">All CICS Students</option>
              <option value="1st Year">1st Year Only</option>
              <option value="2nd Year">2nd Year Only</option>
              <option value="3rd Year">3rd Year Only</option>
              <option value="4th Year">4th Year Only</option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Provide context or breakdown of fees..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17] font-medium text-slate-800"
            />
          </div>

          {/* MODAL FOOTER */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-bold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 border border-[#B8860B]/30 flex items-center gap-1.5"
            >
              {loading ? "Creating Fee..." : "Create Fee Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
