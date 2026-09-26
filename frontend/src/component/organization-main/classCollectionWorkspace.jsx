import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../api/axios";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDueDate = (dateString) => {
  if (!dateString) return "N/A";
  const cleanDateStr = String(dateString).split("T")[0];
  const [year, month, day] = cleanDateStr.split("-");
  if (!year || !month || !day) return String(dateString);
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
};

const emptyRecordForm = () => ({
  method: "CASH",
  referenceNumber: "",
  cashReceiptNumber: "",
  cashNotes: "",
});

const memberPaymentState = (payment) => {
  if (!payment) return "unpaid";
  if (payment.status === "VERIFIED") return "verified";
  if (payment.status === "REJECTED") return "rejected";
  return payment.remitted ? "remitted" : "collected";
};

const stateStyles = {
  unpaid: "border-slate-200 bg-slate-50 text-slate-600",
  collected: "border-amber-200 bg-amber-50 text-amber-800",
  remitted: "border-blue-200 bg-blue-50 text-blue-800",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const stateLabels = {
  unpaid: "Unpaid",
  collected: "Collected",
  remitted: "Remitted",
  verified: "Verified",
  rejected: "Rejected",
};

/**
 * Class treasurer collections: approved parent dues are collected per
 * classmate (cash or e-wallet), monitored, and remitted to the organization
 * treasurer for verification.
 */
export default function ClassCollectionWorkspace() {
  const [fees, setFees] = useState([]);
  const [parentOrg, setParentOrg] = useState(null);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [roster, setRoster] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [recordForms, setRecordForms] = useState({});
  const [recordingId, setRecordingId] = useState("");
  const [remittingId, setRemittingId] = useState("");

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setNotice("");
    try {
      const [feesResponse, rosterResponse, paymentsResponse] =
        await Promise.all([
          API.get("/fees/collectible"),
          API.get("/orgmembers"),
          API.get("/payments/class-collected"),
        ]);
      const feeList = Array.isArray(feesResponse?.data)
        ? feesResponse.data
        : [];
      const memberList = Array.isArray(rosterResponse) ? rosterResponse : [];
      setFees(feeList);
      setParentOrg(feesResponse?.parent || null);
      setRoster(memberList.filter((member) => member.role === "Member"));
      setPayments(
        Array.isArray(paymentsResponse?.data) ? paymentsResponse.data : [],
      );
      setSelectedFeeId((current) => {
        if (current && feeList.some((fee) => String(fee._id) === current)) {
          return current;
        }
        return feeList[0] ? String(feeList[0]._id) : "";
      });
    } catch (requestError) {
      setNotice(requestError.message || "Unable to load collections.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedFee = useMemo(
    () => fees.find((fee) => String(fee._id) === selectedFeeId) || null,
    [fees, selectedFeeId],
  );

  // Per-collection class progress, in the org treasurer card style.
  const classStatsForFee = useCallback(
    (fee) => {
      const feeId = String(fee._id);
      let received = 0;
      const paidMembers = new Set();
      payments.forEach((payment) => {
        if (String(payment.fee?._id || payment.fee) !== feeId) return;
        if (!["PENDING_MANUAL_REVIEW", "VERIFIED"].includes(payment.status)) {
          return;
        }
        received += Number(payment.claimedAmount || 0);
        paidMembers.add(String(payment.member?._id || payment.member));
      });
      const target = Number(fee.amount || 0) * roster.length;
      return {
        target,
        received,
        balance: Math.max(0, target - received),
        paidCount: paidMembers.size,
        memberCount: roster.length,
        percentage:
          target > 0 ? Math.min(100, Math.round((received / target) * 100)) : 0,
      };
    },
    [payments, roster],
  );

  const paymentsForFee = useMemo(() => {
    const byMember = new Map();
    payments.forEach((payment) => {
      if (String(payment.fee?._id || payment.fee) !== selectedFeeId) return;
      const memberId = String(payment.member?._id || payment.member);
      const current = byMember.get(memberId);
      if (
        !current ||
        new Date(payment.createdAt).getTime() >
          new Date(current.createdAt).getTime()
      ) {
        byMember.set(memberId, payment);
      }
    });
    return byMember;
  }, [payments, selectedFeeId]);

  const totals = useMemo(() => {
    let collected = 0;
    let remitted = 0;
    let verified = 0;
    paymentsForFee.forEach((payment) => {
      const amount = Number(payment.claimedAmount || 0);
      if (payment.status === "VERIFIED") verified += amount;
      else if (payment.status === "PENDING_MANUAL_REVIEW") {
        collected += amount;
        if (payment.remitted) remitted += amount;
      }
    });
    return { collected, remitted, verified };
  }, [paymentsForFee]);

  const updateRecordForm = (memberId, patch) =>
    setRecordForms((current) => ({
      ...current,
      [memberId]: { ...(current[memberId] || emptyRecordForm()), ...patch },
    }));

  const handleRecord = async (member) => {
    const memberId = String(member._id);
    const form = recordForms[memberId] || emptyRecordForm();
    if (
      form.method === "GCASH" &&
      !/^\d{10,13}$/.test(form.referenceNumber.replace(/\D/g, ""))
    ) {
      setNotice("Enter a valid 10-to-13-digit e-wallet reference number.");
      return;
    }
    setRecordingId(memberId);
    setNotice("");
    try {
      await API.post("/payments/class-collect", {
        feeId: selectedFeeId,
        memberId,
        paymentMethod: form.method,
        referenceNumber: form.referenceNumber,
        cashReceiptNumber: form.cashReceiptNumber,
        cashNotes: form.cashNotes,
      });
      setRecordForms((current) => {
        const next = { ...current };
        delete next[memberId];
        return next;
      });
      setNotice(`Payment recorded for ${member.name}.`);
      await loadAll();
    } catch (requestError) {
      setNotice(requestError.message || "Unable to record the payment.");
    } finally {
      setRecordingId("");
    }
  };

  const handleRemit = async (payment) => {
    const paymentId = String(payment._id);
    setRemittingId(paymentId);
    setNotice("");
    try {
      const response = await API.patch(`/payments/${paymentId}/remit`);
      setNotice(
        response.message || "Payment remitted to the organization treasurer.",
      );
      await loadAll();
    } catch (requestError) {
      setNotice(requestError.message || "Unable to remit the payment.");
    } finally {
      setRemittingId("");
    }
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-12 text-center text-xs font-semibold text-slate-500">
        Loading collections...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-semibold text-amber-800">
          {notice}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-2">
        <h3 className="text-sm font-extrabold text-[#4A0E17]">
          Collect Class Dues
        </h3>
        <p className="text-xs text-slate-500">
          Approved dues from your parent organization. Record each
          classmate&apos;s cash or e-wallet payment, then remit the batch to
          the organization treasurer for verification.
        </p>
        {(parentOrg?.gcashNumber ||
          parentOrg?.paymayaNumber ||
          parentOrg?.gcashQrImage) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <p className="font-bold">
              Classmates send e-wallet payments here:
            </p>
            <div className="mt-2 flex items-center gap-3">
              {parentOrg?.gcashQrImage && (
                <img
                  src={parentOrg.gcashQrImage}
                  alt="GCash QR code"
                  className="h-24 w-24 shrink-0 rounded-lg border border-emerald-200 bg-white object-contain"
                />
              )}
              <div className="space-y-1 font-semibold">
                {parentOrg?.gcashNumber && (
                  <p>GCash: {parentOrg.gcashNumber}</p>
                )}
                {parentOrg?.paymayaNumber && (
                  <p>PayMaya: {parentOrg.paymayaNumber}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {fees.length === 0 && (
          <p className="text-xs text-slate-400">
            No approved dues available for collection right now.
          </p>
        )}
      </div>

      {selectedFee && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ["Collected", totals.collected, "text-[#8B6E10]"],
            ["Remitted", totals.remitted, "text-blue-700"],
            ["Verified", totals.verified, "text-emerald-700"],
          ].map(([label, amount, color]) => (
            <div
              key={label}
              className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs space-y-1.5"
            >
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {label}
              </p>
              <p className={`text-xl font-bold ${color}`}>
                {formatCurrency(amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {fees.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
          {fees.map((fee) => {
            const feeId = String(fee._id);
            const isSelected = feeId === selectedFeeId;
            const stats = classStatsForFee(fee);
            return (
              <div
                key={feeId}
                className={`rounded-2xl border p-5 shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                  isSelected
                    ? "border-[#4A0E17] bg-white ring-2 ring-[#4A0E17]/20"
                    : "bg-slate-50/60 border-slate-200/80 hover:border-[#D4AF37]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-[#4A0E17] text-sm leading-snug">
                      {fee.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg">
                        ₱
                        {Number(fee.amount || 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Adviser Approved
                      </span>
                    </div>
                  </div>

                  {fee.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {fee.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-500">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <p className="text-[9px] font-bold uppercase text-slate-400">
                        Target
                      </p>
                      <p className="font-black text-slate-800">
                        ₱{Number(stats.target || 0).toLocaleString("en-PH")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200">
                      <p className="text-[9px] font-bold uppercase text-emerald-600">
                        Received
                      </p>
                      <p className="font-black text-emerald-800">
                        ₱{Number(stats.received || 0).toLocaleString("en-PH")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2 border border-amber-200">
                      <p className="text-[9px] font-bold uppercase text-amber-600">
                        Balance
                      </p>
                      <p className="font-black text-amber-900">
                        ₱{Number(stats.balance || 0).toLocaleString("en-PH")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between font-bold">
                      <span>
                        {stats.paidCount} of {stats.memberCount} paid
                      </span>
                      <span>{stats.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span>
                      Due Date:{" "}
                      <span className="font-bold text-amber-700">
                        {formatDueDate(fee.dueDate)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeId(feeId)}
                      className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#4A0E17] text-white"
                          : "border border-[#4A0E17]/30 bg-white text-[#4A0E17] hover:bg-[#4A0E17]/5"
                      }`}
                    >
                      {isSelected ? "Collecting" : "Collect"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFee && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#4A0E17]/5 border-b border-slate-200/80 text-xs font-bold text-[#4A0E17]">
            {selectedFee.title} — {roster.length} classmate
            {roster.length === 1 ? "" : "s"}
          </div>
            {roster.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No classmates listed yet. Ask your class president to build
                the roster first.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {roster.map((member) => {
                  const memberId = String(member._id);
                  const payment = paymentsForFee.get(memberId);
                  const state = memberPaymentState(payment);
                  const form = recordForms[memberId] || emptyRecordForm();
                  const canRecord = state === "unpaid" || state === "rejected";
                  const isRecording = recordingId === memberId;

                  return (
                    <div key={memberId} className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {member.email}
                            {member.idNumber
                              ? ` • ${member.idNumber}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${stateStyles[state]}`}
                        >
                          {stateLabels[state]}
                        </span>
                      </div>

                      {payment && state !== "unpaid" && (
                        <p className="text-[11px] text-slate-500">
                          {formatCurrency(payment.claimedAmount)} •{" "}
                          {payment.paymentMethod === "CASH"
                            ? `Cash${payment.cashReceiptNumber ? ` • ${payment.cashReceiptNumber}` : ""}`
                            : `E-wallet • ${payment.referenceNumber || ""}`}
                          {payment.remitted ? " • Remitted" : ""}
                          {payment.status === "REJECTED" && payment.failureReason
                            ? ` • Rejected: ${payment.failureReason}`
                            : ""}
                        </p>
                      )}

                      {canRecord ? (
                        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2">
                          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                            {["CASH", "GCASH"].map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() =>
                                  updateRecordForm(memberId, {
                                    method,
                                  })
                                }
                                aria-pressed={form.method === method}
                                className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                                  form.method === method
                                    ? "bg-[#4A0E17] text-white shadow-sm"
                                    : "text-slate-500 hover:text-[#4A0E17]"
                                }`}
                              >
                                {method === "CASH" ? "Cash" : "E-wallet"}
                              </button>
                            ))}
                          </div>
                          {form.method === "GCASH" ? (
                            <input
                              value={form.referenceNumber}
                              onChange={(event) =>
                                updateRecordForm(memberId, {
                                  referenceNumber: event.target.value,
                                })
                              }
                              placeholder="E-wallet ref. number"
                              inputMode="numeric"
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#4A0E17]"
                            />
                          ) : (
                            <input
                              value={form.cashReceiptNumber}
                              onChange={(event) =>
                                updateRecordForm(memberId, {
                                  cashReceiptNumber: event.target.value,
                                })
                              }
                              placeholder="Receipt no. (optional)"
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#4A0E17]"
                            />
                          )}
                          {form.method === "CASH" && (
                            <input
                              value={form.cashNotes}
                              onChange={(event) =>
                                updateRecordForm(memberId, {
                                  cashNotes: event.target.value,
                                })
                              }
                              placeholder="Notes (optional)"
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#4A0E17] sm:col-span-2"
                            />
                          )}
                          <div className="sm:col-span-2 flex justify-end">
                            <button
                              type="button"
                              disabled={isRecording}
                              onClick={() => handleRecord(member)}
                              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              {isRecording ? "Recording..." : "Record Payment"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        state === "collected" && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={remittingId === String(payment._id)}
                              onClick={() => handleRemit(payment)}
                              className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              {remittingId === String(payment._id)
                                ? "Remitting..."
                                : "Remit to Org Treasurer"}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
