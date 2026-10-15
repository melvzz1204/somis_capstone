import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  PAST,
  UPCOMING,
  getUpcomingMeetingNotice,
  partitionMeetingsByStatus,
} from "../../util/meetingStatus";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });

function MeetingDetailModal({
  meeting,
  onClose,
  joinState,
  onToggleJoin,
  joinBusy = false,
  isPast = false,
}) {
  if (!meeting) return null;

  const { joined = false, joinCount = 0, joinNames = [] } = joinState || {};
  const presentCount = meeting.presentCount ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Meeting details: ${meeting.title}`}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[#4A0E17] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Organization Meeting
            </p>
            <h3 className="mt-1 truncate text-base font-extrabold text-white">
              {meeting.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close meeting details"
            className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-bold text-[#7A610D]">
              Audience: {meeting.audience}
            </span>
            {meeting.targetYear && (
              <span className="rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                {meeting.targetYear}
              </span>
            )}
            {meeting.targetSection && (
              <span className="rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                {meeting.targetSection}
              </span>
            )}
            {meeting.organization?.name && (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {meeting.organization.name}
              </span>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Schedule
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                📅 {formatDateTime(meeting.startDateTime)} –{" "}
                {formatDateTime(meeting.endDateTime)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Venue
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                📍 {meeting.venue}
              </p>
            </div>
            {meeting.createdBy?.name && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Set by
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {meeting.createdBy.name}
                </p>
              </div>
            )}
          </div>

          {meeting.description && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Details
              </p>
              <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-slate-200 p-4 text-xs leading-relaxed text-slate-600">
                {meeting.description}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Who&apos;s joining ({joinCount})
            </p>
            {joinCount === 0 ? (
              <p className="mt-1.5 text-xs text-slate-400">
                No one has joined yet. Be the first!
              </p>
            ) : (
              <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
                {joinNames.map((name, index) => (
                  <p
                    key={`${name}-${index}`}
                    className="text-xs font-medium text-slate-700"
                  >
                    ✓ {name}
                  </p>
                ))}
              </div>
            )}
            {isPast && presentCount > 0 && (
              <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                Final attendance: {presentCount} attended
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-200 px-5 py-4">
          {!isPast && (
            <button
              type="button"
              onClick={onToggleJoin}
              disabled={joinBusy}
              className={`w-full rounded-lg px-4 py-2.5 text-xs font-extrabold transition disabled:opacity-50 ${
                joined
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {joinBusy ? "Saving..." : joined ? "✓ Joined — tap to leave" : "Join this meeting"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[#4A0E17] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#601520]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const noticeStyles = {
  ongoing: "border-emerald-300 bg-emerald-50 text-emerald-800",
  soon: "border-amber-300 bg-amber-50 text-amber-800",
  later: "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#7A610D]",
};

function MeetingCard({
  meeting,
  onView,
  isPast = false,
  now,
  isNew = false,
  joinState,
  onToggleJoin,
  joinBusy = false,
}) {
  const notice = !isPast ? getUpcomingMeetingNotice(meeting, now) : null;
  const { joined = false, joinCount = 0 } = joinState || {};
  const presentCount = meeting.presentCount ?? 0;

  return (
    <article
      className={
        isPast
          ? "rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-80"
          : "rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4"
      }
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-extrabold text-[#4A0E17]">
              {meeting.title}
            </h5>
            {isNew && (
              <span className="rounded-md border border-emerald-300 bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                New
              </span>
            )}
            <span className="rounded-md border border-[#D4AF37]/40 bg-white px-2 py-0.5 text-[10px] font-bold text-[#7A610D]">
              {meeting.audience}
            </span>
            {joinCount > 0 && (
              <span className="rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                👥 {joinCount} joining
              </span>
            )}
            {isPast && presentCount > 0 && (
              <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                ✓ {presentCount} attended
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
            {notice && (
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${noticeStyles[notice.tone]}`}
              >
                {notice.label}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-700">
            📅 {formatDateTime(meeting.startDateTime)} –{" "}
            {formatDateTime(meeting.endDateTime)}
          </p>
          <p className="mt-1 text-xs text-slate-600">📍 {meeting.venue}</p>
          {meeting.description && (
            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-slate-600">
              {meeting.description}
            </p>
          )}
          {meeting.createdBy?.name && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Set by {meeting.createdBy.name}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2 self-start sm:self-auto">
          {!isPast && (
            <button
              type="button"
              onClick={() => onToggleJoin(meeting)}
              disabled={joinBusy}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                joined
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {joinBusy ? "..." : joined ? "✓ Joined" : "Join"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onView(meeting)}
            className="shrink-0 rounded-lg bg-[#4A0E17] px-3 py-2 text-xs font-bold text-white hover:bg-[#601520]"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MeetingList({
  meetings: providedMeetings,
  isLoading: providedIsLoading = false,
  onMeetingViewed,
}) {
  const shouldFetch = providedMeetings === undefined;
  const [fetchedMeetings, setFetchedMeetings] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date().getTime());
  const [viewedMeeting, setViewedMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState(UPCOMING);
  // Meetings opened during this session, so their New pill clears instantly
  // even before the next list fetch.
  const [sessionViewedIds, setSessionViewedIds] = useState({});
  // Local RSVP overrides so Join works in both fetch and provided modes.
  const [joinOverrides, setJoinOverrides] = useState({});
  const [joinBusyId, setJoinBusyId] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date().getTime()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!shouldFetch) return undefined;
    let mounted = true;
    const request = window.setTimeout(async () => {
      try {
        const response = await API.get("/meetings");
        if (!mounted) return;
        setFetchedMeetings(response?.data || []);
        setError("");
      } catch (requestError) {
        if (mounted)
          setError(requestError.message || "Unable to load meetings.");
      } finally {
        if (mounted) setIsFetching(false);
      }
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(request);
    };
  }, [shouldFetch]);

  const meetings =
    providedMeetings !== undefined ? providedMeetings : fetchedMeetings;
  const isLoading =
    providedMeetings !== undefined ? providedIsLoading : isFetching;

  const { upcoming: upcomingMeetings = [], past: pastMeetings = [] } = useMemo(
    () => partitionMeetingsByStatus(meetings, now),
    [meetings, now],
  );

  const activeMeetings =
    activeTab === UPCOMING ? upcomingMeetings : pastMeetings;

  const isNewMeeting = (meeting) => {
    if (!meeting || meeting.viewed || sessionViewedIds[meeting._id]) return false;
    const end = new Date(meeting.endDateTime).getTime();
    return !Number.isNaN(end) && end >= now;
  };

  const handleView = (meeting) => {
    setViewedMeeting(meeting);
    if (!meeting || meeting.viewed || sessionViewedIds[meeting._id]) return;
    // Fire-and-forget: opening the details marks the meeting as read, which
    // clears its notification badge.
    API.patch(`/meetings/${meeting._id}/view`).catch(() => {});
    setSessionViewedIds((current) => ({ ...current, [meeting._id]: true }));
    onMeetingViewed?.(meeting._id);
  };

  const getJoinState = (meeting) => {
    if (!meeting) return { joined: false, joinCount: 0, joinNames: [] };
    const override = joinOverrides[meeting._id];
    return {
      joined: override?.joined ?? meeting.joined ?? false,
      joinCount: override?.joinCount ?? meeting.joinCount ?? 0,
      joinNames: override?.joinNames ?? meeting.joinNames ?? [],
    };
  };

  const handleToggleJoin = async (meeting) => {
    if (!meeting?._id || joinBusyId) return;
    const { joined } = getJoinState(meeting);
    setJoinBusyId(meeting._id);
    setError("");
    try {
      const response = joined
        ? await API.delete(`/meetings/${meeting._id}/join`)
        : await API.post(`/meetings/${meeting._id}/join`);
      const data = response?.data || {};
      setJoinOverrides((current) => ({
        ...current,
        [meeting._id]: {
          joined: data.joined ?? !joined,
          joinCount: data.joinCount ?? 0,
          joinNames: data.joinNames ?? [],
        },
      }));
      // Keep the open detail modal in sync without refetching.
      setViewedMeeting((current) =>
        current?._id === meeting._id ? meeting : current,
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to update your RSVP.");
    } finally {
      setJoinBusyId("");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-extrabold text-[#4A0E17]">
            Organization Meetings
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Meetings scheduled by your organization leader for your audience.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
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
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-slate-500">Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500">
          No meetings have been scheduled for your audience yet.
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {activeTab === UPCOMING ? "Upcoming & Ongoing" : "Past Meetings"}
          </h4>
          {activeMeetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              {activeTab === UPCOMING
                ? "No upcoming meetings. You will see new meetings here once your organization leader schedules them."
                : "No past meetings yet."}
            </div>
          ) : (
            activeMeetings.map((meeting, index) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                onView={handleView}
                isPast={activeTab === PAST}
                now={index === 0 ? now : undefined}
                isNew={isNewMeeting(meeting)}
                joinState={getJoinState(meeting)}
                onToggleJoin={handleToggleJoin}
                joinBusy={joinBusyId === meeting._id}
              />
            ))
          )}
        </div>
      )}

      <MeetingDetailModal
        meeting={viewedMeeting}
        onClose={() => setViewedMeeting(null)}
        joinState={getJoinState(viewedMeeting)}
        onToggleJoin={() => handleToggleJoin(viewedMeeting)}
        joinBusy={joinBusyId === viewedMeeting?._id}
        isPast={Boolean(
          viewedMeeting &&
            new Date(viewedMeeting.endDateTime).getTime() < now,
        )}
      />
    </div>
  );
}
