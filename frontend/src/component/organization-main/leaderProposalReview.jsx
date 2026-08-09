import { useEffect, useState } from "react";
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
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function LeaderProposalReview({
  proposals,
  isLoading,
  actionId,
  onReview,
  reviewRole = "leader",
}) {
  const isAdviserReview = reviewRole === "adviser";
  const [reviewForms, setReviewForms] = useState({});
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [isLoadingSignature, setIsLoadingSignature] = useState(true);
  const [signatureError, setSignatureError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDigitalSignature = async () => {
      setIsLoadingSignature(true);
      setSignatureError("");
      try {
        const endpoint = isAdviserReview
          ? "/proposals/adviser-signature"
          : "/proposals/leader-signature";
        const response = await API.get(endpoint);
        if (isMounted) {
          setDigitalSignature(response.data?.digitalSignature || "");
        }
      } catch (error) {
        if (isMounted) {
          setDigitalSignature("");
          setSignatureError(
            error.message ||
              `Unable to load the ${
                isAdviserReview ? "faculty adviser" : "organization leader"
              } name.`,
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
  }, [isAdviserReview]);

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
        <h3 className="text-base font-bold text-[#4A0E17]">
          {isAdviserReview ? "Final Adviser Approval" : "Activity Proposals"}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {isAdviserReview
            ? "Review proposals approved by the organization president. Your decision is final."
            : "Review proposals prepared by the organization secretary and record your decision."}
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-bold text-slate-700">
            {isAdviserReview
              ? "No president-approved proposals are awaiting final approval"
              : "No proposals awaiting organization review"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAdviserReview
              ? "President-rejected proposals are not shown in this workspace."
              : "Proposals created by the secretary will appear here."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {proposals.map((proposal) => {
            const isFinal = ["Approved", "Rejected"].includes(proposal.status);
            const isActing = actionId === proposal._id;

            return (
              <article key={proposal._id} className="p-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#4A0E17]">
                        {proposal.proposalTitle}
                      </h4>
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

                {isFinal ? (
                  <div
                    className={`mt-4 border px-4 py-4 text-xs ${
                      proposal.status === "Rejected"
                        ? "border-rose-200 bg-rose-50"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <p className="font-extrabold text-slate-800">
                      {proposal.status === "Rejected"
                        ? `${isAdviserReview ? "Adviser" : "Organization leader"} rejected this proposal`
                        : "Final proposal approved by:"}
                    </p>
                    <p className="mt-3 text-slate-600">
                      {proposal.status === "Rejected" && isAdviserReview
                        ? "Adviser e-signature:"
                        : "Adviser e-signature:"}{" "}
                      <span className="font-bold italic text-slate-800">
                        {proposal.adviserReview?.digitalSignature ||
                          "Not available"}
                      </span>
                    </p>
                    <p className="mt-2 text-slate-600">
                      {proposal.status === "Rejected" && isAdviserReview
                        ? "Adviser rejected on"
                        : "Adviser approved on"}{" "}
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(proposal.adviserReview?.reviewedAt)}
                      </span>
                    </p>
                    {proposal.adviserReview?.remarks && (
                      <p className="mt-2 whitespace-pre-wrap text-slate-600">
                        {proposal.adviserReview.remarks}
                      </p>
                    )}
                  </div>
                ) : proposal.status === "Pending Adviser Review" &&
                  !isAdviserReview ? (
                  <div className="mt-4 border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
                    <p className="font-extrabold text-blue-900">
                      Awaiting faculty adviser approval
                    </p>
                    <p className="mt-1 text-blue-700">
                      The president has approved this proposal.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="text-[11px] font-bold text-slate-700">
                        {isAdviserReview
                          ? "Faculty Adviser E-Signature"
                          : "Organization President E-Signature"}
                        <div className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold italic uppercase text-slate-800">
                          {isLoadingSignature
                            ? `Loading ${isAdviserReview ? "adviser" : "president"} name...`
                            : digitalSignature ||
                              `${isAdviserReview ? "Adviser" : "President"} name unavailable`}
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
                          : isAdviserReview
                            ? "Final Approve"
                            : "Approve"}
                      </button>
                    </div>
                  </div>
                )}
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
