import { useEffect, useRef, useState } from "react";
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

const formatPeso = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatMeetingLabel = (meeting, isAdopted = false) => {
  const when = meeting?.startDateTime
    ? new Date(meeting.startDateTime).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No date";
  const title = `${meeting?.title || "Untitled meeting"} — ${when}`;
  return isAdopted ? `Already adopted — ${title}` : title;
};

export default function ResolutionModal({
  resolution,
  onClose,
  onSaved,
  currentUser = null,
}) {
  const { showToast } = useToast();
  const isEditing = Boolean(resolution?._id);

  const [meetingId, setMeetingId] = useState(
    resolution?.meeting?._id || resolution?.meeting || "",
  );
  const [title, setTitle] = useState(resolution?.title || "");
  // No Subject input — the subject lives in the uploaded attachment.
  // Existing subjects on older records are preserved as-is.
  const existingSubject = resolution?.subject || "";
  // The full resolution text lives in the uploaded attachment, so no
  // clause inputs are needed. Existing clauses on older records are
  // preserved as-is.
  const existingWhereasClauses = Array.isArray(resolution?.whereasClauses)
    ? resolution.whereasClauses
    : [];
  const existingResolvedClauses = Array.isArray(resolution?.resolvedClauses)
    ? resolution.resolvedClauses
    : [];
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
  // Meetings that already ground an adopted resolution, shown with an
  // "Already adopted" prefix in the basis-meeting dropdown.
  const [adoptedMeetingIds, setAdoptedMeetingIds] = useState(() => new Set());
  const [duesCollections, setDuesCollections] = useState([]);
  const [rosterCount, setRosterCount] = useState(null);
  const attendeesTouchedRef = useRef(false);
  // Project lead fields prefill from the secretary's account but stay editable.
  const [secretaryInfo, setSecretaryInfo] = useState({
    name: currentUser?.name || "",
    contact: currentUser?.email || "",
  });
  const leadTouchedRef = useRef({ person: false, contact: false });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      API.get("/meetings"),
      API.get("/resolutions", { params: { status: "Adopted" } }).catch(
        () => ({ data: [] }),
      ),
    ])
      .then(([meetingsResponse, adoptedResponse]) => {
        if (!isCurrent) return;
        const list = Array.isArray(meetingsResponse?.data)
          ? meetingsResponse.data
          : [];
        // A6: a resolution is grounded in a meeting that has already occurred.
        const now = Date.now();
        const held = list.filter(
          (meeting) => new Date(meeting.endDateTime).getTime() <= now,
        );
        setMeetings(held);
        const adoptedList = Array.isArray(adoptedResponse?.data)
          ? adoptedResponse.data
          : [];
        setAdoptedMeetingIds(
          new Set(
            adoptedList
              .map((resolution) => {
                const meeting = resolution?.meeting;
                const id =
                  meeting && typeof meeting === "object"
                    ? meeting._id || meeting.id
                    : meeting;
                return id ? String(id) : null;
              })
              .filter(Boolean),
          ),
        );
      })
      .catch(() => {
        if (isCurrent) {
          setMeetings([]);
          setAdoptedMeetingIds(new Set());
        }
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

  useEffect(() => {
    let isCurrent = true;
    API.get("/orgmembers")
      .then((response) => {
        if (!isCurrent) return;
        const roster = Array.isArray(response)
          ? response
          : response?.data || [];
        setRosterCount(roster.length);
      })
      .catch(() => {
        if (isCurrent) setRosterCount(null);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  // Prefill attendees from the org roster for new resolutions aimed at
  // org members only — unless the user has already typed a value.
  // A roster of 0 is also filled through so an empty group is detected.
  useEffect(() => {
    if (isEditing || rosterCount == null) return;
    if (attendeesTouchedRef.current) return;
    setProposal((current) => {
      if (
        current.targetAudience !== "Org Members Only" ||
        String(current.expectedAttendees ?? "").trim() !== ""
      ) {
        return current;
      }
      return { ...current, expectedAttendees: String(rosterCount) };
    });
  }, [rosterCount, isEditing]);

  // Resolve the secretary's identity: prefer the parent-provided account,
  // otherwise refresh from the session (with a localStorage fallback).
  useEffect(() => {
    if (currentUser?.name || currentUser?.email) {
      setSecretaryInfo({
        name: currentUser.name || "",
        contact: currentUser.email || "",
      });
      return;
    }
    let isCurrent = true;
    API.get("/auth/me")
      .then((response) => {
        if (!isCurrent) return;
        const me = response?.user || response || {};
        setSecretaryInfo({
          name: me.name || "",
          contact: me.email || "",
        });
      })
      .catch(() => {
        if (!isCurrent) return;
        try {
          const cached = JSON.parse(localStorage.getItem("user") || "null");
          setSecretaryInfo({
            name: cached?.name || "",
            contact: cached?.email || "",
          });
        } catch {
          // Leave the fields blank for manual entry.
        }
      });
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill the project lead fields from the secretary's account for new
  // resolutions — unless the user has already typed a value.
  useEffect(() => {
    if (isEditing) return;
    if (!secretaryInfo.name && !secretaryInfo.contact) return;
    setProposal((current) => {
      const next = { ...current };
      let changed = false;
      if (
        !leadTouchedRef.current.person &&
        !String(current.projectLeadPerson || "").trim() &&
        secretaryInfo.name
      ) {
        next.projectLeadPerson = secretaryInfo.name;
        changed = true;
      }
      if (
        !leadTouchedRef.current.contact &&
        !String(current.projectLeadContact || "").trim() &&
        secretaryInfo.contact
      ) {
        next.projectLeadContact = secretaryInfo.contact;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [secretaryInfo, isEditing]);

  const updateProposalField = (event) => {
    const { name, value, type, checked } = event.target;
    setProposal((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Selecting the audience fills attendees from the roster; the field stays
  // editable so the user can always type a manual count afterwards.
  const handleAudienceChange = (event) => {
    const audience = event.target.value;
    setProposal((current) => ({
      ...current,
      targetAudience: audience,
      ...(audience === "Org Members Only" && rosterCount != null
        ? { expectedAttendees: String(rosterCount) }
        : null),
    }));
  };

  const handleAttendeesChange = (event) => {
    attendeesTouchedRef.current = true;
    updateProposalField(event);
  };

  const handleLeadPersonChange = (event) => {
    leadTouchedRef.current.person = true;
    updateProposalField(event);
  };

  const handleLeadContactChange = (event) => {
    leadTouchedRef.current.contact = true;
    updateProposalField(event);
  };

  // Picking (or typing) a dues collection fills the budget from its expected
  // total; the field stays editable so the user can type a manual figure.
  const handleSourceOfFundsChange = (event) => {
    const source = event.target.value;
    setProposal((current) => {
      const next = { ...current, sourceOfFunds: source };
      const total = feeExpectedTotal(findFeeForSource(source));
      if (total != null) next.totalBudgetAllocation = String(total);
      return next;
    });
  };

  const applyFeeBudget = () => {
    const total = feeExpectedTotal(
      findFeeForSource(proposal.sourceOfFunds),
    );
    if (total == null) return;
    setProposal((current) => ({
      ...current,
      totalBudgetAllocation: String(total),
    }));
  };

  const fillAttendeesFromRoster = () => {
    if (rosterCount == null) return;
    setProposal((current) => ({
      ...current,
      expectedAttendees: String(rosterCount),
    }));
  };

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
    const attendeeCount = Number(proposal.expectedAttendees);
    if (
      String(proposal.expectedAttendees ?? "").trim() === "" ||
      !Number.isFinite(attendeeCount) ||
      attendeeCount < 0
    ) {
      setError("Enter the expected number of attendees (0 or more).");
      return;
    }
    if (retainedResolutionFiles.length + newResolutionFiles.length < 1) {
      setError(
        "Attach the resolution document (at least one file) before saving.",
      );
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
    payload.append("subject", existingSubject);
    payload.append(
      "whereasClauses",
      JSON.stringify(
        existingWhereasClauses.map((c) => String(c).trim()).filter(Boolean),
      ),
    );
    payload.append(
      "resolvedClauses",
      JSON.stringify(
        existingResolvedClauses.map((c) => String(c).trim()).filter(Boolean),
      ),
    );
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

  // The hint below Expected Attendees reacts to the attendee number itself.
  const attendeesRaw = String(proposal.expectedAttendees ?? "").trim();
  const hasZeroAttendees =
    attendeesRaw !== "" && Number(attendeesRaw) === 0;

  // Link Source of Funds to a created dues collection so the budget can fill
  // from its expected total. Matching accepts both the dropdown value
  // ("Dues Collection: <title>") and a plain title typed by hand.
  const findFeeForSource = (sourceText) => {
    const normalized = String(sourceText || "").trim().toLowerCase();
    if (!normalized) return null;
    return (
      duesCollections.find((fee) => {
        const title = String(fee?.title || "").trim().toLowerCase();
        return (
          normalized === `dues collection: ${title}` || normalized === title
        );
      }) || null
    );
  };

  const feeExpectedTotal = (fee) => {
    if (!fee) return null;
    const expected = Number(fee.expectedCollection);
    if (Number.isFinite(expected)) return expected;
    const amount = Number(fee.amount);
    return Number.isFinite(amount) ? amount : null;
  };

  const linkedFee = findFeeForSource(proposal.sourceOfFunds);
  const linkedFeeTotal = feeExpectedTotal(linkedFee);

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
                    {meetings.map((meeting) => {
                      const isAdopted = adoptedMeetingIds.has(
                        String(meeting._id),
                      );
                      return (
                        <option
                          key={meeting._id}
                          value={meeting._id}
                          disabled={isAdopted}
                        >
                          {formatMeetingLabel(meeting, isAdopted)}
                        </option>
                      );
                    })}
                  </select>
                  {meetings.length === 0 && (
                    <span className="mt-1 block text-[10px] font-normal text-slate-500">
                      No concluded meetings are available yet. Hold the meeting
                      first, then draft its resolution.
                    </span>
                  )}
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Resolution Title <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={200}
                    required
                  />
                </label>
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
                <label className={`${labelClass} md:col-span-2`}>
                  Target Audience <span className="text-rose-600">*</span>
                  <select
                    className={inputClass}
                    name="targetAudience"
                    value={proposal.targetAudience}
                    onChange={handleAudienceChange}
                    required
                  >
                    {audiences.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Expected Attendees <span className="text-rose-600">*</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={inputClass}
                    name="expectedAttendees"
                    value={proposal.expectedAttendees}
                    onChange={handleAttendeesChange}
                    required
                  />
                  {rosterCount != null && (
                    <span className="mt-1 block text-[10px] font-normal text-slate-500">
                      {hasZeroAttendees ? (
                        <span className="font-bold text-amber-700">
                          No attendees in {proposal.targetAudience}.
                        </span>
                      ) : proposal.targetAudience === "Org Members Only" ? (
                        <>
                          Total members registered in{" "}
                          {proposal.targetAudience} is {rosterCount}.{" "}
                          {rosterCount === 0 &&
                            "No members to invite yet — register members first. "}
                        </>
                      ) : (
                        <>
                          Enter the expected number of attendees for{" "}
                          {proposal.targetAudience}.
                        </>
                      )}{" "}
                      {proposal.targetAudience === "Org Members Only" && (
                        <button
                          type="button"
                          onClick={fillAttendeesFromRoster}
                          className="font-bold text-[#4A0E17] hover:underline"
                        >
                          Use roster count
                        </button>
                      )}
                    </span>
                  )}
                </label>
                <label className={labelClass}>
                  Source of Funds <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="sourceOfFunds"
                    value={proposal.sourceOfFunds}
                    onChange={handleSourceOfFundsChange}
                    list="dues-collections"
                    maxLength={200}
                    required
                  />
                  <datalist id="dues-collections">
                    {duesCollections.map((fee) => {
                      const total = feeExpectedTotal(fee);
                      return (
                        <option
                          key={fee._id}
                          value={`Dues Collection: ${fee.title}`}
                        >
                          {total != null
                            ? `${formatPeso(total)} expected`
                            : fee.title}
                        </option>
                      );
                    })}
                  </datalist>
                  {duesCollections.length === 0 && (
                    <span className="mt-1 block text-[10px] font-normal text-slate-500">
                      No dues collections created yet — type the fund source
                      manually.
                    </span>
                  )}
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
                  {linkedFee && (
                    <span className="mt-1 block text-[10px] font-normal text-slate-500">
                      From {linkedFee.title}:{" "}
                      {linkedFeeTotal != null
                        ? `${formatPeso(linkedFeeTotal)} expected`
                        : "no amount set"}
                      {Number(linkedFee.targetMemberCount) > 0 &&
                        Number(linkedFee.amount) > 0 &&
                        ` (${linkedFee.targetMemberCount} members × ${formatPeso(linkedFee.amount)})`}
                      .{" "}
                      {linkedFeeTotal != null && (
                        <button
                          type="button"
                          onClick={applyFeeBudget}
                          className="font-bold text-[#4A0E17] hover:underline"
                        >
                          Use expected total
                        </button>
                      )}
                    </span>
                  )}
                </label>
                <label className={labelClass}>
                  Project Lead Person <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="projectLeadPerson"
                    value={proposal.projectLeadPerson}
                    onChange={handleLeadPersonChange}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Project Lead Contact <span className="text-rose-600">*</span>
                  <input
                    className={inputClass}
                    name="projectLeadContact"
                    value={proposal.projectLeadContact}
                    onChange={handleLeadContactChange}
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
                    <span className="text-rose-600">*</span>
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
