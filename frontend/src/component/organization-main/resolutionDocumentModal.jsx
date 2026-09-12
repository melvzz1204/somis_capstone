import { useEffect } from "react";
import { getStatusClass } from "../../util/resolutionStatus";

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

const signatoryStages = [
  ["presidentReview", "Organization President", "Awaiting president approval"],
  ["adviserReview", "Faculty Adviser", "Awaiting adviser approval"],
  ["deanReview", "Department Dean", "Awaiting dean approval"],
];

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

export default function ResolutionDocumentModal({ resolution, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!resolution) return null;

  const proposal = resolution.activityProposal || {};
  const meeting =
    resolution.meeting && typeof resolution.meeting === "object"
      ? resolution.meeting
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolution-document-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B8860B]">
              Resolution Document
            </p>
            <h2
              id="resolution-document-title"
              className="mt-1 truncate text-lg font-extrabold text-[#4A0E17] sm:text-xl"
            >
              {resolution.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {resolution.resolutionNumber && (
                <span className="rounded-md border border-[#4A0E17]/20 bg-[#4A0E17]/5 px-2 py-1 text-[10px] font-bold text-[#4A0E17]">
                  {resolution.resolutionNumber}
                </span>
              )}
              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-bold ${getStatusClass(
                  resolution.status,
                )}`}
              >
                {resolution.status}
              </span>
              {resolution.adoptedAt && (
                <span className="text-[11px] text-slate-400">
                  Adopted {formatDateTime(resolution.adoptedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-[#4A0E17]/30 bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
            >
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close resolution document"
            >
              x
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-8">
          <article className="mx-auto max-w-3xl space-y-6 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
            <header className="border-b-2 border-[#4A0E17] pb-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Marinduque State University
              </p>
              {resolution.org?.name && (
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {resolution.org.name}
                </p>
              )}
              <h1 className="mt-2 text-xl font-black uppercase text-[#4A0E17] sm:text-2xl">
                {resolution.resolutionNumber
                  ? `${resolution.resolutionNumber}: ${resolution.title}`
                  : resolution.title}
              </h1>
              {resolution.subject && (
                <p className="mt-2 text-xs italic text-slate-500">
                  {resolution.subject}
                </p>
              )}
            </header>

            {meeting && (
              <DocumentSection title="Basis Meeting">
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Detail label="Meeting">{meeting.title}</Detail>
                  <Detail label="Held On">
                    {formatDateTime(meeting.startDateTime)}
                  </Detail>
                  {meeting.venue && (
                    <Detail label="Venue">{meeting.venue}</Detail>
                  )}
                  {meeting.audience && (
                    <Detail label="Audience">{meeting.audience}</Detail>
                  )}
                </dl>
              </DocumentSection>
            )}

            {resolution.whereasClauses?.length > 0 && (
              <DocumentSection title="Preamble">
                <div className="space-y-3">
                  {resolution.whereasClauses.map((clause, index) => (
                    <p
                      key={index}
                      className="text-sm leading-6 text-slate-700"
                    >
                      <span className="font-bold">WHEREAS,</span>{" "}
                      {clause.replace(/^WHEREAS,?\s*/i, "")}
                    </p>
                  ))}
                </div>
              </DocumentSection>
            )}

            <DocumentSection title="Resolved">
              <div className="space-y-3">
                {(resolution.resolvedClauses || []).map((clause, index) => (
                  <p key={index} className="text-sm leading-6 text-slate-800">
                    <span className="font-bold">
                      {index === 0 ? "NOW, THEREFORE, BE IT RESOLVED," : "RESOLVED,"}
                    </span>{" "}
                    {clause.replace(/^RESOLVED,?\s*(that)?\s*/i, "")}
                  </p>
                ))}
              </div>
            </DocumentSection>

            <DocumentSection title="Embedded Activity Proposal">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Detail label="Proposal Title">{proposal.proposalTitle}</Detail>
                <Detail label="Activity Category">
                  {proposal.activityCategory}
                </Detail>
                <div className="sm:col-span-2">
                  <Detail label="Objectives">
                    <span className="whitespace-pre-wrap font-normal">
                      {proposal.projectObjectives}
                    </span>
                  </Detail>
                </div>
                <div className="sm:col-span-2">
                  <Detail label="Description">
                    <span className="whitespace-pre-wrap font-normal">
                      {proposal.projectDescription}
                    </span>
                  </Detail>
                </div>
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

            {(resolution.attachments?.length > 0 ||
              proposal.attachments?.length > 0) && (
              <DocumentSection title="Supporting Documents">
                <div className="space-y-2">
                  {[
                    ...(resolution.attachments || []),
                    ...(proposal.attachments || []),
                  ].map((file) => (
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

            <DocumentSection title="Adoption Signatories">
              <div className="border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-extrabold text-slate-800">
                  {resolution.status === "Adopted"
                    ? "Resolution Adopted"
                    : resolution.status === "Rejected"
                      ? "Resolution Review — Rejected"
                      : "Review Chain in Progress"}
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-3">
                  {signatoryStages.map(([field, label, pendingLabel]) => {
                    const review = resolution[field];
                    return (
                      <div
                        key={field}
                        className="border-b border-slate-400 pb-2 text-center"
                      >
                        <p className="font-serif text-lg font-bold italic text-slate-800">
                          {review?.digitalSignature || pendingLabel}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {review?.reviewedAt
                            ? `${review.decision} — E-signed ${formatDateTime(review.reviewedAt)}`
                            : "Signature pending"}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {signatoryStages.some(
                  ([field]) => resolution[field]?.remarks,
                ) && (
                  <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                    {signatoryStages.map(([field, label]) =>
                      resolution[field]?.remarks ? (
                        <p key={field} className="mt-1 whitespace-pre-wrap">
                          {label}: {resolution[field].remarks}
                        </p>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </DocumentSection>
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
