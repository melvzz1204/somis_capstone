import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";

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

export default function MeetingManager() {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

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

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await API.post("/meetings", form);
      setMeetings((current) => [response.data, ...current]);
      setForm(emptyForm);
      setIsFormOpen(false);
      showToast("Meeting created successfully.", "success");
    } catch (requestError) {
      setError(requestError.message || "Unable to create meeting.");
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
          onClick={() => setIsFormOpen((current) => !current)}
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

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
        >
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
              {isSaving ? "Saving..." : "Create Meeting"}
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
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <article
              key={meeting._id}
              className="rounded-xl border border-slate-200 bg-white p-4"
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
                <button
                  type="button"
                  onClick={() => deleteMeeting(meeting)}
                  disabled={deletingId === meeting._id}
                  className="self-start rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === meeting._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
