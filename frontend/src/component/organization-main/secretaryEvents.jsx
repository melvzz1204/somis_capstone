import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  CalendarDays,
  Clock3,
  Download,
  MapPin,
  QrCode,
  Search,
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

const formatEventDay = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" })
    : "N/A";

const restorePersistedQrs = async (eventId) => {
  const response = await API.get(`/events/${eventId}/attendance/qr`);
  const records = Array.isArray(response?.data) ? response.data : [];
  const grouped = {};

  await Promise.all(
    records.map(async (record) => {
      if (!record?.code) return;
      const day = Number(record.day) || 1;
      const image = await QRCode.toDataURL(record.code, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push({
        ...record,
        day,
        payload: record.code,
        image,
      });
    }),
  );

  return grouped;
};

export default function SecretaryEvents({ proposals = [] }) {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [eventView, setEventView] = useState("active");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date().getTime());
  const [qrConfigDialog, setQrConfigDialog] = useState(null);
  const [selectedQrDay, setSelectedQrDay] = useState(1);
  const [selectedQrPhases, setSelectedQrPhases] = useState([
    "morning_in",
    "lunch_out",
    "afternoon_in",
    "afternoon_out",
  ]);
  const [qrSchedule, setQrSchedule] = useState({
    morningIn: "08:00",
    morningOut: "12:00",
    afternoonIn: "13:00",
    afternoonOut: "17:00",
  });
  const [qrImagesByEvent, setQrImagesByEvent] = useState({});
  const [qrLoading, setQrLoading] = useState(false);
  const [attendanceDialog, setAttendanceDialog] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");

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

    const loadEventsAndQrs = async () => {
      try {
        const response = await API.get("/events");
        const loadedEvents = Array.isArray(response?.data) ? response.data : [];
        if (!active) return;
        setEvents(loadedEvents);

        const restoredResults = await Promise.allSettled(
          loadedEvents.map(async (event) => ({
            eventId: event._id,
            groups: await restorePersistedQrs(event._id),
          })),
        );
        if (!active) return;

        const restoredByEvent = {};
        restoredResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          if (Object.keys(result.value.groups).length > 0) {
            restoredByEvent[result.value.eventId] = result.value.groups;
          }
        });
        setQrImagesByEvent(restoredByEvent);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load events.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEventsAndQrs();
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

  const activeEvents = trackedEvents.filter(
    (event) => event.lifecycle.status !== "Ended",
  );
  const archivedEvents = trackedEvents
    .filter((event) => event.lifecycle.status === "Ended")
    .sort(
      (first, second) =>
        new Date(second.endDateTime).getTime() -
        new Date(first.endDateTime).getTime(),
    );
  const visibleEvents = eventView === "archive" ? archivedEvents : activeEvents;
  const statusCounts = activeEvents.reduce(
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

  const getEventDays = (event) => {
    if (event.attendanceDays?.length) return event.attendanceDays;

    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    const firstDate = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const lastDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const days = [];

    for (
      const date = new Date(firstDate);
      date <= lastDate;
      date.setDate(date.getDate() + 1)
    ) {
      days.push({
        day: days.length + 1,
        date: new Date(date),
        schedule: event.attendanceSchedule,
      });
    }

    return days.length
      ? days
      : [
          {
            day: 1,
            date: event.startDateTime,
            schedule: event.attendanceSchedule,
          },
        ];
  };

  const openQrConfiguration = (event) => {
    const day = getEventDays(event)[0];
    setSelectedQrDay(day.day);
    setSelectedQrPhases([
      "morning_in",
      "lunch_out",
      "afternoon_in",
      "afternoon_out",
    ]);
    setQrSchedule({
      morningIn: day.schedule?.morningIn || "08:00",
      morningOut: day.schedule?.morningOut || "12:00",
      afternoonIn: day.schedule?.afternoonIn || "13:00",
      afternoonOut: day.schedule?.afternoonOut || "17:00",
    });
    setQrConfigDialog(event);
  };

  const selectQrDay = (event, dayNumber) => {
    const day = getEventDays(event).find(
      (item) => item.day === Number(dayNumber),
    );
    setSelectedQrDay(Number(dayNumber));
    setQrSchedule({
      morningIn: day?.schedule?.morningIn || "08:00",
      morningOut: day?.schedule?.morningOut || "12:00",
      afternoonIn: day?.schedule?.afternoonIn || "13:00",
      afternoonOut: day?.schedule?.afternoonOut || "17:00",
    });
  };

  const generateQr = async (event) => {
    setQrLoading(true);
    setError("");
    if (!selectedQrPhases.length) {
      setQrLoading(false);
      setError("Select at least one attendance checkpoint.");
      return;
    }
    try {
      const selectedSchedule = Object.fromEntries(
        attendancePhases
          .filter(({ key }) => selectedQrPhases.includes(key))
          .map(({ key }) => {
            const field = {
              morning_in: "morningIn",
              lunch_out: "morningOut",
              afternoon_in: "afternoonIn",
              afternoon_out: "afternoonOut",
            }[key];
            return [field, qrSchedule[field]];
          }),
      );
      const scheduleResponse = await API.patch(
        `/events/${event._id}/attendance/schedule`,
        { day: selectedQrDay, schedule: selectedSchedule },
      );
      const savedSchedule = scheduleResponse.data || {
        schedule: qrSchedule,
      };
      const generated = await Promise.all(
        attendancePhases
          .filter(({ key }) => selectedQrPhases.includes(key))
          .map(async ({ key: phase, label }) => {
            const response = await API.post(
              `/events/${event._id}/attendance/qr`,
              { day: selectedQrDay, phase },
            );
            const payload = response.code || response.data?.code;
            if (!payload)
              throw new Error(`The server did not return ${label}.`);
            const image = await QRCode.toDataURL(payload, {
              width: 360,
              margin: 2,
              errorCorrectionLevel: "M",
            });
            return { phase, label, payload, image };
          }),
      );
      setQrImagesByEvent((current) => ({
        ...current,
        [event._id]: {
          ...(current[event._id] || {}),
          [selectedQrDay]: generated.map((qr) => ({
            ...qr,
            day: selectedQrDay,
          })),
        },
      }));
      setEvents((current) =>
        current.map((item) => {
          if (item._id !== event._id) return item;
          const days = getEventDays(item).map((day) =>
            day.day === selectedQrDay
              ? { ...day, schedule: savedSchedule.schedule || qrSchedule }
              : day,
          );
          return {
            ...item,
            attendanceDays: days,
            attendanceSchedule: savedSchedule.schedule || qrSchedule,
          };
        }),
      );
      setQrConfigDialog(null);
      showToast(
        `Day ${selectedQrDay} schedule saved and ${generated.length} QR code${generated.length === 1 ? "" : "s"} generated.`,
        "success",
      );
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
    setAttendanceSearch("");
    setAttendanceDialog({
      event,
      records: [],
      summary: null,
      checkpoints: [],
    });
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const response = await API.get(`/events/${event._id}/attendance`);
      setAttendanceDialog((current) => ({
        ...current,
        records: response.data || [],
        summary: response.summary || null,
        checkpoints: response.checkpoints || [],
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

  const revokeQr = async (event, qr) => {
    if (!event || !qr) return;
    if (
      !window.confirm(
        `Revoke the Day ${qr.day} ${qr.label} QR code? Students will no longer be able to scan it.`,
      )
    ) {
      return;
    }
    try {
      await API.delete(`/events/${event._id}/attendance/qr`, {
        data: { day: qr.day, phase: qr.phase },
      });
      setQrImagesByEvent((current) => {
        const eventQrs = { ...(current[event._id] || {}) };
        const remaining = (eventQrs[qr.day] || []).filter(
          (item) => item.phase !== qr.phase,
        );
        if (remaining.length) eventQrs[qr.day] = remaining;
        else delete eventQrs[qr.day];
        return { ...current, [event._id]: eventQrs };
      });
      showToast(`${qr.label} QR revoked.`, "success");
    } catch (requestError) {
      showToast(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to revoke the QR code.",
        "error",
      );
    }
  };

  const downloadQr = (event, qr) => {
    if (!qr || !event) return;
    const link = document.createElement("a");
    link.href = qr.image;
    link.download = `${event.title}-day-${qr.day}-${qr.phase}-attendance.png`;
    link.click();
  };

  const filteredAttendanceRecords = attendanceDialog
    ? attendanceDialog.records.filter((record) => {
        const query = attendanceSearch.trim().toLocaleLowerCase();
        if (!query) return true;
        const studentName = String(
          record.student?.name || "",
        ).toLocaleLowerCase();
        return studentName.includes(query);
      })
    : [];

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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-bold text-[#4A0E17]">
              {eventView === "archive" ? "Event Archive" : "Event Tracking"} (
              {visibleEvents.length})
            </h4>
            {eventView === "active" && (
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {["Upcoming", "Ongoing", "Cancelled"].map((status) => (
                  <span
                    key={status}
                    className={`rounded-md border px-2.5 py-1 ${lifecycleStyles[status]}`}
                  >
                    {status}: {statusCounts[status] || 0}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="tablist"
            aria-label="Event views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={eventView === "active"}
              onClick={() => setEventView("active")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                eventView === "active"
                  ? "bg-[#4A0E17] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              Events ({activeEvents.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={eventView === "archive"}
              onClick={() => setEventView("archive")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                eventView === "archive"
                  ? "bg-[#4A0E17] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              Archive ({archivedEvents.length})
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-xs text-slate-500">Loading events...</p>
        ) : visibleEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500">
            {eventView === "archive"
              ? "Events will appear here automatically after they end."
              : "No active events created yet."}
          </div>
        ) : (
          visibleEvents.map((event) => (
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
                    {event.lifecycle.status === "Ongoing" && (
                      <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        {formatEventDay(now)}
                      </span>
                    )}
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
                {eventView === "active" && (
                  <button
                    type="button"
                    onClick={() => openQrConfiguration(event)}
                    disabled={
                      qrLoading || event.lifecycle.status === "Cancelled"
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Configure and Generate QR Codes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => loadAttendance(event)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" />
                  Attendance
                </button>
              </div>
              {eventView === "active" &&
                Object.keys(qrImagesByEvent[event._id] || {}).length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-[#4A0E17]">
                          Attendance QR Codes
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Each event day has unique codes accepted only during
                          its configured checkpoint windows.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openQrConfiguration(event)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Configure another day
                      </button>
                    </div>
                    {Object.entries(qrImagesByEvent[event._id]).map(
                      ([day, dayQrs]) => (
                        <div key={day} className="mb-5 last:mb-0">
                          <p className="mb-2 text-xs font-extrabold text-[#4A0E17]">
                            Day {day} ·{" "}
                            {formatEventDay(
                              getEventDays(event).find(
                                (item) => item.day === Number(day),
                              )?.date,
                            )}
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {dayQrs.map((qr) => (
                              <div
                                key={`${day}-${qr.phase}`}
                                className="rounded-lg border border-slate-200 p-3 text-center"
                              >
                                <p className="text-[11px] font-extrabold text-[#4A0E17]">
                                  {qr.label}
                                </p>
                                <img
                                  src={qr.image}
                                  alt={`Day ${day} ${qr.label} attendance QR`}
                                  className="mx-auto mt-2 aspect-square w-full max-w-40"
                                />
                                <div className="mt-2 flex items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => downloadQr(event, qr)}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-[#4A0E17]"
                                  >
                                    <Download className="h-3.5 w-3.5" />{" "}
                                    Download
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => revokeQr(event, qr)}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </article>
          ))
        )}
      </div>

      {qrConfigDialog && (
        <div className="modal-backdrop">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              generateQr(qrConfigDialog);
            }}
            className="modal-panel max-w-lg p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#7A610D]">
                  Attendance QR schedule
                </p>
                <h3 className="mt-1 text-base font-extrabold text-[#4A0E17]">
                  {qrConfigDialog.title}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setQrConfigDialog(null)}
                aria-label="Close QR configuration"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block text-[11px] font-bold text-slate-700">
              Event date
              <select
                value={selectedQrDay}
                onChange={(event) =>
                  selectQrDay(qrConfigDialog, event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#4A0E17]"
              >
                {getEventDays(qrConfigDialog).map((day) => (
                  <option key={day.day} value={day.day}>
                    {formatEventDay(day.date)}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-bold text-slate-700">
                Checkpoints to create
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {attendancePhases.map(({ key, label }) => {
                  const field = {
                    morning_in: "morningIn",
                    lunch_out: "morningOut",
                    afternoon_in: "afternoonIn",
                    afternoon_out: "afternoonOut",
                  }[key];
                  const selected = selectedQrPhases.includes(key);
                  return (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-[11px] font-bold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setSelectedQrPhases((current) =>
                            selected
                              ? current.filter((item) => item !== key)
                              : [...current, key],
                          )
                        }
                      />
                      <span className="flex-1">{label}</span>
                      <input
                        type="time"
                        required={selected}
                        disabled={!selected}
                        value={qrSchedule[field]}
                        onChange={(event) =>
                          setQrSchedule((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#4A0E17] disabled:bg-slate-100"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500">
              Select one or more checkpoints. Only selected QR codes will be
              created. Selected times must be chronological; unselected
              checkpoints may be configured later.
            </p>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setQrConfigDialog(null)}
                disabled={qrLoading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={qrLoading}
                className="btn-primary inline-flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                {qrLoading ? "Generating..." : "Save and Generate"}
              </button>
            </div>
          </form>
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
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label className="block text-[10px] font-bold uppercase text-amber-800">
                    Attendance fine per absence
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={
                        attendanceDialog.event.attendanceFineAmount ?? ""
                      }
                      onBlur={async (e) => {
                        const amount = Number(e.target.value || 0);
                        try {
                          await API.patch(
                            `/events/${attendanceDialog.event._id}/attendance/fine`,
                            { amount },
                          );
                          setAttendanceDialog((current) => ({
                            ...current,
                            event: {
                              ...current.event,
                              attendanceFineAmount: amount,
                            },
                          }));
                        } catch (error) {
                          setAttendanceError(
                            error.message || "Unable to save attendance fine.",
                          );
                        }
                      }}
                      className="w-40 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs"
                    />
                    <span className="self-center text-xs text-amber-800">
                      per absent student
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-amber-700">
                    After the event, pending attendance records can be finalized
                    into student fines.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await API.post(
                          `/events/${attendanceDialog.event._id}/attendance/finalize-fines`,
                        );
                        setAttendanceError("");
                        await loadAttendance(attendanceDialog.event);
                      } catch (error) {
                        setAttendanceError(
                          error.message ||
                            "Unable to finalize attendance fines.",
                        );
                      }
                    }}
                    className="mt-3 rounded-lg bg-[#4A0E17] px-3 py-2 text-[10px] font-bold text-white"
                  >
                    Finalize absent-student fines
                  </button>
                </div>
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
                <div className="mt-4">
                  <label
                    htmlFor="attendance-name-search"
                    className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500"
                  >
                    Search student name
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="attendance-name-search"
                      type="search"
                      value={attendanceSearch}
                      onChange={(event) =>
                        setAttendanceSearch(event.target.value)
                      }
                      placeholder="Type a student name..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                    />
                  </div>
                </div>
                <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-100">
                  {attendanceDialog.records.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-500">
                      No students have checked in yet.
                    </p>
                  ) : filteredAttendanceRecords.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-500">
                      No student names match “{attendanceSearch.trim()}”.
                    </p>
                  ) : (
                    <table className="min-w-full text-left text-[10px]">
                      <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-bold">Student</th>
                          {attendanceDialog.checkpoints.map((checkpoint) => (
                            <th
                              key={`${checkpoint.day}-${checkpoint.phase}`}
                              className="whitespace-nowrap px-3 py-2 font-bold"
                            >
                              Day {checkpoint.day} {checkpoint.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendanceRecords.map((record) => (
                          <tr
                            key={record._id}
                            className="border-t border-slate-100"
                          >
                            <td className="min-w-40 px-3 py-2.5">
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
                            </td>
                            {attendanceDialog.checkpoints.map((checkpoint) => {
                              const dailyRecord = record.days?.find(
                                (day) => Number(day.day) === checkpoint.day,
                              );
                              const scannedAt = dailyRecord?.[checkpoint.field];
                              return (
                                <td
                                  key={`${checkpoint.day}-${checkpoint.phase}`}
                                  className="whitespace-nowrap px-3 py-2.5"
                                >
                                  <span
                                    className={`rounded-md border px-2 py-1 font-bold ${scannedAt ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-400"}`}
                                  >
                                    {scannedAt
                                      ? new Date(scannedAt).toLocaleTimeString(
                                          "en-PH",
                                          {
                                            hour: "numeric",
                                            minute: "2-digit",
                                          },
                                        )
                                      : "Not scanned"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
