// Shared status vocabulary for the Resolution workflow. Mirrors the status
// helpers used elsewhere (see meetingStatus.js) so every resolution surface —
// secretary list, reviewer queues, and the printable document — renders the
// same labels, colors, and stage messaging.

const STATUS_DRAFT = "Draft";
const STATUS_SUBMITTED = "Submitted";
const STATUS_PENDING_ADVISER = "Pending Adviser Review";
const STATUS_PENDING_DEAN = "Pending Dean Review";
const STATUS_ADOPTED = "Adopted";
const STATUS_REJECTED = "Rejected";

const RESOLUTION_STATUSES = [
  STATUS_DRAFT,
  STATUS_SUBMITTED,
  STATUS_PENDING_ADVISER,
  STATUS_PENDING_DEAN,
  STATUS_ADOPTED,
  STATUS_REJECTED,
];

const STATUS_LABELS = {
  [STATUS_DRAFT]: "Draft",
  [STATUS_SUBMITTED]: "Submitted",
  [STATUS_PENDING_ADVISER]: "Pending Adviser Review",
  [STATUS_PENDING_DEAN]: "Pending Dean Review",
  [STATUS_ADOPTED]: "Adopted",
  [STATUS_REJECTED]: "Rejected",
};

const STATUS_CLASSES = {
  [STATUS_DRAFT]: "border-slate-200 bg-slate-50 text-slate-700",
  [STATUS_SUBMITTED]: "border-amber-200 bg-amber-50 text-amber-800",
  [STATUS_PENDING_ADVISER]: "border-blue-200 bg-blue-50 text-blue-800",
  [STATUS_PENDING_DEAN]: "border-violet-200 bg-violet-50 text-violet-800",
  [STATUS_ADOPTED]: "border-emerald-200 bg-emerald-50 text-emerald-800",
  [STATUS_REJECTED]: "border-rose-200 bg-rose-50 text-rose-800",
};

// Which reviewer currently holds a resolution at each pending stage.
const PENDING_REVIEWER_BY_STATUS = {
  [STATUS_SUBMITTED]: "president",
  [STATUS_PENDING_ADVISER]: "adviser",
  [STATUS_PENDING_DEAN]: "dean",
};

const TERMINAL_STATUSES = [STATUS_ADOPTED, STATUS_REJECTED];

const isTerminal = (status) => TERMINAL_STATUSES.includes(status);

const getStatusClass = (status) =>
  STATUS_CLASSES[status] || "border-slate-200 bg-slate-50 text-slate-700";

export {
  STATUS_DRAFT,
  STATUS_SUBMITTED,
  STATUS_PENDING_ADVISER,
  STATUS_PENDING_DEAN,
  STATUS_ADOPTED,
  STATUS_REJECTED,
  RESOLUTION_STATUSES,
  STATUS_LABELS,
  STATUS_CLASSES,
  PENDING_REVIEWER_BY_STATUS,
  TERMINAL_STATUSES,
  isTerminal,
  getStatusClass,
};
