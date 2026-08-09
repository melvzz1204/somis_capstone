import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getRedirectPathByRole } from "../util/loginRedirectPage";
import { useToast } from "../util/toastContext";

// Inline SVG Icons
const UserShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const UserGroupIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
    setFormData({ email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const payload = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      portalType: portalType,
      role: portalType === "admin" ? "admin" : "officer",
    };

    try {
      const response = await API.post("/auth/login", payload);

      const user = response.user || response.data?.user;
      const token = response.token || response.data?.token;

      if (!user) {
        throw new Error("User data missing from response.");
      }

      const actualRole =
        user.role || (portalType === "admin" ? "admin" : "officer");

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, role: actualRole }),
      );
      localStorage.setItem("somis_user_role", actualRole);
      localStorage.setItem("somis_onboarding_completed", "true");

      const redirectPath = getRedirectPathByRole(actualRole);
      showToast("Signed in successfully.", "success");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Invalid credentials.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }; // ✅ Correctly closed handleSubmit before returning JSX

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
          SOMIS Portal
        </h1>
        <p className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest">
          Marinduque State University
        </p>
      </div>

      {/* PORTAL TOGGLE SWITCH */}
      <div
        className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200"
        role="tablist"
        aria-label="Choose portal type"
      >
        <button
          type="button"
          onClick={() => handlePortalSwitch("org")}
          role="tab"
          aria-selected={portalType === "org"}
          className={`py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            portalType === "org"
              ? "bg-[#4A0E17] text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserGroupIcon className="w-3.5 h-3.5" />
          Student Officer
        </button>
        <button
          type="button"
          onClick={() => handlePortalSwitch("admin")}
          role="tab"
          aria-selected={portalType === "admin"}
          className={`py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            portalType === "admin"
              ? "bg-[#4A0E17] text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserShieldIcon className="w-3.5 h-3.5" />
          OVPSAS Admin
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 font-medium animate-in fade-in duration-150">
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label htmlFor="portal-email" className="field-label">
            {portalType === "org" ? "Official Email" : "Admin Email"}
          </label>
          <input
            id="portal-email"
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
            autoComplete="email"
            className="field-control text-xs"
          />
        </div>

        <div>
          <label htmlFor="portal-password" className="field-label">
            Password
          </label>
          <input
            id="portal-password"
            type="password"
            name="password"
            required
            placeholder="Enter your lastname and last 4 GCash account digits"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="field-control text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full mt-1"
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
        <p className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
          New organization? Check email for OVPSAS invite link.
        </p>
      )}
    </div>
  );
}
