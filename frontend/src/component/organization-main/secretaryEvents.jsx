import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import API from "../../api/axios";
import {
  formatCountdown,
  getEventLifecycle,
  lifecycleStyles,
} from "../../util/eventLifecycle";
import { useToast } from "../../util/toastContext";

const emptyForm = { proposal: "" };

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

export default function SecretaryEvents({ proposals = [] }) {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date().getTime());

  const approvedProposals = useMemo(
    () => proposals.filter((proposal) => proposal.status === "Approved"),
    [proposals],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    API.get("/events")
      .then((response) => {
        if (!active) return;
        setEvents(response.data?.data || response.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const existingProposalIds = new Set(
    events.map((event) => event.proposal?._id || event.proposal),
  );
  const availableProposals = approvedProposals.filter(
    (proposal) => !existingProposalIds.has(proposal._id),
  );

  const trackedEvents = useMemo(
    () =>
      events
        .map((event) => ({
          ...event,
          lifecycle: getEventLifecycle(event, now),
        }))
        .sort((first, second) => {
          const statusOrder = {
            Ongoing: 0,
            Upcoming: 1,
            Ended: 2,
            Cancelled: 3,
          };
          const statusDifference =
            statusOrder[first.lifecycle.status] -
            statusOrder[second.lifecycle.status];
          if (statusDifference !== 0) return statusDifference;
          return (
            new Date(first.startDateTime).getTime() -
            new Date(second.startDateTime).getTime()
          );
        }),
    [events, now],
  );

  const statusCounts = trackedEvents.reduce(
    (counts, event) => ({
      ...counts,
      [event.lifecycle.status]: (counts[event.lifecycle.status] || 0) + 1,
    }),
    {},
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.proposal) {
      setError("Choose an approved proposal first.");
      return;
    }
    setSaving(true);
    try {
      const response = await API.post("/events", form);
      setEvents((current) => [
        response.data?.data || response.data,
        ...current,
      ]);
      setForm(emptyForm);
      showToast("Event created from the approved proposal.", "success");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || "Unable to create the event.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-[#4A0E17]">
          Organization Events
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Create an event from a proposal that received final approval from the
          president and adviser.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
      >
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Approved proposal <span className="text-rose-600">*</span>
          </label>
          <select
            value={form.proposal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                proposal: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-[#4A0E17] focus:outline-none"
          >
            <option value="">Choose an approved proposal</option>
            {availableProposals.map((proposal) => (
              <option key={proposal._id} value={proposal._id}>
                {proposal.proposalTitle}
              </option>
            ))}
          </select>
          {availableProposals.length === 0 && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              No unused final-approved proposals are available.
            </p>
          )}
        </div>

        {form.proposal &&
          (() => {
            const proposal = approvedProposals.find(
              (item) => item._id === form.proposal,
            );
            return proposal ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900">
                <p className="font-bold">{proposal.proposalTitle}</p>
                <p className="mt-1">
                  Approved schedule:{" "}
                  {formatDateTime(proposal.requestedStartDateTime)} –{" "}
                  {formatDateTime(proposal.requestedEndDateTime)}
                </p>
                <p className="mt-1">Venue: {proposal.targetVenue}</p>
              </div>
            ) : null;
          })()}

        {error && (
          <p className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving || availableProposals.length === 0}
          className="rounded-xl bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating event..." : "Create Event"}
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-bold text-[#4A0E17]">
            Event Tracking ({events.length})
          </h4>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            {["Upcoming", "Ongoing", "Ended"].map((status) => (
              <span
                key={status}
                className={`rounded-md border px-2.5 py-1 ${lifecycleStyles[status]}`}
              >
                {status}: {statusCounts[status] || 0}
              </span>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="text-xs text-slate-500">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500">
            No events created yet.
          </div>
        ) : (
          trackedEvents.map((event) => (
            <article
              key={event._id}
              className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-xs"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#4A0E17]">
                      {event.title}
                    </p>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${lifecycleStyles[event.lifecycle.status]}`}
                    >
                      {event.lifecycle.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {formatDateTime(event.startDateTime)} -{" "}
                      {formatDateTime(event.endDateTime)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {event.venue}
                    </p>
                  </div>
                </div>
                {event.lifecycle.target && (
                  <div
                    className={`min-w-36 rounded-lg border px-3 py-2 ${lifecycleStyles[event.lifecycle.status]}`}
                    aria-live="polite"
                  >
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {event.lifecycle.status === "Ongoing"
                        ? "Ends in"
                        : "Starts in"}
                    </p>
                    <p className="mt-1 text-sm font-extrabold tabular-nums">
                      {formatCountdown(event.lifecycle.remainingMs)}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
