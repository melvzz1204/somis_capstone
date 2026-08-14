import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import ProposalDocumentModal from "./proposalDocumentModal";

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

const statusClasses = {
  Submitted: "border-amber-200 bg-amber-50 text-amber-800",
  "Pending Adviser Review": "border-blue-200 bg-blue-50 text-blue-800",
  "Pending Dean Review": "border-violet-200 bg-violet-50 text-violet-800",
  "Pending OVPSAS Review": "border-orange-200 bg-orange-50 text-orange-800",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

const reviewConfig = {
  leader: {
    title: "Activity Proposals",
    description:
      "Review proposals prepared by the organization secretary and record your decision.",
    expectedStatus: "Submitted",
    signatureEndpoint: "/proposals/leader-signature",
    signatureLabel: "Organization President E-Signature",
    reviewerName: "Organization leader",
  },
  adviser: {
    title: "Faculty Adviser Approval",
    description:
      "Review proposals approved by the organization president and forward approved requests to the dean.",
    expectedStatus: "Pending Adviser Review",
    signatureEndpoint: "/proposals/adviser-signature",
    signatureLabel: "Faculty Adviser E-Signature",
    reviewerName: "Faculty adviser",
  },
  dean: {
    title: "Department Dean Approval",
    description:
      "Validate proposals approved by the organization leader and faculty adviser before OVPSAS review.",
    expectedStatus: "Pending Dean Review",
    signatureEndpoint: "/proposals/dean-signature",
    signatureLabel: "Department Dean E-Signature",
    reviewerName: "Department dean",
  },
  admin: {
    title: "OVPSAS Final Approval",
    description:
      "Issue the final approval or rejection for proposals endorsed by the leader, adviser, and dean.",
    expectedStatus: "Pending OVPSAS Review",
    signatureEndpoint: "/proposals/ovpsas-signature",
    signatureLabel: "OVPSAS E-Signature",
    reviewerName: "OVPSAS",
  },
};

const reviewHistory = [
  ["leaderReview", "Organization Leader"],
  ["adviserReview", "Faculty Adviser"],
  ["deanReview", "Department Dean"],
  ["ovpsasReview", "OVPSAS"],
];

export default function LeaderProposalReview({
  proposals,
  isLoading,
  actionId,
  onReview,
  reviewRole = "leader",
}) {
  const config = reviewConfig[reviewRole] || reviewConfig.leader;
  const [reviewForms, setReviewForms] = useState({});
  const [selectedProposal, setSelectedProposal] = useState(null);
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

  const updateReviewField = (proposalId, value) => {
    setReviewForms((current) => ({
      ...current,
      [proposalId]: { remarks: value },
    }));
  };

  const submitDecision = async (proposal, decision) => {
    const completed = await onReview(proposal, {
      decision,
      remarks: reviewForms[proposal._id]?.remarks || "",
    });

    if (completed) {
      setReviewForms((current) => {
        const next = { ...current };
        delete next[proposal._id];
        return next;
      });
    }
  };

  const filteredProposals = useMemo(
    () =>
      statusFilter === "All"
        ? proposals
        : proposals.filter((proposal) => proposal.status === statusFilter),
    [proposals, statusFilter],
  );

  const filterOptions = ["All", config.expectedStatus, "Approved", "Rejected"];

  if (isLoading) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-12 text-center text-xs font-semibold text-slate-500">
        Loading proposals for review...
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
            <p className="mt-0.5 text-xs text-slate-500">
              {config.description}
            </p>
          </div>
          <div
            className="flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto"
            role="group"
            aria-label="Filter activity proposals by status"
          >
            {filterOptions.map((option) => {
              const count =
                option === "All"
                  ? proposals.length
                  : proposals.filter((proposal) => proposal.status === option)
                      .length;

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

      {filteredProposals.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-bold text-slate-700">
            {statusFilter === "All"
              ? `No proposals available for ${config.reviewerName.toLowerCase()} review`
              : `No ${statusFilter.toLowerCase()} proposals`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {statusFilter === "All"
              ? "Proposals will appear here when they reach this approval stage."
              : "Try another status filter to view more activity proposals."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {filteredProposals.map((proposal) => {
            const isFinal = ["Approved", "Rejected"].includes(proposal.status);
            const isActionable = proposal.status === config.expectedStatus;
            const isActing = actionId === proposal._id;

            return (
              <article key={proposal._id} className="p-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#4A0E17]">
                        {proposal.proposalTitle}
                      </h4>
                      {reviewRole === "admin" && proposal.org && (
                        <span className="rounded-md border border-[#4A0E17]/20 bg-[#4A0E17]/5 px-2 py-0.5 text-[10px] font-bold text-[#4A0E17]">
                          {proposal.org.acronym || proposal.org.name}
                        </span>
                      )}
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          statusClasses[proposal.status] ||
                          "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {proposal.status}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {proposal.activityCategory}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {proposal.projectDescription}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-row items-center gap-3 lg:flex-col lg:items-end">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Submitted {formatDateTime(proposal.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProposal(proposal)}
                      className="rounded-lg border border-[#4A0E17] bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white"
                    >
                      View Proposal
                    </button>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-y border-slate-100 py-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="font-semibold text-slate-400">Schedule</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {formatDateTime(proposal.requestedStartDateTime)} to{" "}
                      {formatDateTime(proposal.requestedEndDateTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-400">
                      Venue and Audience
                    </dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {proposal.targetVenue} · {proposal.targetAudience}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-400">
                      Attendance and Budget
                    </dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {proposal.expectedAttendees} attendees ·{" "}
                      {formatCurrency(proposal.totalBudgetAllocation)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-400">
                      Project Lead
                    </dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {proposal.projectLeadPerson}
                    </dd>
                    <dd className="text-slate-500">
                      {proposal.projectLeadContact}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 grid gap-4 text-xs md:grid-cols-2">
                  <div>
                    <p className="font-bold text-slate-500">Objectives</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-600">
                      {proposal.projectObjectives}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500">Source of Funds</p>
                    <p className="mt-1 text-slate-600">
                      {proposal.sourceOfFunds}
                    </p>
                  </div>
                </div>

                {proposal.attachments?.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-bold text-slate-500">
                      Attachments:
                    </span>
                    {proposal.attachments.map((file) => (
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

                {reviewHistory.some(
                  ([field]) => proposal[field]?.reviewedAt,
                ) && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {reviewHistory.map(([field, label]) => {
                      const review = proposal[field];
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
                          value={reviewForms[proposal._id]?.remarks || ""}
                          onChange={(event) =>
                            updateReviewField(proposal._id, event.target.value)
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
                        onClick={() => submitDecision(proposal, "Rejected")}
                        disabled={
                          isActing || isLoadingSignature || !digitalSignature
                        }
                        className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => submitDecision(proposal, "Approved")}
                        disabled={
                          isActing || isLoadingSignature || !digitalSignature
                        }
                        className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing
                          ? "Saving Decision..."
                          : reviewRole === "admin"
                            ? "Final Approve"
                            : "Approve and Forward"}
                      </button>
                    </div>
                  </div>
                ) : !isFinal ? (
                  <div className="mt-4 border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                    <p className="font-extrabold text-slate-800">
                      {proposal.status}
                    </p>
                    <p className="mt-1 text-slate-600">
                      This proposal has completed your review stage and is
                      waiting for the next authorized reviewer.
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {selectedProposal && (
        <ProposalDocumentModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}
