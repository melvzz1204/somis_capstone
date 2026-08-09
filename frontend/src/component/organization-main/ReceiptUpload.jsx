import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";
import API from "../../api/axios";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const STATUS_PRESENTATION = {
  VERIFIED: {
    icon: CheckCircle2,
    title: "Receipt verified",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  PENDING_MANUAL_REVIEW: {
    icon: AlertCircle,
    title: "Sent for Treasurer review",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  REJECTED: {
    icon: AlertCircle,
    title: "Receipt rejected",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

/**
 * Uploads one GCash receipt and displays the server-side OCR decision.
 *
 * @param {{
 *   claimedAmount?: number | string,
 *   eventId?: string,
 *   onComplete?: (payment: object) => void,
 *   className?: string
 * }} props
 */
export default function ReceiptUpload({
  claimedAmount: initialClaimedAmount = "",
  eventId = "",
  onComplete,
  className = "",
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [editableAmount, setEditableAmount] = useState(initialClaimedAmount);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const isBusy = phase === "uploading" || phase === "processing";
  const claimedAmount =
    initialClaimedAmount !== "" ? initialClaimedAmount : editableAmount;
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const validateAndSelectFile = (candidate) => {
    setError("");
    setResult(null);
    setProgress(0);

    if (!candidate) return;
    if (!ACCEPTED_TYPES.has(candidate.type)) {
      setFile(null);
      setError("Choose a JPEG, PNG, or WebP receipt image.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("The receipt image must not exceed 5 MB.");
      return;
    }

    setFile(candidate);
    setPhase("idle");
  };

  const clearFile = () => {
    if (isBusy) return;
    setFile(null);
    setResult(null);
    setError("");
    setProgress(0);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isBusy) validateAndSelectFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numericAmount = Number(claimedAmount);

    if (!file) {
      setError("Select a receipt image before uploading.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a claimed amount greater than zero.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("claimedAmount", String(numericAmount));
    if (eventId) formData.append("event", eventId);

    setError("");
    setResult(null);
    setProgress(0);
    setPhase("uploading");

    try {
      const response = await API.post("/payments/upload-receipt", formData, {
        onUploadProgress: ({ loaded, total }) => {
          if (!total) return;
          const nextProgress = Math.min(
            100,
            Math.round((loaded / total) * 100),
          );
          setProgress(nextProgress);
          if (nextProgress === 100) setPhase("processing");
        },
      });

      setProgress(100);
      setPhase("complete");
      setResult(response);
      onComplete?.(response.data);
    } catch (requestError) {
      setPhase("error");
      setError(requestError.message || "Unable to upload the receipt.");
    }
  };

  const presentation = result ? STATUS_PRESENTATION[result.status] : null;
  const StatusIcon = presentation?.icon;

  return (
    <section
      className={`border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
      aria-labelledby="receipt-upload-heading"
    >
      <div className="mb-4">
        <h3
          id="receipt-upload-heading"
          className="text-sm font-bold text-slate-900"
        >
          Upload GCash receipt
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          JPEG, PNG, or WebP up to 5 MB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="receipt-claimed-amount"
            className="mb-1.5 block text-xs font-bold text-slate-700"
          >
            Claimed amount
          </label>
          <div className="flex min-h-11 overflow-hidden border border-slate-300 bg-white focus-within:border-[#4A0E17]">
            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">
              PHP
            </span>
            <input
              id="receipt-claimed-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={claimedAmount}
              onChange={(event) => setEditableAmount(event.target.value)}
              disabled={isBusy || initialClaimedAmount !== ""}
              className="min-w-0 flex-1 border-0 px-3 text-sm text-slate-900 outline-none"
              required
            />
          </div>
        </div>

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-40 w-full flex-col items-center justify-center border-2 border-dashed px-5 py-6 text-center transition-colors ${
              isDragging
                ? "border-[#4A0E17] bg-rose-50"
                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            <UploadCloud
              className="h-7 w-7 text-[#4A0E17]"
              aria-hidden="true"
            />
            <span className="mt-3 text-sm font-bold text-slate-800">
              Drop receipt here or choose an image
            </span>
          </button>
        ) : (
          <div className="border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <img
                src={previewUrl}
                alt="Selected GCash receipt preview"
                className="h-24 w-20 shrink-0 border border-slate-200 bg-white object-contain"
              />
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-start gap-2">
                  <FileImage className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={isBusy}
                    className="grid h-8 w-8 shrink-0 place-items-center text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                    aria-label="Remove selected receipt"
                    title="Remove receipt"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => validateAndSelectFile(event.target.files?.[0])}
          className="sr-only"
          tabIndex={-1}
        />

        {isBusy && (
          <div aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>
                {phase === "processing"
                  ? "Reading receipt"
                  : "Uploading receipt"}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden bg-slate-200">
              <div
                className="h-full bg-[#4A0E17] transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        )}

        {presentation && (
          <div
            className={`flex items-start gap-3 border px-3 py-3 ${presentation.className}`}
            role="status"
          >
            <StatusIcon
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold">{presentation.title}</p>
              <p className="mt-1 text-xs leading-5">{result.message}</p>
              {result.referenceNumber && (
                <p className="mt-2 break-all font-mono text-xs font-bold">
                  Ref: {result.referenceNumber}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isBusy}
          className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#4A0E17] px-4 text-sm font-bold text-white hover:bg-[#601520] disabled:hover:bg-[#4A0E17]"
        >
          {isBusy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
          )}
          {phase === "processing" ? "Verifying receipt" : "Upload receipt"}
        </button>
      </form>
    </section>
  );
}
