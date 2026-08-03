import React, { useState } from "react";
import Login from "../component/login";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1A000D] text-slate-100 font-sans selection:bg-[#FFD700] selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* BACKGROUND DECORATIVE CANVAS */}
      <div
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#400020] via-[#1A000D] to-[#0A0A0A] -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0A0A0A]/80 border-b border-[#33001A]">
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
                <span className="text-base font-bold tracking-tight text-white block leading-tight">
                  SOMIS
                </span>
                <span className="text-[9px] font-semibold text-[#FFD700] uppercase tracking-widest block">
                  Marinduque State University
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
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

            {/* Login CTA Header Button */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs text-[#0A0A0A] bg-[#FFD700] hover:bg-[#FFE033] transition-all shadow-md shadow-[#FFD700]/10 hover:shadow-[#FFD700]/30 active:scale-95 cursor-pointer"
              >
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
                className="p-2 rounded-md text-slate-300 hover:text-[#FFD700] focus:outline-none"
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
          <div className="md:hidden border-b border-[#33001A] bg-[#0A0A0A] px-4 pt-2 pb-4 space-y-3 text-xs">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-[#FFD700] py-1"
            >
              Features
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-[#FFD700] py-1"
            >
              User Roles
            </a>
            <a
              href="#clearance"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-[#FFD700] py-1"
            >
              Clearance
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs text-[#0A0A0A] bg-[#FFD700] hover:bg-[#FFE033] transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white leading-tight">
          Student Organization <br />
          <span className="font-bold text-[#FFD700]">Information System</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Digitize organization workflows, centralize official records, and
          streamline end-of-semester clearances under Marinduque State
          University OVPSAS.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-7 py-3 rounded-lg font-semibold text-xs text-[#0A0A0A] bg-[#FFD700] hover:bg-[#FFE033] transition-all shadow-lg shadow-[#FFD700]/20 hover:scale-[1.02] cursor-pointer"
          >
            Access SOMIS Portal &rarr;
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3 rounded-lg font-medium text-xs text-slate-300 bg-[#0A0A0A]/60 hover:bg-[#0A0A0A] border border-[#33001A] transition-all"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* FEATURES / CORE VALUES */}
      <section
        id="features"
        className="py-16 bg-[#0A0A0A]/60 border-y border-[#33001A]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0A0A0A] border border-[#33001A] p-6 rounded-xl hover:border-[#FFD700]/40 transition-colors">
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
              <h3 className="text-sm font-semibold text-white mb-1.5">
                Digitize Workflows
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Transform paper-heavy organization procedures into fast,
                traceable digital requests and approvals.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#33001A] p-6 rounded-xl hover:border-[#FFD700]/40 transition-colors">
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
              <h3 className="text-sm font-semibold text-white mb-1.5">
                Centralize Records
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Maintain a unified repository for organization rosters,
                financial activity, and annual reporting.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#33001A] p-6 rounded-xl hover:border-[#FFD700]/40 transition-colors">
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
              <h3 className="text-sm font-semibold text-white mb-1.5">
                Transparency & Compliance
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
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
          <h2 className="text-2xl font-light text-white">
            System Access & Roles
          </h2>
          <p className="text-slate-400 text-xs">
            Role-based features for student officers and administrators
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0A0A0A] border border-[#33001A] rounded-xl p-6 hover:border-[#FFD700]/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/20 rounded-lg text-xs font-mono">
                MEMBER
              </span>
              <h3 className="text-base font-semibold text-white">
                Student Leader / Officer
              </h3>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Assigned student officers responsible for leading organizational
              activities, records, and compliance.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300">
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

          <div className="bg-[#0A0A0A] border border-[#33001A] rounded-xl p-6 hover:border-[#FFD700]/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/20 rounded-lg text-xs font-mono">
                ADMIN
              </span>
              <h3 className="text-base font-semibold text-white">
                OVPSAS Administrator
              </h3>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Office of Student Affairs administrators who oversee student
              organization registration and clearance.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300">
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

      {/* FOOTER */}
      <footer className="border-t border-[#33001A] bg-[#0A0A0A] py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MarSU Logo"
              className="h-5 w-auto object-contain"
            />
            <span className="font-semibold text-white">SOMIS</span>
          </div>
          <p>
            © {new Date().getFullYear()} Office of the Vice President for
            Student Affairs (OVPSAS).
          </p>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
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

            {/* Embedded Login Component */}
            <div className="p-2">
              <Login />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
