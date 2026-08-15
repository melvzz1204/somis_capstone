import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  FilePlus2,
  FileText,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";
import OrganizationDocumentModal from "./organizationDocumentModal";

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const statusClasses = {
  "Pending Adviser Review": "border-blue-200 bg-blue-50 text-blue-800",
  "Pending OVPSAS Review": "border-amber-200 bg-amber-50 text-amber-800",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

const statusFilterLabels = {
  "Pending Adviser Review": "Adviser Review",
  "Pending OVPSAS Review": "OVPSAS Review",
};

const documentTypeLabels = {
  "Annual Report": "Accomplishment Report",
  "Activity Plan": "Organization Plan",
};

const submitterStatusOptions = [
  "All",
  "Pending Adviser Review",
  "Pending OVPSAS Review",
  "Approved",
  "Rejected",
];

const reviewStages = [
  ["adviserReview", "Faculty adviser"],
  ["ovpsasReview", "OVPSAS"],
];

const reviewConfig = {
  adviser: {
    expectedStatus: "Pending Adviser Review",
    pendingLabel: "Awaiting adviser validation",
  },
  admin: {
    expectedStatus: "Pending OVPSAS Review",
    pendingLabel: "Awaiting final OVPSAS approval",
  },
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not available";

const formatFileSize = (bytes) => {
  const numericBytes = Number(bytes || 0);
  if (numericBytes < 1024) return `${numericBytes} B`;
  if (numericBytes < 1024 * 1024) {
    return `${(numericBytes / 1024).toFixed(1)} KB`;
  }
  return `${(numericBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function OrganizationDocumentWorkspace({
  documentType,
  reviewRole = null,
  academicPeriodKey = "",
}) {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingDocument, setEditingDocument] = useState(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [actionId, setActionId] = useState("");
  const [reviewRemarks, setReviewRemarks] = useState({});

  const isReviewer = Boolean(reviewConfig[reviewRole]);
  const config = reviewConfig[reviewRole] || null;
  const displayDocumentType = documentTypeLabels[documentType] || documentType;
  const statusOptions = isReviewer
    ? ["All", config.expectedStatus, "Approved", "Rejected"]
    : submitterStatusOptions;
  const [activeSchoolYear, activeSemester] = academicPeriodKey.split(":");

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await API.get("/organization-documents", {
        params: { documentType, academicPeriodKey },
      });
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setLoadError(
        requestError.message ||
          `Unable to load ${displayDocumentType.toLowerCase()}s.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [academicPeriodKey, displayDocumentType, documentType]);

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      loadDocuments();
    }, 0);
    return () => window.clearTimeout(requestId);
  }, [loadDocuments]);

  const filteredDocuments = useMemo(
    () =>
      statusFilter === "All"
        ? documents
        : documents.filter((item) => item.status === statusFilter),
    [documents, statusFilter],
  );

  const statusCounts = useMemo(
    () =>
      documents.reduce(
        (counts, item) => ({
          ...counts,
          [item.status]: (counts[item.status] || 0) + 1,
        }),
        {},
      ),
    [documents],
  );

  const openCreateModal = () => {
    setEditingDocument(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingDocument(item);
    setIsModalOpen(true);
  };

  const handleSaved = (savedDocument) => {
    setDocuments((current) => {
      const exists = current.some((item) => item._id === savedDocument._id);
      if (exists) {
        return current.map((item) =>
          item._id === savedDocument._id ? savedDocument : item,
        );
      }
      return [savedDocument, ...current];
    });
    setIsModalOpen(false);
    setEditingDocument(undefined);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete “${item.title}” and all of its attachments?`,
    );
    if (!confirmed) return;

    setDeletingId(item._id);
    try {
      const response = await API.delete(`/organization-documents/${item._id}`);
      setDocuments((current) =>
        current.filter((document) => document._id !== item._id),
      );
      showToast(response.message, "success");
    } catch (requestError) {
      showToast(
        requestError.message ||
          `Unable to delete the ${displayDocumentType.toLowerCase()}.`,
        "error",
      );
    } finally {
      setDeletingId("");
    }
  };

  const updateRemarks = (documentId, value) => {
    setReviewRemarks((current) => ({ ...current, [documentId]: value }));
  };

  const handleReview = async (item, decision) => {
    const remarks = String(reviewRemarks[item._id] || "").trim();
    if (decision === "Rejected" && !remarks) {
      showToast("Add remarks before rejecting this submission.", "error");
      return;
    }

    setActionId(item._id);
    try {
      const response = await API.patch(
        `/organization-documents/${item._id}/review`,
        { decision, remarks },
      );
      setDocuments((current) =>
        current.map((document) =>
          document._id === item._id ? response.data : document,
        ),
      );
      setReviewRemarks((current) => {
        const next = { ...current };
        delete next[item._id];
        return next;
      });
      showToast(response.message, "success");
    } catch (requestError) {
      showToast(
        requestError.message ||
          `Unable to review the ${displayDocumentType.toLowerCase()}.`,
        "error",
      );
    } finally {
      setActionId("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center border border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading {displayDocumentType.toLowerCase()}s...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#9A6F16]">
              Organization records
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold text-[#4A0E17]">
              {displayDocumentType}
            </h2>
            {isReviewer && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {config.pendingLabel}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div
              className="flex w-full max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto"
              role="group"
              aria-label={`Filter ${displayDocumentType.toLowerCase()} submissions by status`}
            >
              {statusOptions.map((status) => {
                const count =
                  status === "All"
                    ? documents.length
                    : statusCounts[status] || 0;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    aria-pressed={statusFilter === status}
                    className={`flex-1 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors sm:flex-none ${
                      statusFilter === status
                        ? "bg-[#4A0E17] text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-[#4A0E17]"
                    }`}
                  >
                    {statusFilterLabels[status] || status}{" "}
                    <span className="ml-0.5 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={loadDocuments}
                title="Refresh submissions"
                aria-label="Refresh submissions"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#4A0E17]"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
              {!isReviewer && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-md bg-[#4A0E17] px-4 text-xs font-extrabold text-white hover:bg-[#601520] sm:flex-none"
                >
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  New submission
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="flex flex-col items-start justify-between gap-3 border-l-4 border-rose-500 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-rose-800">{loadError}</p>
          <button
            type="button"
            onClick={loadDocuments}
            className="text-xs font-extrabold text-rose-800 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {!loadError && filteredDocuments.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileText
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-extrabold text-slate-700">
            {statusFilter === "All"
              ? `No ${displayDocumentType.toLowerCase()} submissions`
              : `No ${statusFilter.toLowerCase()} submissions`}
          </p>
        </div>
      ) : (
        !loadError && (
          <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
            {filteredDocuments.map((item) => {
              const isActionable =
                isReviewer && item.status === config.expectedStatus;
              const canManage =
                !isReviewer &&
                ["Pending Adviser Review", "Rejected"].includes(item.status);
              const isActing = actionId === item._id;

              return (
                <article key={item._id} className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 text-sm font-extrabold text-[#4A0E17]">
                          {item.title}
                        </h3>
                        {reviewRole === "admin" && item.org && (
                          <span className="rounded-md border border-[#4A0E17]/20 bg-[#4A0E17]/5 px-2 py-0.5 text-[10px] font-extrabold text-[#4A0E17]">
                            {item.org.acronym || item.org.name}
                          </span>
                        )}
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            statusClasses[item.status] ||
                            "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        {item.schoolYear} · {item.semester}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Submitted by{" "}
                        {item.createdBy?.name || "Organization officer"} on{" "}
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    {canManage && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title={
                            item.status === "Rejected"
                              ? "Revise and resubmit"
                              : "Edit submission"
                          }
                          aria-label={
                            item.status === "Rejected"
                              ? "Revise and resubmit"
                              : "Edit submission"
                          }
                          className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-[#4A0E17]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          title="Delete submission"
                          aria-label="Delete submission"
                          className="grid h-9 w-9 place-items-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          {deletingId === item._id ? (
                            <LoaderCircle
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-extrabold uppercase text-slate-400">
                      Attachments ({item.attachments?.length || 0})
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {(item.attachments || []).map((attachment) => (
                        <a
                          key={attachment._id}
                          href={`${apiOrigin}${attachment.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 hover:border-[#4A0E17]/35 hover:bg-white"
                        >
                          <FileText
                            className="h-4 w-4 shrink-0 text-[#4A0E17]"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-bold text-slate-700">
                              {attachment.originalName}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {formatFileSize(attachment.size)}
                            </span>
                          </span>
                          <Download
                            className="h-3.5 w-3.5 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>
                  </div>

                  {reviewStages.some(([field]) => item[field]?.reviewedAt) && (
                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                      {reviewStages.map(([field, label]) => {
                        const review = item[field];
                        if (!review?.reviewedAt) return null;
                        return (
                          <div
                            key={field}
                            className="border-l-2 border-slate-300 pl-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-extrabold text-slate-700">
                                {label}
                              </p>
                              <span
                                className={`text-[10px] font-extrabold ${review.decision === "Approved" ? "text-emerald-700" : "text-rose-700"}`}
                              >
                                {review.decision}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {review.reviewedBy?.name || label} ·{" "}
                              {formatDate(review.reviewedAt)}
                            </p>
                            {review.remarks && (
                              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                                {review.remarks}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isActionable && (
                    <div className="mt-4 border-t border-slate-200 bg-slate-50 px-4 py-4">
                      <label
                        htmlFor={`review-remarks-${item._id}`}
                        className="text-xs font-extrabold text-slate-700"
                      >
                        Review remarks
                      </label>
                      <textarea
                        id={`review-remarks-${item._id}`}
                        value={reviewRemarks[item._id] || ""}
                        onChange={(event) =>
                          updateRemarks(item._id, event.target.value)
                        }
                        maxLength={500}
                        rows={3}
                        disabled={isActing}
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                      />
                      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleReview(item, "Rejected")}
                          disabled={isActing}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-300 bg-white px-4 py-2.5 text-xs font-extrabold text-rose-700 hover:bg-rose-50"
                        >
                          {isActing ? (
                            <LoaderCircle
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <X className="h-4 w-4" aria-hidden="true" />
                          )}
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(item, "Approved")}
                          disabled={isActing}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-800"
                        >
                          {isActing ? (
                            <LoaderCircle
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="h-4 w-4" aria-hidden="true" />
                          )}
                          {reviewRole === "admin"
                            ? "Final approve"
                            : "Validate and forward"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}

      {isModalOpen && (
        <OrganizationDocumentModal
          documentType={documentType}
          documentLabel={displayDocumentType}
          document={editingDocument}
          activePeriod={{
            academicYear: activeSchoolYear,
            semester: activeSemester,
          }}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDocument(undefined);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
