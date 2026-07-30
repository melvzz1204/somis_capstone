import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(""); // Clear error when typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Call backend login endpoint
      const response = await API.post("/v1/auth/login", formData);
      const data = response.data || response;

      // 2. Store session details in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 3. Redirect based on User Role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "org_admin") {
        navigate("/org-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || err.message || "Invalid credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="MarSU Logo"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            SOMIS Portal
          </h1>
          <p className="text-xs text-slate-500">
            Student Organization Management & Information System
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-medium text-slate-800">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your official email and password below.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">
                Official Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="org@marsu.edu.ph"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 text-xs transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-medium">Password</label>
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 text-xs transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400">
          Marinduque State University — OVPSAS
        </p>
      </div>
    </div>
  );
}
