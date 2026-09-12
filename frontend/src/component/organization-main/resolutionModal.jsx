import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";

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
const acceptedExtensions = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"];

const emptyProposal = {
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
  sourceOfFunds: "",
  projectLeadPerson: "",
  projectLeadContact: "",
  requiresFeeCollection: false,
};

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toApiDateTime = (value) => (value ? new Date(value).toISOString() : value);

const formatMeetingLabel = (meeting) => {
  const when = meeting?.startDateTime
    ? new Date(meeting.startDateTime).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No date";
  return `${meeting?.title || "Untitled meeting"} — ${when}`;
};

export default function ResolutionModal({ resolution, onClose, onSaved }) {
  const { showToast } = useToast();
  const isEditing = Boolean(resolution?._id);

  const [meetingId, setMeetingId] = useState(
    resolution?.meeting?._id || resolution?.meeting || "",
  );
  const [title, setTitle] = useState(resolution?.title || "");
  const [subject, setSubject] = useState(resolution?.subject || "");
  const [whereasClauses, setWhereasClauses] = useState(() =>
    resolution?.whereasClauses?.length ? resolution.whereasClauses : [""],
  );
  const [resolvedClauses, setResolvedClauses] = useState(() =>
    resolution?.resolvedClauses?.length ? resolution.resolvedClauses : [""],
  );
  const [proposal, setProposal] = useState(() =>
    resolution?.activityProposal
      ? {
          ...emptyProposal,
          ...resolution.activityProposal,
          requestedStartDateTime: toLocalDateTime(
            resolution.activityProposal.requestedStartDateTime,
          ),
          requestedEndDateTime: toLocalDateTime(
            resolution.activityProposal.requestedEndDateTime,
          ),
          expectedAttendees: String(
            resolution.activityProposal.expectedAttendees ?? "",
          ),
          totalBudgetAllocation: String(
            resolution.activityProposal.totalBudgetAllocation ?? 0,
          ),
          requiresFeeCollection: Boolean(
            resolution.activityProposal.requiresFeeCollection,
          ),
        }
      : emptyProposal,
  );

  const [retainedResolutionFiles, setRetainedResolutionFiles] = useState(
    () => resolution?.attachments || [],
  );
  const [retainedProposalFiles, setRetainedProposalFiles] = useState(
    () => resolution?.activityProposal?.attachments || [],
  );
  const [newResolutionFiles, setNewResolutionFiles] = useState([]);
  const [newProposalFiles, setNewProposalFiles] = useState([]);

  const [meetings, setMeetings] = useState([]);
  const [duesCollections, setDuesCollections] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    API.get("/meetings")
      .then((response) => {
        if (!isCurrent) return;
        const list = Array.isArray(response?.data) ? response.data : [];
        // A6: a resolution is grounded in a meeting that has already occurred.
        const now = Date.now();
        const held = list.filter(
          (meeting) => new Date(meeting.endDateTime).getTime() <= now,
        );
        setMeetings(held);
      })
      .catch(() => {
        if (isCurrent) setMeetings([]);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    API.get("/fees")
      .then((response) => {
        if (!isCurrent) return;
        const fees = Array.isArray(response?.data) ? response.data : [];
        setDuesCollections(fees);
      })
      .catch(() => {
        if (isCurrent) setDuesCollections([]);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const updateProposalField = (event) => {
    const { name, value, type, checked } = event.target;
    setProposal((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateClause = (setter) => (index, value) =>
    setter((current) =>
      current.map((clause, position) =>
        position === index ? value : clause,
      ),
    );
  const addClause = (setter) => () =>
    setter((current) => [...current, ""]);
  const removeClause = (setter) => (index) =>
    setter((current) =>
      current.length <= 1
        ? current
        : current.filter((_, position) => position !== index),
    );

  const handleFiles = (event, kind) => {
    const selected = Array.from(event.target.files || []);
    const retained =
      kind === "resolution" ? retainedResolutionFiles : retainedProposalFiles;
    const pending = kind === "resolution" ? newResolutionFiles : newProposalFiles;
    if (retained.length + pending.length + selected.length > 5) {
      setError("Each attachment group can contain no more than 5 files.");
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
    if (kind === "resolution") {
      setNewResolutionFiles((current) => [...current, ...selected]);
    } else {
      setNewProposalFiles((current) => [...current, ...selected]);
    }
    event.target.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!meetingId) {
      setError("Select the meeting where this resolution was agreed.");
      return;
    }
    const cleanResolved = resolvedClauses
      .map((clause) => clause.trim())
      .filter(Boolean);
    if (cleanResolved.length < 1) {
      setError("Add at least one RESOLVED clause.");
      return;
    }
    if (
      new Date(proposal.requestedEndDateTime) <=
      new Date(proposal.requestedStartDateTime)
    ) {
      setError(
        "The activity end date and time must be after the start date and time.",
      );
      return;
    }

    const activityProposal = {
      ...proposal,
      requestedStartDateTime: toApiDateTime(proposal.requestedStartDateTime),
      requestedEndDateTime: toApiDateTime(proposal.requestedEndDateTime),
      sourceOfFunds: String(proposal.sourceOfFunds || "").trim(),
    };

    const payload = new FormData();
    payload.append("meeting", meetingId);
    payload.append("title", title);
    payload.append("subject", subject);
    payload.append(
      "whereasClauses",
      JSON.stringify(whereasClauses.map((c) => c.trim()).filter(Boolean)),
    );
    payload.append("resolvedClauses", JSON.stringify(cleanResolved));
    payload.append("activityProposal", JSON.stringify(activityProposal));
    payload.append(
      "retainedAttachmentIds",
      JSON.stringify(retainedResolutionFiles.map((item) => item._id)),
    );
    payload.append(
      "retainedProposalAttachmentIds",
      JSON.stringify(retainedProposalFiles.map((item) => item._id)),
    );
    newResolutionFiles.forEach((file) => payload.append("attachments", file));
    newProposalFiles.forEach((file) =>
      payload.append("proposalAttachments", file),
    );

    setIsSaving(true);
    try {
      const response = isEditing
        ? await API.put(`/resolutions/${resolution._id}`, payload)
        : await API.post("/resolutions", payload);
      const action = isEditing ? "updated" : "created";
      showToast(`Resolution ${action} successfully.`, "success");
      onSaved(response.data, action);
    } catch (requestError) {
      const message = requestError.message || "Unable to save the resolution.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10";
  const labelClass = "text-[11px] font-bold text-slate-700";

  const renderClauseEditor = (clauses, setter, legend, placeholder) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={labelClass}>{legend}</p>
        <button
          type="button"
          onClick={addClause(setter)}
          className="rounded-md border border-[#4A0E17]/30 bg-white px-2.5 py-1 text-[11px] font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
        >
          + Add clause
        </button>
      </div>
      {clauses.map((clause, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            className={inputClass}
            rows={2}
            value={clause}
            placeholder={placeholder}
            onChange={(event) =>
              updateClause(setter)(index, event.target.value)
            }
          />
          {clauses.length > 1 && (
            <button
              type="button"
              onClick={() => removeClause(setter)(index)}
              className="mt-1 shrink-0 rounded-md border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const renderFileList = (retained, pending, setRetained, setPending) =>
    (retained.length > 0 || pending.length > 0) && (
      <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {retained.map((file) => (
          <div
            key={file._id}
            className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
          >
            <span className="truncate text-slate-700">{file.originalName}</span>
            <button
              type="button"
              onClick={() =>
                setRetained((items) =>
                  items.filter((item) => item._id !== file._id),
                )
              }
              className="font-bold text-rose-600 hover:text-rose-800"
            >
              Remove
            </button>
          </div>
        ))}
        {pending.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
          >
            <span className="truncate text-slate-700">{file.name}</span>
            <button
              type="button"
              onClick={() =>
                setPending((items) =>
                  items.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              className="font-bold text-rose-600 hover:text-rose-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolution-modal-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="resolution-modal-title"
              className="text-base font-extrabold text-[#4A0E17]"
            >
              {isEditing ? "Edit Resolution" : "Create Resolution"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEditing
                ? "Update the drafted resolution and its embedded activity proposal."
                : "Draft a resolution grounded on a held meeting, with its activity proposal embedded."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close resolution form"
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
                Resolution Details
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={`${labelClass} md:col-span-2`}>
                  Basis Meeting <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    value={meetingId}
                    onChange={(event) => setMeetingId(event.target.value)}
                    required
                  >
                    <option value="">Choose a held meeting</option>
                    {meetings.map((meeting) => (
                      <option key={meeting._id} value={meeting._id}>
                        {formatMeetingLabel(meeting)}
                      </option>
                    ))}
                  </select>
                  {meetings.length === 0 && (
                    <span className="mt-1 block text-[10px] font-normal text-slate-500">
                      No concluded meetings are available yet. Hold the meeting
                      first, then draft its resolution.
                    </span>
                  )}
                </label>
                <label className={labelClass}>
                  Resolution Title <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={200}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Subject
                  <input
                    className={inputClass}
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={300}
                    placeholder="A RESOLUTION ..."
                  />
                </label>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {renderClauseEditor(
                  whereasClauses,
                  setWhereasClauses,
                  "WHEREAS clauses",
                  "WHEREAS, ...",
                )}
                {renderClauseEditor(
                  resolvedClauses,
                  setResolvedClauses,
                  "RESOLVED clauses *",
                  "RESOLVED, that ...",
                )}
              </div>
            </section>

            <section>
              <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase text-[#4A0E17]">
                Embedded Activity Proposal
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Proposal Title <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="proposalTitle"
                    value={proposal.proposalTitle}
                    onChange={updateProposalField}
                    maxLength={150}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Activity Category <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="activityCategory"
                    value={proposal.activityCategory}
                    onChange={updateProposalField}
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
                    value={proposal.projectObjectives}
                    onChange={updateProposalField}
                    rows={3}
                    required
                  />
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Project Description <span className="text-rose-600">*</span>
                  <textarea
                    className={inputClass}
                    name="projectDescription"
                    value={proposal.projectDescription}
                    onChange={updateProposalField}
                    rows={4}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Requested Start <span className="text-rose-600">*</span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    name="requestedStartDateTime"
                    value={proposal.requestedStartDateTime}
                    onChange={updateProposalField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Requested End <span className="text-rose-600">*</span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    name="requestedEndDateTime"
                    value={proposal.requestedEndDateTime}
                    onChange={updateProposalField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Target Venue <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="targetVenue"
                    value={proposal.targetVenue}
                    onChange={updateProposalField}
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
                    value={proposal.expectedAttendees}
                    onChange={updateProposalField}
                    required
                  />
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Target Audience <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="targetAudience"
                    value={proposal.targetAudience}
                    onChange={updateProposalField}
                    required
                  >
                    {audiences.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Total Budget Allocation (PHP){" "}
                  <span className="text-rose-600">*</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    name="totalBudgetAllocation"
                    value={proposal.totalBudgetAllocation}
                    onChange={updateProposalField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Source of Funds <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="sourceOfFunds"
                    value={proposal.sourceOfFunds}
                    onChange={updateProposalField}
                    list="dues-collections"
                    maxLength={200}
                    required
                  />
                  <datalist id="dues-collections">
                    {duesCollections.map((fee) => (
                      <option key={fee._id} value={`Dues Collection: ${fee.title}`}>
                        {`Dues Collection: ${fee.title}`}
                      </option>
                    ))}
                  </datalist>
                </label>
                <label className={labelClass}>
                  Project Lead Person <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="projectLeadPerson"
                    value={proposal.projectLeadPerson}
                    onChange={updateProposalField}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Project Lead Contact <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="projectLeadContact"
                    value={proposal.projectLeadContact}
                    onChange={updateProposalField}
                    placeholder="Phone number or email address"
                    required
                  />
                </label>
                <label className="mt-1 flex items-center gap-2 text-[11px] font-bold text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    name="requiresFeeCollection"
                    checked={proposal.requiresFeeCollection}
                    onChange={updateProposalField}
                    className="h-4 w-4 rounded border-slate-300 text-[#4A0E17]"
                  />
                  This activity will require a dues collection (fee drive).
                </label>
              </div>
            </section>

            <section>
              <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase text-[#4A0E17]">
                Supporting Documents
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Resolution Attachments{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                      onChange={(event) => handleFiles(event, "resolution")}
                      className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#4A0E17] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white`}
                    />
                  </label>
                  {renderFileList(
                    retainedResolutionFiles,
                    newResolutionFiles,
                    setRetainedResolutionFiles,
                    setNewResolutionFiles,
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    Proposal Attachments{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                      onChange={(event) => handleFiles(event, "proposal")}
                      className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#4A0E17] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white`}
                    />
                  </label>
                  {renderFileList(
                    retainedProposalFiles,
                    newProposalFiles,
                    setRetainedProposalFiles,
                    setNewProposalFiles,
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">
                PDF, DOCX, XLSX, PNG, JPG, or JPEG. Up to 5 files per group, 10
                MB each.
              </p>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-[#4A0E17]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#4A0E17] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Resolution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
