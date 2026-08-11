const getEventLifecycle = (event, now = Date.now()) => {
  const start = new Date(event?.startDateTime).getTime();
  const end = new Date(event?.endDateTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { status: "Upcoming", target: null, remainingMs: 0 };
  }

  if (event?.status === "Cancelled") {
    return { status: "Cancelled", target: null, remainingMs: 0 };
  }

  if (event?.status === "Completed" || now >= end) {
    return { status: "Ended", target: null, remainingMs: 0 };
  }

  if (now >= start) {
    return { status: "Ongoing", target: end, remainingMs: end - now };
  }

  return { status: "Upcoming", target: start, remainingMs: start - now };
};

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const lifecycleStyles = {
  Upcoming: "border-amber-200 bg-amber-50 text-amber-800",
  Ongoing: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Ended: "border-slate-200 bg-slate-100 text-slate-600",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

export { formatCountdown, getEventLifecycle, lifecycleStyles };
