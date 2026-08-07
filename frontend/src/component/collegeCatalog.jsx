import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { useToast } from "../util/toastContext";

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export default function CollegeCatalog() {
  const { showToast } = useToast();
  const [colleges, setColleges] = useState([]);
  const [newCollege, setNewCollege] = useState({ code: "", name: "" });
  const [programNames, setProgramNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState("");

  const loadColleges = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await API.get("/colleges");
      setColleges(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(error.message || "Unable to load colleges.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const request = window.setTimeout(loadColleges, 0);
    return () => window.clearTimeout(request);
  }, [loadColleges]);

  const handleAddCollege = async (event) => {
    event.preventDefault();
    const code = newCollege.code.trim().toUpperCase();
    const name = newCollege.name.trim();
    if (!code || !name) return;

    setPendingAction("college-add");
    try {
      const data = await API.post("/colleges", { code, name });
      setColleges((current) =>
        [...current, data.college].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewCollege({ code: "", name: "" });
      showToast(data.message || "College added successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to add college.", "error");
    } finally {
      setPendingAction("");
    }
  };

  const handleDeleteCollege = async (college) => {
    if (
      !window.confirm(
        `Delete ${college.name} and all of its registered programs?`,
      )
    ) {
      return;
    }

    setPendingAction(`college-${college._id}`);
    try {
      const data = await API.delete(`/colleges/${college._id}`);
      setColleges((current) =>
        current.filter((item) => item._id !== college._id),
      );
      showToast(data.message || "College deleted successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to delete college.", "error");
    } finally {
      setPendingAction("");
    }
  };

  const handleAddProgram = async (event, college) => {
    event.preventDefault();
    const name = (programNames[college._id] || "").trim();
    if (!name) return;

    setPendingAction(`program-add-${college._id}`);
    try {
      const data = await API.post(`/colleges/${college._id}/programs`, {
        name,
      });
      setColleges((current) =>
        current.map((item) =>
          item._id === college._id
            ? { ...item, programs: [...item.programs, data.program] }
            : item,
        ),
      );
      setProgramNames((current) => ({ ...current, [college._id]: "" }));
      showToast(data.message || "Program added successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to add program.", "error");
    } finally {
      setPendingAction("");
    }
  };

  const handleDeleteProgram = async (college, program) => {
    if (!window.confirm(`Delete ${program.name}?`)) return;

    setPendingAction(`program-${program._id}`);
    try {
      const data = await API.delete(
        `/colleges/${college._id}/programs/${program._id}`,
      );
      setColleges((current) =>
        current.map((item) =>
          item._id === college._id
            ? {
                ...item,
                programs: item.programs.filter(
                  (currentProgram) => currentProgram._id !== program._id,
                ),
              }
            : item,
        ),
      );
      showToast(data.message || "Program deleted successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to delete program.", "error");
    } finally {
      setPendingAction("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
          Colleges & Programs
        </h1>
        <p className="text-xs text-slate-500">
          Maintain the academic options used by organization registration and
          student onboarding.
        </p>
      </div>

      <form
        onSubmit={handleAddCollege}
        className="bg-white border border-slate-200/80 rounded-lg p-5 shadow-xs grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            College Code
          </label>
          <input
            required
            maxLength={20}
            placeholder="e.g. CICS"
            value={newCollege.code}
            onChange={(event) =>
              setNewCollege((current) => ({
                ...current,
                code: event.target.value.toUpperCase(),
              }))
            }
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#4A0E17]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            College Name
          </label>
          <input
            required
            maxLength={200}
            placeholder="e.g. College of Information and Computing Sciences"
            value={newCollege.name}
            onChange={(event) =>
              setNewCollege((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#4A0E17]"
          />
        </div>
        <button
          type="submit"
          disabled={pendingAction === "college-add"}
          className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <PlusIcon />
          <span>
            {pendingAction === "college-add" ? "Adding..." : "Add College"}
          </span>
        </button>
      </form>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-xs font-medium text-slate-500">
          Loading college catalog...
        </div>
      ) : colleges.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-xs text-slate-500">
          No colleges are registered.
        </div>
      ) : (
        <div className="space-y-4">
          {colleges.map((college) => (
            <section
              key={college._id}
              className="bg-white border border-slate-200/80 rounded-lg shadow-xs overflow-hidden"
            >
              <div className="px-5 py-4 bg-[#4A0E17]/5 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-[#4A0E17]">
                      {college.name}
                    </h2>
                    <span className="text-[10px] font-black text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                      {college.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {college.programs.length} registered{" "}
                    {college.programs.length === 1 ? "program" : "programs"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCollege(college)}
                  disabled={pendingAction === `college-${college._id}`}
                  className="p-2 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                  aria-label={`Delete ${college.name}`}
                  title={`Delete ${college.name}`}
                >
                  <TrashIcon />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <form
                  onSubmit={(event) => handleAddProgram(event, college)}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    required
                    maxLength={200}
                    placeholder="Add a degree program"
                    value={programNames[college._id] || ""}
                    onChange={(event) =>
                      setProgramNames((current) => ({
                        ...current,
                        [college._id]: event.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#4A0E17]"
                  />
                  <button
                    type="submit"
                    disabled={pendingAction === `program-add-${college._id}`}
                    className="px-3.5 py-2 bg-[#4A0E17] hover:bg-[#601520] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <PlusIcon />
                    <span>Add Program</span>
                  </button>
                </form>

                {college.programs.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No programs registered for this college.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {college.programs.map((program) => (
                      <div
                        key={program._id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <span className="text-xs font-medium text-slate-700">
                          {program.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProgram(college, program)}
                          disabled={pendingAction === `program-${program._id}`}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50 cursor-pointer"
                          aria-label={`Delete ${program.name}`}
                          title={`Delete ${program.name}`}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
