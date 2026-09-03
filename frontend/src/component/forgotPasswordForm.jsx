import { useState } from "react";
import API from "../api/axios";
import { useToast } from "../util/toastContext";

// Shared "Forgot Password" form used by both the officer/admin login and the
// student login modals. Accepts an optional pre-filled email so users don't
// have to retype it after failing a login attempt.
export default function ForgotPasswordForm({
  initialEmail = "",
  onBack,
  portalLabel = "your account",
}) {
  const { showToast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      const errorMessage = "Please enter your registered email address.";
      setError(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await API.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      const resData = response?.data || response;
      const message =
        resData?.message ||
        "If an account exists for this email, a password reset link has been sent.";

      setEmailSent(true);
      showToast(message, "success");
    } catch (err) {
      console.error("Forgot password error:", err);
      const backendMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to send password reset email.";
      setError(backendMsg);
      showToast(backendMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white p-6 space-y-5 text-slate-900">
      {/* BRAND HEADER */}
      <div className="text-center space-y-1">
        <img
          src="/logo.png"
          alt="MarSU Logo"
          className="h-10 w-auto mx-auto object-contain"
        />
        <h1 className="text-lg font-extrabold text-[#4A0E17] tracking-tight">
          Forgot Password
        </h1>
        <p className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest">
          Marinduque State University
        </p>
      </div>

      {emailSent ? (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in fade-in duration-300">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-base font-bold">
            ✓
          </div>
          <p className="text-xs font-bold text-emerald-800">
            Reset link sent to your email
          </p>
          <p className="text-[11px] text-emerald-600 leading-relaxed">
            If an account exists for{" "}
            <span className="font-semibold">{email.trim().toLowerCase()}</span>,
            a password reset link has been sent. Please check your inbox (and
            spam folder). The link expires in 1 hour.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="btn-primary w-full mt-2"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <>
          {/* ERROR ALERT */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* INSTRUCTIONS */}
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter the email address registered to {portalLabel} and we'll send
            you a secure link to set a new password.
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="forgot-email" className="field-label">
                Registered Email <span className="text-rose-600">*</span>
              </label>
              <input
                id="forgot-email"
                type="email"
                name="email"
                required
                placeholder="you@marsu.edu.ph"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="email"
                className="field-control text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-1"
            >
              {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>

          {/* BACK TO LOGIN */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-[#4A0E17] font-bold hover:underline cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        </>
      )}
    </div>
  );
}
