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

export default function ProposalList({
  proposals,
  isLoading,
  deletingId,
  onCreate,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-12 text-center text-xs font-semibold text-slate-500">
        Loading proposals...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-[#4A0E17]">
            Activity Proposals
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Review and maintain the organization's submitted project requests.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="self-start rounded-lg bg-[#4A0E17] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#601520] sm:self-auto"
        >
          + Create Proposal
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-bold text-slate-700">
            No proposals added yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Create the first activity proposal for this organization.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {proposals.map((proposal) => (
            <article key={proposal._id} className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-[#4A0E17]">
                      {proposal.proposalTitle}
                    </h4>
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
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
                {!["Approved", "Rejected"].includes(proposal.status) && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(proposal)}
                      className="rounded-lg border border-[#4A0E17]/30 bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(proposal)}
                      disabled={deletingId === proposal._id}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === proposal._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
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
                    Venue & Audience
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-700">
                    {proposal.targetVenue} · {proposal.targetAudience}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-400">
                    Attendance & Budget
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-700">
                    {proposal.expectedAttendees} attendees ·{" "}
                    {formatCurrency(proposal.totalBudgetAllocation)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-400">Project Lead</dt>
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

              {(proposal.leaderReview?.reviewedAt ||
                proposal.adviserReview?.reviewedAt) && (
                <div
                  className={`mt-4 border px-4 py-3 text-xs ${
                    proposal.status === "Approved"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  {proposal.status === "Approved" &&
                  proposal.adviserReview?.reviewedAt ? (
                    <>
                      <p className="font-extrabold text-slate-800">
                        Final proposal approved by:
                      </p>
                      <p className="mt-3 text-slate-600">
                        Adviser e-signature:{" "}
                        <span className="font-bold italic text-slate-800">
                          {proposal.adviserReview.digitalSignature ||
                            "Not available"}
                        </span>
                      </p>
                      <p className="mt-2 text-slate-600">
                        President e-signature:{" "}
                        <span className="font-bold italic text-slate-800">
                          {proposal.leaderReview.digitalSignature ||
                            "Not available"}
                        </span>
                      </p>
                      <p className="mt-2 text-slate-600">
                        Adviser approved on{" "}
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(proposal.adviserReview.reviewedAt)}
                        </span>
                      </p>
                      {proposal.adviserReview.remarks && (
                        <p className="mt-2 whitespace-pre-wrap text-slate-600">
                          {proposal.adviserReview.remarks}
                        </p>
                      )}
                    </>
                  ) : proposal.status === "Pending Adviser Review" ? (
                    <>
                      <p className="font-extrabold text-blue-900">
                        Forwarded to faculty adviser
                      </p>
                      <p className="mt-1 text-blue-700">
                        Organization president approval recorded. Awaiting
                        adviser's final decision.
                      </p>
                      <p className="mt-2 text-slate-600">
                        President e-signature:{" "}
                        <span className="font-bold italic text-slate-800">
                          {proposal.leaderReview.digitalSignature}
                        </span>{" "}
                        on {formatDateTime(proposal.leaderReview.reviewedAt)}
                      </p>
                    </>
                  ) : proposal.status === "Rejected" &&
                    proposal.adviserReview?.reviewedAt ? (
                    <>
                      <p className="font-extrabold text-rose-900">
                        Proposal rejected by the faculty adviser
                      </p>
                      <p className="mt-1 text-slate-600">
                        The organization president approved this proposal, but
                        the faculty adviser issued the final rejection.
                      </p>
                      <p className="mt-3 text-slate-600">
                        Adviser e-signature:{" "}
                        <span className="font-bold italic text-slate-800">
                          {proposal.adviserReview.digitalSignature ||
                            "Not available"}
                        </span>
                      </p>
                      <p className="mt-2 text-slate-600">
                        Adviser rejected on{" "}
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(proposal.adviserReview.reviewedAt)}
                        </span>
                      </p>
                      {proposal.adviserReview.remarks && (
                        <p className="mt-2 whitespace-pre-wrap text-slate-600">
                          Adviser remarks: {proposal.adviserReview.remarks}
                        </p>
                      )}
                      <p className="mt-3 border-t border-rose-200 pt-3 text-slate-600">
                        President e-signature:{" "}
                        <span className="font-bold italic text-slate-800">
                          {proposal.leaderReview.digitalSignature ||
                            "Not available"}
                        </span>{" "}
                        on {formatDateTime(proposal.leaderReview.reviewedAt)}
                      </p>
                      {proposal.leaderReview.remarks && (
                        <p className="mt-2 whitespace-pre-wrap text-slate-600">
                          President remarks: {proposal.leaderReview.remarks}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-extrabold text-slate-800">
                        Proposal decision: {proposal.status}
                      </p>
                      <p className="mt-1 text-slate-600">
                        Digitally signed by{" "}
                        <span className="font-bold italic">
                          {proposal.leaderReview.digitalSignature}
                        </span>{" "}
                        on {formatDateTime(proposal.leaderReview.reviewedAt)}
                      </p>
                      {proposal.leaderReview.remarks && (
                        <p className="mt-2 whitespace-pre-wrap text-slate-600">
                          {proposal.leaderReview.remarks}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
