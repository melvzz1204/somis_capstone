import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function RoleModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setError("");

    if (role === "admin") {
      setEmail("admin@marsu.edu.ph");
      setPassword("AdminPass2026!");
    } else {
      setEmail("student.2026@marsu.edu.ph");
      setPassword("");
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await API.post("v1/auth/login", { email, password });

      // Save token and user details to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      handleCloseModal();

      // Redirect user according to returned backend role
      const userRole = data.user?.role?.toLowerCase();
      if (userRole === "admin" || userRole === "ovpsas") {
        navigate("/admin-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedRole(null);
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      {/* Modal Card Container */}
      <div className="bg-[#0A0A0A] border-2 border-[#660033] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-[#141414] border-b border-[#660033] p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 flex items-center justify-center text-[#FFD700] font-bold text-xs">
              <img
                src="/logo.png"
                alt="MarSU SOMIS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">
              MarSU SOMIS Portal
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#33001A] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8">
          {/* STEP 1: ROLE SELECTION */}
          {!selectedRole ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-white">
                  Select Login Portal
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Choose your authorized user role to access SOMIS
                </p>
              </div>

              <div className="grid gap-4">
                {/* Admin / OVPSAS / Faculty Option */}
                <button
                  onClick={() => handleSelectRole("admin")}
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-[#141414] border border-[#660033] hover:border-[#FFD700] hover:bg-[#33001A]/40 transition-all text-left shadow-md cursor-pointer"
                >
                  <div className="p-3 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 rounded-xl group-hover:bg-[#FFD700] group-hover:text-[#0A0A0A] transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-base font-bold text-white group-hover:text-[#FFD700] transition-colors">
                      Admin / OVPSAS / Adviser
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      System management, organization approvals, and university
                      clearance oversight.
                    </p>
                  </div>
                </button>

                {/* Student Member / Officer Option */}
                <button
                  onClick={() => handleSelectRole("student")}
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-[#141414] border border-[#660033] hover:border-[#FFD700] hover:bg-[#33001A]/40 transition-all text-left shadow-md cursor-pointer"
                >
                  <div className="p-3 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 rounded-xl group-hover:bg-[#FFD700] group-hover:text-[#0A0A0A] transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-base font-bold text-white group-hover:text-[#FFD700] transition-colors">
                      Student Member / Officer
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Manage rosters, event proposals, attendance scanning,
                      dues, and individual clearance.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: REAL BACKEND LOGIN FORM */
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-[#660033] pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#FFD700] uppercase tracking-wider block">
                    Logging in as
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedRole === "admin"
                      ? "Administrator / OVPSAS Portal"
                      : "Student Member / Officer Portal"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-xs text-[#FFD700] hover:underline font-semibold cursor-pointer"
                >
                  Change Role
                </button>
              </div>

              {/* Dynamic Error Banner */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-red-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    MarSU Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@marsu.edu.ph"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-[#660033] text-white text-sm focus:outline-none focus:border-[#FFD700]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-[#660033] text-white text-sm focus:outline-none focus:border-[#FFD700]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#FFD700] rounded"
                      defaultChecked
                    />
                    Remember login
                  </label>
                  <a href="#forgot" className="text-[#FFD700] hover:underline">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-[#0A0A0A] bg-[#FFD700] hover:bg-[#FFE033] transition-all shadow-lg shadow-[#FFD700]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>
                      Sign In to{" "}
                      {selectedRole === "admin"
                        ? "Admin Portal"
                        : "Student Portal"}
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
