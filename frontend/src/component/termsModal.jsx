import { useCallback, useEffect, useState } from "react";
import { hasAcceptedTerms, recordTermsAccepted } from "../util/termsAcceptance.js";

// One-time Terms & Conditions gate. Shown on first visit until accepted;
// the acceptance is recorded in localStorage so it never pops up again
// on the same browser. Re-open anywhere with:
//   window.dispatchEvent(new Event("somis:open-terms"))
export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(() => !hasAcceptedTerms());
  const [agreed, setAgreed] = useState(false);
  const [declineNotice, setDeclineNotice] = useState("");

  useEffect(() => {
    const reopen = () => {
      setAgreed(false);
      setDeclineNotice("");
      setIsOpen(true);
    };
    window.addEventListener("somis:open-terms", reopen);
    return () => window.removeEventListener("somis:open-terms", reopen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleAccept = useCallback(() => {
    recordTermsAccepted();
    setIsOpen(false);
  }, []);

  const handleDecline = () => {
    setDeclineNotice(
      "You need to accept the Terms & Conditions to continue using SOMIS.",
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop modal-backdrop-front"
      role="dialog"
      aria-modal="true"
      aria-labelledby="somis-terms-title"
    >
      <div className="modal-panel max-w-2xl p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2
            id="somis-terms-title"
            className="text-base font-extrabold text-[#4A0E17]"
          >
            Terms & Conditions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Please read and accept to continue using SOMIS. Last updated:
            October 15, 2026.
          </p>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs leading-5 text-slate-600">
          <section>
            <h3 className="font-bold text-slate-800">1. Acceptance of Terms</h3>
            <p>
              By accessing or using the Student Organization Management and
              Information System (SOMIS), you agree to these Terms &
              Conditions. If you do not agree, you may not use the system.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">2. Who May Use SOMIS</h3>
            <p>
              SOMIS is for Marinduque State University students, registered
              student organization officers, faculty advisers, deans, directors,
              and OVPSAS administrators. Student members must register with
              their official school email and accurate personal details.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">
              3. Accounts & Security
            </h3>
            <p>
              You are responsible for keeping your password and account setup
              links confidential. Setup and reset links expire after 24 hours.
              Do not share your account, and notify your organization or OVPSAS
              immediately if you suspect unauthorized access.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">4. Acceptable Use</h3>
            <p>
              Use SOMIS only for legitimate student organization purposes such
              as membership, meetings, resolutions, dues, and clearances. Any
              misuse — including falsifying records, uploading false receipts,
              or accessing accounts or data you are not authorized for — may
              result in suspension of your account and disciplinary action under
              university policies.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">5. Data Privacy</h3>
            <p>
              SOMIS collects your name, contact details, academic information
              (college, program, section, year level), and organization records
              to operate membership, dues, attendance, and clearance features.
              Your information is visible only to authorized users within your
              organization and university offices. By accepting, you consent to
              this processing in accordance with the Data Privacy Act of 2012.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">6. Dues & Payments</h3>
            <p>
              Dues collections require faculty adviser approval before payment.
              Cash payments are logged by the treasurer and receipt uploads are
              subject to verification. Every transaction is recorded in the
              organization ledger. Disputes should be raised with your treasurer
              or faculty adviser.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">7. Accuracy of Records</h3>
            <p>
              You certify that the information you provide — including identity,
              enrollment details, and payment proofs — is true and correct.
              Officers are accountable for the rosters, proposals, and reports
              they submit for review.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">8. Service Availability</h3>
            <p>
              SOMIS is provided on an &quot;as is&quot; basis. The university
              strives to keep the system available and accurate but does not
              guarantee uninterrupted access, and may update or suspend features
              for maintenance or policy compliance.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">9. Changes to Terms</h3>
            <p>
              These terms may be updated from time to time. Material changes
              will require your acceptance again before you can continue using
              SOMIS.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-slate-800">10. Contact</h3>
            <p>
              For questions about these terms or your data, contact the Office
              of the Vice President for Student Affairs and Services (OVPSAS).
            </p>
          </section>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#4A0E17]"
          />
          I have read and accept the Terms & Conditions above.
        </label>

        {declineNotice && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
            {declineNotice}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={handleDecline}
            className="cursor-pointer rounded-xl border border-[#4A0E17]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A0E17] transition-colors hover:bg-[#4A0E17]/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!agreed}
            className="cursor-pointer rounded-xl bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
