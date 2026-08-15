import { useEffect, useState } from "react";
import API from "../../api/axios";
import PaymentStatusBadge from "./PaymentStatusBadge";

const POLL_INTERVAL_MS = 5000;
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDateTime = (value) => {
  if (!value) return "Not yet verified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const STATUS_NOTICE = {
  PENDING_MANUAL_REVIEW: {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    message:
      "Pending review — your receipt was submitted and is waiting for the Treasurer's GCash statement verification.",
  },
  VERIFIED: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Paid — this payment has been verified successfully.",
  },
  REJECTED: {
    className: "border-rose-200 bg-rose-50 text-rose-800",
    message:
      "Payment needs attention. Review the reason below and submit a valid receipt.",
  },
};

/**
 * Displays one student-owned payment and keeps pending statuses up to date.
 *
 * @param {{
 *   payment: {
 *     _id: string,
 *     claimedAmount: number,
 *     extractedAmount?: number,
 *     referenceNumber: string,
 *     status: "PENDING_MANUAL_REVIEW" | "VERIFIED" | "REJECTED",
 *     verificationMethod?: string,
 *     verifiedAt?: string,
 *     createdAt?: string,
 *     fee?: { title?: string }
 *   },
 *   onPaymentChange?: (payment: object) => void
 * }} props
 */
export default function StudentPaymentTracker({ payment, onPaymentChange }) {
  const [currentPayment, setCurrentPayment] = useState(payment);
  const [pollError, setPollError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (
      !currentPayment?._id ||
      currentPayment.status !== "PENDING_MANUAL_REVIEW"
    ) {
      return undefined;
    }

    let cancelled = false;
    let timerId;

    const pollPayment = async () => {
      try {
        const response = await API.get(`/payments/${currentPayment._id}`);
        if (cancelled) return;

        const updatedPayment = response.data;
        setCurrentPayment(updatedPayment);
        setPollError("");
        onPaymentChange?.(updatedPayment);

        if (updatedPayment.status === "PENDING_MANUAL_REVIEW") {
          timerId = window.setTimeout(pollPayment, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (cancelled) return;
        setPollError(error.message || "Unable to refresh payment status.");
        timerId = window.setTimeout(pollPayment, POLL_INTERVAL_MS);
      }
    };

    timerId = window.setTimeout(pollPayment, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [currentPayment?._id, currentPayment?.status, onPaymentChange]);

  if (!currentPayment) return null;

  const statusNotice = STATUS_NOTICE[currentPayment.status];
  const displayAmount =
    currentPayment.claimedAmount ??
    currentPayment.extractedAmount ??
    currentPayment.amount;

  return (
    <article className="border border-slate-200 bg-white p-5 shadow-sm transition-all">
      {/* Header Bar - Always Visible */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">
            Submitted payment
          </p>
          <h4 className="mt-1 break-words text-sm font-extrabold text-[#4A0E17]">
            {currentPayment.fee?.title || "Organization fee"}
          </h4>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <PaymentStatusBadge status={currentPayment.status} />

          {/* Up / Down Arrow Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-expanded={isOpen}
            aria-label={
              isOpen ? "Collapse payment details" : "Expand payment details"
            }
          >
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Content Block */}
      {isOpen && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <dl className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase text-slate-400">
                Amount paid
              </dt>
              <dd className="mt-1 text-base font-extrabold text-slate-900">
                {formatCurrency(displayAmount)}
              </dd>
              <p className="mt-1 text-[11px] font-bold text-slate-500">
                Amount due:{" "}
                {formatCurrency(currentPayment.claimedAmount ?? displayAmount)}
              </p>
            </div>
            <div>
              <dt className="font-bold uppercase text-slate-400">
                GCash reference
              </dt>
              <dd className="mt-1 break-all font-mono text-sm font-bold text-slate-800">
                {currentPayment.referenceNumber}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase text-slate-400">
                Verification method
              </dt>
              <dd className="mt-1 font-bold text-slate-700">
                {currentPayment.verificationMethod === "BULK_STATEMENT"
                  ? "GCash statement"
                  : currentPayment.status === "PENDING_MANUAL_REVIEW"
                    ? "Awaiting statement review"
                    : "Manual review"}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase text-slate-400">
                Verified date
              </dt>
              <dd className="mt-1 font-bold text-slate-700">
                {formatDateTime(currentPayment.verifiedAt)}
              </dd>
            </div>
          </dl>

          {statusNotice && (
            <div
              className={`mt-4 border px-3 py-2 text-xs font-medium ${statusNotice.className}`}
              role="status"
              aria-live="polite"
            >
              {statusNotice.message}
              {currentPayment.status === "PENDING_MANUAL_REVIEW" &&
                " Status refresh every 24 hours."}
              {currentPayment.failureReason && (
                <p className="mt-1 font-bold">
                  Reason: {currentPayment.failureReason}
                </p>
              )}
            </div>
          )}

          {pollError && (
            <p className="mt-3 text-xs font-medium text-rose-700" role="status">
              {pollError}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
