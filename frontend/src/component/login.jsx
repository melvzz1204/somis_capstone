import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [portalType, setPortalType] = useState("org"); // "org" or "admin"
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handlePortalSwitch = (type) => {
    setPortalType(type);
    setError("");
    setFormData({ email: "", password: "" }); // Reset inputs when switching tabs
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 1. Sanitize payload and attach active portalType/role
    const payload = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      portalType: portalType, // e.g., "org" or "admin"
      role: portalType === "admin" ? "admin" : "officer", // Included if backend checks 'role'
    };

    try {
      const response = await API.post("/v1/auth/login", payload);

      // 2. Parse response payload
      const resData = response.data || response;
      const user = resData.user || resData.data?.user;
      const token = resData.token || resData.data?.token;

      if (!user) {
        throw new Error("User data missing from login response.");
      }

      // 3. Store credentials
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // 4. Navigate using exact route paths from App.jsx
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/org-dashboard");
      }
    } catch (err) {
      console.error(
        "Login Error details:",
        err.response?.data || err.message || err,
      );

      setError(
        err.response?.data?.message || err.message || "Invalid credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-5 rounded-2xl space-y-4 text-slate-900">
      {/* BRAND HEADER */}
      <div className="text-center space-y-1">
        <img
          src="/logo.png"
          alt="MarSU Logo"
          className="h-8 w-auto mx-auto object-contain"
        />
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          SOMIS Portal
        </h1>
        <p className="text-[10px] text-slate-500">
          Marinduque State University — OVPSAS
        </p>
      </div>

      {/* PORTAL TOGGLE SWITCH */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
        <button
          type="button"
          onClick={() => handlePortalSwitch("org")}
          className={`py-1 rounded-md transition-all cursor-pointer ${
            portalType === "org"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Student Officer
        </button>
        <button
          type="button"
          onClick={() => handlePortalSwitch("admin")}
          className={`py-1 rounded-md transition-all cursor-pointer ${
            portalType === "admin"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          OVPSAS Admin
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600">
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-medium mb-1">
            {portalType === "org" ? "Official Email" : "Admin Email"}
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder={
              portalType === "org"
                ? "organization@marsu.edu.ph"
                : "admin@marsu.edu.ph"
            }
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-xs transition-colors"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-xs transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-1"
        >
          {isLoading
            ? "Signing in..."
            : `Sign In as ${
                portalType === "org" ? "Student Officer" : "Admin"
              }`}
        </button>
      </form>

      {/* FOOTER NOTICE */}
      {portalType === "org" && (
        <p className="text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          New organization? Check email for OVPSAS invite link.
        </p>
      )}
    </div>
  );
}
