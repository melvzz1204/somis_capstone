import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios";
import PaymentStatusBadge from "./PaymentStatusBadge";

const FILTERS = ["ALL", "PENDING_MANUAL_REVIEW", "VERIFIED"];
const REFRESH_INTERVAL_MS = 15000;

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

const formatMethod = (method) => {
  if (method === "AUTOMATE_SMS") return "Legacy SMS";
  if (method === "BULK_STATEMENT") return "Bulk statement";
  if (method === "PAYMONGO") return "PayMongo";
  if (method === "CASH_MANUAL") return "Cash (treasurer)";
  return "Manual";
};

/**
 * Organization-scoped payment verification audit for Treasurer accounts.
 */
export default function TreasurerPaymentAudit() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async (signal) => {
    try {
      const response = await API.get("/payments/audit", { signal });
      setPayments(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (requestError) {
      if (requestError.originalError?.code === "ERR_CANCELED") return;
      setError(requestError.message || "Unable to load the payment audit.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialRequestId = window.setTimeout(
      () => loadPayments(controller.signal),
      0,
    );
    const intervalId = window.setInterval(
      () => loadPayments(),
      REFRESH_INTERVAL_MS,
    );

    return () => {
      controller.abort();
      window.clearTimeout(initialRequestId);
      window.clearInterval(intervalId);
    };
  }, [loadPayments]);

  const filteredPayments = payments.filter(
    (payment) => statusFilter === "ALL" || payment.status === statusFilter,
  );

  return (
    <section className="space-y-4" aria-labelledby="payment-audit-heading">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3
            id="payment-audit-heading"
            className="text-base font-bold text-[#4A0E17]"
          >
            Payment Verification Audit
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Verified GCash and over-the-counter cash payment records.
          </p>
        </div>
        <div
          className="inline-flex w-full border border-slate-200 bg-slate-50 p-1 sm:w-auto"
          role="group"
          aria-label="Payment status filter"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors sm:flex-none ${
                statusFilter === filter
                  ? "bg-white text-[#4A0E17] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {filter === "PENDING_MANUAL_REVIEW" ? "Pending" : filter}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200">
        <table className="min-w-[760px] w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Payment details</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Verified date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-10 text-center font-medium text-slate-500"
                >
                  Loading payment verification audit...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-10 text-center font-medium text-slate-500"
                >
                  No payments match the selected status.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">
                      {payment.student?.name || "Unknown student"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {payment.student?.email || "No email"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black">
                      {payment.paymentMethod || "GCASH"}
                    </span>
                    <p className="mt-1 font-mono text-xs">
                      {payment.paymentMethod === "CASH"
                        ? payment.cashReceiptNumber || "No receipt number"
                        : payment.referenceNumber || "No reference"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {formatCurrency(
                      payment.claimedAmount ??
                        payment.extractedAmount ??
                        payment.amount,
                    )}
                    {payment.extractedAmount != null && (
                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        Receipt: {formatCurrency(payment.extractedAmount)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatMethod(payment.verificationMethod)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">
                    {formatDateTime(payment.verifiedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
