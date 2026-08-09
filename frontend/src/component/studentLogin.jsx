import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import PasswordInput from "./passwordInput";
import { getRedirectPathByRole } from "../util/loginRedirectPage";
import { useToast } from "../util/toastContext";

export default function StudentLogin({ onClose, onSwitchToOnboarding }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const normalizedEmail = formData.email.trim().toLowerCase();

    // Keep login validation consistent with student registration.
    const isApprovedEmail = [
      "@marsu.edu.ph",
      "@marstateu.edu.ph",
      "@gmail.com",
    ].some((domain) => normalizedEmail.endsWith(domain));

    if (!isApprovedEmail) {
      const errorMessage =
        "Use your MarSU email (@marsu.edu.ph or @marstateu.edu.ph), or an approved Gmail address.";
      setIsLoading(false);
      setError(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    try {
      const response = await API.post("/auth/login", {
        email: normalizedEmail,
        password: formData.password,
      });

      const resData = response?.data || response;
      const user = resData?.user;
      const token = resData?.token;

      if (user && token) {
        // Store auth credentials
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Store onboarding status and user role
        localStorage.setItem("somis_onboarding_completed", "true");
        localStorage.setItem("somis_user_role", user.role);

        const redirectPath = getRedirectPathByRole(user.role);
        showToast("Signed in successfully.", "success");
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error("Login response did not include account details.");
      }
    } catch (err) {
      console.error("Student Login Error:", err);
      const backendMsg =
        err.response?.data?.message ||
        err.message ||
        "Invalid institutional email or password.";
      setError(backendMsg);
      showToast(backendMsg, "error");
    } finally {
      setIsLoading(false);
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
          Student Login
        </h1>
        <p className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest">
          Marinduque State University
        </p>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium animate-in fade-in duration-150">
          {error}
        </div>
      )}

      {/* LOGIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label htmlFor="student-email" className="field-label">
            Institutional Email <span className="text-rose-600">*</span>
          </label>
          <input
            id="student-email"
            type="email"
            name="email"
            required
            placeholder="student@marsu.edu.ph"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="field-control text-xs"
          />
        </div>

        <div>
          <label htmlFor="student-password" className="field-label">
            Password <span className="text-rose-600">*</span>
          </label>
          <PasswordInput
            id="student-password"
            name="password"
            required
            placeholder="Enter your lastname and last 4 GCash account digits"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="text-xs"
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((visible) => !visible)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full mt-1"
        >
          {isLoading ? "Signing in..." : "Sign In as Student"}
        </button>
      </form>

      {/* FOOTER ACTION */}
      <div className="pt-2 border-t border-slate-100 text-center space-y-1">
        <p className="text-[10px] text-slate-400 font-medium">
          Haven't completed registration yet?
        </p>
        <button
          type="button"
          onClick={onSwitchToOnboarding || onClose}
          className="text-xs text-[#4A0E17] font-bold hover:underline cursor-pointer"
        >
          Complete Student Registration
        </button>
      </div>
    </div>
  );
}
