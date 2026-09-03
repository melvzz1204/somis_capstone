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
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      if (editingMeeting) {
        const response = await API.patch(
          `/meetings/${editingMeeting._id}`,
          form,
        );
        setMeetings((current) =>
          current.map((item) =>
            item._id === editingMeeting._id ? response.data : item,
          ),
        );
        showToast("Meeting updated successfully.", "success");
      } else {
        const response = await API.post("/meetings", form);
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
              <option>Students</option>
              <option>Officers</option>
            </select>
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
                <div className="flex shrink-0 gap-2">
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
    </div>
  );
}
