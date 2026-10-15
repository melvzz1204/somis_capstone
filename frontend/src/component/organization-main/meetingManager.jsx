import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";
import {
  PAST,
  UPCOMING,
  partitionMeetingsByStatus,
} from "../../util/meetingStatus";

const emptyForm = {
  title: "",
  description: "",
  startDateTime: "",
  endDateTime: "",
  venue: "",
  audience: "All Members",
  targetYear: "",
  targetSection: "",
};

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // Render the stored UTC instant as Asia/Manila wall time for the
  // datetime-local input, regardless of the browser's local timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
};

// datetime-local gives Manila wall time without an offset. Convert to an
// explicit UTC ISO string so a UTC-hosted server doesn't misinterpret it
// (which caused the ~8-hour shift).
const toApiDateTime = (value) => {
  if (!value) return value;
  const str = String(value).trim();
  // Already carries timezone info — parse directly.
  if (/[Zz]$|[+-]\d{2}:?\d{2}$/.test(str)) {
    const direct = new Date(str);
    return Number.isNaN(direct.getTime()) ? value : direct.toISOString();
  }
  // Assume Asia/Manila wall time (datetime-local has no offset).
  const withOffset = /T\d{2}:\d{2}:\d{2}$/.test(str)
    ? `${str}+08:00`
    : `${str}:00+08:00`;
  const parsed = new Date(withOffset);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

export default function MeetingManager() {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(UPCOMING);
  const [now, setNow] = useState(() => new Date().getTime());

  // Attendance marking (president): roster + RSVPs + saved present/absent.
  const [attendanceMeeting, setAttendanceMeeting] = useState(null);
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [attendanceJoins, setAttendanceJoins] = useState([]);
  const [attendanceChecks, setAttendanceChecks] = useState({});
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [isAttendanceSaving, setIsAttendanceSaving] = useState(false);
  // Section suggestions for the optional section target.
  const [sectionOptions, setSectionOptions] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  const ensureSectionOptions = async () => {
    if (sectionsLoaded) return;
    try {
      const roster = await API.get("/orgmembers");
      const sections = [
        ...new Set(
          (Array.isArray(roster) ? roster : [])
            .map((member) => String(member.section || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b));
      setSectionOptions(sections);
    } catch {
      // Suggestions are optional; free-text entry still works.
    } finally {
      setSectionsLoaded(true);
    }
  };

  const loadMeetings = async () => {
    try {
      const response = await API.get("/meetings", {
        params: { view: "manage" },
      });
      setMeetings(response?.data || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load meetings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const request = window.setTimeout(() => {
      loadMeetings();
    }, 0);
    return () => window.clearTimeout(request);
  }, []);

  // Keep the Upcoming/Past tabs in sync as meetings end over time.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date().getTime()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMeeting(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
    ensureSectionOptions();
  };

  const openEdit = (meeting) => {
    setEditingMeeting(meeting);
    setForm({
      title: meeting.title || "",
      description: meeting.description || "",
      startDateTime: toDateTimeLocal(meeting.startDateTime),
      endDateTime: toDateTimeLocal(meeting.endDateTime),
      venue: meeting.venue || "",
      audience: meeting.audience || "All Members",
      targetYear: meeting.targetYear || "",
      targetSection: meeting.targetSection || "",
    });
    setIsFormOpen(true);
    ensureSectionOptions();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    const payload = {
      ...form,
      startDateTime: toApiDateTime(form.startDateTime),
      endDateTime: toApiDateTime(form.endDateTime),
    };
    try {
      if (editingMeeting) {
        const response = await API.patch(
          `/meetings/${editingMeeting._id}`,
          payload,
        );
        setMeetings((current) =>
          current.map((item) =>
            item._id === editingMeeting._id ? response.data : item,
          ),
        );
        showToast("Meeting updated successfully.", "success");
      } else {
        const response = await API.post("/meetings", payload);
        setMeetings((current) => [response.data, ...current]);
        showToast("Meeting created successfully.", "success");
      }
      closeForm();
    } catch (requestError) {
      setError(requestError.message || "Unable to save meeting.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMeeting = async (meeting) => {
    if (!window.confirm(`Delete the meeting “${meeting.title}”?`)) return;
    setDeletingId(meeting._id);
    try {
      await API.delete(`/meetings/${meeting._id}`);
      setMeetings((current) =>
        current.filter((item) => item._id !== meeting._id),
      );
      showToast("Meeting deleted successfully.", "success");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete meeting.");
    } finally {
      setDeletingId("");
    }
  };

  const { upcoming: upcomingMeetings = [], past: pastMeetings = [] } = useMemo(
    () => partitionMeetingsByStatus(meetings, now),
    [meetings, now],
  );

  const openAttendance = async (meeting) => {
    setAttendanceMeeting(meeting);
    setAttendanceRoster([]);
    setAttendanceJoins([]);
    setAttendanceChecks({});
    setAttendanceSearch("");
    setIsAttendanceLoading(true);
    try {
      const [rosterResponse, attendanceResponse] = await Promise.all([
        API.get("/orgmembers"),
        API.get(`/meetings/${meeting._id}/attendance`),
      ]);
      const roster = Array.isArray(rosterResponse) ? rosterResponse : [];
      const eligible = roster.filter(
        (member) =>
          !["Faculty Adviser", "Department Dean"].includes(member.role),
      );
      const joins = attendanceResponse?.data?.joins || [];
      const saved = attendanceResponse?.data?.attendance || [];
      const joinedEmails = new Set(
        joins.map((join) => String(join.email || "").toLowerCase()),
      );
      const savedByEmail = {};
      saved.forEach((record) => {
        savedByEmail[String(record.email || "").toLowerCase()] = record;
      });
      const initialChecks = {};
      eligible.forEach((member) => {
        const key = String(member.email || "").toLowerCase();
        if (!key) return;
        initialChecks[key] = savedByEmail[key]
          ? Boolean(savedByEmail[key].present)
          : joinedEmails.has(key);
      });
      setAttendanceRoster(eligible);
      setAttendanceJoins(joins);
      setAttendanceChecks(initialChecks);
    } catch (requestError) {
      setError(requestError.message || "Unable to load attendance.");
      setAttendanceMeeting(null);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const closeAttendance = () => {
    setAttendanceMeeting(null);
    setAttendanceRoster([]);
    setAttendanceJoins([]);
    setAttendanceChecks({});
    setAttendanceSearch("");
  };

  const saveAttendance = async () => {
    if (!attendanceMeeting || isAttendanceSaving) return;
    setIsAttendanceSaving(true);
    setError("");
    try {
      const joinUserByEmail = {};
      attendanceJoins.forEach((join) => {
        joinUserByEmail[String(join.email || "").toLowerCase()] = join.user;
      });
      const records = attendanceRoster
        .map((member) => {
          const email = String(member.email || "").toLowerCase();
          if (!email) return null;
          return {
            email,
            name: member.name || "",
            user: joinUserByEmail[email] || null,
            present: Boolean(attendanceChecks[email]),
          };
        })
        .filter(Boolean);
      const response = await API.put(
        `/meetings/${attendanceMeeting._id}/attendance`,
        { records },
      );
      const saved = response?.data || {};
      setMeetings((current) =>
        current.map((item) =>
          item._id === attendanceMeeting._id
            ? {
                ...item,
                attendance: saved.attendance || [],
                presentCount: saved.presentCount ?? 0,
              }
            : item,
        ),
      );
      showToast("Attendance saved successfully.", "success");
      closeAttendance();
    } catch (requestError) {
      setError(requestError.message || "Unable to save attendance.");
    } finally {
      setIsAttendanceSaving(false);
    }
  };

  const filteredAttendanceRoster = attendanceRoster.filter((member) => {
    const query = attendanceSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      member.name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.section?.toLowerCase().includes(query)
    );
  });
  const joinedEmailSet = useMemo(
    () =>
      new Set(
        attendanceJoins.map((join) => String(join.email || "").toLowerCase()),
      ),
    [attendanceJoins],
  );
  const markedPresentCount =
    Object.values(attendanceChecks).filter(Boolean).length;

  const activeMeetings =
    activeTab === UPCOMING ? upcomingMeetings : pastMeetings;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-[#4A0E17]">
            Organization Meetings
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Create meetings and notify only the members included in the selected
            audience.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (isFormOpen ? closeForm() : openCreate())}
          className="self-start rounded-lg bg-[#4A0E17] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#601520] sm:self-auto"
        >
          {isFormOpen ? "Close Form" : "+ Add Meeting"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab(UPCOMING)}
          aria-pressed={activeTab === UPCOMING}
          className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
            activeTab === UPCOMING
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          Upcoming ({upcomingMeetings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(PAST)}
          aria-pressed={activeTab === PAST}
          className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
            activeTab === PAST
              ? "border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#7A610D]"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          Past ({pastMeetings.length})
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
        >
          <div className="flex items-center justify-between md:col-span-2">
            <h4 className="text-sm font-extrabold text-[#4A0E17]">
              {editingMeeting ? "Edit Meeting" : "Create a Meeting"}
            </h4>
            {editingMeeting && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-slate-500 hover:text-[#4A0E17]"
              >
                Switch to new meeting
              </button>
            )}
          </div>
          <label className="text-xs font-bold text-slate-700 md:col-span-2">
            Meeting title *
            <input
              required
              name="title"
              value={form.title}
              onChange={updateField}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
              placeholder="e.g. General Membership Meeting"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Start date and time *
            <input
              required
              type="datetime-local"
              name="startDateTime"
              value={form.startDateTime}
              onChange={updateField}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            End date and time *
            <input
              required
              type="datetime-local"
              name="endDateTime"
              value={form.endDateTime}
              onChange={updateField}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Venue *
            <input
              required
              name="venue"
              value={form.venue}
              onChange={updateField}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
              placeholder="e.g. AVR 、生"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Targeted audience *
            <select
              name="audience"
              value={form.audience}
              onChange={updateField}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
            >
              <option>All Members</option>
              <option>Officers</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">
            Year level target
            <select
              name="targetYear"
              value={form.targetYear}
              onChange={updateField}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
            >
              <option value="">All year levels</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year} only
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">
            Section target{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <input
              name="targetSection"
              value={form.targetSection}
              onChange={updateField}
              list="meeting-section-options"
              maxLength={60}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
              placeholder="e.g. BSIS - 2 A"
            />
            <datalist id="meeting-section-options">
              {sectionOptions.map((section) => (
                <option key={section} value={section} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-bold text-slate-700 md:col-span-2">
            Details
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows="3"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#4A0E17]"
              placeholder="Add an agenda or other meeting details."
            />
          </label>
          <div className="flex justify-end md:col-span-2">
            <button
              disabled={isSaving}
              className="rounded-lg bg-[#4A0E17] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#601520] disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : editingMeeting
                  ? "Save Changes"
                  : "Create Meeting"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-xs text-slate-500">Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500">
          No meetings created yet.
        </div>
      ) : activeMeetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
          {activeTab === UPCOMING
            ? "No upcoming meetings. Create one with the button above."
            : "No past meetings yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {activeMeetings.map((meeting) => (
            <article
              key={meeting._id}
              className={
                activeTab === PAST
                  ? "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-80"
                  : "rounded-xl border border-slate-200 bg-white p-4"
              }
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-[#4A0E17]">
                      {meeting.title}
                    </h4>
                    <span className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold text-[#7A610D]">
                      {meeting.audience}
                    </span>
                    {(meeting.joinCount ?? 0) > 0 && (
                      <span className="rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        👥 {meeting.joinCount} joining
                      </span>
                    )}
                    {(meeting.presentCount ?? 0) > 0 && (
                      <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        ✓ {meeting.presentCount} attended
                      </span>
                    )}
                    {meeting.targetYear && (
                      <span className="rounded-md border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        {meeting.targetYear}
                      </span>
                    )}
                    {meeting.targetSection && (
                      <span className="rounded-md border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        {meeting.targetSection}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    📅 {formatDateTime(meeting.startDateTime)} –{" "}
                    {formatDateTime(meeting.endDateTime)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    📍 {meeting.venue}
                  </p>
                  {meeting.description && (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">
                      {meeting.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openAttendance(meeting)}
                    className="rounded-lg bg-[#4A0E17] px-3 py-2 text-xs font-bold text-white hover:bg-[#601520]"
                  >
                    Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(meeting)}
                    className="rounded-lg border border-[#D4AF37]/40 bg-white px-3 py-2 text-xs font-bold text-[#7A610D] hover:bg-[#D4AF37]/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMeeting(meeting)}
                    disabled={deletingId === meeting._id}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {deletingId === meeting._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ATTENDANCE MODAL (president): RSVP list + manual present/absent */}
      {attendanceMeeting && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Attendance for ${attendanceMeeting.title}`}
        >
          <div className="modal-panel max-w-2xl space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A610D]">
                  Meeting Attendance
                </p>
                <h3 className="mt-1 text-sm font-extrabold text-[#4A0E17]">
                  {attendanceMeeting.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {markedPresentCount} of {attendanceRoster.length} marked
                  present
                  {(attendanceMeeting.joinCount ?? 0) > 0 &&
                    ` • ${attendanceMeeting.joinCount} joined via RSVP`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAttendance}
                aria-label="Close attendance"
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {isAttendanceLoading ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Loading roster...
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(event) => setAttendanceSearch(event.target.value)}
                  placeholder="Search roster by name, email, or section..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#4A0E17] focus:outline-none"
                />
                <div className="max-h-[46vh] divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200">
                  {filteredAttendanceRoster.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400">
                      No roster members found.
                    </p>
                  ) : (
                    filteredAttendanceRoster.map((member) => {
                      const key = String(member.email || "").toLowerCase();
                      const checked = Boolean(attendanceChecks[key]);
                      return (
                        <label
                          key={member._id || key}
                          className={`flex cursor-pointer items-center justify-between gap-3 p-3 transition-colors hover:bg-slate-50 ${
                            checked ? "bg-emerald-50/50" : ""
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setAttendanceChecks((current) => ({
                                  ...current,
                                  [key]: !current[key],
                                }))
                              }
                              className="h-4 w-4 shrink-0 accent-emerald-600"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold text-slate-800">
                                {member.name}
                              </span>
                              <span className="block truncate text-[11px] text-slate-500">
                                {member.role}
                                {member.section ? ` • ${member.section}` : ""}
                              </span>
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {joinedEmailSet.has(key) && (
                              <span className="rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                                Joined
                              </span>
                            )}
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                checked
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              {checked ? "Present" : "Absent"}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={closeAttendance}
                className="rounded-xl border border-[#4A0E17]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAttendance}
                disabled={isAttendanceLoading || isAttendanceSaving}
                className="rounded-xl bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white hover:bg-[#601520] disabled:opacity-50"
              >
                {isAttendanceSaving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
