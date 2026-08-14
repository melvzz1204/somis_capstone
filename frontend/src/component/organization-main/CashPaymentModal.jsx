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
            <div className="border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}
          <div className="relative">
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              htmlFor="cash-student-search"
            >
              Student name or student ID
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
                  className="text-xs font-bold text-emerald-800"
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
                  placeholder="Search name or student ID"
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#4A0E17]"
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
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-rose-50"
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
          <div>
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              htmlFor="cash-fee"
            >
              Dues collection
            </label>
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#4A0E17]"
            >
              <option value="">Select dues collection</option>
              {fees
                .filter((fee) => fee.status === "active")
                .map((fee) => (
                  <option key={fee._id} value={fee._id}>
                    {fee.title} — ₱{Number(fee.amount || 0).toFixed(2)}
                  </option>
                ))}
            </select>
          </div>
          {selectedFee && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
              Confirm cash received: ₱
              {Number(selectedFee.amount || 0).toFixed(2)}
            </div>
          )}
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#4A0E17]"
            />
          </div>
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#4A0E17]"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFee || !selectedStudent}
              className="rounded-lg bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Confirm cash received"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
