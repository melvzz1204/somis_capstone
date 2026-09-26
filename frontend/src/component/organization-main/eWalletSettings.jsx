import { useEffect, useRef, useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";

/**
 * Lets the organization treasurer set the e-wallet numbers (and an optional
 * GCash QR image) members send dues payments to.
 */
export default function EWalletSettings({ org }) {
  const { showToast } = useToast();
  const [gcashNumber, setGcashNumber] = useState("");
  const [paymayaNumber, setPaymayaNumber] = useState("");
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setGcashNumber(org?.gcashNumber || "");
    setPaymayaNumber(org?.paymayaNumber || "");
    setQrPreview(org?.gcashQrImage || null);
    setQrFile(null);
    setRemoveQr(false);
  }, [org?.gcashNumber, org?.paymayaNumber, org?.gcashQrImage]);

  // Refresh from the directory so saved values show even when the cached
  // organization snapshot predates them.
  useEffect(() => {
    const orgId = org?._id || org?.id;
    if (!orgId) return;
    let active = true;
    API.get("/organizations")
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response) ? response : [];
        const match = list.find((item) => String(item._id) === String(orgId));
        if (match) {
          setGcashNumber(match.gcashNumber || "");
          setPaymayaNumber(match.paymayaNumber || "");
          setQrPreview(match.gcashQrImage || null);
          setQrFile(null);
          setRemoveQr(false);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [org?._id, org?.id]);

  const handleQrChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file for the QR code.", "error");
      return;
    }
    setQrFile(file);
    setRemoveQr(false);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleRemoveQr = () => {
    setQrFile(null);
    setQrPreview(null);
    setRemoveQr(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("gcashNumber", gcashNumber.trim());
      payload.append("paymayaNumber", paymayaNumber.trim());
      if (qrFile) payload.append("gcashQr", qrFile);
      else if (removeQr) payload.append("removeQr", "true");

      const response = await API.patch("/organizations/e-wallet", payload);
      setGcashNumber(response.gcashNumber || "");
      setPaymayaNumber(response.paymayaNumber || "");
      setQrPreview(response.gcashQrImage || null);
      setQrFile(null);
      setRemoveQr(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("E-wallet details saved.", "success");
    } catch (requestError) {
      showToast(
        requestError.message || "Unable to save e-wallet details.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-[#4A0E17]">
          E-Wallet Details
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Members send e-money dues payments here. Numbers accept 11-digit
          mobile numbers starting with 09.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block font-bold text-slate-700">
            GCash Number
            <input
              value={gcashNumber}
              onChange={(event) => setGcashNumber(event.target.value)}
              placeholder="e.g. 09171234567"
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium text-slate-800 focus:border-[#4A0E17] focus:outline-none"
            />
          </label>
          <label className="block font-bold text-slate-700">
            PayMaya Number
            <input
              value={paymayaNumber}
              onChange={(event) => setPaymayaNumber(event.target.value)}
              placeholder="e.g. 09181234567"
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium text-slate-800 focus:border-[#4A0E17] focus:outline-none"
            />
          </label>
        </div>

        <div>
          <span className="block font-bold text-slate-700 mb-1">
            GCash QR Code{" "}
            <span className="font-medium text-slate-400">(optional)</span>
          </span>
          <div className="flex items-center gap-3">
            {qrPreview ? (
              <img
                src={qrPreview}
                alt="GCash QR code preview"
                className="h-24 w-24 rounded-xl border border-slate-200 bg-white object-contain"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-400">
                No QR
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-xl border border-[#4A0E17]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5 text-center">
                {qrPreview ? "Replace QR" : "Upload QR"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                  className="sr-only"
                />
              </label>
              {qrPreview && (
                <button
                  type="button"
                  onClick={handleRemoveQr}
                  className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#4A0E17] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#601520] disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save E-Wallet Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
