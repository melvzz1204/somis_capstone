import { useMemo, useState } from "react";
import API from "../../api/axios";

export default function CashPaymentModal({
  fees,
  roster,
  onClose,
  onRecorded,
}) {
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({
    feeId: "",
    cashReceiptNumber: "",
    cashNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const students = useMemo(
    () =>
      (roster || []).filter(
        (member) =>
          !["Faculty Adviser", "Department Dean"].includes(member.role),
      ),
    [roster],
  );
  const selectedFee = fees.find((fee) => fee._id === form.feeId);
  const eligibleStudents = useMemo(() => {
    if (!selectedFee) return students;
    const targetIds = new Set(
      (selectedFee.targetMembers || []).map((member) => String(member.member)),
    );
    const targetEmails = new Set(
      (selectedFee.targetMembers || []).map((member) =>
        String(member.email || "").toLowerCase(),
      ),
    );
    if (targetIds.size === 0 && targetEmails.size === 0) return students;
    return students.filter(
      (student) =>
        targetIds.has(String(student._id || "")) ||
        targetEmails.has(String(student.email || "").toLowerCase()),
    );
  }, [selectedFee, students]);
  const matches = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query || selectedStudent) return [];
    return eligibleStudents
      .filter((student) =>
        [
          student.name,
          student.firstName,
          student.surname,
          student.idNumber,
          student.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 8);
  }, [studentQuery, selectedStudent, eligibleStudents]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedStudent || !form.feeId) {
      setError("Select a student and dues collection first.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const targetMember = (selectedFee.targetMembers || []).find(
        (member) =>
          String(member.email || "").toLowerCase() ===
          String(selectedStudent.email || "").toLowerCase(),
      );
      const response = await API.post("/payments/cash", {
        ...form,
        memberId: targetMember?.member || selectedStudent._id,
        studentIdentifier: selectedStudent.idNumber || selectedStudent.email,
      });
      onRecorded(response.data);
    } catch (requestError) {
      setError(requestError.message || "Unable to record the cash payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-md p-5 sm:p-6">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-[#4A0E17]">
            Record cash payment
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Only record this after receiving the cash. The payment is
            immediately marked verified.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* 1. DUES COLLECTION DROPDOWN (TOP HIERARCHY) */}
          <div>
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              htmlFor="cash-fee"
            >
              Dues collection <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <select
                id="cash-fee"
                required
                value={form.feeId}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    feeId: event.target.value,
                  }));
                  setSelectedStudent(null);
                  setStudentQuery("");
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm font-medium text-slate-800 outline-none transition-all focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
              >
                <option value="">Select dues collection...</option>
                {fees
                  .filter((fee) => fee.status === "active")
                  .map((fee) => (
                    <option key={fee._id} value={fee._id}>
                      {fee.title} — ₱
                      {Number(fee.amount || 0).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </option>
                  ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* FEE CONFIRMATION BADGE */}
          {selectedFee && (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-900 shadow-xs">
              <span>Confirm cash amount:</span>
              <span className="text-sm font-black text-[#4A0E17]">
                ₱
                {Number(selectedFee.amount || 0).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* 2. STUDENT SEARCH (SECOND IN HIERARCHY) */}
          <div className="relative">
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              htmlFor="cash-student-search"
            >
              Student name or student ID{" "}
              <span className="text-rose-600">*</span>
            </label>
            {selectedStudent ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm">
                <div>
                  <p className="font-bold text-emerald-900">
                    {selectedStudent.name}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {selectedStudent.idNumber || selectedStudent.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentQuery("");
                  }}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  id="cash-student-search"
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="Search name or student ID..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
                />
                {matches.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {matches.map((student) => (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentQuery("");
                        }}
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left transition-colors hover:bg-rose-50/50"
                      >
                        <p className="text-sm font-bold text-slate-800">
                          {student.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {student.idNumber || "No student ID"} -{" "}
                          {student.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RECEIPT NUMBER */}
          <div>
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              htmlFor="cash-receipt-number"
            >
              Official receipt number (optional)
            </label>
            <input
              id="cash-receipt-number"
              value={form.cashReceiptNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cashReceiptNumber: event.target.value,
                }))
              }
              maxLength={100}
              placeholder="e.g. OR-2026-00123"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
            />
          </div>

          {/* NOTES */}
          <div>
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              htmlFor="cash-notes"
            >
              Notes (optional)
            </label>
            <textarea
              id="cash-notes"
              value={form.cashNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cashNotes: event.target.value,
                }))
              }
              maxLength={500}
              rows={3}
              placeholder="Add any remarks or notes..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFee || !selectedStudent}
              className="rounded-lg bg-[#4A0E17] hover:bg-[#601520] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Recording..." : "Confirm cash received"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
