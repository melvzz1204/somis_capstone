import { useState, useEffect } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";

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

// Helper to ensure options work seamlessly whether passed as strings or { value, label } objects
const normalizeOptions = (options = []) =>
  options.map((opt) =>
    typeof opt === "object" && opt !== null
      ? opt
      : { value: String(opt), label: String(opt) },
  );

export default function FeeModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  org,
  user,
  // DYNAMIC CONFIGURATION PROPS (Override via parent component or API)
  categories: rawCategories,
  semesters: rawSemesters = ["1st Semester", "2nd Semester", "Summer"],
  targetLevels: rawTargetLevels = [
    { value: "All", label: "All Students" },
    { value: "1st Year", label: "1st Year Only" },
    { value: "2nd Year", label: "2nd Year Only" },
    { value: "3rd Year", label: "3rd Year Only" },
    { value: "4th Year", label: "4th Year Only" },
  ],
  academicYears: rawAcademicYears,
}) {
  const { showToast } = useToast();
  const orgDisplayName =
    org?.name || user?.organization?.name || user?.org?.name || "Organization";
  const orgFeePrefix = String(
    org?.acronym ||
      user?.organization?.acronym ||
      user?.org?.acronym ||
      orgDisplayName,
  )
    .trim()
    .toUpperCase();
  const defaultCategories = [
    { value: "organization_fee", label: `${orgFeePrefix} Fee` },
    { value: "paf", label: `${orgFeePrefix} PAF` },
    { value: "intrams_fee", label: `${orgFeePrefix} Intrams Fee` },
    { value: "organization_week_fee", label: `${orgFeePrefix} Week Fee` },
    { value: "others", label: "Others Fee" },
  ];

  // Normalize options array
  const categories = normalizeOptions(rawCategories || defaultCategories);
  const semesters = normalizeOptions(rawSemesters);
  const targetLevels = normalizeOptions(rawTargetLevels);

  // Calculate dynamic academic years if not explicitly provided
  const currentYear = new Date().getFullYear();
  const defaultAYs = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];
  const academicYears = normalizeOptions(rawAcademicYears || defaultAYs);

  // Form State
  const [formData, setFormData] = useState({
    feeCategory: "",
    customFeeName: "",
    amount: "",
    academicYear: "",
    semester: "",
    targetYearLevel: "",
    dueDate: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize or reset form defaults when modal opens or options change
  useEffect(() => {
    if (!isOpen) return undefined;

    const resetRequest = window.setTimeout(() => {
      setFormData({
        feeCategory: categories[0]?.value || "others",
        customFeeName: "",
        amount: "",
        academicYear: academicYears[1]?.value || academicYears[0]?.value || "",
        semester: semesters[0]?.value || "",
        targetYearLevel: targetLevels[0]?.value || "All",
        dueDate: "",
        description: "",
      });
      setErrorMsg("");
    }, 0);

    return () => window.clearTimeout(resetRequest);
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to locate Org ID dynamically across all user/org payload variations
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
      if (currentUser._id && currentUser.role === "org_admin")
        return currentUser._id;
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

  // Dynamically resolve title based on chosen category or custom input
  const resolveTitle = () => {
    if (formData.feeCategory === "others") {
      return formData.customFeeName.trim();
    }
    const matchedCategory = categories.find(
      (cat) => cat.value === formData.feeCategory,
    );
    return matchedCategory ? matchedCategory.label : formData.feeCategory;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const targetOrgId = getOrgId();

    if (!targetOrgId) {
      const missingOrgErr =
        "Organization ID missing. Please log in again or re-select organization.";
      setErrorMsg(missingOrgErr);
      showToast?.(missingOrgErr, "error");
      setLoading(false);
      return;
    }

    // The backend derives organization scope from the authenticated treasurer.
    const payload = {
      title: resolveTitle(),
      category: formData.feeCategory,
      amount: Number(formData.amount),
      academicYear: formData.academicYear,
      semester: formData.semester,
      targetYearLevel: formData.targetYearLevel,
      dueDate: formData.dueDate, // Raw YYYY-MM-DD from input
      description: formData.description.trim(),
    };

    try {
      const response = await API.post("/fees", payload);

      showToast?.("Dues Collection created successfully!", "success");

      const createdFee =
        response.data?.data || response.data?.fee || response.data || payload;
      if (onSubmitSuccess) onSubmitSuccess(createdFee);

      onClose();
    } catch (error) {
      console.error("Failed to create Dues Collection:", error);
      const errMsg =
        error.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create Dues Collection. Please check network or inputs.";

      setErrorMsg(errMsg);
      showToast?.(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

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
                Create Dues Collection
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
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
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
                placeholder="Enter custom title..."
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
                  placeholder="0.00"
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
                {academicYears.map((ay) => (
                  <option key={ay.value} value={ay.value}>
                    {ay.label}
                  </option>
                ))}
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
                {semesters.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))}
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
              {targetLevels.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
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
              {loading ? "Creating Fee..." : "Create Fee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
