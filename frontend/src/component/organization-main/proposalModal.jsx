import { useState } from "react";
import API from "../../api/axios";

const activityCategories = [
  "Academic",
  "Non-Academic",
  "Community Service",
  "Fundraiser",
  "Sports & Recreation",
  "General Assembly / Meeting",
];
const venues = [
  "AVR",
  "Gymnasium",
  "Student Center",
  "Classroom",
  "Outdoor Grounds",
  "Off-Campus / Virtual",
];
const audiences = [
  "Org Members Only",
  "All University Students",
  "Faculty & Staff",
  "Open to External Public",
];
const fundSources = [
  "Organization Fund",
  "Participant Registration / Ticket Fee",
  "Sponsorship / Solicitation",
  "Department / School Grant",
];
const acceptedExtensions = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"];

const emptyForm = {
  proposalTitle: "",
  activityCategory: "Academic",
  projectObjectives: "",
  projectDescription: "",
  requestedStartDateTime: "",
  requestedEndDateTime: "",
  targetVenue: "AVR",
  expectedAttendees: "",
  targetAudience: "Org Members Only",
  totalBudgetAllocation: "0",
  sourceOfFunds: "Organization Fund",
  projectLeadPerson: "",
  projectLeadContact: "",
};

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function ProposalModal({ proposal, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    proposal
      ? {
          ...emptyForm,
          ...proposal,
          requestedStartDateTime: toLocalDateTime(
            proposal.requestedStartDateTime,
          ),
          requestedEndDateTime: toLocalDateTime(proposal.requestedEndDateTime),
          expectedAttendees: String(proposal.expectedAttendees ?? ""),
          totalBudgetAllocation: String(proposal.totalBudgetAllocation ?? 0),
        }
      : emptyForm,
  );
  const [retainedAttachments, setRetainedAttachments] = useState(
    () => proposal?.attachments || [],
  );
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const totalFiles =
      retainedAttachments.length + newFiles.length + selected.length;
    if (totalFiles > 5) {
      setError("A proposal can contain no more than 5 attachments.");
      event.target.value = "";
      return;
    }
    const invalidFile = selected.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return (
        !acceptedExtensions.includes(extension) || file.size > 10 * 1024 * 1024
      );
    });
    if (invalidFile) {
      setError(`${invalidFile.name} is unsupported or exceeds 10 MB.`);
      event.target.value = "";
      return;
    }
    setError("");
    setNewFiles((current) => [...current, ...selected]);
    event.target.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (
      new Date(form.requestedEndDateTime) <=
      new Date(form.requestedStartDateTime)
    ) {
      setError(
        "Requested end date and time must be after the start date and time.",
      );
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append(
      "retainedAttachmentIds",
      JSON.stringify(retainedAttachments.map((item) => item._id)),
    );
    newFiles.forEach((file) => payload.append("attachments", file));

    setIsSaving(true);
    try {
      const response = proposal?._id
        ? await API.put(`/proposals/${proposal._id}`, payload)
        : await API.post("/proposals", payload);
      onSaved(response.data, proposal ? "updated" : "created");
    } catch (requestError) {
      setError(requestError.message || "Unable to save the proposal.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10";
  const labelClass = "text-[11px] font-bold text-slate-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="proposal-modal-title"
              className="text-base font-extrabold text-[#4A0E17]"
            >
              {proposal ? "Edit Proposal" : "Create Proposal"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {proposal
                ? "Update the saved activity request."
                : "Prepare a new activity request for your organization."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Close proposal form"
            aria-label="Close proposal form"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <section>
              <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase text-[#4A0E17]">
                General Project Information
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Proposal Title <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="proposalTitle"
                    value={form.proposalTitle}
                    onChange={updateField}
                    maxLength={150}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Activity Category <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="activityCategory"
                    value={form.activityCategory}
                    onChange={updateField}
                    required
                  >
                    {activityCategories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Project Objectives <span className="text-rose-600">*</span>
                  <textarea
                    className={inputClass}
                    name="projectObjectives"
                    value={form.projectObjectives}
                    onChange={updateField}
                    rows={3}
                    required
                  />
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Project Description <span className="text-rose-600">*</span>
                  <textarea
                    className={inputClass}
                    name="projectDescription"
                    value={form.projectDescription}
                    onChange={updateField}
                    rows={4}
                    required
                  />
                </label>
              </div>
            </section>

            <section>
              <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase text-[#4A0E17]">
                Schedule, Venue & Audience
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Requested Start Date & Time{" "}
                  <span className="text-rose-600">*</span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    name="requestedStartDateTime"
                    value={form.requestedStartDateTime}
                    onChange={updateField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Requested End Date & Time{" "}
                  <span className="text-rose-600">*</span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    name="requestedEndDateTime"
                    value={form.requestedEndDateTime}
                    onChange={updateField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Target Venue <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="targetVenue"
                    value={form.targetVenue}
                    onChange={updateField}
                    required
                  >
                    {venues.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Expected Attendees <span className="text-rose-600">*</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={inputClass}
                    name="expectedAttendees"
                    value={form.expectedAttendees}
                    onChange={updateField}
                    required
                  />
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Target Audience <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="targetAudience"
                    value={form.targetAudience}
                    onChange={updateField}
                    required
                  >
                    {audiences.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase text-[#4A0E17]">
                Financials & Accountability
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Total Budget Allocation (PHP){" "}
                  <span className="text-rose-600">*</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs font-bold text-slate-500">
                      ₱
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${inputClass} pl-7`}
                      name="totalBudgetAllocation"
                      value={form.totalBudgetAllocation}
                      onChange={updateField}
                      required
                    />
                  </div>
                </label>
                <label className={labelClass}>
                  Source of Funds <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="sourceOfFunds"
                    value={form.sourceOfFunds}
                    onChange={updateField}
                    required
                  >
                    {fundSources.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Project Lead Person <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="projectLeadPerson"
                    value={form.projectLeadPerson}
                    onChange={updateField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Project Lead Contact <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="projectLeadContact"
                    value={form.projectLeadContact}
                    onChange={updateField}
                    placeholder="Phone number or email address"
                    required
                  />
                </label>
              </div>
            </section>

            <section>
              <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase text-[#4A0E17]">
                Supporting Documents
              </h3>
              <div className="mt-4">
                <label className={labelClass}>
                  Supporting Attachments{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFiles}
                    className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#4A0E17] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white`}
                  />
                </label>
                <p className="mt-1.5 text-[10px] text-slate-500">
                  PDF, DOCX, XLSX, PNG, JPG, or JPEG. Up to 5 files, 10 MB each.
                </p>
                {(retainedAttachments.length > 0 || newFiles.length > 0) && (
                  <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {retainedAttachments.map((file) => (
                      <div
                        key={file._id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                      >
                        <span className="truncate text-slate-700">
                          {file.originalName}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRetainedAttachments((items) =>
                              items.filter((item) => item._id !== file._id),
                            )
                          }
                          className="font-bold text-rose-600 hover:text-rose-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {newFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                      >
                        <span className="truncate text-slate-700">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewFiles((items) =>
                              items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                          className="font-bold text-rose-600 hover:text-rose-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg border border-[#B8860B]/40 bg-[#D4AF37] px-5 py-2 text-xs font-extrabold text-[#36080E] hover:bg-[#C59B27] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : proposal
                  ? "Save Changes"
                  : "Create Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
