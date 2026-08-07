import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getRedirectPathByRole } from "../util/loginRedirectPage";

export default function SetupAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Password validation checks
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 2. Post setup payload to /auth/setup-account
      const response = await API.post("/auth/setup-account", {
        token,
        password,
      });

      setSuccess("Account activated successfully! Redirecting...");

      // 3. Extract token and user payload (safely handling unwrapped or standard Axios responses)
      const resData = response?.data || response;
      const user = resData?.user;
      const authToken = resData?.token;
      if (authToken) {
        localStorage.setItem("token", authToken);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("somis_user_role", user.role || "student");
        }
        // Mark onboarding as complete so the modal doesn't pop up again
        localStorage.setItem("somis_onboarding_completed", "true");
      }

      // 4. Smooth redirect after displaying success message
      const redirectPath = getRedirectPathByRole(user?.role || "student");

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Account setup error:", err);

      const backendMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to complete account setup.";

      setError(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render error card if token is missing from the email URL
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Invalid Activation Link
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            No invitation token was found in the URL. Please verify that you
            opened the full link sent to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="MarSU Logo"
            className="h-14 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
            Set Up Your Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Create a secure password to activate your MarSU SOMIS account.
          </p>
        </div>

        {/* Account Setup Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xl space-y-5">
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
                <label className="block text-slate-700 font-bold mb-1.5">
                  New Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium placeholder:text-slate-400 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Confirm New Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium placeholder:text-slate-400 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting
                  ? "Activating Account..."
                  : "Save Password & Activate Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
