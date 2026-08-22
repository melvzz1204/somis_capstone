import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  CalendarDays,
  Clock3,
  Download,
  MapPin,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
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
  const [qrDialog, setQrDialog] = useState(null);
  const [qrImages, setQrImages] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [attendanceDialog, setAttendanceDialog] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

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

  const attendancePhases = [
    { key: "morning_in", label: "Morning time in" },
    { key: "lunch_out", label: "Lunch break time out" },
    { key: "afternoon_in", label: "Afternoon time in" },
    { key: "afternoon_out", label: "Afternoon time out" },
  ];

  const generateQr = async (event) => {
    setQrLoading(true);
    setError("");
    try {
      const generated = await Promise.all(
        attendancePhases.map(async ({ key: phase, label }) => {
          const response = await API.post(
            `/events/${event._id}/attendance/qr`,
            { phase },
          );
          const payload = response.code || response.data?.code;
          if (!payload) throw new Error(`The server did not return ${label}.`);
          const image = await QRCode.toDataURL(payload, {
            width: 360,
            margin: 2,
            errorCorrectionLevel: "M",
          });
          return { phase, label, payload, image };
        }),
      );
      setQrImages(generated);
      setQrDialog({ event });
      showToast("Four attendance QR codes generated.", "success");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to generate the attendance QR codes.";
      setError(message);
      showToast(message, "error");
    } finally {
      setQrLoading(false);
    }
  };

  const loadAttendance = async (event) => {
    setAttendanceDialog({ event, records: [], summary: null });
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const response = await API.get(`/events/${event._id}/attendance`);
      setAttendanceDialog((current) => ({
        ...current,
        records: response.data || [],
        summary: response.summary || null,
      }));
    } catch (requestError) {
      setAttendanceError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load attendance.",
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  const downloadQr = (qr) => {
    if (!qr || !qrDialog) return;
    const link = document.createElement("a");
    link.href = qr.image;
    link.download = `${qrDialog.event.title}-${qr.phase}-attendance.png`;
    link.click();
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
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => generateQr(event)}
                  disabled={qrLoading || event.lifecycle.status !== "Ongoing"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate 4 Attendance QR Codes
                </button>
                <button
                  type="button"
                  onClick={() => loadAttendance(event)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" />
                  Attendance
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {qrDialog && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md p-5 text-center">
            <div className="flex items-start justify-between gap-3 text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A610D]">
                  Four attendance checkpoints
                </p>
                <h3 className="mt-1 text-base font-extrabold text-[#4A0E17]">
                  {qrDialog.event.title}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setQrDialog(null)}
                aria-label="Close QR code"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Display each code only during its checkpoint. Students who joined
              the event can scan all four codes to complete attendance.
            </p>
            <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {qrImages.map((qr) => (
                <div
                  key={qr.phase}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <p className="text-xs font-extrabold text-[#4A0E17]">
                    {qr.label}
                  </p>
                  <img
                    src={qr.image}
                    alt={`${qr.label} attendance QR`}
                    className="mx-auto mt-2 h-40 w-40"
                  />
                  <button
                    type="button"
                    onClick={() => downloadQr(qr)}
                    className="btn-secondary mt-2 inline-flex items-center gap-2 text-[11px]"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setQrDialog(null)}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {attendanceDialog && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A610D]">
                  Attendance roster
                </p>
                <h3 className="mt-1 text-base font-extrabold text-[#4A0E17]">
                  {attendanceDialog.event.title}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setAttendanceDialog(null)}
                aria-label="Close attendance roster"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {attendanceLoading ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Loading attendance...
              </p>
            ) : attendanceError ? (
              <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {attendanceError}
              </p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                  {["total", "joined", "pending", "present"].map((key) => (
                    <div key={key} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        {key === "total" ? "Expected" : key}
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-[#4A0E17]">
                        {attendanceDialog.summary?.[key] || 0}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-100">
                  {attendanceDialog.records.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-500">
                      No students have checked in yet.
                    </p>
                  ) : (
                    attendanceDialog.records.map((record) => (
                      <div
                        key={record._id}
                        className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-700">
                            {record.student?.name ||
                              record.student?.email ||
                              "Student"}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">
                            {record.student?.email ||
                              record.member?.idNumber ||
                              ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] font-bold ${record.status === "Present" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                        >
                          {record.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
