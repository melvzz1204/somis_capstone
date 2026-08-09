import { useEffect } from "react";

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "Not set";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));

const statusClasses = {
  Draft: "border-slate-200 bg-slate-50 text-slate-700",
  Submitted: "border-amber-200 bg-amber-50 text-amber-800",
  "Pending Adviser Review": "border-blue-200 bg-blue-50 text-blue-800",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-5 text-slate-800">
        {children || "Not provided"}
      </dd>
    </div>
  );
}

function DocumentSection({ title, children }) {
  return (
    <section className="border-t border-slate-200 pt-5">
      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A0E17]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProposalDocumentModal({ proposal, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!proposal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-document-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B8860B]">
              Activity Proposal Document
            </p>
            <h2
              id="proposal-document-title"
              className="mt-1 truncate text-lg font-extrabold text-[#4A0E17] sm:text-xl"
            >
              {proposal.proposalTitle}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-bold ${
                  statusClasses[proposal.status] || statusClasses.Submitted
                }`}
              >
                {proposal.status}
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                {proposal.activityCategory}
              </span>
              <span className="text-[11px] text-slate-400">
                Submitted {formatDateTime(proposal.createdAt)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Close proposal document"
            aria-label="Close proposal document"
          >
            x
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-8">
          <article className="mx-auto max-w-3xl space-y-6 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
            <header className="border-b-2 border-[#4A0E17] pb-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Marinduque State University
              </p>
              <h1 className="mt-2 text-xl font-black uppercase text-[#4A0E17] sm:text-2xl">
                {proposal.proposalTitle}
              </h1>
              <p className="mt-2 text-xs text-slate-500">
                Submitted for organization president and faculty adviser
                approval
              </p>
            </header>

            <DocumentSection title="Project Information">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Detail label="Activity Category">
                  {proposal.activityCategory}
                </Detail>
                <Detail label="Proposal Status">{proposal.status}</Detail>
                <div className="sm:col-span-2">
                  <Detail label="Project Objectives">
                    <span className="whitespace-pre-wrap font-normal">
                      {proposal.projectObjectives}
                    </span>
                  </Detail>
                </div>
                <div className="sm:col-span-2">
                  <Detail label="Project Description">
                    <span className="whitespace-pre-wrap font-normal">
                      {proposal.projectDescription}
                    </span>
                  </Detail>
                </div>
              </dl>
            </DocumentSection>

            <DocumentSection title="Schedule, Venue and Audience">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Detail label="Requested Start">
                  {formatDateTime(proposal.requestedStartDateTime)}
                </Detail>
                <Detail label="Requested End">
                  {formatDateTime(proposal.requestedEndDateTime)}
                </Detail>
                <Detail label="Target Venue">{proposal.targetVenue}</Detail>
                <Detail label="Target Audience">
                  {proposal.targetAudience}
                </Detail>
                <Detail label="Expected Attendees">
                  {proposal.expectedAttendees} attendees
                </Detail>
              </dl>
            </DocumentSection>

            <DocumentSection title="Financials and Accountability">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Detail label="Total Budget Allocation">
                  {formatCurrency(proposal.totalBudgetAllocation)}
                </Detail>
                <Detail label="Source of Funds">
                  {proposal.sourceOfFunds}
                </Detail>
                <Detail label="Project Lead">
                  {proposal.projectLeadPerson}
                </Detail>
                <Detail label="Project Lead Contact">
                  {proposal.projectLeadContact}
                </Detail>
              </dl>
            </DocumentSection>

            {proposal.attachments?.length > 0 && (
              <DocumentSection title="Supporting Documents">
                <div className="space-y-2">
                  {proposal.attachments.map((file) => (
                    <a
                      key={file._id || file.filename}
                      href={`${apiOrigin}${file.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2.5 text-xs font-semibold text-[#4A0E17] hover:border-[#4A0E17]/40 hover:bg-slate-50"
                    >
                      <span className="truncate">{file.originalName}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        Open file
                      </span>
                    </a>
                  ))}
                </div>
              </DocumentSection>
            )}

            {proposal.leaderReview?.reviewedAt && (
              <DocumentSection title="Approval Signatories">
                <div className="border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-extrabold text-slate-800">
                    {proposal.status === "Approved"
                      ? "Final Proposal — Approved"
                      : "President Approval Recorded"}
                  </p>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div className="border-b border-slate-400 pb-2 text-center">
                      <p className="font-serif text-lg font-bold italic text-slate-800">
                        {proposal.leaderReview.digitalSignature}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Organization President
                      </p>
                      <p className="text-[10px] text-slate-400">
                        E-signed{" "}
                        {formatDateTime(proposal.leaderReview.reviewedAt)}
                      </p>
                    </div>
                    <div className="border-b border-slate-400 pb-2 text-center">
                      <p className="font-serif text-lg font-bold italic text-slate-800">
                        {proposal.adviserReview?.digitalSignature ||
                          "Awaiting adviser approval"}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Faculty Adviser
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {proposal.adviserReview?.reviewedAt
                          ? `E-signed ${formatDateTime(proposal.adviserReview.reviewedAt)}`
                          : "Second signatory pending"}
                      </p>
                    </div>
                  </div>
                  {(proposal.leaderReview.remarks ||
                    proposal.adviserReview?.remarks) && (
                    <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                      {proposal.leaderReview.remarks && (
                        <p className="whitespace-pre-wrap">
                          President: {proposal.leaderReview.remarks}
                        </p>
                      )}
                      {proposal.adviserReview?.remarks && (
                        <p className="mt-1 whitespace-pre-wrap">
                          Adviser: {proposal.adviserReview.remarks}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </DocumentSection>
            )}
          </article>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#4A0E17]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
}
