import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import PasswordInput from "../component/passwordInput";
import { getRedirectPathByRole } from "../util/loginRedirectPage";
import { useToast } from "../util/toastContext";

// Opened from the "Reset My Password" button inside the password reset email.
// Mirrors the setup-account page behaviour: new password + confirm password
// inputs inside a modal-style card, then auto-login and redirect.
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Password validation checks (consistent with account setup)
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 2. Post reset payload to /auth/reset-password
      const response = await API.post("/auth/reset-password", {
        token,
        password,
      });

      setSuccess("Password reset successfully! Redirecting...");
      showToast("Password reset successfully.", "success");

      // 3. Extract token and user payload (safely handling unwrapped or
      // standard Axios responses)
      const resData = response?.data || response;
      const user = resData?.user;
      const authToken = resData?.token;
      if (authToken) {
        localStorage.setItem("token", authToken);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("somis_user_role", user.role || "student");
        }
        // Mark onboarding as complete so the role modal doesn't pop up again
        localStorage.setItem("somis_onboarding_completed", "true");
      }

      // 4. Smooth redirect after displaying success message
      const redirectPath = getRedirectPathByRole(user || "student");

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Password reset error:", err);

      const backendMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to reset password.";

      setError(backendMsg);
      showToast(backendMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render error card if token is missing from the email URL
  if (!token) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center p-4">
        <div className="panel p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Invalid Reset Link
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            No reset token was found in the URL. Please request a new password
            reset link from the sign-in page.
          </p>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="btn-primary w-full"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] font-sans flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="MarSU Logo"
            className="h-14 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Create a new secure password for your MarSU SOMIS account.
          </p>
        </div>

        {/* Password Reset Card */}
        <div className="panel p-7 space-y-5">
          {success ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in fade-in duration-300">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-base font-bold">
                ✓
              </div>
              <p className="text-xs font-bold text-emerald-800">{success}</p>
              <p className="text-[11px] text-emerald-600">
                Logging you in and preparing your dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="field-label">
                  New Password <span className="text-rose-600">*</span>
                </label>
                <PasswordInput
                  id="new-password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="text-xs"
                  showPassword={showPassword}
                  onToggleVisibility={() =>
                    setShowPassword((visible) => !visible)
                  }
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="field-label">
                  Confirm New Password <span className="text-rose-600">*</span>
                </label>
                <PasswordInput
                  id="confirm-password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="text-xs"
                  showPassword={showConfirmPassword}
                  onToggleVisibility={() =>
                    setShowConfirmPassword((visible) => !visible)
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full mt-2"
              >
                {isSubmitting
                  ? "Resetting Password..."
                  : "Save New Password & Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
