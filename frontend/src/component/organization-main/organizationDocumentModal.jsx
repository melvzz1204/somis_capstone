import { useEffect, useRef, useState } from "react";
import {
  FileText,
  LoaderCircle,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
]);
const ACCEPT_ATTRIBUTE = Array.from(ACCEPTED_EXTENSIONS).join(",");
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

const getDefaultSchoolYear = () => {
  const today = new Date();
  const startYear =
    today.getMonth() >= 5 ? today.getFullYear() : today.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

const getExtension = (filename = "") => {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
};

const formatFileSize = (bytes) => {
  const numericBytes = Number(bytes || 0);
  if (numericBytes < 1024) return `${numericBytes} B`;
  if (numericBytes < 1024 * 1024) {
    return `${(numericBytes / 1024).toFixed(1)} KB`;
  }
  return `${(numericBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const initialForm = (document) => ({
  title: document?.title || "",
  schoolYear: document?.schoolYear || getDefaultSchoolYear(),
  semester: document?.semester || "1st Semester",
});

export default function OrganizationDocumentModal({
  documentType,
  documentLabel = documentType,
  document: existingDocument = null,
  onClose,
  onSaved,
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => initialForm(existingDocument));
  const [newFiles, setNewFiles] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState(new Set());
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(existingDocument?._id);
  const existingAttachments = existingDocument?.attachments || [];
  const retainedCount = existingAttachments.filter(
    (attachment) => !removedAttachmentIds.has(String(attachment._id)),
  ).length;
  const totalFileCount = retainedCount + newFiles.length;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSaving, onClose]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleFileSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;

    if (totalFileCount + selectedFiles.length > MAX_FILES) {
      setError(`A submission can contain at most ${MAX_FILES} files.`);
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !ACCEPTED_EXTENSIONS.has(getExtension(file.name)) ||
        file.size > MAX_FILE_SIZE,
    );
    if (invalidFile) {
      setError(
        `${invalidFile.name} is unsupported or exceeds the 10 MB file limit.`,
      );
      return;
    }

    const currentKeys = new Set(
      newFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
    );
    const uniqueFiles = selectedFiles.filter(
      (file) =>
        !currentKeys.has(`${file.name}:${file.size}:${file.lastModified}`),
    );

    setNewFiles((current) => [...current, ...uniqueFiles]);
    setError("");
  };

  const toggleExistingAttachment = (attachmentId) => {
    const normalizedId = String(attachmentId);
    setRemovedAttachmentIds((current) => {
      const next = new Set(current);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
    setError("");
  };

  const removeNewFile = (index) => {
    setNewFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
    setError("");
  };

  const validateForm = () => {
    const title = form.title.trim();
    const schoolYearMatch = /^(\d{4})-(\d{4})$/.exec(form.schoolYear.trim());

    if (!title) return "Title is required.";
    if (title.length > 150) return "Title cannot exceed 150 characters.";
    if (
      !schoolYearMatch ||
      Number(schoolYearMatch[2]) !== Number(schoolYearMatch[1]) + 1
    ) {
      return "Use consecutive years for the school year, for example 2026-2027.";
    }
    if (!SEMESTERS.includes(form.semester)) return "Select a valid semester.";
    if (totalFileCount < 1)
      return "Attach at least one file before submitting.";
    if (totalFileCount > MAX_FILES) {
      return `A submission can contain at most ${MAX_FILES} files.`;
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const payload = new FormData();
    payload.append("documentType", documentType);
    payload.append("title", form.title.trim());
    payload.append("schoolYear", form.schoolYear.trim());
    payload.append("semester", form.semester);
    newFiles.forEach((file) => payload.append("attachments", file));

    if (isEditing) {
      const retainedAttachmentIds = existingAttachments
        .filter(
          (attachment) => !removedAttachmentIds.has(String(attachment._id)),
        )
        .map((attachment) => attachment._id);
      payload.append(
        "retainedAttachmentIds",
        JSON.stringify(retainedAttachmentIds),
      );
    }

    setIsSaving(true);
    setError("");
    try {
      const response = isEditing
        ? await API.put(
            `/organization-documents/${existingDocument._id}`,
            payload,
          )
        : await API.post("/organization-documents", payload);
      showToast(response.message, "success");
      onSaved(response.data);
    } catch (requestError) {
      const message =
        requestError.message ||
        `Unable to save the ${documentLabel.toLowerCase()}.`;
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="organization-document-modal-title"
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-lg"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase text-[#9A6F16]">
              {documentLabel}
            </p>
            <h2
              id="organization-document-modal-title"
              className="truncate text-base font-extrabold text-[#4A0E17]"
            >
              {isEditing ? "Edit submission" : "New submission"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            title="Close"
            aria-label="Close submission form"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {error && (
              <div
                role="alert"
                className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="organization-document-title"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                Title <span className="text-rose-600">*</span>
              </label>
              <input
                id="organization-document-title"
                name="title"
                value={form.title}
                onChange={handleFieldChange}
                maxLength={150}
                autoFocus
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="organization-document-school-year"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  School year <span className="text-rose-600">*</span>
                </label>
                <input
                  id="organization-document-school-year"
                  name="schoolYear"
                  value={form.schoolYear}
                  onChange={handleFieldChange}
                  placeholder="2026-2027"
                  inputMode="numeric"
                  maxLength={9}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                />
              </div>
              <div>
                <label
                  htmlFor="organization-document-semester"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  Semester <span className="text-rose-600">*</span>
                </label>
                <select
                  id="organization-document-semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleFieldChange}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                >
                  {SEMESTERS.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-slate-700">
                  Attachments <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {totalFileCount}/{MAX_FILES} files
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                multiple
                onChange={handleFileSelection}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={totalFileCount >= MAX_FILES || isSaving}
                className="flex min-h-24 w-full items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-left hover:border-[#4A0E17]/50 hover:bg-[#4A0E17]/[0.03]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-[#4A0E17] shadow-sm ring-1 ring-slate-200">
                  <Upload className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-extrabold text-slate-800">
                    Select files
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    PDF, Word, Excel, or image files, up to 10 MB each
                  </span>
                </span>
              </button>

              {(existingAttachments.length > 0 || newFiles.length > 0) && (
                <div className="mt-3 divide-y divide-slate-100 border-y border-slate-200">
                  {existingAttachments.map((attachment) => {
                    const isRemoved = removedAttachmentIds.has(
                      String(attachment._id),
                    );
                    return (
                      <div
                        key={attachment._id}
                        className={`flex min-w-0 items-center gap-3 py-2.5 ${
                          isRemoved ? "opacity-55" : ""
                        }`}
                      >
                        <FileText
                          className="h-4 w-4 shrink-0 text-slate-500"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-xs font-bold text-slate-700 ${
                              isRemoved ? "line-through" : ""
                            }`}
                          >
                            {attachment.originalName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            toggleExistingAttachment(attachment._id)
                          }
                          title={isRemoved ? "Restore file" : "Remove file"}
                          aria-label={`${
                            isRemoved ? "Restore" : "Remove"
                          } ${attachment.originalName}`}
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                            isRemoved
                              ? "text-emerald-700 hover:bg-emerald-50"
                              : "text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          {isRemoved ? (
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {newFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex min-w-0 items-center gap-3 py-2.5"
                    >
                      <FileText
                        className="h-4 w-4 shrink-0 text-[#9A6F16]"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-700">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(file.size)} · New
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        title="Remove file"
                        aria-label={`Remove ${file.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-md bg-[#4A0E17] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#601520] disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Submit for review"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
