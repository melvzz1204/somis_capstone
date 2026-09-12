import { useMemo, useState } from "react";
import ResolutionDocumentModal from "./resolutionDocumentModal";
import {
  PENDING_REVIEWER_BY_STATUS,
  getStatusClass,
  isTerminal,
} from "../../util/resolutionStatus";

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

const pendingReviewerLabel = {
  president: "organization president",
  adviser: "faculty adviser",
  dean: "department dean",
};

export default function ResolutionList({
  resolutions,
  isLoading,
  deletingId,
  submittingId,
  onCreate,
  onEdit,
  onSubmit,
  onDelete,
}) {
  const [view, setView] = useState("all");
  const [selectedResolution, setSelectedResolution] = useState(null);

  const views = useMemo(
    () => [
      { key: "all", label: "All", count: resolutions.length },
      {
        key: "Draft",
        label: "Draft",
        count: resolutions.filter((item) => item.status === "Draft").length,
      },
      {
        key: "Submitted",
        label: "In Review",
        count: resolutions.filter((item) =>
          ["Submitted", "Pending Adviser Review", "Pending Dean Review"].includes(
            item.status,
          ),
        ).length,
      },
      {
        key: "Adopted",
        label: "Adopted",
        count: resolutions.filter((item) => item.status === "Adopted").length,
      },
      {
        key: "Rejected",
        label: "Rejected",
        count: resolutions.filter((item) => item.status === "Rejected").length,
      },
    ],
    [resolutions],
  );

  const visibleResolutions = useMemo(() => {
    if (view === "all") return resolutions;
    if (view === "Submitted") {
      return resolutions.filter((item) =>
        ["Submitted", "Pending Adviser Review", "Pending Dean Review"].includes(
          item.status,
        ),
      );
    }
    return resolutions.filter((item) => item.status === view);
  }, [view, resolutions]);

  if (isLoading) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-12 text-center text-xs font-semibold text-slate-500">
        Loading resolutions...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-[#4A0E17]">Resolutions</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Draft resolutions from held meetings and route them through
            president, adviser, and dean approval.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="self-start rounded-lg bg-[#4A0E17] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#601520] sm:self-auto"
        >
          + Create Resolution
        </button>
      </div>

      <div
        className="inline-flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1"
        role="tablist"
        aria-label="Resolution views"
      >
        {views.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={view === item.key}
            onClick={() => setView(item.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
              view === item.key
                ? "bg-[#4A0E17] text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {visibleResolutions.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-bold text-slate-700">
            No resolutions in this view
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Create a resolution from a concluded meeting to begin the approval
            chain.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {visibleResolutions.map((resolution) => {
            const proposal = resolution.activityProposal || {};
            const editable = ["Draft", "Submitted"].includes(resolution.status);
            const isDraft = resolution.status === "Draft";
            const pendingReviewer =
              PENDING_REVIEWER_BY_STATUS[resolution.status];

            return (
              <article key={resolution._id} className="p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#4A0E17]">
                        {resolution.title}
                      </h4>
                      {resolution.resolutionNumber && (
                        <span className="rounded-md border border-[#4A0E17]/20 bg-[#4A0E17]/5 px-2 py-0.5 text-[10px] font-bold text-[#4A0E17]">
                          {resolution.resolutionNumber}
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
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedResolution(resolution)}
                      className="rounded-lg border border-[#4A0E17] bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white"
                    >
                      View
                    </button>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => onEdit(resolution)}
                        className="rounded-lg border border-[#4A0E17]/30 bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
                      >
                        Edit
                      </button>
                    )}
                    {isDraft && (
                      <>
                        <button
                          type="button"
                          onClick={() => onSubmit(resolution)}
                          disabled={submittingId === resolution._id}
                          className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {submittingId === resolution._id
                            ? "Submitting..."
                            : "Submit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(resolution)}
                          disabled={deletingId === resolution._id}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === resolution._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-y border-slate-100 py-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="font-semibold text-slate-400">Basis Meeting</dt>
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

                {!isTerminal(resolution.status) &&
                  resolution.status !== "Draft" &&
                  pendingReviewer && (
                    <div className="mt-4 border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
                      <p className="font-extrabold text-slate-800">
                        Awaiting {pendingReviewerLabel[pendingReviewer]} review
                      </p>
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
