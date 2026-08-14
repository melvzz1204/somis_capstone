import { useState, useEffect, useEffectEvent, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  LoaderCircle,
  QrCode,
  UploadCloud,
  X,
} from "lucide-react";
import API from "../../api/axios";
import {
  formatCountdown,
  getEventLifecycle,
  lifecycleStyles,
} from "../../util/eventLifecycle";

// Sub-components
import LogoutButton from "../logoutButton";
import MobileTabBar from "../mobileTabBar";
import StudentPaymentTracker from "./StudentPaymentTracker";

// Helper Date Formatter
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const cleanDateStr = dateString.split("T")[0];
  const [year, month, day] = cleanDateStr.split("-");
  if (!year || !month || !day) return dateString;

  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// --- INLINE SVG ICON COMPONENTS (With Sizing Guarantees) ---
const LayoutDashboardIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const UserGroupIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
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

const CalendarIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CreditCardIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckCircleIcon = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ShieldCheckIcon = ({ className = "" }) => (
  <svg
    className={`w-5 h-5 ${className}`}
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
);

const getRootBackendUrl = () => {
  try {
    const rawUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
};

const BACKEND_URL = getRootBackendUrl();

const getAvatarSrc = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http") || avatarPath.startsWith("blob:")) {
    return avatarPath;
  }
  return `${BACKEND_URL}${avatarPath}`;
};

export default function StudentDashboard({ user: propsUser }) {
  const currentUser =
    propsUser || JSON.parse(localStorage.getItem("user") || "null");
  const userName = currentUser?.name || "Student";
  const upperName = userName.toUpperCase();
  const userEmail = currentUser?.email || "No email registered";

  const currentYear = new Date().getFullYear();
  const dynamicAcademicYear = `AY ${currentYear}–${currentYear + 1}`;

  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [roster, setRoster] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeError, setFeeError] = useState("");
  const [payments, setPayments] = useState([]);
  const [paymentError, setPaymentError] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptMetadata, setReceiptMetadata] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [receiptProgress, setReceiptProgress] = useState(0);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("GCASH");
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventError, setEventError] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [joiningEventId, setJoiningEventId] = useState("");
  const scannerRef = useRef(null);
  const scanHandledRef = useRef(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementError, setAnnouncementError] = useState("");
  const [now, setNow] = useState(() => new Date().getTime());
  const [clearanceItems] = useState([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date().getTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const request = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await API.get("/orgmembers/mine");
        setOrganization(data.organization || null);
        setMembership(data.membership || null);
        setRoster(data.roster || []);

        if (data.organization?._id) {
          const [
            feeResult,
            paymentResult,
            eventResult,
            announcementResult,
            attendanceResult,
          ] = await Promise.allSettled([
            API.get("/fees"),
            API.get("/payments/mine"),
            API.get("/events"),
            API.get("/announcements"),
            API.get("/events/attendance/mine"),
          ]);

          if (feeResult.status === "fulfilled") {
            setFees(feeResult.value.data || []);
            setFeeError("");
          } else {
            console.error(
              "Error fetching organization fees:",
              feeResult.reason,
            );
            setFees([]);
            setFeeError(
              feeResult.reason.message || "Unable to load organization fees.",
            );
          }

          if (paymentResult.status === "fulfilled") {
            setPayments(paymentResult.value.data || []);
            setPaymentError("");
          } else {
            console.error(
              "Error fetching student payments:",
              paymentResult.reason,
            );
            setPayments([]);
            setPaymentError(
              paymentResult.reason.message || "Unable to load your payments.",
            );
          }

          if (eventResult.status === "fulfilled") {
            setUpcomingEvents(eventResult.value.data || []);
            setEventError("");
          } else {
            console.error(
              "Error fetching organization events:",
              eventResult.reason,
            );
            setUpcomingEvents([]);
            setEventError(
              eventResult.reason.message ||
                "Unable to load organization events.",
            );
          }

          if (announcementResult.status === "fulfilled") {
            setAnnouncements(announcementResult.value.data || []);
            setAnnouncementError("");
          } else {
            console.error(
              "Error fetching organization announcements:",
              announcementResult.reason,
            );
            setAnnouncements([]);
            setAnnouncementError(
              announcementResult.reason.message ||
                "Unable to load organization announcements.",
            );
          }

          if (attendanceResult.status === "fulfilled") {
            setAttendance(attendanceResult.value.data || []);
          } else {
            setAttendance([]);
          }
        } else {
          setFees([]);
          setPayments([]);
          setUpcomingEvents([]);
          setAttendance([]);
          setAnnouncements([]);
          setEventError("");
          setAnnouncementError("");
        }
      } catch (err) {
        console.error("Error fetching student organization data:", err);
        setLoadError(err.message || "Unable to load organization details.");
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(request);
  }, [currentUser?._id]);

  const submitAttendanceCode = async (code) => {
    if (!String(code || "").trim() || scanning) return;
    setScanning(true);
    setScanError("");
    setScanMessage("");
    try {
      const response = await API.post("/events/attendance/scan", { code });
      const record = response.data;
      if (record) {
        setAttendance((current) => [
          record,
          ...current.filter(
            (item) =>
              (item.event?._id || item.event) !==
              (record.event?._id || record.event),
          ),
        ]);
      }
      setScanMessage(response.message || "Attendance updated successfully.");
    } catch (error) {
      setScanError(
        error.response?.data?.message ||
          error.message ||
          "Unable to process this attendance QR.",
      );
      scanHandledRef.current = false;
    } finally {
      setScanning(false);
    }
  };

  const submitScannedAttendance = useEffectEvent((code) => {
    submitAttendanceCode(code);
  });

  useEffect(() => {
    if (!scannerOpen) return undefined;
    let active = true;
    scanHandledRef.current = false;

    const disposeScanner = async (scanner) => {
      if (!scanner) return;
      try {
        if (scanner.isScanning) await scanner.stop();
      } catch {
        // The scanner may already be stopping or stopped.
      }
      try {
        await scanner.clear();
      } catch {
        // clear() throws synchronously if startup or shutdown is still active.
      }
    };

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("attendance-qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (!active || scanHandledRef.current) return;
            scanHandledRef.current = true;
            try {
              if (scanner.isScanning) await scanner.stop();
            } catch {
              // The camera may already be stopped after a successful read.
            }
            submitScannedAttendance(decodedText);
          },
          () => {},
        );
        if (!active) await disposeScanner(scanner);
      } catch (error) {
        if (active) {
          setScanError(
            error?.message ||
              "Camera access is unavailable. Paste the QR payload below.",
          );
        }
      }
    };

    void startScanner();
    return () => {
      active = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      void disposeScanner(scanner);
    };
  }, [scannerOpen]);

  const openScanner = () => {
    setScanError("");
    setScanMessage("");
    setScannerOpen(true);
  };

  const closeScanner = () => {
    setScannerOpen(false);
    setScanError("");
    setScanMessage("");
  };

  const attendanceForEvent = (eventId) =>
    attendance.find(
      (record) => (record.event?._id || record.event) === eventId,
    );

  const joinEvent = async (event) => {
    setJoiningEventId(event._id);
    setEventError("");
    try {
      const response = await API.post(`/events/${event._id}/join`);
      const record = response.data;
      if (record) {
        setAttendance((current) => [
          record,
          ...current.filter(
            (item) => (item.event?._id || item.event) !== event._id,
          ),
        ]);
      }
    } catch (error) {
      setEventError(
        error.response?.data?.message ||
          error.message ||
          "Unable to join this event.",
      );
    } finally {
      setJoiningEventId("");
    }
  };

  const resetPaymentDialog = () => {
    setSelectedFee(null);
    setPaymentMethod("GCASH");
    setReferenceNumber("");
    setReceiptMetadata(null);
    setReceiptPreview("");
    setReceiptFileName("");
    setReceiptProgress(0);
    setPaymentError("");
  };

  const parseReceipt = async (file) => {
    setPaymentError("");
    setReferenceNumber("");
    setReceiptMetadata(null);
    setReceiptProgress(0);

    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPaymentError("Choose a JPEG, PNG, or WebP GCash receipt image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPaymentError("The receipt image must not exceed 5 MB.");
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(String(reader.result || ""));
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("claimedAmount", String(selectedFee.amount));
    formData.append("parseOnly", "true");

    setIsParsingReceipt(true);
    try {
      const response = await API.post("/payments/upload-receipt", formData, {
        onUploadProgress: ({ loaded, total }) => {
          if (total) setReceiptProgress(Math.round((loaded / total) * 100));
        },
      });
      const extractedReference = String(response.referenceNumber || "");
      if (!/^\d{13}$/.test(extractedReference)) {
        throw new Error("A 13-digit reference number was not found.");
      }
      setReferenceNumber(extractedReference);
      setReceiptMetadata(response.data);
      setReceiptProgress(100);
    } catch (error) {
      setPaymentError(
        error.message ||
          "Unable to read a 13-digit reference from this receipt.",
      );
    } finally {
      setIsParsingReceipt(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    const normalizedReference = referenceNumber.replace(/\D/g, "");

    if (paymentMethod === "CASH") {
      setPaymentError(
        "Cash payments are completed in person. Please ask your treasurer to record the payment after you hand over the cash.",
      );
      return;
    }

    if (
      !selectedFee ||
      !receiptMetadata ||
      !/^\d{13}$/.test(normalizedReference)
    ) {
      setPaymentError(
        "Upload a receipt with a readable 13-digit GCash reference number.",
      );
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError("");

    try {
      const response = await API.post("/payments", {
        feeId: selectedFee._id,
        referenceNumber: normalizedReference,
        receiptImageUrl: receiptMetadata.receiptImageUrl,
        ocrRawText: receiptMetadata.ocrRawText,
        extractedAmount: receiptMetadata.extractedAmount,
      });
      setPayments((current) => [
        response.data,
        ...current.filter((payment) => payment._id !== response.data._id),
      ]);
      resetPaymentDialog();
    } catch (error) {
      setPaymentError(error.message || "Unable to submit the payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const trackedEvents = upcomingEvents
    .map((event) => ({
      ...event,
      lifecycle: getEventLifecycle(event, now),
    }))
    .sort((first, second) => {
      const statusOrder = { Ongoing: 0, Upcoming: 1, Ended: 2, Cancelled: 3 };
      const statusDifference =
        statusOrder[first.lifecycle.status] -
        statusOrder[second.lifecycle.status];
      if (statusDifference !== 0) return statusDifference;
      return (
        new Date(first.startDateTime).getTime() -
        new Date(second.startDateTime).getTime()
      );
    });

  const officerRoster = roster.filter(
    (member) => member.role?.trim().toLowerCase() !== "member",
  );
  const activeMembershipsCount = organization ? 1 : 0;
  const clearedCount = clearanceItems.filter(
    (item) => item.status === "Cleared",
  ).length;
  const isFullyCleared =
    clearanceItems.length === 0 || clearedCount === clearanceItems.length;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 h-screen sticky top-0 self-start bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl overflow-y-auto">
        <div className="space-y-8">
          {/* Logo & Portal Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#601520]">
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase block">
                SOMIS
              </span>
              <span className="text-[10px] font-medium text-rose-200/70 tracking-wider block">
                Student Portal
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <LayoutDashboardIcon
                className={
                  activeTab === "overview"
                    ? "text-[#D4AF37]"
                    : "text-rose-200/60"
                }
              />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("orgs")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "orgs"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <UserGroupIcon
                className={
                  activeTab === "orgs" ? "text-[#D4AF37]" : "text-rose-200/60"
                }
              />
              <span>My Organization ({activeMembershipsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "events"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CalendarIcon
                className={
                  activeTab === "events" ? "text-[#D4AF37]" : "text-rose-200/60"
                }
              />
              <span>Events & Activities ({trackedEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("fees")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "fees"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CreditCardIcon
                className={
                  activeTab === "fees" ? "text-[#D4AF37]" : "text-rose-200/60"
                }
              />
              <span>Organization Fees ({fees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <CheckCircleIcon
                className={
                  activeTab === "clearance"
                    ? "text-[#D4AF37]"
                    : "text-rose-200/60"
                }
              />
              <span>Org Clearance Status ({clearanceItems.length})</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Email */}
        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-100 truncate">
                {userName}
              </p>
              <p className="text-[10px] text-rose-300/70 truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <LogoutButton variant="button" showConfirmModal={true} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4A0E17] text-[#D4AF37] shadow-sm">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A610D]">
                  Student Services
                </p>
                <h1 className="truncate text-base sm:text-lg font-extrabold text-[#4A0E17]">
                  Welcome back, {upperName}
                </h1>
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {organization?.name || "Student Portal"}{" "}
                  <span className="mx-1 text-slate-300">•</span> Stay updated
                  with your organization
                </p>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] text-[11px] font-bold tracking-tight">
              {dynamicAcademicYear}
            </span>
          </div>
        </header>

        <MobileTabBar
          activeItem={activeTab}
          onChange={setActiveTab}
          items={[
            {
              id: "overview",
              label: "Overview",
              icon: <LayoutDashboardIcon />,
            },
            {
              id: "orgs",
              label: "Organization",
              shortLabel: "Org",
              icon: <UserGroupIcon />,
            },
            { id: "events", label: "Events", icon: <CalendarIcon /> },
            { id: "fees", label: "Fees", icon: <CreditCardIcon /> },
            {
              id: "clearance",
              label: "Clearance",
              shortLabel: "Clear",
              icon: <CheckCircleIcon />,
            },
          ]}
        />

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8 max-w-6xl w-full mx-auto space-y-8">
          {/* METRIC CARDS GRID */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Memberships
                  </p>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                      {activeMembershipsCount}
                    </h2>
                    <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                      Enrolled
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Upcoming Events
                  </p>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                      {
                        trackedEvents.filter(
                          (event) => event.lifecycle.status !== "Ended",
                        ).length
                      }
                    </h2>
                    <span className="text-[11px] text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2 py-0.5 rounded-md font-bold">
                      Active
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Clearance Status
                  </p>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                      {isFullyCleared ? "Cleared" : "Pending"}
                    </h2>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                        isFullyCleared
                          ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                          : "text-rose-800 bg-rose-50 border border-rose-200"
                      }`}
                    >
                      {isFullyCleared ? "100%" : "Action Needed"}
                    </span>
                  </div>
                </div>
              </div>

              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#4A0E17]">
                      Organization Announcements
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Official notices published by your P.I.O.
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2.5 py-1 rounded-md">
                    {announcements.length} active
                  </span>
                </div>

                {announcementError ? (
                  <div className="m-5 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                    {announcementError}
                  </div>
                ) : isLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Loading announcements...
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-xs font-bold text-slate-700">
                      No active announcements
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Published organization notices will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {announcements.map((announcement) => (
                      <article
                        key={announcement._id}
                        className={`p-5 ${
                          announcement.priority === "Urgent"
                            ? "border-l-4 border-l-rose-600 bg-rose-50/30"
                            : announcement.priority === "Important"
                              ? "border-l-4 border-l-[#D4AF37]"
                              : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#7A610D]">
                                {announcement.category}
                              </span>
                              {announcement.priority !== "Normal" && (
                                <span
                                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                                    announcement.priority === "Urgent"
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-amber-200 bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {announcement.priority}
                                </span>
                              )}
                            </div>
                            <h3 className="mt-2 text-sm font-extrabold text-slate-800">
                              {announcement.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-600">
                              {announcement.content}
                            </p>
                            <p className="mt-3 text-[10px] text-slate-400">
                              Published {formatDate(announcement.publishedAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAnnouncement(announcement)
                            }
                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-[#4A0E17] bg-white px-4 text-xs font-bold text-[#4A0E17] hover:bg-rose-50"
                          >
                            View
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: MY ORGANIZATION */}
          {activeTab === "orgs" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                  <p className="text-xs font-bold text-slate-600">
                    Loading your organization and roster...
                  </p>
                </div>
              ) : loadError ? (
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 shadow-xs">
                  <h3 className="text-sm font-bold text-rose-800">
                    Unable to load My Organization
                  </h3>
                  <p className="text-xs text-rose-700 mt-1">{loadError}</p>
                </div>
              ) : !organization ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2 shadow-xs">
                  <p className="text-sm font-bold text-slate-700">
                    No Organization Assigned
                  </p>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    No roster record matches your account email yet. Contact
                    your organization secretary or the student services office
                    to have your membership recorded.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A610D]">
                            My Organization
                          </p>
                          <h3 className="text-xl font-extrabold text-[#4A0E17] mt-1">
                            {organization.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {[organization.acronym, organization.college]
                              .filter(Boolean)
                              .join(" • ") || "University student organization"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start">
                          {organization.status || "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Your Role
                        </p>
                        <p className="font-bold text-slate-800 mt-1">
                          {membership?.role || "Member"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Faculty Adviser
                        </p>
                        <p className="font-bold text-slate-800 mt-1">
                          {organization.adviser || "Not recorded"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          President
                        </p>
                        <p className="font-bold text-slate-800 mt-1">
                          {organization.president || "Not recorded"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Contact Email
                        </p>
                        <p className="font-bold text-slate-800 mt-1 break-all">
                          {organization.email || "Not recorded"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#4A0E17]">
                          Organization Chart
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Registered leadership of{" "}
                          {organization.acronym || organization.name}.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-1 text-[10px] font-bold text-[#6f1c1c]">
                        {officerRoster.length}{" "}
                        {officerRoster.length === 1 ? "Officer" : "Officers"}
                      </span>
                    </div>

                    {officerRoster.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                        <p className="text-xs text-slate-400">
                          No organization officers are currently recorded.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl bg-slate-50/70 p-3 sm:p-5">
                        <div className="mx-auto min-w-[560px] max-w-4xl">
                          <div className="flex justify-center">
                            <div className="w-56 rounded-xl border border-[#D4AF37]/50 bg-white px-3 py-2 text-center shadow-sm">
                              <p className="text-[9px] font-black uppercase tracking-wider text-[#7A610D]">
                                Organization President
                              </p>
                              <p className="mt-1 truncate text-xs font-extrabold text-[#4A0E17]">
                                {organization.president || "Not recorded"}
                              </p>
                            </div>
                          </div>
                          <div className="mx-auto h-5 w-px bg-[#D4AF37]" />
                          <div className="relative border-t border-[#D4AF37] pt-5">
                            <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-[#D4AF37]" />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {officerRoster.map((officer) => {
                                const avatarUrl = getAvatarSrc(officer.avatar);
                                return (
                                  <article
                                    key={officer._id}
                                    className="relative flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
                                  >
                                    <div className="absolute -top-5 left-1/2 h-5 w-px -translate-x-1/2 bg-[#D4AF37]" />
                                    {avatarUrl ? (
                                      <img
                                        src={avatarUrl}
                                        alt={officer.name || "Officer"}
                                        className="h-15 w-15 shrink-0 rounded-full border border-[#D4AF37]/50 object-cover object-top"
                                      />
                                    ) : (
                                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#4A0E17]/10 text-xs font-extrabold uppercase text-[#4A0E17]">
                                        {officer.name?.charAt(0) || "?"}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-[10px] font-black uppercase tracking-wide text-[#7A610D]">
                                        {officer.role || "Officer"}
                                      </p>
                                      <p
                                        className="truncate text-xs font-bold text-slate-800"
                                        title={officer.name}
                                      >
                                        {officer.name}
                                      </p>
                                      {(officer.year || officer.section) && (
                                        <p className="truncate text-[10px] text-slate-500">
                                          {[officer.year, officer.section]
                                            .filter(Boolean)
                                            .join(" • ")}
                                        </p>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: ORGANIZATION FEES */}
          {activeTab === "fees" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  {organization?.acronym ||
                    organization?.name ||
                    "Organization"}{" "}
                  Fees
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fees created by your organization secretary and applicable to
                  your membership.
                </p>
              </div>

              {feeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {feeError}
                </div>
              )}

              {fees.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No active fees available
                  </p>
                  <p className="text-xs text-slate-400">
                    Your organization has not published an applicable fee yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {fees.map((fee) => {
                    const feePayments = payments.filter(
                      (payment) =>
                        String(payment.fee?._id || payment.fee || "") ===
                        String(fee._id),
                    );
                    const latestPayment = feePayments[0];
                    const canPay =
                      !latestPayment || latestPayment.status === "REJECTED";

                    return (
                      <article
                        key={fee._id}
                        className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 hover:border-[#D4AF37] transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-[#7A610D]">
                              {fee.category || "Organization Fee"}
                            </p>
                            <h4 className="font-bold text-[#4A0E17] text-sm mt-1">
                              {fee.title}
                            </h4>
                          </div>
                          <span className="text-sm font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg shrink-0">
                            ₱{Number(fee.amount || 0).toFixed(2)}
                          </span>
                        </div>

                        {fee.description && (
                          <p className="text-xs text-slate-600">
                            {fee.description}
                          </p>
                        )}

                        <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-500">
                          <div className="flex items-center justify-between">
                            <span>Academic Term:</span>
                            <span className="font-bold text-slate-700">
                              {fee.academicYear}{" "}
                              {fee.semester ? `(${fee.semester})` : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-amber-700 font-bold">
                            <span>Due Date:</span>
                            <span>{formatDate(fee.dueDate)}</span>
                          </div>
                        </div>

                        {latestPayment && (
                          <div className="border-t border-slate-200/80 pt-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Payment status
                              </p>
                              <span className="text-[10px] font-bold text-slate-400">
                                Submission {feePayments.length}
                              </span>
                            </div>
                            <StudentPaymentTracker payment={latestPayment} />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            resetPaymentDialog();
                            setSelectedFee(fee);
                          }}
                          disabled={!canPay}
                          className="w-full px-3 py-2.5 bg-[#4A0E17] hover:bg-[#601520] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {latestPayment?.status === "VERIFIED"
                            ? "Paid"
                            : latestPayment?.status === "PENDING_MANUAL_REVIEW"
                              ? "Pending review"
                              : "Pay Now"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVENTS & ACTIVITIES */}
          {activeTab === "events" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Campus & Organization Events
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Discover upcoming student activities and track your event
                  participation.
                </p>
              </div>

              {eventError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {eventError}
                </div>
              )}

              {trackedEvents.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Events & Activities
                  </p>
                  <p className="text-xs text-slate-400">
                    Check back later for newly approved activities from your
                    organization.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {trackedEvents.map((evt) => (
                    <div
                      key={evt._id}
                      className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#4A0E17]/10 text-[#4A0E17] text-[10px] font-bold rounded-md">
                            {organization?.acronym ||
                              organization?.name ||
                              "My Organization"}
                          </span>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${lifecycleStyles[evt.lifecycle.status]}`}
                          >
                            {evt.lifecycle.status}
                          </span>
                          {attendanceForEvent(evt._id) && (
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${attendanceForEvent(evt._id).status === "Present" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                            >
                              {attendanceForEvent(evt._id).status}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          📍 {evt.venue} • 📅{" "}
                          {new Date(evt.startDateTime).toLocaleString("en-PH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        {evt.lifecycle.target && (
                          <p
                            className={`font-bold ${evt.lifecycle.status === "Ongoing" ? "text-emerald-700" : "text-amber-700"}`}
                          >
                            {evt.lifecycle.status === "Ongoing"
                              ? "Ends in"
                              : "Starts in"}
                            : {formatCountdown(evt.lifecycle.remainingMs)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {evt.lifecycle.status === "Upcoming" &&
                          !attendanceForEvent(evt._id) && (
                            <button
                              type="button"
                              onClick={() => joinEvent(evt)}
                              disabled={joiningEventId === evt._id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {joiningEventId === evt._id
                                ? "Joining..."
                                : "Join Now"}
                            </button>
                          )}
                        {evt.lifecycle.status === "Ongoing" &&
                          attendanceForEvent(evt._id)?.status === "Pending" && (
                            <button
                              type="button"
                              onClick={openScanner}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-800"
                            >
                              <QrCode className="h-3.5 w-3.5" /> Scan On-site
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="px-3 py-1.5 bg-[#4A0E17] text-white font-bold rounded-lg hover:bg-[#601520] transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CLEARANCE STATUS */}
          {activeTab === "clearance" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  End-of-Term Organization Clearance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify clearance sign-offs required by your student
                  organizations.
                </p>
              </div>

              {clearanceItems.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircleIcon className="text-emerald-700 w-5 h-5" />
                  <p className="text-xs text-emerald-800 font-bold">
                    No active clearance holds recorded. You are fully cleared
                    for the current academic term.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {clearanceItems.map((c, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {c.orgName || "Organization Clearance"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {c.requirement || "Dues & Assembly Attendance"}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          c.status === "Cleared"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {c.status || "Cleared"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {scannerOpen && (
          <div className="modal-backdrop">
            <div className="modal-panel max-w-md p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A610D]">
                    Event attendance
                  </p>
                  <h3 className="mt-1 text-base font-extrabold text-[#4A0E17]">
                    Scan attendance QR
                  </h3>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={closeScanner}
                  aria-label="Close scanner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                <div id="attendance-qr-reader" className="min-h-64 w-full" />
              </div>
              {scanError && (
                <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {scanError}
                </p>
              )}
              {scanMessage && (
                <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  {scanMessage}
                </p>
              )}
              {scanning && (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Verifying attendance...
                </p>
              )}
            </div>
          </div>
        )}

        {selectedAnnouncement && (
          <div className="modal-backdrop">
            <div
              className="modal-panel max-w-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="announcement-detail-title"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A610D]">
                      {selectedAnnouncement.category}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                        selectedAnnouncement.priority === "Urgent"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : selectedAnnouncement.priority === "Important"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {selectedAnnouncement.priority}
                    </span>
                  </div>
                  <h2
                    id="announcement-detail-title"
                    className="mt-2 text-lg font-extrabold text-[#4A0E17]"
                  >
                    {selectedAnnouncement.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="icon-button shrink-0"
                  aria-label="Close announcement details"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Audience
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {selectedAnnouncement.audience}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Published
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {formatDate(selectedAnnouncement.publishedAt)}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Expires
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {selectedAnnouncement.expiresAt
                        ? formatDate(selectedAnnouncement.expiresAt)
                        : "No expiry"}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Published by
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-700">
                      {selectedAnnouncement.createdBy?.name || "P.I.O."}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Announcement details
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  {selectedAnnouncement.actionUrl && (
                    <a
                      href={selectedAnnouncement.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                    >
                      {selectedAnnouncement.actionLabel}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedEvent && (
          <div className="modal-backdrop">
            <div className="modal-panel max-w-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A610D]">
                    {organization?.acronym ||
                      organization?.name ||
                      "Organization Event"}
                  </p>
                  <h3 className="mt-1 text-base font-extrabold text-[#4A0E17]">
                    {selectedEvent.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="grid h-8 w-8 place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close event details"
                  title="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {(() => {
                const lifecycle = getEventLifecycle(selectedEvent, now);
                return (
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${lifecycleStyles[lifecycle.status]}`}
                    >
                      {lifecycle.status}
                    </span>
                    {lifecycle.target && (
                      <span className="text-xs font-bold text-slate-600">
                        {lifecycle.status === "Ongoing"
                          ? "Ends in"
                          : "Starts in"}
                        : {formatCountdown(lifecycle.remainingMs)}
                      </span>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold text-slate-400">Schedule</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {new Date(selectedEvent.startDateTime).toLocaleString(
                      "en-PH",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}{" "}
                    –{" "}
                    {new Date(selectedEvent.endDateTime).toLocaleString(
                      "en-PH",
                      { timeStyle: "short" },
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold text-slate-400">Venue</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedEvent.venue}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold text-slate-400">Category</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedEvent.category}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold text-slate-400">Target audience</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedEvent.targetAudience}
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-500">Description</p>
                <p className="leading-relaxed text-slate-700">
                  {selectedEvent.description}
                </p>
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white hover:bg-[#601520]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedFee && (
          <div className="modal-backdrop">
            <div className="modal-panel max-w-md p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#4A0E17]">
                    Payment for {selectedFee.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Amount due: ₱{Number(selectedFee.amount || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetPaymentDialog}
                  className="grid h-8 w-8 place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close payment dialog"
                  title="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={submitPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {["GCASH", "CASH"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        setPaymentError("");
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${paymentMethod === method ? "border-[#4A0E17] bg-rose-50 text-[#4A0E17]" : "border-slate-200 text-slate-500"}`}
                    >
                      {method === "GCASH" ? "Pay via GCash" : "Pay with Cash"}
                    </button>
                  ))}
                </div>
                {paymentMethod === "CASH" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Bring the exact amount to your organization treasurer. Your
                    payment will appear as paid after the treasurer records the
                    cash received.
                  </div>
                )}
                {paymentError && (
                  <div
                    className="flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{paymentError}</span>
                  </div>
                )}

                {paymentMethod === "GCASH" && (
                  <>
                    <div>
                      <label
                        htmlFor="gcash-receipt"
                        className="mb-1.5 block text-xs font-bold text-slate-700"
                      >
                        GCash receipt image
                      </label>
                      <label
                        htmlFor="gcash-receipt"
                        className="flex min-h-32 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center hover:border-[#4A0E17] hover:bg-rose-50"
                      >
                        <UploadCloud
                          className="h-6 w-6 text-[#4A0E17]"
                          aria-hidden="true"
                        />
                        <span className="mt-2 text-xs font-bold text-slate-800">
                          {receiptFileName || "Choose GCash receipt image"}
                        </span>
                        <span className="mt-1 text-[11px] text-slate-500">
                          JPEG, PNG, or WebP up to 5 MB
                        </span>
                      </label>
                      <input
                        id="gcash-receipt"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                          parseReceipt(event.target.files?.[0])
                        }
                        disabled={isParsingReceipt || isSubmittingPayment}
                        className="sr-only"
                      />
                    </div>

                    {receiptPreview && (
                      <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-2.5">
                        <img
                          src={receiptPreview}
                          alt="Selected GCash receipt preview"
                          className="h-20 w-16 shrink-0 border border-slate-200 bg-white object-contain"
                        />
                        <FileImage
                          className="h-4 w-4 shrink-0 text-slate-500"
                          aria-hidden="true"
                        />
                        <p className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">
                          {receiptFileName}
                        </p>
                      </div>
                    )}

                    {isParsingReceipt && (
                      <div className="space-y-2" role="status">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-2">
                            <LoaderCircle
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                            {receiptProgress === 100
                              ? "Reading receipt"
                              : "Uploading receipt"}
                          </span>
                          <span>{receiptProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden bg-slate-200">
                          <div
                            className="h-full bg-[#4A0E17] transition-[width]"
                            style={{ width: `${receiptProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="gcash-reference"
                        className="mb-1 block text-xs font-bold text-slate-700"
                      >
                        13-digit GCash reference number
                      </label>
                      <div className="relative">
                        <input
                          id="gcash-reference"
                          type="text"
                          value={referenceNumber}
                          readOnly
                          placeholder="Upload receipt to extract reference"
                          className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 font-mono text-sm font-bold text-slate-800 outline-none"
                        />
                        {referenceNumber && (
                          <CheckCircle2
                            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>

                    {referenceNumber && (
                      <div className="border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                        Reference extracted successfully. Review it, then submit
                        the payment.
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={resetPaymentDialog}
                        className="border border-[#4A0E17]/30 bg-white px-3 py-2 text-xs font-bold text-[#4A0E17] hover:bg-[#4A0E17]/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isSubmittingPayment ||
                          isParsingReceipt ||
                          (paymentMethod === "GCASH" &&
                            (!receiptMetadata ||
                              !/^\d{13}$/.test(referenceNumber)))
                        }
                        className="bg-[#4A0E17] px-4 py-2 text-xs font-bold text-white hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmittingPayment
                          ? "Submitting..."
                          : "Submit payment"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
