const STATUS_STYLES = {
  PENDING_MANUAL_REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
  PENDING_VERIFICATION: "border-amber-200 bg-amber-50 text-amber-800",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FAILED: "border-rose-200 bg-rose-50 text-rose-800",
};

const STATUS_LABELS = {
  PENDING_MANUAL_REVIEW: "Pending verification",
  PENDING_VERIFICATION: "Pending verification",
  VERIFIED: "Verified",
  FAILED: "Failed",
};

/**
 * @param {{ status: "PENDING_MANUAL_REVIEW" | "PENDING_VERIFICATION" | "VERIFIED" | "FAILED", className?: string }} props
 */
export default function PaymentStatusBadge({ status, className = "" }) {
  const style =
    STATUS_STYLES[status] || "border-slate-200 bg-slate-50 text-slate-700";
  const label = STATUS_LABELS[status] || status || "Unknown";

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase ${style} ${className}`}
    >
      {label}
    </span>
  );
}
