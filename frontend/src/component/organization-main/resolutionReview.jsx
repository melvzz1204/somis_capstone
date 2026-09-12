import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import ResolutionDocumentModal from "./resolutionDocumentModal";
import { getStatusClass } from "../../util/resolutionStatus";

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

const reviewConfig = {
  president: {
    title: "Resolution Approval",
    description:
      "Review resolutions prepared by the organization secretary and forward approved resolutions to the faculty adviser.",
    expectedStatus: "Submitted",
    signatureEndpoint: "/resolutions/president-signature",
    signatureLabel: "Organization President E-Signature",
    reviewerName: "Organization president",
  },
  adviser: {
    title: "Faculty Adviser Approval",
    description:
      "Review resolutions approved by the organization president and forward approved resolutions to the dean.",
    expectedStatus: "Pending Adviser Review",
    signatureEndpoint: "/resolutions/adviser-signature",
    signatureLabel: "Faculty Adviser E-Signature",
    reviewerName: "Faculty adviser",
  },
  dean: {
    title: "Department Dean Adoption",
    description:
      "Validate resolutions approved by the president and adviser. Your approval adopts the resolution.",
    expectedStatus: "Pending Dean Review",
    signatureEndpoint: "/resolutions/dean-signature",
    signatureLabel: "Department Dean E-Signature",
    reviewerName: "Department dean",
  },
};

const reviewHistory = [
  ["presidentReview", "Organization President"],
  ["adviserReview", "Faculty Adviser"],
  ["deanReview", "Department Dean"],
];

export default function ResolutionReview({
  resolutions,
  isLoading,
  actionId,
  onReview,
  reviewRole = "president",
}) {
  const config = reviewConfig[reviewRole] || reviewConfig.president;
  const [reviewForms, setReviewForms] = useState({});
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [digitalSignature, setDigitalSignature] = useState("");
  const [isLoadingSignature, setIsLoadingSignature] = useState(true);
  const [signatureError, setSignatureError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDigitalSignature = async () => {
      setIsLoadingSignature(true);
      setSignatureError("");
      try {
        const response = await API.get(config.signatureEndpoint);
        if (isMounted) {
          setDigitalSignature(
            response.data?.digitalSignature || response.digitalSignature || "",
          );
        }
      } catch (error) {
        if (isMounted) {
          setDigitalSignature("");
          setSignatureError(
            error.message || `Unable to load the ${config.reviewerName} name.`,
          );
        }
      } finally {
        if (isMounted) setIsLoadingSignature(false);
      }
    };

    loadDigitalSignature();
    return () => {
      isMounted = false;
    };
  }, [config.reviewerName, config.signatureEndpoint]);

  const updateReviewField = (resolutionId, value) => {
    setReviewForms((current) => ({
      ...current,
      [resolutionId]: { remarks: value },
    }));
  };

  const submitDecision = async (resolution, decision) => {
    const completed = await onReview(resolution, {
      decision,
      remarks: reviewForms[resolution._id]?.remarks || "",
    });

    if (completed) {
      setReviewForms((current) => {
        const next = { ...current };
        delete next[resolution._id];
        return next;
      });
    }
  };

  const filteredResolutions = useMemo(
    () =>
      statusFilter === "All"
        ? resolutions
        : resolutions.filter((item) => item.status === statusFilter),
    [resolutions, statusFilter],
  );

  const filterOptions = ["All", config.expectedStatus, "Adopted", "Rejected"];

  if (isLoading) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-12 text-center text-xs font-semibold text-slate-500">
        Loading resolutions for review...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-base font-bold text-[#4A0E17]">
              {config.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{config.description}</p>
          </div>
          <div
            className="flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto"
            role="group"
            aria-label="Filter resolutions by status"
          >
            {filterOptions.map((option) => {
              const count =
                option === "All"
                  ? resolutions.length
                  : resolutions.filter((item) => item.status === option).length;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  aria-pressed={statusFilter === option}
                  className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors sm:flex-none ${
                    statusFilter === option
                      ? "bg-[#4A0E17] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-[#4A0E17]"
                  }`}
                >
                  {option} <span className="ml-0.5 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredResolutions.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-bold text-slate-700">
            No resolutions available for {config.reviewerName.toLowerCase()}{" "}
            review
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Resolutions appear here when they reach this approval stage.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {filteredResolutions.map((resolution) => {
            const proposal = resolution.activityProposal || {};
            const isActionable = resolution.status === config.expectedStatus;
            const isFinal = ["Adopted", "Rejected"].includes(resolution.status);
            const isActing = actionId === resolution._id;

            return (
              <article key={resolution._id} className="p-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
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
                      {resolution.org && (
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {resolution.org.acronym || resolution.org.name}
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
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Embeds:{" "}
                      <span className="font-semibold text-slate-700">
                        {proposal.proposalTitle}
                      </span>{" "}
                      · {proposal.activityCategory}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-row items-center gap-3 lg:flex-col lg:items-end">
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
                      {(resolution.resolvedClauses || []).length} resolved
                    </dd>
                  </div>
                </dl>

                {reviewHistory.some(
                  ([field]) => resolution[field]?.reviewedAt,
                ) && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {reviewHistory.map(([field, label]) => {
                      const review = resolution[field];
                      if (!review?.reviewedAt) return null;
                      return (
                        <div
                          key={field}
                          className={`border px-3 py-3 text-[11px] ${
                            review.decision === "Rejected"
                              ? "border-rose-200 bg-rose-50"
                              : "border-emerald-200 bg-emerald-50"
                          }`}
                        >
                          <p className="font-extrabold text-slate-800">
                            {label}: {review.decision}
                          </p>
                          <p className="mt-1 font-bold italic text-slate-700">
                            {review.digitalSignature || "Signature unavailable"}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {formatDateTime(review.reviewedAt)}
                          </p>
                          {review.remarks && (
                            <p className="mt-2 whitespace-pre-wrap text-slate-600">
                              {review.remarks}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isActionable ? (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="text-[11px] font-bold text-slate-700">
                        {config.signatureLabel}
                        <div className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold italic uppercase text-slate-800">
                          {isLoadingSignature
                            ? `Loading ${config.reviewerName.toLowerCase()} name...`
                            : digitalSignature ||
                              `${config.reviewerName} name unavailable`}
                        </div>
                        {signatureError && (
                          <p className="mt-1 font-medium text-rose-600">
                            {signatureError}
                          </p>
                        )}
                      </div>
                      <label className="text-[11px] font-bold text-slate-700">
                        Remarks (Optional)
                        <textarea
                          value={reviewForms[resolution._id]?.remarks || ""}
                          onChange={(event) =>
                            updateReviewField(resolution._id, event.target.value)
                          }
                          maxLength={500}
                          rows={2}
                          className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => submitDecision(resolution, "Rejected")}
                        disabled={
                          isActing || isLoadingSignature || !digitalSignature
                        }
                        className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => submitDecision(resolution, "Approved")}
                        disabled={
                          isActing || isLoadingSignature || !digitalSignature
                        }
                        className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing
                          ? "Saving Decision..."
                          : reviewRole === "dean"
                            ? "Approve and Adopt"
                            : "Approve and Forward"}
                      </button>
                    </div>
                  </div>
                ) : !isFinal ? (
                  <div className="mt-4 border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                    <p className="font-extrabold text-slate-800">
                      {resolution.status}
                    </p>
                    <p className="mt-1 text-slate-600">
                      This resolution has completed your review stage and is
                      waiting for the next authorized reviewer.
                    </p>
                  </div>
                ) : null}
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
