import { useState } from "react";
import Login from "../component/login";
import ForgotPasswordForm from "../component/forgotPasswordForm";
import RoleSelectionModal from "../component/roleSelectionModal";
import StudentOnboardingModal from "../component/studentOnboardingModal";
import StudentLogin from "../component/studentLogin";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(() => {
    const token = localStorage.getItem("token");
    const hasCompletedOnboarding = localStorage.getItem(
      "somis_onboarding_completed",
    );

    return !token && !hasCompletedOnboarding ? "role" : null;
  });

  // Remembers the email typed into the login form (and which login modal to
  // return to) so the forgot-password form can pre-fill it.
  const [forgotPasswordContext, setForgotPasswordContext] = useState({
    email: "",
    returnModal: "login",
    portalLabel: "your account",
  });

  const handleForgotPassword = (email, portalType) => {
    setForgotPasswordContext({
      email: email || "",
      returnModal: portalType === "student" ? "student_login" : "login",
      portalLabel:
        portalType === "student"
          ? "your student account"
          : portalType === "admin"
            ? "your OVPSAS admin account"
            : "your officer account",
    });
    setActiveModal("forgot_password");
  };

  const handleSelectOfficer = () => {
    localStorage.setItem("somis_user_role", "officer");
    setActiveModal("login");
  };

  const handleSelectStudent = () => {
    localStorage.setItem("somis_user_role", "student");
    setActiveModal("student");
  };

  const handleCloseModals = () => {
    localStorage.setItem("somis_onboarding_completed", "true");
    setActiveModal(null);
  };

  const handleStudentOnboardingFinish = () => {
    localStorage.setItem("somis_user_role", "student");
    localStorage.setItem("somis_onboarding_completed", "true");
    setActiveModal("student_login");
  };

  const handleSignInClick = () => {
    localStorage.setItem("somis_onboarding_completed", "true");

    const storedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("somis_user_role");
    let userRole = null;

    if (storedUser) {
      try {
        userRole = JSON.parse(storedUser)?.role;
      } catch (err) {
        console.error(err);
      }
    }

    if (userRole === "student" || savedRole === "student") {
      setActiveModal("student_login");
    } else {
      setActiveModal("login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-800 font-sans flex flex-col justify-between overflow-x-hidden">
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center font-bold text-[#FFD700]">
                <img
                  src="/logo.png"
                  alt="MarSU SOMIS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-bold text-[#4A0E17] block leading-tight">
                  SOMIS
                </span>
                <span className="text-[9px] font-semibold text-[#8a6b13] uppercase tracking-widest block">
                  Marinduque State University
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
              <a
                href="#features"
                className="hover:text-[#FFD700] transition-colors"
              >
                Features
              </a>
              <a
                href="#roles"
                className="hover:text-[#FFD700] transition-colors"
              >
                User Roles
              </a>
              <a
                href="#clearance"
                className="hover:text-[#FFD700] transition-colors"
              >
                Clearance
              </a>
            </nav>

            {/* Login CTA Header Button (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={handleSignInClick} className="btn-primary">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="icon-button text-[#4A0E17]"
                aria-label="Toggle Navigation Menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 text-sm shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-[#4A0E17] py-2 font-semibold"
            >
              Features
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-[#4A0E17] py-2 font-semibold"
            >
              User Roles
            </a>
            <a
              href="#clearance"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-[#4A0E17] py-2 font-semibold"
            >
              Clearance
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignInClick(); // ✅ Fixed: Now uses handleSignInClick instead of setActiveModal("role")
              }}
              className="btn-primary w-full mt-2"
            >
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-14 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <img
          src="/logo.png"
          alt="Marinduque State University seal"
          className="h-24 sm:h-28 w-auto mx-auto object-contain"
        />
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#755a0d] text-xs font-bold uppercase">
          Official OVPSAS Portal
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#4A0E17] leading-tight">
          SOMIS
        </h1>
        <p className="text-lg sm:text-xl font-bold text-slate-800">
          Student Organization Management and Information System
        </p>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Digitize organization workflows, centralize official records, and
          streamline end-of-semester clearances under Marinduque State
          University OVPSAS.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={handleSignInClick}
            className="btn-primary w-full sm:w-auto px-7"
          >
            Access SOMIS Portal
          </button>
          <a href="#features" className="btn-secondary w-full sm:w-auto px-7">
            Explore Features
          </a>
        </div>
      </section>

      {/* FEATURES / CORE VALUES */}
      <section
        id="features"
        className="py-14 bg-white border-y border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="panel p-6">
              <div className="w-10 h-10 rounded-lg bg-[#33001A]/50 border border-[#FFD700]/20 flex items-center justify-center text-[#FFD700] mb-4">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Digitize Workflows
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Transform paper-heavy organization procedures into fast,
                traceable digital requests and approvals.
              </p>
            </div>

            <div className="panel p-6">
              <div className="w-10 h-10 rounded-lg bg-[#33001A]/50 border border-[#FFD700]/20 flex items-center justify-center text-[#FFD700] mb-4">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Centralize Records
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Maintain a unified repository for organization rosters,
                financial activity, and annual reporting.
              </p>
            </div>

            <div className="panel p-6">
              <div className="w-10 h-10 rounded-lg bg-[#33001A]/50 border border-[#FFD700]/20 flex items-center justify-center text-[#FFD700] mb-4">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Transparency & Compliance
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Ensure accountability across executive boards while complying
                strictly with university standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEFINITIONS & ROLES */}
      <section
        id="roles"
        className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-12 space-y-1">
          <h2 className="text-2xl font-extrabold text-[#4A0E17]">
            System Access & Roles
          </h2>
          <p className="text-slate-400 text-xs">
            Role-based features for student officers and administrators
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/20 rounded-lg text-xs font-mono">
                MEMBER
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Student Leader / Officer
              </h3>
            </div>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              Assigned student officers responsible for leading organizational
              activities, records, and compliance.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Submit activity
                proposals and reports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Complete
                end-of-semester clearance requirements
              </li>
            </ul>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/20 rounded-lg text-xs font-mono">
                ADMIN
              </span>
              <h3 className="text-base font-bold text-slate-900">
                OVPSAS Administrator
              </h3>
            </div>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              Office of Student Affairs administrators who oversee student
              organization registration and clearance.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Register new student
                entities and send invite tokens
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Review compliance
                submissions and grant official clearance
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 1. ROLE SELECTION MODAL */}
      {activeModal === "role" && (
        <RoleSelectionModal
          isOpen={true}
          onClose={handleCloseModals}
          onOfficerSelect={handleSelectOfficer}
          onStudentSelect={handleSelectStudent}
        />
      )}

      {/* 2. DEDICATED REGULAR STUDENT ONBOARDING MODAL */}
      {activeModal === "student" && (
        <StudentOnboardingModal
          isOpen={true}
          initialStep={2}
          onClose={handleCloseModals}
          onFinish={handleStudentOnboardingFinish}
          onOfficerSelect={handleSelectOfficer}
        />
      )}

      {/* 3. OFFICER / GENERAL LOGIN MODAL */}
      {activeModal === "login" && (
        <div className="modal-backdrop">
          <div className="modal-panel relative max-w-sm min-h-[300px]">
            <button
              onClick={handleCloseModals}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close Modal"
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

            <div className="p-2">
              <Login onForgotPassword={handleForgotPassword} />
            </div>
          </div>
        </div>
      )}

      {/* 4. DEDICATED STUDENT MEMBER LOGIN MODAL */}
      {activeModal === "student_login" && (
        <div className="modal-backdrop">
          <div className="modal-panel relative max-w-sm min-h-[300px]">
            <button
              onClick={handleCloseModals}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close Modal"
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

            <div className="p-2">
              <StudentLogin
                onClose={handleCloseModals}
                onSwitchToOnboarding={() => setActiveModal("student")}
                onForgotPassword={(email) =>
                  handleForgotPassword(email, "student")
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. FORGOT PASSWORD MODAL */}
      {activeModal === "forgot_password" && (
        <div className="modal-backdrop">
          <div className="modal-panel relative max-w-sm min-h-[300px]">
            <button
              onClick={handleCloseModals}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close Modal"
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

            <div className="p-2">
              <ForgotPasswordForm
                initialEmail={forgotPasswordContext.email}
                portalLabel={forgotPasswordContext.portalLabel}
                onBack={() => setActiveModal(forgotPasswordContext.returnModal)}
              />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MarSU Logo"
              className="h-5 w-auto object-contain"
            />
            <span className="font-semibold text-[#4A0E17]">SOMIS</span>
          </div>
          <p>
            © {new Date().getFullYear()} Office of the Vice President for
            Student Affairs (OVPSAS).
          </p>
        </div>
      </footer>
    </div>
  );
}
