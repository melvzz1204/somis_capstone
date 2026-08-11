import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileKey2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import API from "../../api/axios";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function StatementUploadModal({ isOpen, onClose, onComplete }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStage, setScanStage] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isSubmitting) return undefined;

    const startedAt = Date.now();
    const elapsedTimer = window.setInterval(
      () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    const readingTimer = window.setTimeout(
      () => setScanStage("Opening and reading the PDF..."),
      700,
    );
    const scanningTimer = window.setTimeout(
      () => setScanStage("Scanning transactions for GCash references..."),
      1800,
    );

    return () => {
      window.clearInterval(elapsedTimer);
      window.clearTimeout(readingTimer);
      window.clearTimeout(scanningTimer);
    };
  }, [isSubmitting]);

  if (!isOpen) return null;

  const chooseFile = (nextFile) => {
    setError("");
    setErrorStatus(null);
    setResult(null);

    if (!nextFile) return;
    if (
      nextFile.type !== "application/pdf" &&
      !nextFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setError("Choose a PDF GCash transaction statement.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("The statement PDF must not exceed 15 MB.");
      return;
    }
    setFile(nextFile);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setErrorStatus(null);
    setResult(null);
    setElapsedSeconds(0);

    if (!file) {
      setError("Select a PDF statement first.");
      return;
    }
    if (!pdfPassword.trim()) {
      setError("Enter the PDF password.");
      return;
    }

    const formData = new FormData();
    formData.append("statement", file);
    formData.append("pdfPassword", pdfPassword);
    setScanStage("Uploading the statement...");
    setElapsedSeconds(0);
    setIsSubmitting(true);

    try {
      const response = await API.post("/payments/verify-batch-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // The shared API interceptor already unwraps Axios response.data. Keep the
      // full payload here; selecting response.data again discards the summary
      // wrapper and makes every displayed counter fall back to zero.
      const summary = response;
      setResult(summary);
      setScanStage("Statement scan completed.");
      onComplete?.(summary);
    } catch (requestError) {
      const status = requestError.status
        ? ` (HTTP ${requestError.status})`
        : "";
      setErrorStatus(requestError.status || null);
      setError(
        `${requestError.message || "Unable to verify the statement."}${status}`,
      );
      setScanStage("Statement scan stopped.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4"
      role="presentation"
    >
      <div
        className="mx-auto my-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl sm:my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="statement-upload-title"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2
              id="statement-upload-title"
              className="text-lg font-extrabold text-[#4A0E17]"
            >
              Verify GCash statement
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Upload the password-protected Transaction History PDF downloaded
              from GCash.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p>{error}</p>
                <p className="mt-1 text-[11px] font-normal text-rose-700">
                  The server returned an error while reading the PDF. Check the
                  backend terminal for the detailed scan log.
                  {errorStatus === 401 &&
                    " Re-enter the PDF password and try again."}
                </p>
              </div>
            </div>
          )}
          {isSubmitting && (
            <div
              className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/60 bg-amber-50 p-4 text-sm font-bold text-[#4A0E17]"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-6 w-6 shrink-0 animate-spin text-[#7A610D]"
                aria-hidden="true"
              />
              <div>
                <p>{scanStage || "Preparing statement verification..."}</p>
                <p className="mt-1 text-xs font-normal text-slate-600">
                  Elapsed: {elapsedSeconds}s. Keep this window open while the
                  server reads and scans each PDF page.
                </p>
              </div>
            </div>
          )}

          {result && !isSubmitting && (
            <div
              className="flex items-start gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p>{result.message || "Statement processed successfully."}</p>
                <p className="mt-1 text-[11px] font-normal">
                  Completed in {elapsedSeconds}s using{" "}
                  {result.data?.extractionMethod || "text"} extraction.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 font-normal sm:grid-cols-4">
                  <span>
                    Scanned:{" "}
                    <strong>{result.data?.totalReferencesScanned ?? 0}</strong>
                  </span>
                  <span>
                    Verified:{" "}
                    <strong>{result.data?.paymentsVerified ?? 0}</strong>
                  </span>
                  <span>
                    Already verified:{" "}
                    <strong>{result.data?.alreadyVerified ?? 0}</strong>
                  </span>
                  <span>
                    Unmatched:{" "}
                    <strong>{result.data?.unmatchedReferences ?? 0}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0])}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-sm font-bold text-slate-600 hover:border-[#D4AF37] hover:bg-amber-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {file ? (
                <FileKey2
                  className="h-5 w-5 text-[#7A610D]"
                  aria-hidden="true"
                />
              ) : (
                <Upload className="h-5 w-5 text-[#7A610D]" aria-hidden="true" />
              )}
              <span>
                {file ? file.name : "Choose transaction statement PDF"}
              </span>
            </button>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            PDF password
            <input
              type="password"
              value={pdfPassword}
              onChange={(event) => setPdfPassword(event.target.value)}
              placeholder="Enter your lastname and last 4 GCash account digits"
              autoComplete="off"
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-[#7A610D] focus:ring-2 focus:ring-[#D4AF37]/30"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#4A0E17]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4A0E17] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Scanning statement..." : "Verify statement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
