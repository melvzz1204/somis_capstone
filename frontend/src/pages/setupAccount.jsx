import React, { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsLoading(true);
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Post to endpoint (baseURL in axios.js already has /v1)[cite: 9, 11]
      const response = await API.post("/auth/setup-account", {
        token,
        password,
      });
      setSuccess("Account set up successfully! Redirecting...");

      // 2. Extract directly from response (unwrapped by axios interceptor)[cite: 8, 9, 11]
      const user = response?.user || response?.data?.user;
      const authToken = response?.token || response?.data?.token;

      if (authToken) {
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(user));
      }

      const redirectPath = getRedirectPathByRole(user?.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Account setup error:", err);
      // 3. Extract message from custom error object[cite: 8, 9, 11]
      setError(
        err.message ||
          err.response?.data?.message ||
          "Failed to complete account setup.",
      );
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full text-center space-y-3">
          <p className="text-xs text-red-600 font-medium">Invalid Link</p>
          <p className="text-xs text-slate-500">
            No invitation token found in the URL. Please check your email link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="MarSU Logo"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Account Setup
          </h1>
          <p className="text-xs text-slate-500">
            Set up credentials for your registered student organization.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center space-y-2">
              <p className="text-xs font-semibold text-emerald-800">
                Account activated successfully!
              </p>
              <p className="text-[11px] text-emerald-600">
                Logging you in and redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Activating..." : "Save Password & Activate"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
