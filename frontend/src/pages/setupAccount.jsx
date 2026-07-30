import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function SetupAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await API.post("/v1/auth/setup-account", { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2500);
    } catch (err) {
      console.error("Setup error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to set up account.",
      );
    } finally {
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
                Password created successfully!
              </p>
              <p className="text-[11px] text-emerald-600">
                Redirecting to login page...
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
                {isLoading ? "Saving..." : "Save Password & Activate"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
