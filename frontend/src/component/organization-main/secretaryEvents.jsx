import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { realtimeSocket } from "../../api/socket";
import {
  formatCountdown,
  getEventLifecycle,
  lifecycleStyles,
} from "../../util/eventLifecycle";
import { useToast } from "../../util/toastContext";

let qrCodeModulePromise;

// Load the QR encoder on demand. It is only needed when codes are restored or
// generated, so it stays out of the Events tab's initial bundle.
const getQrCode = () => {
  if (!qrCodeModulePromise) {
    qrCodeModulePromise = import("qrcode").then(
      (module) => module.default || module,
    );
  }
  return qrCodeModulePromise;
};

const emptyForm = { resolution: "" };

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

const QR_IMAGE_WIDTH = 200;
const ATTENDANCE_PAGE_LIMIT = 50;
const EVENTS_CACHE_TTL = 60_000;
const EVENTS_STALE_AFTER = 30_000;
const LOCAL_MUTATION_GUARD_MS = 5000;
let eventsCache = null; // { orgId, data, fetchedAt }
let lastLocalEventMutationAt = 0;

// Called from event handlers (never during render) after a write made by this
// tab, so the socket echo does not trigger an unnecessary /events refetch.
const markLocalEventMutation = () => {
  lastLocalEventMutationAt = Date.now();
  eventsCache = null;
};

// QR image generation is CPU-bound. Cache the encoded images per event using
// the event's updatedAt as the version, so switching tabs does not regenerate
// the same codes. /events returns qrCount without exposing the QR secrets.
const qrImageCache = new Map();
const qrRestoreInFlight = new Map();

const hasPersistedQr = (event) =>
  (event?.qrCount ?? 0) > 0 ||
  (event?.attendanceDays || []).some((day) =>
    ["morning_in", "lunch_out", "afternoon_in", "afternoon_out"].some(
      (phase) => day?.attendanceQr?.[phase]?.generatedAt,
    ),
  );

const restorePersistedQrs = async (event) => {
  const eventId = event._id;
  const version = new Date(event.updatedAt || 0).getTime();
  const cached = qrImageCache.get(eventId);
  if (cached && cached.version === version) return cached.groups;

  // StrictMode (dev) runs the mount effect twice; share one generation pass
  // instead of burning the main thread on duplicate QR encoding.
  const requestKey = `${eventId}:${version}`;
  if (qrRestoreInFlight.has(requestKey)) {
    return qrRestoreInFlight.get(requestKey);
  }

  const restorePromise = (async () => {
    // QR codes can be many days × 4 checkpoints. A bounded timeout keeps one
    // stalled request from holding the rest of the tab hostage.
    const response = await API.get(`/events/${eventId}/attendance/qr`, {
      timeout: 15000,
    });
    const records = Array.isArray(response?.data) ? response.data : [];
    const grouped = {};
    const QRCode = await getQrCode();

    // Encode sequentially: parallel encode calls only compete for the same
    // main thread and spike memory.
    for (const record of records) {
      if (!record?.code) continue;
      const day = Number(record.day) || 1;
      const image = await QRCode.toDataURL(record.code, {
        width: QR_IMAGE_WIDTH,
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
    }

    qrImageCache.set(eventId, { version, groups: grouped });
    return grouped;
  })();

  qrRestoreInFlight.set(requestKey, restorePromise);
  try {
    return await restorePromise;
  } finally {
    qrRestoreInFlight.delete(requestKey);
  }
};

// The countdown ticks every second, but only this small component re-renders —
// not the event list or the open attendance roster.
const EventCountdown = ({ target, paused = false }) => {
  const [remainingMs, setRemainingMs] = useState(() =>
    target ? new Date(target).getTime() - Date.now() : 0,
  );

  useEffect(() => {
    if (!target || paused) return undefined;
    const tick = () =>
      setRemainingMs(new Date(target).getTime() - Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target, paused]);

  return <>{formatCountdown(Math.max(0, remainingMs))}</>;
};

export default function SecretaryEvents({
  resolutions = [],
  orgId = null,
  isActive = true,
}) {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [eventView, setEventView] = useState("active");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date().getTime());
  // Undo support: per-event Undo buttons revert a mistaken creation
  // (backend blocks removal once students have joined or fines exist).
  const [undoingEventId, setUndoingEventId] = useState("");
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
  // "Same time for all days": apply the configured checkpoints to every
  // event day in one go instead of repeating per day.
  const [applyToAllDays, setApplyToAllDays] = useState(false);
  const [qrImagesByEvent, setQrImagesByEvent] = useState({});
  const [qrLoading, setQrLoading] = useState(false);
  const [attendanceDialog, setAttendanceDialog] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceDay, setAttendanceDay] = useState("all");
  const [attendanceRefreshing, setAttendanceRefreshing] = useState(false);
  const [markingKey, setMarkingKey] = useState("");
  const [manualReason, setManualReason] = useState("No mobile data");

  const mountedRef = useRef(true);
  const eventsInFlightRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const lastFilterKeyRef = useRef("");
  const attendanceRequestRef = useRef(0);

  const adoptedResolutions = useMemo(
    () => resolutions.filter((resolution) => resolution.status === "Adopted"),
    [resolutions],
  );

  useEffect(() => {
    // Lifecycle status only changes at event boundaries, so a coarse tick is
    // enough here; the per-event countdown below ticks itself every second.
    if (!isActive) return undefined;
    const sync = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => {
      window.clearTimeout(sync);
      window.clearInterval(timer);
    };
  }, [isActive]);

  const restoreQrs = useCallback(async (loadedEvents) => {
    const restorable = loadedEvents.filter(
      (event) =>
        hasPersistedQr(event) &&
        event.lifecycleStatus !== "Ended" &&
        event.lifecycleStatus !== "Cancelled",
    );

    // Restore in the background, updating each event as it finishes.
    await Promise.allSettled(
      restorable.map(async (event) => {
        const groups = await restorePersistedQrs(event);
        if (!mountedRef.current || Object.keys(groups).length === 0) return;
        setQrImagesByEvent((current) => ({
          ...current,
          [event._id]: groups,
        }));
      }),
    );
  }, []);

  const loadEvents = useCallback(
    async ({ force = false } = {}) => {
      if (eventsInFlightRef.current) return eventsInFlightRef.current;

      const cached =
        eventsCache && eventsCache.orgId === orgId ? eventsCache : null;
      if (cached) {
        // Paint the last known list immediately; the refetch below only
        // revalidates it.
        setEvents(cached.data);
        setLoading(false);
      }

      const isFresh =
        cached && Date.now() - cached.fetchedAt < EVENTS_CACHE_TTL;
      if (isFresh && !force) {
        restoreQrs(cached.data);
        return undefined;
      }

      const request = (async () => {
        try {
          const response = await API.get("/events");
          const loadedEvents = Array.isArray(response?.data)
            ? response.data
            : [];
          if (!mountedRef.current) return;
          setEvents(loadedEvents);
          setLoading(false);
          eventsCache = {
            orgId,
            data: loadedEvents,
            fetchedAt: Date.now(),
          };
          await restoreQrs(loadedEvents);
        } catch (requestError) {
          if (mountedRef.current && !cached) {
            setError(requestError.message || "Unable to load events.");
          }
        } finally {
          if (mountedRef.current) setLoading(false);
        }
      })();

      eventsInFlightRef.current = request;
      try {
        return await request;
      } finally {
        eventsInFlightRef.current = null;
      }
    },
    [orgId, restoreQrs],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      eventsInFlightRef.current = null;
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadEvents(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  useEffect(() => {
    if (!isActive) return undefined;
    const cached = eventsCache;
    if (
      !cached ||
      cached.orgId !== orgId ||
      Date.now() - cached.fetchedAt > EVENTS_STALE_AFTER
    ) {
      const timer = window.setTimeout(() => loadEvents(), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isActive, orgId, loadEvents]);

  useEffect(() => {
    if (!isActive) return undefined;

    const handleDataUpdated = (payload) => {
      if (qrLoading) return;
      if (!payload || payload.resource !== "events") return;
      if (
        payload.organization &&
        orgId &&
        String(payload.organization) !== String(orgId)
      ) {
        return;
      }
      // Ignore the socket echo of this secretary's own event/QR/manual edits.
      if (Date.now() - lastLocalEventMutationAt < LOCAL_MUTATION_GUARD_MS) {
        return;
      }
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        loadEvents({ force: true });
      }, 800);
    };

    realtimeSocket.on("data-updated", handleDataUpdated);
    return () => {
      realtimeSocket.off("data-updated", handleDataUpdated);
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [isActive, orgId, loadEvents, qrLoading]);

  const existingResolutionIds = new Set(
    events.map((event) => event.resolution?._id || event.resolution),
  );
  const availableResolutions = adoptedResolutions.filter(
    (resolution) => !existingResolutionIds.has(resolution._id),
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
    if (!form.resolution) {
      setError("Choose an adopted resolution first.");
      return;
    }
    // Confirm before creating: guards against accidental clicks. The Undo
    // bar and Undo button below still cover a wrongly picked resolution.
    const selectedResolution = adoptedResolutions.find(
      (item) => item._id === form.resolution,
    );
    const selectedActivity = selectedResolution?.activityProposal;
    if (
      !window.confirm(
        `Create event "${selectedActivity?.proposalTitle || selectedResolution?.title || "this resolution"}"?\nSchedule: ${formatDateTime(selectedActivity?.requestedStartDateTime)} - ${formatDateTime(selectedActivity?.requestedEndDateTime)}\nVenue: ${selectedActivity?.targetVenue || "N/A"}`,
      )
    )
      return;
    setSaving(true);
    try {
      markLocalEventMutation();
      const response = await API.post("/events", form);
      const created = response.data || response;
      setEvents((current) => [created, ...current]);
      setForm(emptyForm);
      showToast("Event created from the adopted resolution.", "success");
    } catch (requestError) {
      // The API wrapper rejects with { status, message } (no .response),
      // so read .message first to surface the real backend error instead
      // of always falling back to the generic text.
      const message =
        requestError.message ||
        requestError.originalError?.response?.data?.message ||
        "Unable to create the event.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Undo for a mistaken creation (active view only — the archive stays
  // view-only so attendance history is never at risk).
  const handleUndoEvent = async (target) => {
    if (!target?._id || undoingEventId) return;
    if (
      !window.confirm(
        `Undo "${target.title || "this event"}"? The linked resolution can be reused for a new event.`,
      )
    )
      return;
    setUndoingEventId(target._id);
    try {
      markLocalEventMutation();
      await API.delete(`/events/${target._id}`);
      setEvents((current) =>
        current.filter((item) => item._id !== target._id),
      );
      setQrImagesByEvent((current) => {
        if (!current[target._id]) return current;
        const next = { ...current };
        delete next[target._id];
        return next;
      });
      showToast(
        "Event undone. Its resolution can be reused.",
        "success",
      );
    } catch (requestError) {
      const message =
        requestError.message ||
        requestError.originalError?.response?.data?.message ||
        "Unable to undo the event.";
      setError(message);
      showToast(message, "error");
    } finally {
      setUndoingEventId("");
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
    setApplyToAllDays(false);
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
    const allDays = getEventDays(event);
    const daysToProcess = applyToAllDays
      ? allDays
      : allDays.filter((day) => day.day === selectedQrDay);
    if (daysToProcess.length === 0) {
      setQrLoading(false);
      setError("Select a valid event day.");
      return;
    }
    try {
      markLocalEventMutation();
      const selectedPhases = attendancePhases.filter(({ key }) =>
        selectedQrPhases.includes(key),
      );
      const phaseField = {
        morning_in: "morningIn",
        lunch_out: "morningOut",
        afternoon_in: "afternoonIn",
        afternoon_out: "afternoonOut",
      };
      let totalGenerated = 0;
      let lastSchedule = qrSchedule;
      const QRCode = await getQrCode();
      for (const day of daysToProcess) {
        const selectedSchedule = Object.fromEntries(
          selectedPhases.map(({ key }) => [phaseField[key], qrSchedule[phaseField[key]]]),
        );
        const scheduleResponse = await API.patch(
          `/events/${event._id}/attendance/schedule`,
          { day: day.day, schedule: selectedSchedule },
        );
        const savedSchedule = scheduleResponse.data || {
          schedule: qrSchedule,
        };
        lastSchedule = savedSchedule.schedule || qrSchedule;
        const generated = await Promise.all(
          selectedPhases.map(async ({ key: phase, label }) => {
            const response = await API.post(
              `/events/${event._id}/attendance/qr`,
              { day: day.day, phase },
            );
            const payload = response.code || response.data?.code;
            if (!payload)
              throw new Error(
                `The server did not return ${label} (Day ${day.day}).`,
              );
            const image = await QRCode.toDataURL(payload, {
              width: 360,
              margin: 2,
              errorCorrectionLevel: "M",
            });
            return { phase, label, payload, image };
          }),
        );
        totalGenerated += generated.length;
        const daySchedule = lastSchedule;
        setQrImagesByEvent((current) => ({
          ...current,
          [event._id]: {
            ...(current[event._id] || {}),
            [day.day]: generated.map((qr) => ({
              ...qr,
              day: day.day,
            })),
          },
        }));
        setEvents((current) =>
          current.map((item) => {
            if (item._id !== event._id) return item;
            const days = getEventDays(item).map((entry) =>
              entry.day === day.day
                ? { ...entry, schedule: daySchedule }
                : entry,
            );
            return {
              ...item,
              attendanceDays: days,
              attendanceSchedule: daySchedule,
            };
          }),
        );
      }
      // The generated images now live in component state; drop the cache so a
      // later mount refetches the current codes instead of stale ones.
      qrImageCache.delete(event._id);
      setQrConfigDialog(null);
      showToast(
        daysToProcess.length > 1
          ? `Schedule saved and ${totalGenerated} QR code${totalGenerated === 1 ? "" : "s"} generated for ${daysToProcess.length} days.`
          : `Day ${selectedQrDay} schedule saved and ${totalGenerated} QR code${totalGenerated === 1 ? "" : "s"} generated.`,
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

  const fetchAttendance = useCallback(
    async (event, { page = 1, q = "", day = "all", append = false } = {}) => {
      if (!event?._id) return;
      const requestId = attendanceRequestRef.current + 1;
      attendanceRequestRef.current = requestId;
      const params = { page, limit: ATTENDANCE_PAGE_LIMIT };
      if (q) params.q = q;
      if (day !== "all") params.day = day;

      setAttendanceRefreshing(true);
      setAttendanceError("");
      try {
        const response = await API.get(`/events/${event._id}/attendance`, {
          params,
          timeout: 30000,
        });
        // A newer search/day request superseded this response.
        if (requestId !== attendanceRequestRef.current) return;
        const incoming = Array.isArray(response?.data) ? response.data : [];
        const pagination =
          response.pagination || {
            page: 1,
            limit: incoming.length,
            total: incoming.length,
            pages: 1,
            hasMore: false,
          };
        setAttendanceDialog((current) => {
          if (!current || current.event?._id !== event._id) return current;
          const existingIds = new Set(
            current.records.map((record) => record._id),
          );
          const merged = append
            ? [
                ...current.records,
                ...incoming.filter((record) => !existingIds.has(record._id)),
              ]
            : incoming;
          return {
            ...current,
            records: merged,
            summary: response.summary || current.summary,
            checkpoints: response.checkpoints || [],
            days: response.days || [],
            pagination,
          };
        });
      } catch (requestError) {
        if (requestId !== attendanceRequestRef.current) return;
        setAttendanceError(
          requestError.message || "Unable to load attendance.",
        );
      } finally {
        if (requestId === attendanceRequestRef.current) {
          setAttendanceLoading(false);
          setAttendanceRefreshing(false);
        }
      }
    },
    [],
  );

  const openAttendance = (event) => {
    if (!event?._id) return;
    // The initial page is fetched directly; mark its filter key so the
    // debounced effect below does not request the same page twice.
    lastFilterKeyRef.current = `${event._id}||all`;
    setAttendanceSearch("");
    setAttendanceDay("all");
    setManualReason("No mobile data");
    setAttendanceError("");
    setAttendanceLoading(true);
    setAttendanceDialog({
      event,
      records: [],
      summary: null,
      checkpoints: [],
      days: [],
      pagination: null,
    });
    fetchAttendance(event, { page: 1, q: "", day: "all", append: false });
  };

  const attendanceEvent = attendanceDialog?.event || null;

  useEffect(() => {
    if (!attendanceEvent?._id) return undefined;
    const query = attendanceSearch.trim();
    const key = `${attendanceEvent._id}|${query}|${attendanceDay}`;
    if (lastFilterKeyRef.current === key) return undefined;
    lastFilterKeyRef.current = key;
    const timer = window.setTimeout(
      () => {
        fetchAttendance(attendanceEvent, {
          page: 1,
          q: query,
          day: attendanceDay,
          append: false,
        });
      },
      query ? 300 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [attendanceEvent, attendanceSearch, attendanceDay, fetchAttendance]);

  const handleManualMark = async (record, checkpoint) => {
    if (!attendanceDialog?.event || !record || !checkpoint) return;
    const studentName =
      record.student?.name || record.student?.email || "this student";
    if (
      !window.confirm(
        `Mark ${studentName} present for Day ${checkpoint.day} ${checkpoint.label}? Use this when the student has no mobile data.`,
      )
    ) {
      return;
    }
    const key = `${record._id}-${checkpoint.day}-${checkpoint.phase}`;
    setMarkingKey(key);
    setAttendanceError("");
    markLocalEventMutation();
    try {
      const response = await API.post(
        `/events/${attendanceDialog.event._id}/attendance/manual`,
        {
          attendanceId: record._id,
          day: checkpoint.day,
          phase: checkpoint.phase,
          reason: manualReason || "No mobile data",
        },
      );
      const updated = response.data || response;
      setAttendanceDialog((current) => {
        if (!current) return current;
        let becamePresent = false;
        const nextRecords = current.records.map((item) => {
          if (item._id !== record._id) return item;
          if (item.status !== "Present" && updated.status === "Present") {
            becamePresent = true;
          }
          return { ...item, ...updated };
        });
        return {
          ...current,
          records: nextRecords,
          summary: current.summary
            ? {
                ...current.summary,
                present:
                  current.summary.present + (becamePresent ? 1 : 0),
                pending: Math.max(
                  0,
                  current.summary.pending - (becamePresent ? 1 : 0),
                ),
              }
            : current.summary,
        };
      });
      showToast(
        response.message || `${studentName} marked present.`,
        "success",
      );
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to mark the student present.";
      setAttendanceError(message);
      showToast(message, "error");
    } finally {
      setMarkingKey("");
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
      markLocalEventMutation();
      await API.delete(`/events/${event._id}/attendance/qr`, {
        data: { day: qr.day, phase: qr.phase },
      });
      qrImageCache.delete(event._id);
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

  const attendanceDays = attendanceDialog?.days;
  const attendanceCheckpoints = attendanceDialog?.checkpoints;
  const attendanceDayOptions = useMemo(() => {
    const days = attendanceDays || [];
    if (days.length) return days;
    // Fallback for an older backend response without the `days` array.
    const seen = new Map();
    for (const checkpoint of attendanceCheckpoints || []) {
      if (!seen.has(checkpoint.day)) {
        seen.set(checkpoint.day, {
          day: checkpoint.day,
          date: checkpoint.date,
        });
      }
    }
    return [...seen.values()].sort((first, second) => first.day - second.day);
  }, [attendanceDays, attendanceCheckpoints]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-[#4A0E17]">
          Organization Events
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Create an event from a resolution that has been adopted by the
          president, adviser, and dean.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
      >
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Adopted resolution <span className="text-rose-600">*</span>
          </label>
          <select
            value={form.resolution}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                resolution: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-[#4A0E17] focus:outline-none"
          >
            <option value="">Choose an adopted resolution</option>
            {availableResolutions.map((resolution) => (
              <option key={resolution._id} value={resolution._id}>
                {[
                  resolution.resolutionNumber,
                  resolution.activityProposal?.proposalTitle ||
                    resolution.title,
                ]
                  .filter(Boolean)
                  .join(" — ")}
              </option>
            ))}
          </select>
          {availableResolutions.length === 0 && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              No unused adopted resolutions are available.
            </p>
          )}
        </div>

        {form.resolution &&
          (() => {
            const resolution = adoptedResolutions.find(
              (item) => item._id === form.resolution,
            );
            const activity = resolution?.activityProposal;
            return resolution ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900">
                <p className="font-bold">
                  {activity?.proposalTitle || resolution.title}
                </p>
                <p className="mt-1">
                  Adopted schedule:{" "}
                  {formatDateTime(activity?.requestedStartDateTime)} –{" "}
                  {formatDateTime(activity?.requestedEndDateTime)}
                </p>
                <p className="mt-1">Venue: {activity?.targetVenue}</p>
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
          disabled={saving || availableResolutions.length === 0}
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
                {["Upcoming", "Ongoing"].map((status) => (
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
                      <EventCountdown
                        target={event.lifecycle.target}
                        paused={!isActive}
                      />
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
                  onClick={() => openAttendance(event)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" />
                  Attendance
                </button>
                {eventView === "active" && (
                  <button
                    type="button"
                    onClick={() => handleUndoEvent(event)}
                    disabled={Boolean(undoingEventId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                    {undoingEventId === event._id ? "Undoing..." : "Undo"}
                  </button>
                )}
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
                disabled={applyToAllDays}
                onChange={(event) =>
                  selectQrDay(qrConfigDialog, event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#4A0E17] disabled:bg-slate-100"
              >
                {getEventDays(qrConfigDialog).map((day) => (
                  <option key={day.day} value={day.day}>
                    {formatEventDay(day.date)}
                  </option>
                ))}
              </select>
            </label>
            {getEventDays(qrConfigDialog).length > 1 && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={applyToAllDays}
                  onChange={(event) =>
                    setApplyToAllDays(event.target.checked)
                  }
                />
                <span>
                  Same time for all {getEventDays(qrConfigDialog).length}{" "}
                  event days
                </span>
              </label>
            )}
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
              {applyToAllDays &&
                " The same times will be applied to every event day."}
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
            ) : (
              <>
                {attendanceError && (
                  <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                    {attendanceError}
                  </p>
                )}
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
                          markLocalEventMutation();
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
                        markLocalEventMutation();
                        await API.post(
                          `/events/${attendanceDialog.event._id}/attendance/finalize-fines`,
                        );
                        setAttendanceError("");
                        await fetchAttendance(attendanceDialog.event, {
                          page: 1,
                          q: attendanceSearch.trim(),
                          day: attendanceDay,
                          append: false,
                        });
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
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="attendance-name-search"
                      className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500"
                    >
                      Search student name, ID, or email
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
                        placeholder="Type a name, student ID, or email..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                      />
                    </div>
                    {attendanceRefreshing && (
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        Updating roster...
                      </p>
                    )}
                  </div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                    Attendance day
                    <select
                      value={attendanceDay}
                      onChange={(event) => setAttendanceDay(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case text-slate-700 outline-none focus:border-[#4A0E17]"
                    >
                      <option value="all">All days</option>
                      {attendanceDayOptions.map((day) => (
                        <option key={day.day} value={day.day}>
                          Day {day.day} — {formatEventDay(day.date)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-[10px] text-slate-500 sm:col-span-2">
                    No mobile data ang estudyante? Hanapin siya sa lista at
                    pindutin ang{" "}
                    <span className="font-bold text-[#4A0E17]">
                      Mark present
                    </span>{" "}
                    sa tamang checkpoint.
                  </p>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
                    Reason for manual mark
                    <select
                      value={manualReason}
                      onChange={(event) =>
                        setManualReason(event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case text-slate-700 outline-none focus:border-[#4A0E17]"
                    >
                      <option>No mobile data</option>
                      <option>Phone battery empty</option>
                      <option>QR scan failed</option>
                      <option>Late arrival verified</option>
                      <option>Other verified on-site</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-100">
                  {attendanceDialog.records.length === 0 ? (
                    attendanceError ? null : (
                      <p className="p-6 text-center text-xs text-slate-500">
                        {attendanceSearch.trim() || attendanceDay !== "all"
                          ? `No students match ${
                              attendanceSearch.trim()
                                ? `“${attendanceSearch.trim()}”`
                                : `Day ${attendanceDay}`
                            }.`
                          : "No students have checked in yet."}
                      </p>
                    )
                  ) : (
                    <>
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
                        {attendanceDialog.records.map((record) => (
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
                              const scannedAt =
                                dailyRecord?.[checkpoint.field] ??
                                (checkpoint.day === 1
                                  ? record?.[checkpoint.field]
                                  : null);
                              const viaField = String(
                                checkpoint.field || "",
                              ).replace(/At$/, "Via");
                              const markedVia =
                                dailyRecord?.[viaField] ??
                                (checkpoint.day === 1
                                  ? record?.[viaField]
                                  : null);
                              const isManual = markedVia === "manual";
                              const cellKey = `${record._id}-${checkpoint.day}-${checkpoint.phase}`;
                              const isMarking = markingKey === cellKey;
                              return (
                                <td
                                  key={`${checkpoint.day}-${checkpoint.phase}`}
                                  className="whitespace-nowrap px-3 py-2.5"
                                >
                                  {scannedAt ? (
                                    <span className="inline-flex flex-col items-start gap-1">
                                      <span
                                        className={`rounded-md border px-2 py-1 font-bold ${isManual ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                                      >
                                        {new Date(scannedAt).toLocaleTimeString(
                                          "en-PH",
                                          {
                                            hour: "numeric",
                                            minute: "2-digit",
                                          },
                                        )}
                                      </span>
                                      {isManual && (
                                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-800">
                                          Manual
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isMarking}
                                      onClick={() =>
                                        handleManualMark(record, checkpoint)
                                      }
                                      title="Mark present manually (for students with no mobile data)"
                                      className="rounded-md border border-[#4A0E17]/30 bg-white px-2 py-1 font-bold text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white disabled:cursor-wait disabled:opacity-50"
                                    >
                                      {isMarking
                                        ? "Marking..."
                                        : "Mark present"}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {attendanceDialog.pagination &&
                      attendanceDialog.records.length > 0 && (
                        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-3 py-2">
                          <p className="text-[10px] font-medium text-slate-500">
                            Showing {attendanceDialog.records.length} of{" "}
                            {attendanceDialog.pagination.total}
                          </p>
                          {attendanceDialog.pagination.hasMore && (
                            <button
                              type="button"
                              disabled={attendanceRefreshing}
                              onClick={() =>
                                fetchAttendance(attendanceDialog.event, {
                                  page:
                                    attendanceDialog.pagination.page + 1,
                                  q: attendanceSearch.trim(),
                                  day: attendanceDay,
                                  append: true,
                                })
                              }
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                            >
                              {attendanceRefreshing
                                ? "Loading..."
                                : `Load ${ATTENDANCE_PAGE_LIMIT} more`}
                            </button>
                          )}
                        </div>
                      )}
                    </>
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
