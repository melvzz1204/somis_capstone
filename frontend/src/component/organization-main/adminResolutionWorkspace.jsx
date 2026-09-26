import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, LoaderCircle, RefreshCw } from "lucide-react";
import API from "../../api/axios";
import ResolutionDocumentModal from "./resolutionDocumentModal";
import { getStatusClass, isTerminal } from "../../util/resolutionStatus";

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));

const IN_REVIEW_STATUSES = [
  "Submitted",
  "Pending Adviser Review",
  "Pending Dean Review",
  "Pending Director Review",
  "Pending OVPSAS Approval",
];

const statusViews = [
  { key: "All", label: "All" },
  { key: "In Review", label: "In Review" },
  { key: "Pending OVPSAS Approval", label: "Awaiting OVPSAS" },
  { key: "Adopted", label: "Adopted" },
  { key: "Rejected", label: "Rejected" },
  { key: "Draft", label: "Draft" },
];

const pendingReviewerByStatus = {
  Submitted: "president",
  "Pending Adviser Review": "adviser",
  "Pending Dean Review": "dean",
  "Pending Director Review": "director",
  "Pending OVPSAS Approval": "ovpsas",
};

const pendingReviewerLabel = {
  president: "organization president",
  adviser: "faculty adviser",
  dean: "department dean",
  director: "director",
  ovpsas: "OVPSAS",
};

const matchesView = (status, view) => {
  if (view === "All") return true;
  if (view === "In Review") return IN_REVIEW_STATUSES.includes(status);
  return status === view;
};

export default function AdminResolutionWorkspace({ colleges = [] }) {
  const [resolutions, setResolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All");
  const [statusView, setStatusView] = useState("All");
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [actionId, setActionId] = useState("");
  const [notice, setNotice] = useState("");
  const [ovpsasSignature, setOvpsasSignature] = useState("");
  const [remarksForms, setRemarksForms] = useState({});

  const loadResolutions = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const params = collegeFilter === "All" ? {} : { college: collegeFilter };
      const response = await API.get("/resolutions", { params });
      setResolutions(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setLoadError(
        requestError.message || "Unable to load resolutions for review.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [collegeFilter]);

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      loadResolutions();
    }, 0);
    API.get("/resolutions/ovpsas-signature")
      .then((response) => {
        setOvpsasSignature(
          response.data?.digitalSignature || response.digitalSignature || "",
        );
      })
      .catch(() => setOvpsasSignature(""));
    return () => window.clearTimeout(requestId);
  }, [loadResolutions]);

  const handleOvpsasReview = async (resolution, decision) => {
    setActionId(resolution._id);
    setNotice("");
    try {
      const response = await API.patch(`/resolutions/${resolution._id}/review`, {
        decision,
        remarks: remarksForms[resolution._id] || "",
      });
      setResolutions((current) =>
        current.map((item) =>
          item._id === resolution._id ? response.data : item,
        ),
      );
      setRemarksForms((current) => {
        const next = { ...current };
        delete next[resolution._id];
        return next;
      });
      setNotice(response.message || `Resolution ${decision.toLowerCase()}.`);
    } catch (requestError) {
      setNotice(
        requestError.message || "Unable to save the OVPSAS decision.",
      );
    } finally {
      setActionId("");
    }
  };

  const collegeOptions = useMemo(() => {
    const names = new Set();
    colleges.forEach((college) => {
      if (college?.name) names.add(college.name);
    });
    resolutions.forEach((resolution) => {
      if (resolution.org?.college) names.add(resolution.org.college);
    });
    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }, [colleges, resolutions]);

  const visibleResolutions = useMemo(
    () =>
      resolutions.filter((resolution) =>
        matchesView(resolution.status, statusView),
      ),
    [resolutions, statusView],
  );

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          {notice}
        </div>
      )}
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#9A6F16]">
              OVPSAS oversight
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold text-[#4A0E17]">
              Resolutions
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Review the resolutions submitted by recognized organizations
              across every college. Items cleared by the director await your
              final OVPSAS approval.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="whitespace-nowrap uppercase tracking-wide">
                College
              </span>
              <select
                value={collegeFilter}
                onChange={(event) => setCollegeFilter(event.target.value)}
                className="min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#4A0E17] focus:outline-none focus:ring-1 focus:ring-[#4A0E17]"
              >
                <option value="All">All Colleges</option>
                {collegeOptions.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={loadResolutions}
              title="Refresh resolutions"
              aria-label="Refresh resolutions"
              className="grid h-[38px] w-[38px] shrink-0 place-items-center self-end rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#4A0E17]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        className="inline-flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1"
        role="tablist"
        aria-label="Resolution status views"
      >
        {statusViews.map((item) => {
          const count = resolutions.filter((resolution) =>
            matchesView(resolution.status, item.key),
          ).length;

          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={statusView === item.key}
              onClick={() => setStatusView(item.key)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                statusView === item.key
                  ? "bg-[#4A0E17] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-6 py-12 text-xs font-bold text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading resolutions...
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-start justify-between gap-3 border-l-4 border-rose-500 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-rose-800">{loadError}</p>
          <button
            type="button"
            onClick={loadResolutions}
            className="text-xs font-extrabold text-rose-800 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : visibleResolutions.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileText
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-extrabold text-slate-700">
            No resolutions found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {collegeFilter === "All"
              ? "Resolutions appear here once organizations submit them."
              : `No resolutions for ${collegeFilter} in this view.`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {visibleResolutions.map((resolution) => {
            const proposal = resolution.activityProposal || {};
            const pendingReviewer = pendingReviewerByStatus[resolution.status];

            return (
              <article key={resolution._id} className="p-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[#4A0E17]">
                        {resolution.title}
                      </h3>
                      {resolution.resolutionNumber && (
                        <span className="rounded-md border border-[#4A0E17]/20 bg-[#4A0E17]/5 px-2 py-0.5 text-[10px] font-bold text-[#4A0E17]">
                          {resolution.resolutionNumber}
                        </span>
                      )}
                      {resolution.org && (
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {resolution.org.acronym || resolution.org.name}
                        </span>
                      )}
                      {resolution.org?.college && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {resolution.org.college}
                        </span>
                      )}
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getStatusClass(
                          resolution.status,
                        )}`}
                      >
                        {resolution.status}
                      </span>
                    </div>
                    {resolution.subject && (
                      <p className="mt-1 text-xs italic text-slate-500">
                        {resolution.subject}
                      </p>
                    )}
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Embeds:{" "}
                      <span className="font-semibold text-slate-700">
                        {proposal.proposalTitle}
                      </span>{" "}
                      · {proposal.activityCategory}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Submitted {formatDateTime(resolution.submittedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedResolution(resolution)}
                      className="rounded-lg border border-[#4A0E17] bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white"
                    >
                      View Resolution
                    </button>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-y border-slate-100 py-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="font-semibold text-slate-400">
                      Basis Meeting
                    </dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {resolution.meeting?.title || "Linked meeting"}
                    </dd>
                    <dd className="text-slate-500">
                      {formatDateTime(resolution.meeting?.startDateTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-400">Schedule</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {formatDateTime(proposal.requestedStartDateTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-400">Budget</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {formatCurrency(proposal.totalBudgetAllocation)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-400">Clauses</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {(resolution.resolvedClauses || []).length} resolved ·{" "}
                      {(resolution.whereasClauses || []).length} whereas
                    </dd>
                  </div>
                </dl>

                {!isTerminal(resolution.status) && pendingReviewer && (
                  <div className="mt-4 border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
                    <p className="font-extrabold text-slate-800">
                      Awaiting {pendingReviewerLabel[pendingReviewer]} review
                    </p>
                  </div>
                )}

                {resolution.status === "Pending OVPSAS Approval" && (
                  <div className="mt-4 border border-orange-200 bg-orange-50/50 px-4 py-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="text-[11px] font-bold text-slate-700">
                        OVPSAS E-Signature
                        <div className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold italic uppercase text-slate-800">
                          {ovpsasSignature || "OVPSAS name unavailable"}
                        </div>
                      </div>
                      <label className="text-[11px] font-bold text-slate-700">
                        Remarks (Optional)
                        <textarea
                          value={remarksForms[resolution._id] || ""}
                          onChange={(event) =>
                            setRemarksForms((current) => ({
                              ...current,
                              [resolution._id]: event.target.value,
                            }))
                          }
                          maxLength={500}
                          rows={2}
                          className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#4A0E17]"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOvpsasReview(resolution, "Rejected")}
                        disabled={actionId === resolution._id || !ovpsasSignature}
                        className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOvpsasReview(resolution, "Approved")}
                        disabled={actionId === resolution._id || !ovpsasSignature}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionId === resolution._id
                          ? "Saving..."
                          : "Approve and Adopt"}
                      </button>
                    </div>
                  </div>
                )}

                {resolution.attachments?.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-bold text-slate-500">
                      Attachments:
                    </span>
                    {resolution.attachments.map((file) => (
                      <a
                        key={file._id}
                        href={`${apiOrigin}${file.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-52 truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-[#4A0E17] hover:border-[#4A0E17]/40"
                      >
                        {file.originalName}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedResolution && (
        <ResolutionDocumentModal
          resolution={selectedResolution}
          onClose={() => setSelectedResolution(null)}
        />
      )}
    </div>
  );
}
