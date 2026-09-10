import { useEffect, useRef, useState } from "react";
import Login from "../component/login";
import ForgotPasswordForm from "../component/forgotPasswordForm";
import RoleSelectionModal from "../component/roleSelectionModal";
import StudentOnboardingModal from "../component/studentOnboardingModal";
import StudentLogin from "../component/studentLogin";

// ── Inline icons (lucide-style, consistent stroke) ──
const Icon = {
  Arrow: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M13 5l7 7-7 7"
      />
    </svg>
  ),
  Check: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  Spark: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 14l.9 2.6L22.5 17.5 19.9 18.4 19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14zM5 14l.9 2.6L8.5 17.5 5.9 18.4 5 21l-.9-2.6L1.5 17.5l2.6-.9L5 14z"
      />
    </svg>
  ),
  Shield: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 4v5c0 4.418-3.582 7.5-7 8-3.418-.5-7-3.582-7-8V7l7-4z"
      />
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4"
      />
    </svg>
  ),
  File: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      />
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2v6h6M10 13H8M16 17H8M13 13h3"
      />
    </svg>
  ),
  Wallet: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7a2 2 0 012-2h11a2 2 0 012 2v3a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
      />
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12a2 2 0 012-2h13a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z"
      />
      <circle cx="16.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Users: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
      />
      <circle cx="9" cy="7" r="3" strokeWidth="1.7" />
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  ),
  Clock: (p) => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.7" />
      <path strokeWidth="1.7" strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  ),
  Play: (p) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...p}>
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ),
  Quote: (p) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...p}>
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  ),
};

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(() => {
    const token = localStorage.getItem("token");
    const hasCompletedOnboarding = localStorage.getItem(
      "somis_onboarding_completed",
    );
    return !token && !hasCompletedOnboarding ? "role" : null;
  });
  const [faqOpen, setFaqOpen] = useState(0);
  const scrolled = useScrolled(12);
  const heroRef = useRef(null);

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
  const handleSignUpClick = () => {
    // Top-nav Sign up → onboarding role chooser (does NOT mark completed,
    // so the user can pick Student vs Officer and follow the right flow)
    setActiveModal("role");
  };

  const handleSignInClick = () => {
    localStorage.setItem("somis_onboarding_completed", "true");
    const storedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("somis_user_role");
    let userRole = null;
    if (storedUser) {
      try {
        userRole = JSON.parse(storedUser)?.role;
      } catch {}
    }
    if (userRole === "student" || savedRole === "student")
      setActiveModal("student_login");
    else setActiveModal("login");
  };

  // Close mobile menu on anchor navigation
  useEffect(() => {
    const handleHashChange = () => setMobileMenuOpen(false);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf6] text-[#1a2332] antialiased overflow-x-hidden selection:bg-[#4a0e17] selection:text-white">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-[#4a0e17] focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-bold shadow-lg"
      >
        Skip to content
      </a>

      {/* Top bar — institutional */}
      <div className="hidden lg:block bg-[#2e080e] text-[#f5e6a3] text-[11px] tracking-wide">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-8 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
              aria-hidden
            />
            Official OVPSAS Platform A.Y. 2025–2026 clearances now in progress
          </span>
          <span className="opacity-80 font-mono text-[10px] tracking-widest uppercase">
            Marinduque State University • Boac, Marinduque
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-[#ece9e0] shadow-[0_4px_24px_rgba(74,14,23,0.06)]"
            : "bg-[#fdfbf6]/80 backdrop-blur-md border-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px] lg:h-[72px]">
            <a
              href="#"
              className="flex items-center gap-3 group"
              aria-label="SOMIS home"
            >
              <div className="h-9 w-9 rounded-xl bg-[#4a0e17] flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-black/5 group-hover:shadow-md transition-shadow">
                <img
                  src="/logo.png"
                  alt=""
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="leading-none">
                <span className="block text-[16px] font-black tracking-[-0.02em] text-[#4a0e17]">
                  SOMIS
                </span>
                <span className="block text-[9px] font-bold tracking-[0.18em] uppercase text-[#9a7a14] -mt-0.5">
                  Marinduque State University
                </span>
              </div>
              <span className="hidden sm:inline-flex ml-2 items-center px-2 py-0.5 rounded-full bg-[#fff9db] border border-[#f0d98a] text-[10px] font-bold tracking-widest uppercase text-[#7a5f0f]">
                OVPSAS
              </span>
            </a>

            <nav
              className="hidden lg:flex items-center gap-8 text-[13px] font-semibold"
              aria-label="Primary"
            >
              <a
                href="#features"
                className="text-[#2b3446] hover:text-[#4a0e17] transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-[#2b3446] hover:text-[#4a0e17] transition-colors"
              >
                How it works
              </a>
              <a
                href="#roles"
                className="text-[#2b3446] hover:text-[#4a0e17] transition-colors"
              >
                Roles
              </a>
              <a
                href="#clearance"
                className="text-[#2b3446] hover:text-[#4a0e17] transition-colors"
              >
                Clearance
              </a>
              <a
                href="#faq"
                className="text-[#2b3446] hover:text-[#4a0e17] transition-colors"
              >
                FAQ
              </a>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleSignInClick}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4a0e17] hover:text-[#2e080e] px-4 py-2 rounded-full hover:bg-[#fdf2f3] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={handleSignUpClick}
                className="inline-flex items-center gap-2 text-[13px] font-bold bg-[#4a0e17] text-white px-5 py-2.5 rounded-full shadow-[0_4px_14px_rgba(74,14,23,0.18)] hover:bg-[#2e080e] hover:-translate-y-0.5 transition-all"
              >
                Sign up
                <Icon.Arrow className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#ece9e0] text-[#4a0e17] shadow-sm hover:bg-[#fdfbf6] transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#ece9e0] bg-white px-4 py-5 space-y-1 shadow-xl">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#fdf2f3] text-[#1a2332]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#fdf2f3] text-[#1a2332]"
            >
              How it works
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#fdf2f3] text-[#1a2332]"
            >
              Roles
            </a>
            <a
              href="#clearance"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#fdf2f3] text-[#1a2332]"
            >
              Clearance
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-semibold hover:bg-[#fdf2f3] text-[#1a2332]"
            >
              FAQ
            </a>
            <div className="pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignUpClick();
                }}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-[#4a0e17] text-white py-3 rounded-full shadow-md"
              >
                Sign up create account
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignInClick();
                }}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-white border border-[#ece9e0] text-[#1a2332] py-3 rounded-full"
              >
                Sign in to SOMIS
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main">
        {/* ───────────────── HERO ───────────────── */}
        <section
          ref={heroRef}
          className="relative overflow-hidden pt-8 sm:pt-12 lg:pt-16 pb-16 lg:pb-24"
        >
          <div className="absolute inset-0 bg-[#fdfbf6]" aria-hidden />
          <div
            className="absolute inset-0 opacity-[0.045]"
            aria-hidden
            style={{
              backgroundImage: `linear-gradient(#4a0e17 1px, transparent 1px), linear-gradient(90deg, #4a0e17 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div
            className="absolute -top-28 -right-32 w-[720px] h-[520px] rounded-full bg-[#f5e6a3] opacity-25 blur-[80px]"
            aria-hidden
          />
          <div
            className="absolute top-10 -left-24 w-[600px] h-[420px] rounded-full bg-[#4a0e17] opacity-[0.07] blur-[90px]"
            aria-hidden
          />

          <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center">
              {/* Left copy */}
              <div className="space-y-6 lg:pr-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ece9e0] shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#4a0e17]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                    OVPSAS • Official Portal
                  </span>
                  <span className="hidden sm:inline text-[#ece9e0]">|</span>
                  <span className="hidden sm:inline text-[11px] font-medium text-[#6b7289]">
                    Trusted by 40+ MarSU organizations
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="font-display font-black tracking-[-0.035em] leading-[0.94] text-[#1a0a0d]">
                    <span className="block text-[34px] sm:text-[46px] lg:text-[56px]">
                      Every proposal,
                    </span>
                    <span className="block text-[34px] sm:text-[46px] lg:text-[56px]">
                      every peso,
                    </span>
                    <span className="block text-[34px] sm:text-[46px] lg:text-[56px] font-serif italic font-normal tracking-[-0.03em] text-[#4a0e17]">
                      every clearance
                    </span>
                    <span className="block text-[13px] sm:text-sm font-sans font-bold tracking-[0.16em] uppercase text-[#9a7a14] mt-3">
                      in one trusted place
                    </span>
                  </h1>
                  <p className="text-[15px] sm:text-[16.5px] leading-7 text-[#3a455c] max-w-[560px]">
                    SOMIS is the{" "}
                    <strong className="text-[#1a2332] font-bold">
                      Student Organization Management and Information System
                    </strong>{" "}
                    for Marinduque State University. It digitizes the entire
                    OVPSAS lifecycle registration, rosters, fees, proposals, and
                    end-of-semester clearance so leaders lead, and records stay
                    clean.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleSignInClick}
                    className="inline-flex items-center gap-2 rounded-full bg-[#4a0e17] text-white px-6 py-3.5 text-[14px] font-bold shadow-[0_6px_20px_rgba(74,14,23,0.25)] hover:bg-[#2e080e] hover:shadow-[0_10px_28px_rgba(74,14,23,0.32)] hover:-translate-y-0.5 transition-all"
                  >
                    Access SOMIS Portal
                    <span className="inline-flex w-7 h-7 rounded-full bg-white/15 items-center justify-center">
                      <Icon.Arrow className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-[#ece9e0] px-5 py-3.5 text-[14px] font-bold text-[#1a2332] hover:border-[#d8d2c0] hover:bg-[#fffdf5] transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#fdf2f3] border border-[#f0d0d6] flex items-center justify-center text-[#4a0e17]">
                      <Icon.Play className="w-3 h-3 ml-0.5" />
                    </span>
                    See how it works
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#1a2332]">
                    <Icon.Shield className="w-4 h-4 text-emerald-600" />{" "}
                    OVPSAS-mandated
                  </span>
                  <span className="h-3 w-px bg-[#ece9e0] hidden sm:block" />
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#6b7289]">
                    <Icon.Check className="w-3.5 h-3.5 text-[#4a0e17]" />{" "}
                    Audit-ready records
                  </span>
                  <span className="h-3 w-px bg-[#ece9e0] hidden sm:block" />
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#6b7289]">
                    <Icon.Check className="w-3.5 h-3.5 text-[#4a0e17]" /> Works
                    on any device
                  </span>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#ece9e0]/60">
                  <div className="flex -space-x-2">
                    {[
                      "https://i.pravatar.cc/100?img=32",
                      "https://i.pravatar.cc/100?img=44",
                      "https://i.pravatar.cc/100?img=12",
                    ].map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                        loading="lazy"
                      />
                    ))}
                    <span className="w-7 h-7 rounded-full bg-[#4a0e17] text-white border-2 border-white flex items-center justify-center text-[10px] font-bold">
                      +2k
                    </span>
                  </div>
                  <p className="text-xs leading-tight">
                    <span className="font-bold text-[#1a2332]">
                      Loved by student leaders
                    </span>{" "}
                    <span className="text-[#6b7289]">across all colleges</span>
                    <span className="hidden sm:inline text-[#f0c94a] ml-1.5">
                      ★★★★★ 4.9/5
                    </span>
                  </p>
                </div>
              </div>

              {/* Right — dashboard preview */}
              <div className="relative lg:pl-2">
                <div
                  className="absolute -inset-6 bg-gradient-to-br from-[#f5e6a3]/40 via-transparent to-[#4a0e17]/10 rounded-[28px] blur-2xl"
                  aria-hidden
                />

                <div className="relative rounded-[22px] bg-white border border-[#ece9e0] shadow-[0_20px_60px_rgba(26,10,13,0.12),0_4px_16px_rgba(26,10,13,0.06)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3efe6] bg-[#fffdf5]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black/10" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black/10" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black/10" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide text-[#6b7289] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                      somis.marsu.edu.ph • Live
                    </span>
                    <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#4a0e17] text-white">
                      A.Y. 2025–2026
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 bg-[#fdfbf6] space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Clearance",
                          value: "Cleared",
                          sub: "All docs approved",
                          tone: "emerald",
                        },
                        {
                          label: "Collections",
                          value: "₱42,800",
                          sub: "98% remitted",
                          tone: "gold",
                        },
                        {
                          label: "Events",
                          value: "12",
                          sub: "4 pending",
                          tone: "maroon",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-2xl bg-white border border-[#ece9e0] p-3 shadow-sm"
                        >
                          <div className="text-[10px] font-bold tracking-widest uppercase text-[#9aa0b3]">
                            {s.label}
                          </div>
                          <div
                            className={`text-[15px] font-black tracking-tight mt-1 ${s.tone === "emerald" ? "text-emerald-700" : s.tone === "gold" ? "text-[#9a7a14]" : "text-[#4a0e17]"}`}
                          >
                            {s.value}
                          </div>
                          <div className="text-[11px] font-medium text-[#6b7289]">
                            {s.sub}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-white border border-[#ece9e0] overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3efe6]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#4a0e17] text-[#f5e6a3] flex items-center justify-center">
                            <Icon.File className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div className="text-xs font-bold leading-none">
                              Clearance Tracker
                            </div>
                            <div className="text-[11px] text-[#6b7289] mt-0.5">
                              CICS Student Council
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          On track
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        {[
                          {
                            name: "Accomplishment Report",
                            status: "Approved",
                            color: "emerald",
                          },
                          {
                            name: "Financial Statement",
                            status: "For review",
                            color: "amber",
                          },
                          {
                            name: "Membership Roster",
                            status: "Verified",
                            color: "emerald",
                          },
                        ].map((r) => (
                          <div
                            key={r.name}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${r.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`}
                              />
                              <span className="text-xs font-semibold truncate">
                                {r.name}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${r.color === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                            >
                              {r.status}
                            </span>
                          </div>
                        ))}
                        <div className="h-2 rounded-full bg-[#f3efe6] overflow-hidden">
                          <div className="h-full w-[78%] bg-gradient-to-r from-[#4a0e17] to-[#7a1f2d] rounded-full" />
                        </div>
                        <div className="flex justify-between text-[11px] font-medium text-[#6b7289]">
                          <span>4 of 5 requirements complete</span>
                          <span className="font-bold text-[#4a0e17]">78%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#4a0e17] text-white p-3.5 relative overflow-hidden">
                        <div
                          className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10"
                          aria-hidden
                        />
                        <div className="text-[10px] font-bold tracking-widest uppercase opacity-80">
                          Next deadline
                        </div>
                        <div className="text-xs font-bold mt-1 leading-snug">
                          Accomplishment Report
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5">
                          Due in 4 days • Adviser review
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white border border-[#ece9e0] p-3.5">
                        <div className="text-[10px] font-bold tracking-widest uppercase text-[#9aa0b3]">
                          Recent activity
                        </div>
                        <ul className="mt-1.5 space-y-1 text-[11px] leading-tight">
                          <li className="flex gap-1.5">
                            <span className="text-emerald-600 font-bold">
                              ✓
                            </span>{" "}
                            <span className="font-medium truncate">
                              Treasurer posted Q2 ledger
                            </span>
                          </li>
                          <li className="flex gap-1.5">
                            <span className="text-[#4a0e17] font-bold">•</span>{" "}
                            <span className="font-medium truncate">
                              Secretary uploaded minutes
                            </span>
                          </li>
                          <li className="flex gap-1.5">
                            <span className="text-amber-600 font-bold">!</span>{" "}
                            <span className="font-medium truncate">
                              2 receipts need review
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 bg-white border-t border-[#f3efe6] flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#6b7289]">
                      Real-time sync • Role-aware access
                    </span>
                    <span className="font-mono font-bold tracking-widest text-[#4a0e17]">
                      SOMIS v2.4
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex absolute -right-3 -bottom-4 items-center gap-2.5 bg-white border border-[#ece9e0] rounded-full px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <Icon.Check className="w-3.5 h-3.5" />
                  </span>
                  <div className="pr-1 leading-tight">
                    <div className="text-xs font-bold">Clearance verified</div>
                    <div className="text-[11px] text-[#6b7289]">
                      OVPSAS signed • 2 min ago
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust row */}
            <div className="mt-12 lg:mt-16 rounded-[20px] bg-white border border-[#ece9e0] shadow-sm px-5 sm:px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <span className="font-bold tracking-widest uppercase text-[#9aa0b3]">
                  Trusted across MarSU
                </span>
                <span className="hidden sm:inline h-4 w-px bg-[#ece9e0]" />
                <span className="flex items-center gap-2 font-semibold">
                  <span className="w-6 h-6 rounded-lg bg-[#fdf2f3] border border-[#f0d0d6] flex items-center justify-center text-[#4a0e17] text-[10px] font-black">
                    CICS
                  </span>{" "}
                  CICS • CENG • CAS • COED
                </span>
                <span className="hidden lg:inline h-4 w-px bg-[#ece9e0]" />
                <span className="text-[#6b7289] font-medium hidden lg:inline">
                  University-wide orgs, CSCs, and accredited sub-organizations
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-8 text-center">
                {[
                  { k: "40+", v: "Orgs onboarded" },
                  { k: "2,800+", v: "Student members" },
                  { k: "99.2%", v: "Clearance accuracy" },
                ].map((s) => (
                  <div key={s.k} className="min-w-[84px]">
                    <div className="text-[18px] font-black tracking-tight text-[#4a0e17] leading-none">
                      {s.k}
                    </div>
                    <div className="text-[11px] font-semibold text-[#6b7289] mt-1">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FEATURES ───────── */}
        <section
          id="features"
          className="py-16 lg:py-24 bg-white border-y border-[#ece9e0]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fff9db] border border-[#f0d98a] text-[#7a5f0f] text-[11px] font-bold tracking-widest uppercase">
                <Icon.Spark className="w-3.5 h-3.5" /> Purpose-built for OVPSAS
                workflows
              </div>
              <h2 className="font-display text-[28px] sm:text-[36px] font-black tracking-[-0.03em] text-[#1a0a0d] leading-tight">
                No more paper chases.{" "}
                <span className="font-serif italic font-normal text-[#4a0e17]">
                  Just clean, compliant records.
                </span>
              </h2>
              <p className="text-[14px] sm:text-[15px] leading-6 text-[#6b7289] max-w-2xl mx-auto">
                From fee posting to final clearance, SOMIS gives officers,
                advisers, and OVPSAS the same source of truth with permissions,
                history, and signatures baked in.
              </p>
            </div>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {[
                {
                  icon: Icon.File,
                  title: "Digitize every workflow",
                  desc: "Proposals, minutes, and accomplishment reports move through guided approvals traceable, timestamped, and never lost in GCs.",
                  points: [
                    "Templates & reviewers",
                    "Adviser sign-off",
                    "Version history",
                  ],
                },
                {
                  icon: Icon.Wallet,
                  title: "Collections you can trust",
                  desc: "Treasurers post dues, members upload receipts, and cash payments are logged all reconciled in one ledger.",
                  points: [
                    "Receipt OCR + QR",
                    "Cash & online flows",
                    "Exportable ledgers",
                  ],
                },
                {
                  icon: Icon.Shield,
                  title: "Clearance without chaos",
                  desc: "Checklists adapt per role and period. Officers see what’s missing; OVPSAS sees what’s ready to approve.",
                  points: [
                    "Role-aware checklist",
                    "Auto-verification",
                    "Digital certificate",
                  ],
                },
                {
                  icon: Icon.Users,
                  title: "One roster, zero duplicates",
                  desc: "College-aware onboarding ties members to programs and sections. Invite links replace manual encoding.",
                  points: [
                    "College • Program • Section",
                    "Invite tokens",
                    "De-duped records",
                  ],
                },
                {
                  icon: Icon.Clock,
                  title: "Real-time, role-aware",
                  desc: "Live updates keep everyone aligned. Officers and OVPSAS see only what they should instantly.",
                  points: [
                    "Realtime sync",
                    "Granular permissions",
                    "Audit trail",
                  ],
                },
                {
                  icon: Icon.Spark,
                  title: "Built for MarSU",
                  desc: "Academic periods, signatories, and org types match MarSU policy no workaround needed.",
                  points: [
                    "A.Y. & sem control",
                    "Official signatories",
                    "Policy-aligned",
                  ],
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group relative rounded-[20px] bg-[#fdfbf6] border border-[#ece9e0] p-6 sm:p-7 hover:bg-white hover:border-[#d8d2c0] hover:shadow-[0_8px_24px_rgba(26,10,13,0.07)] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#4a0e17] text-[#f5e6a3] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-5 text-[15px] font-bold tracking-tight text-[#1a2332]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6b7289]">
                    {f.desc}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {f.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-2 text-xs font-medium text-[#1a2332]"
                      >
                        <span className="w-4 h-4 rounded-full bg-white border border-[#ece9e0] flex items-center justify-center shrink-0">
                          <Icon.Check className="w-3 h-3 text-emerald-600" />
                        </span>{" "}
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <span className="px-3.5 py-1.5 rounded-full bg-[#fdf2f3] border border-[#f0d0d6] font-semibold text-[#4a0e17]">
                End-to-end encryption
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#fff9db] border border-[#f0d98a] font-semibold text-[#7a5f0f]">
                Compliant with OVPSAS guidelines
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#ece9e0] font-semibold text-[#6b7289]">
                Accessible • WCAG AA
              </span>
            </div>
          </div>
        </section>

        {/* ───────── HOW IT WORKS ───────── */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-[#fdfbf6]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex px-3.5 py-1 rounded-full bg-white border border-[#ece9e0] text-[11px] font-bold tracking-widest uppercase text-[#4a0e17]">
                  How it works
                </div>
                <h2 className="font-display text-[28px] sm:text-[36px] font-black tracking-[-0.03em] text-[#1a0a0d] leading-tight">
                  Four steps.{" "}
                  <span className="font-serif italic font-normal text-[#4a0e17]">
                    Full semester covered.
                  </span>
                </h2>
                <p className="text-[14px] leading-6 text-[#6b7289]">
                  Designed with OVPSAS, tested with officers. Every handoff is
                  clear, every record is accountable.
                </p>
              </div>
              <a
                href="#clearance"
                className="hidden lg:inline-flex items-center gap-2 text-sm font-bold text-[#4a0e17] hover:gap-3 transition-all"
              >
                View clearance journey <Icon.Arrow className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-12 grid lg:grid-cols-4 gap-5 relative">
              {/* Connector line aligned with badges */}
              <div
                className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#d8d2c0] to-transparent"
                aria-hidden
              />

              {[
                {
                  n: "01",
                  t: "Register & invite",
                  d: "OVPSAS registers orgs; officers receive secure invite tokens. Roles are assigned on setup no manual encoding.",
                  meta: "Admin • 2 min",
                },
                {
                  n: "02",
                  t: "Run day-to-day",
                  d: "Secretary files minutes & proposals, Treasurer posts collections, PIO publishes updates all in one workspace.",
                  meta: "Officers • Daily",
                },
                {
                  n: "03",
                  t: "Remit & reconcile",
                  d: "Members upload receipts or pay cash. Ledgers reconcile automatically; advisers verify with a tap.",
                  meta: "Treasurer • Weekly",
                },
                {
                  n: "04",
                  t: "Clear with confidence",
                  d: "The checklist lights up as requirements complete. OVPSAS signs the digital clearance when ready.",
                  meta: "OVPSAS • End of term",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="relative rounded-[20px] bg-white border border-[#ece9e0] p-6 sm:p-7 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-[#4a0e17] text-white flex items-center justify-center text-xs font-black tracking-widest">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#1a2332]">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6b7289]">
                    {s.d}
                  </p>
                  <div className="mt-5 inline-flex px-3 py-1 rounded-full bg-[#fdfbf6] border border-[#ece9e0] text-[11px] font-semibold text-[#6b7289]">
                    {s.meta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── ROLES ───────── */}
        <section
          id="roles"
          className="py-16 lg:py-24 bg-white border-y border-[#ece9e0]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex px-3.5 py-1 rounded-full bg-[#4a0e17] text-[#f5e6a3] text-[11px] font-bold tracking-widest uppercase">
                Role-based access
              </div>
              <h2 className="font-display text-[28px] sm:text-[36px] font-black tracking-[-0.03em] text-[#1a0a0d]">
                Built for how MarSU actually works
              </h2>
              <p className="text-[14px] leading-6 text-[#6b7289]">
                Officers manage execution; OVPSAS governs compliance. Each role
                sees a tailored workspace with the right permissions nothing
                more, nothing less.
              </p>
            </div>

            <div className="mt-12 grid lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="rounded-[22px] bg-[#fdfbf6] border border-[#ece9e0] overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="h-1.5 bg-[#4a0e17]" />
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-xl bg-[#4a0e17] text-[#f5e6a3] flex items-center justify-center shrink-0">
                        <Icon.Users className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="text-[11px] font-bold tracking-widest uppercase text-[#9a7a14]">
                          For leaders
                        </div>
                        <h3 className="text-[17px] font-black tracking-tight text-[#1a2332]">
                          Student Officer Workspace
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-[13px] leading-6 text-[#6b7289]">
                      Secretary, Treasurer, PIO, and assigned officers share one
                      organization workspace with live roster, fees, and
                      proposals.
                    </p>
                    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] font-medium">
                      {[
                        "Submit proposals & reports",
                        "Manage roster & attendance",
                        "Post dues & track receipts",
                        "Generate clearance docs",
                        "Adviser review flow",
                        "Export official PDFs",
                      ].map((x) => (
                        <li key={x} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#ece9e0] flex items-center justify-center shrink-0">
                            <Icon.Check className="w-3 h-3 text-[#4a0e17]" />
                          </span>{" "}
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 sm:p-8 pt-0">
                  <button
                    onClick={handleSelectOfficer}
                    className="w-full rounded-full bg-white border border-[#d8d2c0] py-3.5 text-sm font-bold text-[#1a2332] hover:bg-[#fffdf5] transition-colors"
                  >
                    Enter as Officer →
                  </button>
                </div>
              </div>

              <div className="rounded-[22px] bg-[#1a0a0d] text-white overflow-hidden relative flex flex-col justify-between">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(600px 300px at 80% 0%, #f5e6a3, transparent)",
                  }}
                  aria-hidden
                />
                <div>
                  <div className="h-1.5 bg-[#f5e6a3]" />
                  <div className="relative p-6 sm:p-8">
                    <div className="flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-xl bg-[#f5e6a3] text-[#1a0a0d] flex items-center justify-center shrink-0">
                        <Icon.Shield className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="text-[11px] font-bold tracking-widest uppercase text-[#f5e6a3]">
                          For governance
                        </div>
                        <h3 className="text-[17px] font-black tracking-tight">
                          OVPSAS Administrator
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-[13px] leading-6 text-white/75">
                      OVPSAS oversees registration, compliance, and final
                      clearance with full visibility and audit history.
                    </p>
                    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] font-medium">
                      {[
                        "Register orgs & invite tokens",
                        "Set academic periods",
                        "Review submissions",
                        "Verify finances & attendance",
                        "Grant digital clearance",
                        "University-wide reports",
                      ].map((x) => (
                        <li key={x} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                            <Icon.Check className="w-3 h-3 text-[#f5e6a3]" />
                          </span>{" "}
                          <span className="text-white">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="relative p-6 sm:p-8 pt-0 space-y-3">
                  <button
                    onClick={handleSelectOfficer}
                    className="w-full rounded-full bg-[#f5e6a3] text-[#1a0a0d] py-3.5 text-sm font-black hover:bg-[#f0d98a] transition-colors"
                  >
                    Enter as OVPSAS Admin →
                  </button>
                  <p className="text-center text-[11px] text-white/60 font-medium">
                    Administrators are provisioned by the system owner.
                  </p>
                </div>
              </div>
            </div>

            {/* Member note */}
            <div className="mt-8 rounded-2xl bg-[#fff9db] border border-[#f0d98a] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-full bg-white border border-[#f0d98a] flex items-center justify-center text-[#9a7a14] shrink-0">
                  <Icon.Users className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-sm font-bold text-[#1a2332]">
                    Regular Student Members
                  </div>
                  <div className="text-xs text-[#6b7289] mt-0.5">
                    Join orgs, pay dues, attend events, and track your personal
                    clearance status.
                  </div>
                </div>
              </div>
              <button
                onClick={handleSelectStudent}
                className="shrink-0 rounded-full bg-[#1a2332] text-white px-5 py-2.5 text-xs font-bold hover:bg-black transition-colors"
              >
                Join as Member →
              </button>
            </div>
          </div>
        </section>

        {/* ───────── CLEARANCE JOURNEY ──────── */}
        <section id="clearance" className="py-16 lg:py-24 bg-[#fdfbf6]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[28px] overflow-hidden border border-[#ece9e0] bg-white shadow-[0_12px_40px_rgba(26,10,13,0.07)]">
              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="p-6 sm:p-10 lg:p-12">
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-[#4a0e17]">
                    <span className="w-6 h-px bg-[#4a0e17]" /> Clearance journey
                  </div>
                  <h2 className="mt-3 font-display text-[26px] sm:text-[32px] font-black tracking-[-0.03em] leading-tight text-[#1a0a0d]">
                    Clearance you can{" "}
                    <span className="font-serif italic font-normal text-[#4a0e17]">
                      prove
                    </span>{" "}
                    and print when ready.
                  </h2>
                  <p className="mt-3 text-[13px] leading-6 text-[#6b7289]">
                    A checklist that understands MarSU policy. Each step
                    auto-verifies when possible, and stays signed once approved
                    with a printable, QR-verifiable certificate.
                  </p>

                  <ol className="mt-8 space-y-4">
                    {[
                      {
                        step: "1",
                        title: "Roster & attendance",
                        desc: "Membership verified against enrollment; event attendance tallied.",
                      },
                      {
                        step: "2",
                        title: "Dues & receipts",
                        desc: "Fee ledger reconciled. On-site cash and online payments are both accounted.",
                      },
                      {
                        step: "3",
                        title: "Reports & proposals",
                        desc: "Activity proposals, minutes, and accomplishment reports submitted.",
                      },
                      {
                        step: "4",
                        title: "Adviser endorsement",
                        desc: "College adviser reviews and endorses the packet.",
                      },
                      {
                        step: "5",
                        title: "OVPSAS clearance",
                        desc: "OVPSAS approves and issues the official clearance certificate.",
                      },
                    ].map((s) => (
                      <li key={s.step} className="flex gap-3.5">
                        <span className="mt-0.5 w-7 h-7 rounded-full bg-[#4a0e17] text-white flex items-center justify-center text-xs font-black shrink-0">
                          {s.step}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#1a2332]">
                            {s.title}
                          </div>
                          <div className="text-xs leading-5 text-[#6b7289]">
                            {s.desc}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <Icon.Check className="w-3.5 h-3.5" /> QR-verifiable
                      certificate
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#ece9e0] text-xs font-semibold text-[#1a2332]">
                      Print-ready A4
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#ece9e0] text-xs font-semibold text-[#1a2332]">
                      Official signatories
                    </span>
                  </div>
                </div>

                {/* Paper preview */}
                <div className="bg-[#f3efe6] p-6 sm:p-10 flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#f5e6a3] opacity-40 blur-2xl"
                    aria-hidden
                  />
                  <div className="relative w-full max-w-[360px] bg-white rounded-xl border border-[#d8d2c0] shadow-[0_16px_40px_rgba(0,0,0,0.12)] overflow-hidden">
                    <div className="h-1.5 bg-[#4a0e17]" />
                    <div className="px-5 py-4 text-center border-b border-[#f3efe6]">
                      <img
                        src="/logo.png"
                        alt=""
                        className="w-8 h-8 mx-auto object-contain"
                      />
                      <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#9a7a14] mt-1">
                        Marinduque State University
                      </div>
                      <div className="text-xs font-black tracking-tight text-[#1a0a0d] mt-0.5">
                        CERTIFICATE OF CLEARANCE
                      </div>
                      <div className="text-[10px] font-semibold text-[#6b7289]">
                        Office of the Vice President for Student Affairs
                      </div>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#6b7289] font-medium">
                          Organization
                        </span>
                        <span className="font-bold text-[#1a2332]">
                          CICS Student Council
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#6b7289] font-medium">
                          A.Y. / Semester
                        </span>
                        <span className="font-bold font-mono">
                          2025–2026 • 1st Sem
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#6b7289] font-medium">
                          Status
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                          CLEARED
                        </span>
                      </div>
                      <div className="pt-3 border-t border-dashed border-[#ece9e0] flex items-center justify-between">
                        <div>
                          <div
                            className="w-16 h-6 bg-[#1a0a0d] rounded-sm"
                            aria-hidden
                          />
                          <div className="text-[9px] font-bold tracking-widest uppercase text-[#6b7289] mt-1">
                            Director, OVPSAS
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-lg bg-[#fdfbf6] border border-[#ece9e0] grid place-items-center">
                          <div
                            className="w-9 h-9 rounded bg-[repeating-linear-gradient(45deg,#1a0a0d_0_2px,transparent_2px_4px)] opacity-80"
                            aria-hidden
                          />
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-[#fdfbf6] border-t border-[#f3efe6] text-[10px] font-mono text-[#6b7289] flex justify-between">
                      <span>Ref: SOMIS-2025-0142</span>
                      <span className="font-bold text-[#4a0e17]">
                        Verify via QR
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── TESTIMONIALS ───────── */}
        <section className="py-16 lg:py-24 bg-white border-y border-[#ece9e0]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2 className="font-display text-[24px] sm:text-[28px] font-black tracking-[-0.02em] text-[#1a0a0d]">
                What leaders say after switching to SOMIS
              </h2>
              <div className="flex items-center gap-1 text-[#f0c94a] text-sm">
                ★★★★★{" "}
                <span className="text-xs font-bold text-[#6b7289] ml-1">
                  4.9/5 from 87 officers
                </span>
              </div>
            </div>

            <div className="mt-10 grid lg:grid-cols-3 gap-5">
              {[
                {
                  name: "Angel M.",
                  role: "Secretary • CICS-SC",
                  quote:
                    "Clearance used to be a scramble of GCs and folders. Now our checklist is live and OVPSAS signed us in a day.",
                  avatar: "https://i.pravatar.cc/100?img=5",
                },
                {
                  name: "James R. T.",
                  role: "Treasurer • COED",
                  quote:
                    "Posting dues and verifying receipts is finally sane. The ledger reconciles itself, and members can see their status instantly.",
                  avatar: "https://i.pravatar.cc/100?img=33",
                },
                {
                  name: "Dr. L. Santos",
                  role: "OVPSAS • Adviser",
                  quote:
                    "We get clean packets on time, with signatures and history. It cut our end-of-term review time by more than half.",
                  avatar: "https://i.pravatar.cc/100?img=14",
                },
              ].map((t) => (
                <figure
                  key={t.name}
                  className="rounded-[20px] bg-[#fdfbf6] border border-[#ece9e0] p-6 sm:p-7 relative flex flex-col justify-between"
                >
                  <div>
                    <Icon.Quote className="w-7 h-7 text-[#f0d98a] opacity-80" />
                    <blockquote className="mt-3 text-[14px] leading-6 text-[#1a2332]">
                      “{t.quote}”
                    </blockquote>
                  </div>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-[#ece9e0]"
                      loading="lazy"
                    />
                    <div>
                      <div className="text-sm font-bold leading-none text-[#1a2332]">
                        {t.name}
                      </div>
                      <div className="text-xs font-medium text-[#6b7289] mt-1">
                        {t.role}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section id="faq" className="py-16 lg:py-24 bg-[#fdfbf6]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-12 items-start">
              <div className="space-y-4 lg:sticky lg:top-28">
                <div className="inline-flex px-3.5 py-1 rounded-full bg-white border border-[#ece9e0] text-[11px] font-bold tracking-widest uppercase text-[#4a0e17]">
                  FAQ
                </div>
                <h2 className="font-display text-[28px] sm:text-[32px] font-black tracking-[-0.03em] text-[#1a0a0d] leading-tight">
                  Questions, answered clearly.
                </h2>
                <p className="text-[14px] leading-6 text-[#6b7289]">
                  If you don’t see your question, contact OVPSAS through your
                  college coordinator.
                </p>
                <div className="hidden lg:block pt-2">
                  <button
                    onClick={handleSignInClick}
                    className="inline-flex items-center gap-2 bg-[#4a0e17] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-sm hover:bg-[#2e080e] transition-colors"
                  >
                    Ask via Portal <Icon.Arrow className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "Who can access SOMIS?",
                    a: "SOMIS is open to three groups: (1) registered student organization officers, (2) regular student members, and (3) OVPSAS administrators. Officers and OVPSAS are provisioned via official invites; members self-register through their college and organization.",
                  },
                  {
                    q: "How do fees and receipts work?",
                    a: "Treasurers create fee items and post payments. Members can pay via cash (logged by the treasurer) or upload a receipt for treasurer verification. Every transaction is recorded in the organization ledger with timestamps and proof.",
                  },
                  {
                    q: "Does SOMIS replace paper clearances?",
                    a: "Yes the digital checklist is the official record. When OVPSAS approves, SOMIS issues a printable, QR-verifiable clearance certificate with the correct signatories and period. Paper is only for printing the certificate itself.",
                  },
                  {
                    q: "What if my organization isn’t listed during registration?",
                    a: "Only organizations registered and set to “Active” by OVPSAS appear. If yours is missing, contact OVPSAS or your college adviser to confirm accreditation and activation for the current academic period.",
                  },
                  {
                    q: "Is my data secure?",
                    a: "Access is role-based and scoped to your organization. Sensitive actions are logged, and clearance records include verification metadata. For account issues, use “Forgot Password” or contact OVPSAS.",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.q}
                    className={`rounded-[18px] border bg-white overflow-hidden transition-all ${faqOpen === idx ? "border-[#d8d2c0] shadow-sm" : "border-[#ece9e0]"}`}
                  >
                    <button
                      onClick={() => setFaqOpen(faqOpen === idx ? -1 : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left px-6 py-4.5"
                      aria-expanded={faqOpen === idx}
                    >
                      <span className="text-sm font-bold text-[#1a2332]">
                        {item.q}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-colors ${faqOpen === idx ? "bg-[#4a0e17] text-white border-[#4a0e17]" : "bg-white text-[#6b7289] border-[#ece9e0]"}`}
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${faqOpen === idx ? "rotate-45" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            d="M12 5v14M5 12h14"
                          />
                        </svg>
                      </span>
                    </button>
                    {faqOpen === idx && (
                      <div className="px-6 pb-5 pt-0">
                        <p className="text-[13px] leading-6 text-[#6b7289]">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FINAL CTA ───────── */}
        <section className="py-12 lg:py-16">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] bg-[#1a0a0d] text-white p-8 sm:p-12 lg:p-14 border border-white/10">
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(700px 400px at 85% 15%, #f5e6a3 0%, transparent 60%), radial-gradient(600px 300px at 10% 90%, #4a0e17 0%, transparent 60%)",
                }}
              />
              <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold tracking-widest uppercase text-[#f5e6a3]">
                    Ready when you are
                  </div>
                  <h2 className="font-display text-[28px] sm:text-[36px] font-black tracking-[-0.03em] leading-tight">
                    Run your org right.{" "}
                    <span className="font-serif italic font-normal text-[#f5e6a3]">
                      Close your term clean.
                    </span>
                  </h2>
                  <p className="text-[13px] sm:text-[14px] leading-6 text-white/70 max-w-xl">
                    Join officers and OVPSAS administrators who already run the
                    semester on SOMIS with fewer follow-ups and no missing
                    requirements.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold">
                    <span className="px-3 py-1.5 rounded-full bg-white text-[#1a0a0d]">
                      No paperwork. No guesswork.
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white">
                      Secure • Compliant • Supported
                    </span>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <button
                    onClick={handleSignInClick}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f5e6a3] text-[#1a0a0d] px-6 py-4 text-[15px] font-black hover:bg-[#f0d98a] hover:-translate-y-0.5 transition-all shadow-[0_10px_28px_rgba(245,230,163,0.25)]"
                  >
                    Access SOMIS Portal
                    <Icon.Arrow className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
                    Platform online • 24/7
                    <span className="opacity-30">•</span>
                    <span>Support via OVPSAS</span>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3.5">
                    <img
                      src="/logo.png"
                      alt=""
                      className="w-8 h-8 object-contain opacity-90"
                    />
                    <div className="text-xs leading-tight">
                      <div className="font-bold text-white">
                        Office of the Vice President for Student Affairs
                      </div>
                      <div className="text-white/60 font-medium mt-0.5">
                        Marinduque State University • Boac, Marinduque
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t border-[#ece9e0] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr_1fr] gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="MarSU"
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <div className="text-sm font-black tracking-tight text-[#4a0e17]">
                    SOMIS
                  </div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#9a7a14]">
                    Marinduque State University
                  </div>
                </div>
              </div>
              <p className="text-xs leading-6 text-[#6b7289] max-w-sm">
                The official Student Organization Management and Information
                System under the Office of the Vice President for Student
                Affairs. Built for transparency, accountability, and ease.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="px-2.5 py-1 rounded-full bg-[#fdfbf6] border border-[#ece9e0] text-[#1a2332]">
                  A.Y. 2025–2026
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                  ● Operational
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-black tracking-widest uppercase text-[#1a2332]">
                Platform
              </div>
              <ul className="mt-4 space-y-2.5 text-xs font-medium">
                <li>
                  <a
                    href="#features"
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#roles"
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors"
                  >
                    Roles
                  </a>
                </li>
                <li>
                  <a
                    href="#clearance"
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors"
                  >
                    Clearance
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-black tracking-widest uppercase text-[#1a2332]">
                Access
              </div>
              <ul className="mt-4 space-y-2.5 text-xs font-medium">
                <li>
                  <button
                    onClick={handleSelectOfficer}
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors text-left"
                  >
                    Officer sign in
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleSelectStudent}
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors text-left"
                  >
                    Student member
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("login")}
                    className="text-[#6b7289] hover:text-[#4a0e17] transition-colors text-left"
                  >
                    OVPSAS admin
                  </button>
                </li>
                <li>
                  <span className="text-[#9aa0b3]">
                    Support: via college coordinator
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-black tracking-widest uppercase text-[#1a2332]">
                Office
              </div>
              <p className="text-xs leading-6 text-[#6b7289]">
                Office of the Vice President for
                <br />
                Student Affairs (OVPSAS)
                <br />
                Marinduque State University
                <br />
                Boac, Marinduque, Philippines
              </p>
              <div className="rounded-xl bg-[#fdfbf6] border border-[#ece9e0] p-3">
                <div className="text-[10px] font-bold tracking-widest uppercase text-[#9aa0b3]">
                  Accessibility & Trust
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#ece9e0] text-[#1a2332]">
                    WCAG AA
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#ece9e0] text-[#1a2332]">
                    Responsive
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#ece9e0] text-[#1a2332]">
                    Audited
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#ece9e0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[#6b7289]">
              © {new Date().getFullYear()} Marinduque State University Office
              of the Vice President for Student Affairs. All rights reserved.
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#9aa0b3]">
              SOMIS • Designed for MarSU
            </span>
          </div>
        </div>
      </footer>

      {/* ───────── MODALS ───────── */}
      {activeModal === "role" && (
        <RoleSelectionModal
          isOpen={true}
          onClose={handleCloseModals}
          onOfficerSelect={handleSelectOfficer}
          onStudentSelect={handleSelectStudent}
        />
      )}
      {activeModal === "student" && (
        <StudentOnboardingModal
          isOpen={true}
          initialStep={2}
          onClose={handleCloseModals}
          onFinish={handleStudentOnboardingFinish}
          onOfficerSelect={handleSelectOfficer}
        />
      )}
      {activeModal === "login" && (
        <div className="modal-backdrop">
          <div className="modal-panel relative max-w-sm min-h-[300px]">
            <button
              onClick={handleCloseModals}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
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
      {activeModal === "student_login" && (
        <div className="modal-backdrop">
          <div className="modal-panel relative max-w-sm min-h-[300px]">
            <button
              onClick={handleCloseModals}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
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
      {activeModal === "forgot_password" && (
        <div className="modal-backdrop">
          <div className="modal-panel relative max-w-sm min-h-[300px]">
            <button
              onClick={handleCloseModals}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
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
    </div>
  );
}
