import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import API from "../../api/axios";
import {
  ACADEMIC_PERIOD_SEMESTERS,
  formatAcademicPeriod,
  getAcademicYearOptions,
  getEffectiveAcademicPeriod,
} from "../../util/academicPeriod";
import { useToast } from "../../util/toastContext";

export default function AcademicPeriodSettings({
  organization,
  onUpdated,
  readOnly = false,
}) {
  const { showToast } = useToast();
  const initialPeriod = getEffectiveAcademicPeriod(organization);
  const [period, setPeriod] = useState(initialPeriod);
  const [form, setForm] = useState({
    mode: initialPeriod.mode || "automatic",
    academicYear: initialPeriod.academicYear,
    semester: initialPeriod.semester,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const academicYears = useMemo(
    () => getAcademicYearOptions(form.academicYear || period.academicYear, 3),
    [form.academicYear, period.academicYear],
  );

  useEffect(() => {
    let active = true;

    API.get("/organizations/academic-period")
      .then((response) => {
        if (!active) return;
        const nextPeriod = response?.data || response;
        setPeriod(nextPeriod);
        setForm({
          mode: nextPeriod.mode || "automatic",
          academicYear: nextPeriod.academicYear,
          semester: nextPeriod.semester,
        });
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "Unable to load the academic period.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const savePeriod = async (nextForm) => {
    if (readOnly || isLoading || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      const payload =
        nextForm.mode === "manual"
          ? {
              mode: "manual",
              academicYear: nextForm.academicYear,
              semester: nextForm.semester,
            }
          : { mode: "automatic" };
      const response = await API.patch(
        "/organizations/academic-period",
        payload,
      );
      const nextPeriod = response?.data || response;

      setPeriod(nextPeriod);
      setForm({
        mode: nextPeriod.mode || "automatic",
        academicYear: nextPeriod.academicYear,
        semester: nextPeriod.semester,
      });
      onUpdated?.(nextPeriod);
      showToast("University academic period updated by OVPSAS.", "success");
    } catch (requestError) {
      const message =
        requestError.message || "Unable to update the academic period.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormAndSave = (changes) => {
    const nextForm = { ...form, ...changes };
    setForm(nextForm);
    void savePeriod(nextForm);
  };

  return (
    <section className="border border-slate-200/80 bg-white shadow-xs">
      <div className="flex flex-col gap-4 bg-[#4A0E17]/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center bg-[#4A0E17] text-[#D4AF37]">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-[#4A0E17]">
              Academic Period
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isLoading
                ? "Loading current period..."
                : formatAcademicPeriod(period)}
            </p>
          </div>
        </div>

        {!readOnly ? (
          <button
            type="button"
            role="switch"
            aria-checked={form.mode === "automatic"}
            aria-label="Toggle automatic academic period"
            disabled={isLoading || isSaving}
            onClick={() =>
              updateFormAndSave({
                mode: form.mode === "automatic" ? "manual" : "automatic",
              })
            }
            className={`relative flex h-10 w-[9.5rem] shrink-0 items-center self-end rounded-full border p-1 text-[11px] font-bold shadow-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto ${
              form.mode === "automatic"
                ? "border-[#4A0E17] bg-[#4A0E17] text-white"
                : "border-slate-300 bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`absolute inset-y-1 left-1 w-[4.25rem] rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
                form.mode === "automatic"
                  ? "translate-x-[4.75rem]"
                  : "translate-x-0"
              }`}
            />
            <span className="relative z-10 flex w-1/2 items-center justify-center">
              Manual
            </span>
            <span
              className={`relative z-10 flex w-1/2 items-center justify-center ${
                form.mode === "automatic" ? "text-[#4A0E17]" : "text-slate-500"
              }`}
            >
              Automatic
            </span>
          </button>
        ) : (
          <span className="self-start border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 sm:self-auto">
            {period.mode === "manual"
              ? "OVPSAS selected"
              : "Calendar automatic"}
          </span>
        )}
      </div>

      {(readOnly || form.mode === "manual" || error || isSaving) && (
        <div className="space-y-4 border-t border-slate-200/80">
          {!readOnly && form.mode === "manual" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">
                Academic year
                <select
                  value={form.academicYear}
                  onChange={(event) =>
                    updateFormAndSave({ academicYear: event.target.value })
                  }
                  className="mt-1.5 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4A0E17]"
                  disabled={isSaving}
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      AY {year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">
                Semester
                <select
                  value={form.semester}
                  onChange={(event) =>
                    updateFormAndSave({ semester: event.target.value })
                  }
                  className="mt-1.5 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4A0E17]"
                  disabled={isSaving}
                >
                  {ACADEMIC_PERIOD_SEMESTERS.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && (
            <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </p>
          )}

          {isSaving && !readOnly ? (
            <p className="text-right text-[11px] font-semibold text-slate-500">
              Saving...
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
