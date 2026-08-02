import React, { useState } from "react";

export default function FeeModal({ isOpen, onClose, onSubmitSuccess }) {
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

  if (!isOpen) return null;

  // Handles category selection & auto-suggests typical fee descriptions
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      feeCategory: value,
      // Clear custom name if switching away from "others"
      customFeeName: value === "others" ? prev.customFeeName : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine final fee label
      const finalFeeName =
        formData.feeCategory === "others"
          ? formData.customFeeName
          : getCategoryLabel(formData.feeCategory);

      const payload = {
        title: finalFeeName,
        category: formData.feeCategory,
        amount: Number(formData.amount),
        academicYear: formData.academicYear,
        semester: formData.semester,
        targetYearLevel: formData.targetYearLevel,
        dueDate: formData.dueDate,
        description: formData.description,
      };

      console.log("Submitting Fee Record:", payload);

      // Call API endpoint here if ready (e.g., await API.post("/fees", payload))
      if (onSubmitSuccess) onSubmitSuccess(payload);

      onClose();
    } catch (error) {
      console.error("Error creating fee:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render readable label
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "cics_fee":
        return "cics Fee";
      case "cics_paf":
        return "cics PAF";
      case "cisc_intrams":
        return "Ciscs Intrams Fee";
      case "cics_week":
        return "CICS Week Fee";
      default:
        return "Others Fee";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Create Organization Fee Drive
            </h3>
            <p className="text-xs text-slate-500">
              Set up official fee requirements for CICS students or members.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* FEE CATEGORY SELECT */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Fee Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.feeCategory}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 cursor-pointer"
            >
              <option value="ciscs_fee">CICS Fee</option>
              <option value="ciscs_paf">
                CICS PAF (Program Alignment Fee)
              </option>
              <option value="cisc_intrams">CICS Intrams Fee</option>
              <option value="cics_week">CICS Week Fee</option>
              <option value="others">Others Fee (Custom)</option>
            </select>
          </div>

          {/* DYNAMIC INPUT / TEXTAREA FOR "OTHERS FEE" */}
          {formData.feeCategory === "others" && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Custom Fee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-Shirt Collection, Graduation Fee, Workshop Fee"
                  value={formData.customFeeName}
                  onChange={(e) =>
                    setFormData({ ...formData, customFeeName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* AMOUNT & DUE DATE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Amount (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-medium">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* ACADEMIC YEAR & TARGET AUDIENCE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academic Year
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="2025-2026">AY 2025-2026</option>
                <option value="2026-2027">AY 2026-2027</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Applies To
              </label>
              <select
                value={formData.targetYearLevel}
                onChange={(e) =>
                  setFormData({ ...formData, targetYearLevel: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="All">All CICS Students</option>
                <option value="1st Year">1st Year Only</option>
                <option value="2nd Year">2nd Year Only</option>
                <option value="3rd Year">3rd Year Only</option>
                <option value="4th Year">4th Year Only</option>
                <option value="Officers">Officers Only</option>
              </select>
            </div>
          </div>

          {/* DESCRIPTION / REMARKS (TEXT AREA) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fee Description & Breakdown
            </label>
            <textarea
              rows={3}
              placeholder="Provide context or a breakdown of what this fee covers..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Fee Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
