import React, { useState } from "react";
import RoleModal from "../component/RoleModalLoginSelection";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#33001A] text-slate-100 font-sans selection:bg-[#FFD700] selection:text-black flex flex-col justify-between">
      {/* Background Decorative Gradient (60% Burgundy Canvas) */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#660033] via-[#33001A] to-[#1A000D] -z-10 pointer-events-none" />

      {/* HEADER / NAVIGATION (30% Black Base with 10% Gold Accent CTA) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0A0A]/90 border-b border-[#660033]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Institution Branding */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center shadow-lg font-bold text-[#FFD700] text-xl">
                <img
                  src="/logo.png"
                  alt="MarSU SOMIS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-wider text-white block leading-tight">
                  SOMIS
                </span>
                <span className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest block">
                  Marinduque State University
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-[#0A0A0A] bg-[#FFD700] hover:bg-[#FFE033] transition-all shadow-md shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
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
                Login
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-300 hover:text-[#FFD700] hover:bg-[#141414]"
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
          <div className="md:hidden border-b border-[#660033] bg-[#0A0A0A] px-4 pt-2 pb-4 space-y-3">
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
            <a
              href="#ovpsas"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-[#FFD700] py-1"
            >
              OVPSAS Portal
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-[#0A0A0A] bg-[#FFD700]"
            >
              Login
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Student Organization Management Information System
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
          Digitize organization workflows, centralize official records, and
          streamline end-of-semester clearances under the supervision of OVPSAS.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-[#0A0A0A] bg-[#FFD700] hover:bg-[#FFE033] transition-all shadow-lg shadow-[#FFD700]/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Access SOMIS Portal &rarr;
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-[#0A0A0A]/80 hover:bg-[#141414] border border-[#660033] transition-all"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* FEATURES / CORE VALUES */}
      <section
        id="features"
        className="py-16 bg-[#1A000D] border-y border-[#660033]/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#0A0A0A] border border-[#660033] p-6 rounded-2xl hover:border-[#FFD700]/60 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#33001A] border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] mb-5">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Digitize Workflows
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Transform paper-heavy student organization procedures into fast,
                traceable digital requests and event approvals.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#660033] p-6 rounded-2xl hover:border-[#FFD700]/60 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#33001A] border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] mb-5">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Centralize Records
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Maintain a unified repository for organization rosters,
                financial activity, and annual institutional reporting.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#660033] p-6 rounded-2xl hover:border-[#FFD700]/60 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#33001A] border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] mb-5">
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
              <h3 className="text-xl font-bold text-white mb-2">
                Transparency & Compliance
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Ensure accountability across executive boards while strictly
                complying with university standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEFINITIONS & USER ROLES */}
      <section
        id="roles"
        className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">
            System Roles & Definitions
          </h2>
          <p className="mt-2 text-slate-300 text-sm">
            Role-based access designed for MarSU student leaders and members
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#0A0A0A] border border-[#660033] rounded-2xl p-8 hover:border-[#FFD700]/50 transition-all shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 rounded-xl">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Member</h3>
                <span className="text-xs font-mono text-[#FFD700]">
                  Registered Student
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              A registered student officially affiliated with a recognized
              Marinduque State University student organization.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Access campus
                organization directories
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> View personal
                clearance verification status
              </li>
            </ul>
          </div>

          <div className="bg-[#0A0A0A] border border-[#660033] rounded-2xl p-8 hover:border-[#FFD700]/50 transition-all shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 rounded-xl">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Officer</h3>
                <span className="text-xs font-mono text-[#FFD700]">
                  Assigned Executive Role
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              A student assigned an organizational role responsible for leading
              activities, records, and compliance.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Submit event proposals
                and financial reports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FFD700]">✓</span> Process member
                clearances for end-of-semester validation
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CLEARANCE & OVPSAS INTEGRATION */}
      <section
        id="clearance"
        className="py-20 bg-[#1A000D] border-t border-[#660033]/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0A0A0A] border border-[#660033] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest block mb-2">
                  Institutional Process
                </span>
                <h2 className="text-3xl font-extrabold text-white mb-4">
                  End-of-Semester Clearance & OVPSAS Verification
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  <strong>Clearance</strong> is the official end-of-semester
                  validation process required for student organizations. SOMIS
                  bridges student officers and the{" "}
                  <strong>
                    Office of the Vice President for Student Affairs (OVPSAS)
                  </strong>{" "}
                  to guarantee fast, transparent, and accurate compliance
                  reviews.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 mt-0.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        OVPSAS Compliance Alignment
                      </h4>
                      <p className="text-xs text-slate-400">
                        Direct submission channel to the Office of the Vice
                        President for Student Affairs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-[#33001A] text-[#FFD700] border border-[#FFD700]/30 mt-0.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Seamless Clearance Tracking
                      </h4>
                      <p className="text-xs text-slate-400">
                        Track real-time sign-offs for organizational and
                        individual student clearances.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clearance Tracker Widget */}
              <div
                id="ovpsas"
                className="bg-[#141414] border border-[#660033] rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[#660033] pb-4 mb-4">
                  <div>
                    <p className="text-xs text-[#FFD700] font-bold">
                      MarSU Clearance Portal
                    </p>
                    <p className="text-sm font-bold text-white">
                      OVPSAS Semester Validation
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
                    Active
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded-lg border border-[#660033]/50 text-xs">
                    <span className="text-slate-200">
                      Roster & Officer Form
                    </span>
                    <span className="text-[#FFD700] font-bold">✓ Cleared</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded-lg border border-[#660033]/50 text-xs">
                    <span className="text-slate-200">
                      Financial Audit & Accomplishment
                    </span>
                    <span className="text-[#FFD700] font-bold">✓ Cleared</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded-lg border border-[#660033]/50 text-xs">
                    <span className="text-slate-200">
                      OVPSAS Final Sign-off
                    </span>
                    <span className="text-amber-400 font-medium">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#660033] bg-[#0A0A0A] py-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 flex items-center justify-center font-bold text-[#FFD700] text-xs">
              <img
                src="/logo.png"
                alt="MarSU Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-white">SOMIS</span>
          </div>
          <p>
            © {new Date().getFullYear()} Office of the Vice President for
            Student Affairs (OVPSAS). All rights reserved.
          </p>
        </div>
      </footer>

      {/* MOUNTED ROLE SELECTION MODAL */}
      <RoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
