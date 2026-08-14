import { useState, useEffect } from "react";
import API from "../../api/axios";
import { useToast } from "../../util/toastContext";
import LogoutButton from "../logoutButton";
import MobileTabBar from "../mobileTabBar";
import FeeModal from "./feesModal";
import StatementUploadModal from "./StatementUploadModal";
import TreasurerPaymentAudit from "./TreasurerPaymentAudit";
import CashPaymentModal from "./CashPaymentModal";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  // Take only the YYYY-MM-DD part to prevent timezone offset shifts
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

// --- INLINE SVG ICON COMPONENTS ---
const LayoutDashboardIcon = ({ className = "w-4 h-4" }) => (
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
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const WalletIcon = ({ className = "w-4 h-4" }) => (
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
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const PieChartIcon = ({ className = "w-4 h-4" }) => (
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
      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
    />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const ShieldCheckIcon = ({ className = "w-5 h-5" }) => (
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
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const SearchIcon = ({ className = "" }) => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);
const FileTextIcon = ({ className = "w-4 h-4" }) => (
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
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// Dynamic Budget Allocation Limits
const BUDGET_LIMITS = {
  "Events & Logistics": 15000,
  "Operational Supplies": 5000,
};

export default function OrgTreasurerPage({ user: propsUser, org: propsOrg }) {
  const { showToast } = useToast();

  // 1. Resolve User from props OR fallback to localStorage
  const currentUser =
    propsUser || JSON.parse(localStorage.getItem("user") || "null");

  // 2. Resolve Org from props, nested user.organization, OR localStorage
  const currentOrg =
    propsOrg ||
    currentUser?.organization ||
    JSON.parse(localStorage.getItem("org") || "null");

  const orgId = currentOrg?._id || currentOrg?.id || currentOrg;

  // Display Identity
  const userName = currentUser?.name || "User";
  const upperName = userName.toUpperCase();
  const userEmail = currentUser?.email || "No email provided";
  const orgName = currentOrg?.name || "Student Organization";

  // Compute Dynamic Academic Year
  const currentYear = new Date().getFullYear();
  const dynamicAcademicYear = `AY ${currentYear}–${currentYear + 1}`;

  // Navigation State
  const [activeTab, setActiveTab] = useState("overview");

  // Modals & Form State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState(false);
  const [statementModalKey, setStatementModalKey] = useState(0);
  const [paymentAuditKey, setPaymentAuditKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Data States
  const [transactions, setTransactions] = useState([]);
  const [feeDrives, setFeeDrives] = useState([]);
  const [feeView, setFeeView] = useState("active");
  const [organizationRoster, setOrganizationRoster] = useState([]);
  const [filterType, setFilterType] = useState("income");
  const [searchQuery, setSearchQuery] = useState("");

  const [transactionForm, setTransactionForm] = useState({
    title: "",
    type: "expense",
    category: "Events & Logistics",
    amount: "",
    feeId: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
  });

  // Fetch all treasury data on mount or organization switch.
  useEffect(() => {
    let isActive = true;

    const fetchTreasuryData = async () => {
      const [transactionsResult, feesResult, rosterResult] =
        await Promise.allSettled([
          API.get(orgId ? `/transactions?org=${orgId}` : "/transactions"),
          API.get("/fees"),
          API.get("/orgmembers"),
        ]);

      if (!isActive) return;

      if (transactionsResult.status === "fulfilled") {
        const data = transactionsResult.value.data || [];
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        console.error(
          "Failed to fetch treasury transactions:",
          transactionsResult.reason,
        );
        setTransactions([]);
      }

      if (feesResult.status === "fulfilled") {
        const data = feesResult.value.data || [];
        setFeeDrives(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch dues collections:", feesResult.reason);
        setFeeDrives([]);
      }

      if (rosterResult.status === "fulfilled") {
        const data = rosterResult.value || [];
        setOrganizationRoster(Array.isArray(data) ? data : []);
      } else {
        console.error(
          "Failed to fetch organization roster:",
          rosterResult.reason,
        );
        setOrganizationRoster([]);
      }
    };

    fetchTreasuryData();
    return () => {
      isActive = false;
    };
  }, [orgId]);

  const handleFeeCreated = (newFeeData) => {
    setFeeDrives((previous) => [newFeeData, ...previous]);
    setIsFeeModalOpen(false);
    setEditingFee(null);
    setActiveTab("fees");
  };

  const openCreateFeeModal = () => {
    setEditingFee(null);
    setIsFeeModalOpen(true);
  };

  const openEditFeeModal = (fee) => {
    if (fee.status !== "active") return;
    setEditingFee(fee);
    setIsFeeModalOpen(true);
  };

  const handleArchiveFee = async (fee) => {
    if (fee.status !== "active") return;
    try {
      const response = await API.patch(`/fees/${fee._id}/archive`);
      const archivedFee = response.data?.data || response.data;
      setFeeDrives((previous) =>
        previous.map((current) =>
          current._id === fee._id ? archivedFee : current,
        ),
      );
      setFeeView("archived");
      showToast("Dues Collection moved to Archive.", "success");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to archive Dues Collection.";
      showToast(message, "error");
    }
  };

  const activeFeeDrives = feeDrives.filter((fee) => fee.status === "active");
  const archivedFeeDrives = feeDrives.filter(
    (fee) => fee.status === "archived" || fee.status === "closed",
  );
  const visibleFeeDrives =
    feeView === "archived" ? archivedFeeDrives : activeFeeDrives;
  const selectedIncomeFee = activeFeeDrives.find(
    (fee) => fee._id === transactionForm.feeId,
  );
  const selectedFeePostedIncome = transactions
    .filter(
      (entry) =>
        entry.type === "income" &&
        String(entry.fee?._id || entry.fee || "") === transactionForm.feeId,
    )
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const selectedFeeAvailableIncome = Math.max(
    0,
    Number(selectedIncomeFee?.collectedAmount || 0) - selectedFeePostedIncome,
  );
  const incomeBaseCost = Number(selectedIncomeFee?.baseCost || 0);
  const incomeUnitPrice = Number(selectedIncomeFee?.amount || 0);
  const incomeAmount = Number(transactionForm.amount || 0);
  const incomeEstimatedCost =
    incomeUnitPrice > 0 ? (incomeAmount / incomeUnitPrice) * incomeBaseCost : 0;
  const incomeNetAmount = incomeAmount - incomeEstimatedCost;

  const refreshFeeDrives = async () => {
    try {
      const response = await API.get("/fees");
      const data = response.data || [];
      setFeeDrives(Array.isArray(data) ? data : []);
      setSelectedFee((current) =>
        current ? data.find((fee) => fee._id === current._id) || current : null,
      );
    } catch (error) {
      console.error("Failed to refresh collection progress:", error);
    }
  };

  // Dynamic Calculations
  const approvedIncomeTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "income" &&
      (transaction.status === "Approved" || !transaction.status),
  );
  const totalIncome = approvedIncomeTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );
  const totalNetIncome = approvedIncomeTransactions.reduce(
    (sum, transaction) =>
      sum + Number(transaction.netIncome ?? transaction.amount ?? 0),
    0,
  );

  const totalExpense = transactions
    .filter(
      (t) => t.type === "expense" && (t.status === "Approved" || !t.status),
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentBalance = totalIncome - totalExpense;
  const pendingCount = transactions.filter(
    (t) => t.status === "Pending",
  ).length;

  // Category Expense Calculations
  const getCategorySpent = (categoryName) => {
    return transactions
      .filter((t) => t.category === categoryName && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  };

  const eventsSpent = getCategorySpent("Events & Logistics");
  const eventsPercent = Math.min(
    100,
    Math.round((eventsSpent / BUDGET_LIMITS["Events & Logistics"]) * 100),
  );

  const opsSpent = getCategorySpent("Operational Supplies");
  const opsPercent = Math.min(
    100,
    Math.round((opsSpent / BUDGET_LIMITS["Operational Supplies"]) * 100),
  );

  // Filtered Ledger List
  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = t.type === filterType;

    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Handle Record Creation
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (
      !transactionForm.title ||
      !transactionForm.amount ||
      (transactionForm.type === "income" && !transactionForm.feeId)
    )
      return;

    setIsSubmitting(true);
    const payload = {
      ...transactionForm,
      amount: parseFloat(transactionForm.amount) || 0,
      org: orgId,
      organization: orgId,
      status: transactionForm.type === "expense" ? "Pending" : "Approved",
    };

    try {
      const res = await API.post("/transactions", payload);
      const newEntry = res.data || { ...payload, _id: Date.now().toString() };
      setTransactions((prev) => [newEntry, ...prev]);
      showToast("Transaction recorded successfully.", "success");
      setIsTransactionModalOpen(false);
      setTransactionForm({
        title: "",
        type: "expense",
        category: "Events & Logistics",
        amount: "",
        feeId: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
      });
    } catch (err) {
      console.error("Failed to create transaction entry:", err);
      showToast(err.message || "Unable to record the transaction.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 h-screen sticky top-0 self-start bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl overflow-y-auto">
        <div className="space-y-8">
          {/* Logo & Header */}
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
                Treasurer Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
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
                className={`w-4 h-4 ${activeTab === "overview" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Overview & Summary</span>
            </button>

            <button
              onClick={() => setActiveTab("treasury")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "treasury"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <WalletIcon
                className={`w-4 h-4 ${activeTab === "treasury" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Financial Ledger ({transactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("fees")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "fees"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <WalletIcon
                className={`w-4 h-4 ${activeTab === "fees" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Dues Collection ({feeDrives.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "payments"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <ShieldCheckIcon
                className={`w-4 h-4 ${activeTab === "payments" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Payment Verification</span>
            </button>

            <button
              onClick={() => setActiveTab("budgets")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${
                activeTab === "budgets"
                  ? "bg-[#601520] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-md"
                  : "text-rose-100/80 hover:bg-[#58111A] hover:text-white"
              }`}
            >
              <PieChartIcon
                className={`w-4 h-4 ${activeTab === "budgets" ? "text-[#D4AF37]" : "text-rose-200/60"}`}
              />
              <span>Budget Allocations</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout */}

        <div className="pt-6 border-t border-[#601520] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-100 truncate">
                {userName}
              </p>
              {/* User Email */}
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
        {/* Top Header Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4A0E17] text-[#D4AF37] shadow-sm">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A610D]">
                  Treasurer Workspace
                </p>
                <h1 className="truncate text-base sm:text-lg font-extrabold text-[#4A0E17]">
                  Welcome back, {upperName}
                </h1>
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {orgName} <span className="mx-1 text-slate-300">•</span>{" "}
                  Manage your organization finances
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
              id: "treasury",
              label: "Ledger",
              shortLabel: "Ledger",
              icon: <WalletIcon />,
            },
            { id: "fees", label: "Dues", icon: <WalletIcon /> },
            {
              id: "payments",
              label: "Payments",
              shortLabel: "Verify",
              icon: <ShieldCheckIcon className="w-4 h-4" />,
            },
            { id: "budgets", label: "Budgets", icon: <PieChartIcon /> },
          ]}
        />

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8 max-w-6xl w-full mx-auto space-y-8">
          {/* DYNAMIC METRIC CARDS OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Cash Balance
                </p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                    ₱
                    {currentBalance.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    Treasury
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Net Income
                </p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                    ₱
                    {totalNetIncome.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    Net
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Disbursements
                </p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                    ₱
                    {totalExpense.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>
                  <span className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold">
                    Expenses
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Pending Approvals
                </p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                    {pendingCount}
                  </h2>
                  <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#4A0E17]">
                  Treasury Activity Summary
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                    <span className="p-2 bg-[#D4AF37]/15 text-[#7A610D] rounded-lg text-sm border border-[#D4AF37]/30">
                      💳
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">
                        Financial Entries Recorded
                      </p>
                      <p className="text-slate-500">
                        Currently tracking {transactions.length} total
                        transaction entries in the organizational ledger.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                    <span className="p-2 bg-emerald-100/80 text-emerald-800 rounded-lg text-sm border border-emerald-200">
                      📊
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">
                        Budget Utilization Status
                      </p>
                      <p className="text-slate-500">
                        Events & Logistics is currently running at{" "}
                        {eventsPercent}% allocated capacity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#4A0E17]">
                  Treasurer Primary Tasks
                </h3>
                <ul className="text-xs space-y-2.5 text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                    Reconcile cash collections with Secretary
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4A0E17]"></span>
                    Verify Official Receipts (OR) for disbursements
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Prepare semester liquidation reports
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: FINANCIAL LEDGER */}
          {activeTab === "treasury" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Financial Transaction Ledger
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detailed record of all approved income and expense
                    disbursements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTransactionModalOpen(true)}
                    className="px-4 py-2 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusIcon className="w-4 h-4 text-white" />
                    <span>Record Financial Entry</span>
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ledger entries, reference numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] font-medium"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg text-xs font-semibold shrink-0">
                  {["income", "expense"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-md transition-all capitalize cursor-pointer ${
                        filterType === type
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* TRANSACTIONS LIST */}
              {filteredTransactions.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Financial Entries Found
                  </p>
                  <p className="text-xs text-slate-400">
                    Click "Record Financial Entry" above to log a new revenue or
                    expense record.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {filteredTransactions.map((tx, idx) => {
                    const studentPrice = Number(
                      tx.unitPriceSnapshot ?? tx.fee?.amount ?? 0,
                    );
                    const baseCost = Number(
                      tx.baseCostSnapshot ?? tx.fee?.baseCost ?? 0,
                    );
                    const marginPerStudent = Math.max(
                      0,
                      studentPrice - baseCost,
                    );
                    const marginPercentage =
                      studentPrice > 0
                        ? (marginPerStudent / studentPrice) * 100
                        : 0;
                    const netIncome = Number(tx.netIncome ?? tx.amount ?? 0);

                    return (
                      <div
                        key={tx._id || tx.id || idx}
                        className={`rounded-2xl border p-4 transition-colors ${
                          tx.type === "income"
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-slate-200 bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                tx.type === "income"
                                  ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                                  : "border border-rose-200 bg-rose-50 text-rose-700"
                              }`}
                            >
                              {tx.type === "income" ? "+" : "−"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-800">
                                {tx.title}
                              </p>
                              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                <span className="font-bold text-[#4A0E17]">
                                  {tx.category}
                                </span>{" "}
                                {formatDate(tx.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                            <span
                              className={`text-sm font-black ${
                                tx.type === "income"
                                  ? "text-emerald-700"
                                  : "text-slate-800"
                              }`}
                            >
                              {tx.type === "income" ? "+" : "−"}₱
                              {Number(tx.amount || 0).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span
                              className={`rounded-md border px-2.5 py-1 text-[9px] font-black ${
                                tx.status === "Approved" || !tx.status
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : tx.status === "Pending"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-rose-200 bg-rose-50 text-rose-800"
                              }`}
                            >
                              {tx.status || "Approved"}
                            </span>
                          </div>
                        </div>

                        {tx.type === "income" && (
                          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-emerald-100 pt-3 sm:grid-cols-5">
                            {[
                              ["Student Price", `₱${studentPrice.toFixed(2)}`],
                              ["Base Cost", `₱${baseCost.toFixed(2)}`],
                              [
                                "Margin / Student",
                                `₱${marginPerStudent.toFixed(2)}`,
                              ],
                              ["Margin", `${marginPercentage.toFixed(2)}%`],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl border border-emerald-100 bg-white px-3 py-2.5"
                              >
                                <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                                  {label}
                                </p>
                                <p className="mt-1 font-black text-slate-800">
                                  {value}
                                </p>
                              </div>
                            ))}
                            <div className="col-span-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-white sm:col-span-1">
                              <p className="text-[8px] font-black uppercase tracking-wide text-emerald-100">
                                Net Income
                              </p>
                              <p className="mt-1 text-sm font-black">
                                ₱{netIncome.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 3: DUES COLLECTION */}
          {activeTab === "fees" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Organization Dues Collection
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create and manage official fee requirements for members and
                    students.
                  </p>
                </div>
                <button
                  onClick={openCreateFeeModal}
                  className="px-4 py-2 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <PlusIcon className="w-4 h-4 text-white" />
                  <span>Add Dues Collection</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:flex-row sm:items-center sm:justify-between">
                <div
                  className="inline-flex rounded-lg bg-slate-200/70 p-1"
                  role="tablist"
                  aria-label="Dues collection status"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={feeView === "active"}
                    onClick={() => setFeeView("active")}
                    className={`rounded-md px-4 py-2 text-xs font-black transition-all ${feeView === "active" ? "bg-white text-[#4A0E17] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Active{" "}
                    <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                      {activeFeeDrives.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={feeView === "archived"}
                    onClick={() => setFeeView("archived")}
                    className={`rounded-md px-4 py-2 text-xs font-black transition-all ${feeView === "archived" ? "bg-white text-[#4A0E17] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Archive{" "}
                    <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                      {archivedFeeDrives.length}
                    </span>
                  </button>
                </div>
                <p className="px-2 text-[11px] font-medium text-slate-500">
                  {feeView === "active"
                    ? "Current collections accepting payments"
                    : "Completed and past collections kept for records"}
                </p>
              </div>

              {visibleFeeDrives.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    {feeView === "archived"
                      ? "Archive is empty"
                      : "No active dues collections"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {feeView === "archived"
                      ? "Collections you archive will be stored here for future reference."
                      : "Click “Add Dues Collection” to create a collection for membership or activities."}
                  </p>
                  {feeView === "active" && (
                    <button
                      type="button"
                      onClick={openCreateFeeModal}
                      className="pt-2 text-xs font-black text-[#7A610D]"
                    >
                      Create a collection
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleFeeDrives.map((fee, idx) => (
                    <div
                      key={fee._id || fee.id || idx}
                      className={`bg-slate-50/60 p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                        fee.status === "archived"
                          ? "border-slate-200 bg-slate-100/70"
                          : "border-slate-200/80 hover:border-[#D4AF37]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#4A0E17] text-sm">
                            {fee.title}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg shrink-0">
                              ₱{Number(fee.amount || 0).toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                fee.status === "archived"
                                  ? "bg-slate-200 text-slate-600 border-slate-300"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {fee.status === "archived"
                                ? "Archived"
                                : "Active"}
                            </span>
                          </div>
                        </div>
                        {fee.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {fee.description}
                          </p>
                        )}
                      </div>
                      <div className="pt-3 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-500">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-white p-2 border border-slate-200">
                            <p className="text-[9px] font-bold uppercase text-slate-400">
                              Target
                            </p>
                            <p className="font-black text-slate-800">
                              ₱
                              {Number(
                                fee.expectedCollection || 0,
                              ).toLocaleString("en-PH")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200">
                            <p className="text-[9px] font-bold uppercase text-emerald-600">
                              Received
                            </p>
                            <p className="font-black text-emerald-800">
                              ₱
                              {Number(fee.collectedAmount || 0).toLocaleString(
                                "en-PH",
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-2 border border-amber-200">
                            <p className="text-[9px] font-bold uppercase text-amber-600">
                              Balance
                            </p>
                            <p className="font-black text-amber-900">
                              ₱
                              {Number(fee.remainingAmount || 0).toLocaleString(
                                "en-PH",
                              )}
                            </p>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between font-bold">
                            <span>
                              {fee.paidMemberCount || 0} of{" "}
                              {fee.targetMemberCount || 0} paid
                            </span>
                            <span>{fee.collectionPercentage || 0}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all"
                              style={{
                                width: `${fee.collectionPercentage || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Applies To:</span>
                          <span className="font-bold text-slate-700">
                            {fee.targetYearLevel === "All"
                              ? "All Students"
                              : fee.targetYearLevel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Academic Term:</span>
                          <span className="font-bold text-slate-700">
                            {fee.academicYear}{" "}
                            {fee.semester ? `(${fee.semester})` : ""}
                          </span>
                        </div>
                        {fee.dueDate && (
                          <div className="flex items-center justify-between text-amber-700 font-bold">
                            <span>Due Date:</span>
                            <span>{formatDate(fee.dueDate)}</span>
                          </div>
                        )}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedFee(fee)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#4A0E17] text-white hover:bg-[#601520] font-bold"
                          >
                            View students
                          </button>
                          <div className="flex items-center gap-2">
                            {fee.status === "active" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditFeeModal(fee)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleArchiveFee(fee)}
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 font-bold"
                                >
                                  Archive
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 4: PAYMENT VERIFICATION */}
          {activeTab === "payments" && (
            <div className="space-y-4 bg-white p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#4A0E17]">
                    Payment verification
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Verify GCash statements or record cash received in person.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsCashPaymentModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#4A0E17] bg-white px-4 py-2.5 text-xs font-bold text-[#4A0E17] hover:bg-rose-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Record cash payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatementModalKey((current) => current + 1);
                      setIsStatementModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A0E17] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#601520]"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    Verify statement
                  </button>
                </div>
              </div>
              <TreasurerPaymentAudit key={paymentAuditKey} />
            </div>
          )}

          {/* TAB CONTENT 5: BUDGET ALLOCATIONS */}
          {activeTab === "budgets" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-[#4A0E17]">
                    Dynamic Budget Tracker
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live monitoring of disbursements calculated against preset
                    category limits.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800">Events & Logistics</span>
                      <span className="text-[#4A0E17]">
                        ₱{eventsSpent.toLocaleString("en-PH")} / ₱
                        {BUDGET_LIMITS["Events & Logistics"].toLocaleString(
                          "en-PH",
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4A0E17] rounded-full transition-all duration-500"
                        style={{ width: `${eventsPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">
                      {eventsPercent}% utilized
                    </p>
                  </div>

                  <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800">
                        Operational Supplies
                      </span>
                      <span className="text-[#7A610D]">
                        ₱{opsSpent.toLocaleString("en-PH")} / ₱
                        {BUDGET_LIMITS["Operational Supplies"].toLocaleString(
                          "en-PH",
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                        style={{ width: `${opsPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">
                      {opsPercent}% utilized
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-[#4A0E17] font-bold text-sm">
                  <FileTextIcon />
                  <span>Liquidation Guidelines</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  All expense claims require official receipts (OR) and must be
                  vetted by the Treasurer before submiting to the Org Adviser &
                  OVPSAS.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {isCashPaymentModalOpen && (
        <CashPaymentModal
          fees={feeDrives}
          roster={organizationRoster}
          onClose={() => setIsCashPaymentModalOpen(false)}
          onRecorded={() => {
            setIsCashPaymentModalOpen(false);
            setPaymentAuditKey((current) => current + 1);
            refreshFeeDrives();
            showToast("Cash payment recorded and verified.", "success");
          }}
        />
      )}

      {/* DYNAMIC FEE MODAL */}
      <StatementUploadModal
        key={statementModalKey}
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        onComplete={() => {
          setPaymentAuditKey((current) => current + 1);
        }}
      />

      <FeeModal
        isOpen={isFeeModalOpen}
        onClose={() => {
          setIsFeeModalOpen(false);
          setEditingFee(null);
        }}
        onSubmitSuccess={(savedFee) => {
          if (editingFee) {
            setFeeDrives((previous) =>
              previous.map((fee) =>
                fee._id === savedFee._id ? savedFee : fee,
              ),
            );
            setIsFeeModalOpen(false);
            setEditingFee(null);
            setActiveTab("fees");
          } else {
            handleFeeCreated(savedFee);
          }
        }}
        fee={editingFee}
        org={currentOrg}
        user={currentUser}
        roster={organizationRoster}
      />

      {selectedFee && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-3xl p-0 overflow-hidden">
            <div className="bg-[#4A0E17] p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                    Collection member ledger
                  </p>
                  <h3 className="mt-1 text-xl font-black">
                    {selectedFee.title}
                  </h3>
                  <p className="mt-1 text-xs text-rose-100/70">
                    {selectedFee.targetYearLevel === "All"
                      ? "All Students"
                      : selectedFee.targetYearLevel}{" "}
                    • ₱{Number(selectedFee.amount || 0).toFixed(2)} per student
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFee(null)}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20"
                >
                  ✕
                </button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-[9px] font-bold uppercase text-rose-100/60">
                    Expected
                  </p>
                  <p className="mt-1 font-black">
                    ₱
                    {Number(selectedFee.expectedCollection || 0).toLocaleString(
                      "en-PH",
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-500/20 p-3">
                  <p className="text-[9px] font-bold uppercase text-emerald-100/70">
                    Collected
                  </p>
                  <p className="mt-1 font-black">
                    ₱
                    {Number(selectedFee.collectedAmount || 0).toLocaleString(
                      "en-PH",
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-400/20 p-3">
                  <p className="text-[9px] font-bold uppercase text-amber-100/70">
                    Remaining
                  </p>
                  <p className="mt-1 font-black">
                    ₱
                    {Number(selectedFee.remainingAmount || 0).toLocaleString(
                      "en-PH",
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-6">
              <div className="space-y-2">
                {(selectedFee.targetMembers || []).map((member) => (
                  <div
                    key={member.student}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-800">
                        {member.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {member.studentIdNumber || "No student ID"} •{" "}
                        {member.program} {member.section} • {member.yearLevel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${member.paymentStatus === "VERIFIED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : member.paymentStatus === "PENDING_MANUAL_REVIEW" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                    >
                      {member.paymentStatus === "VERIFIED"
                        ? `Paid • ${member.paymentMethod}`
                        : member.paymentStatus === "PENDING_MANUAL_REVIEW"
                          ? "Pending verification"
                          : "Unpaid"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC RECORD TRANSACTION MODAL */}
      {isTransactionModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-h-[92vh] max-w-2xl overflow-hidden p-0">
            <div className="bg-[#4A0E17] px-5 py-5 text-white sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#D4AF37] ring-1 ring-white/15">
                    <WalletIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                      Treasury Ledger
                    </p>
                    <h3 className="mt-0.5 text-lg font-black">
                      Record Financial Entry
                    </h3>
                    <p className="mt-0.5 text-[11px] text-rose-100/70">
                      Record official collection income or organization
                      expenses.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-black text-white transition hover:bg-white/20"
                  aria-label="Close financial entry modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              onSubmit={handleTransactionSubmit}
              className="max-h-[calc(92vh-108px)] overflow-y-auto text-xs"
            >
              <div className="space-y-5 p-5 sm:p-7">
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="font-black uppercase tracking-wider text-slate-500">
                      Entry Type
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Choose how this affects the ledger
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTransactionForm({
                          ...transactionForm,
                          type: "income",
                          title: "",
                          category: "Membership Dues",
                          amount: "",
                          feeId: "",
                        })
                      }
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        transactionForm.type === "income"
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-black ${
                          transactionForm.type === "income"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        +
                      </span>
                      <span>
                        <span className="block font-black text-slate-800">
                          Income Entry
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          Post verified dues revenue
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTransactionForm({
                          ...transactionForm,
                          type: "expense",
                          title: "",
                          category: "Events & Logistics",
                          amount: "",
                          feeId: "",
                        })
                      }
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        transactionForm.type === "expense"
                          ? "border-[#4A0E17] bg-rose-50 ring-2 ring-[#4A0E17]/10"
                          : "border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-black ${
                          transactionForm.type === "expense"
                            ? "bg-[#4A0E17] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        −
                      </span>
                      <span>
                        <span className="block font-black text-slate-800">
                          Expense Entry
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          Record an official disbursement
                        </span>
                      </span>
                    </button>
                  </div>
                </section>

                {transactionForm.type === "income" && (
                  <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                    <div className="mb-3">
                      <p className="font-black text-emerald-950">
                        Link an Active Collection
                      </p>
                      <p className="mt-0.5 text-[10px] text-emerald-800/70">
                        Only verified, unposted collections can be recognized as
                        income.
                      </p>
                    </div>
                    <label className="mb-1.5 block font-bold text-slate-700">
                      Dues Collection <span className="text-rose-600">*</span>
                    </label>
                    <select
                      required
                      value={transactionForm.feeId}
                      onChange={(event) => {
                        const fee = activeFeeDrives.find(
                          (item) => item._id === event.target.value,
                        );
                        const posted = transactions
                          .filter(
                            (entry) =>
                              entry.type === "income" &&
                              String(entry.fee?._id || entry.fee || "") ===
                                event.target.value,
                          )
                          .reduce(
                            (total, entry) => total + Number(entry.amount || 0),
                            0,
                          );
                        setTransactionForm({
                          ...transactionForm,
                          feeId: event.target.value,
                          title: fee ? `${fee.title} collection income` : "",
                          category: "Membership Dues",
                          amount: fee
                            ? Math.max(
                                0,
                                Number(fee.collectedAmount || 0) - posted,
                              ).toFixed(2)
                            : "",
                        });
                      }}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-3 font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    >
                      <option value="">Select active collection</option>
                      {activeFeeDrives.map((fee) => (
                        <option key={fee._id} value={fee._id}>
                          {fee.title} · ₱{Number(fee.amount || 0).toFixed(2)}{" "}
                          per student
                        </option>
                      ))}
                    </select>

                    {selectedIncomeFee && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            ["Student Price", selectedIncomeFee.amount],
                            ["Base Cost", selectedIncomeFee.baseCost],
                            [
                              "Margin / Student",
                              selectedIncomeFee.marginPerMember,
                            ],
                            [
                              "Margin",
                              `${
                                Number(selectedIncomeFee.amount || 0) > 0
                                  ? (
                                      (Number(
                                        selectedIncomeFee.marginPerMember || 0,
                                      ) /
                                        Number(selectedIncomeFee.amount)) *
                                      100
                                    ).toFixed(2)
                                  : "0.00"
                              }%`,
                            ],
                          ].map(([label, value], index) => (
                            <div
                              key={label}
                              className="rounded-xl border border-emerald-100 bg-white p-2.5"
                            >
                              <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                                {label}
                              </p>
                              <p className="mt-1 font-black text-slate-800">
                                {index === 3
                                  ? value
                                  : `₱${Number(value || 0).toFixed(2)}`}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
                          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            <div className="p-3">
                              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                Verified Collection
                              </p>
                              <p className="mt-1 text-base font-black text-slate-900">
                                ₱
                                {Number(
                                  selectedIncomeFee.collectedAmount || 0,
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div className="p-3">
                              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                Already Posted
                              </p>
                              <p className="mt-1 text-base font-black text-slate-700">
                                ₱{selectedFeePostedIncome.toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-emerald-600 p-3 text-white">
                              <p className="text-[9px] font-black uppercase tracking-wide text-emerald-100">
                                Available to Post
                              </p>
                              <p className="mt-1 text-base font-black">
                                ₱{selectedFeeAvailableIncome.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50">
                            {" "}
                            <div className="border-l border-slate-200 p-3">
                              <p className="text-[9px] font-black uppercase tracking-wide text-emerald-600">
                                Net Income
                              </p>
                              <p className="mt-1 font-black text-emerald-700">
                                ₱{incomeNetAmount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {transactionForm.type === "expense" && (
                  <section>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block font-bold text-slate-700">
                          Title / Particulars{" "}
                          <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={transactionForm.type === "income"}
                          placeholder="e.g. General Assembly Refreshments"
                          value={transactionForm.title}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              title: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10 read-only:bg-slate-50 read-only:text-slate-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block font-bold text-slate-700">
                            Category
                          </label>
                          <select
                            value={transactionForm.category}
                            disabled={transactionForm.type === "income"}
                            onChange={(e) =>
                              setTransactionForm({
                                ...transactionForm,
                                category: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium outline-none transition focus:border-[#4A0E17] disabled:bg-slate-50 disabled:text-slate-500"
                          >
                            <option value="Events & Logistics">
                              Events & Logistics
                            </option>
                            <option value="Operational Supplies">
                              Operational Supplies
                            </option>
                            <option value="Membership Dues">
                              Membership Dues
                            </option>
                            <option value="Sponsorship">Sponsorship</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block font-bold text-slate-700">
                            Amount to Post (₱){" "}
                            <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            max={
                              transactionForm.type === "income"
                                ? selectedFeeAvailableIncome
                                : undefined
                            }
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={transactionForm.amount}
                            onChange={(e) =>
                              setTransactionForm({
                                ...transactionForm,
                                amount: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-bold outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                          />
                          {transactionForm.type === "income" &&
                            selectedIncomeFee && (
                              <p className="mt-1 text-[9px] font-medium text-slate-400">
                                Maximum available: ₱
                                {selectedFeeAvailableIncome.toFixed(2)}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block font-bold text-slate-700">
                            Reference / OR No.
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. OR-9901"
                            value={transactionForm.reference}
                            onChange={(e) =>
                              setTransactionForm({
                                ...transactionForm,
                                reference: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block font-bold text-slate-700">
                            Transaction Date{" "}
                            <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={transactionForm.date}
                            onChange={(e) =>
                              setTransactionForm({
                                ...transactionForm,
                                date: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/10"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-center text-[9px] text-slate-400 sm:text-left">
                  Entries are saved to the official organization ledger.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTransactionModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-600 transition hover:bg-slate-50 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (transactionForm.type === "income" &&
                        (!selectedIncomeFee || selectedFeeAvailableIncome <= 0))
                    }
                    className="flex-1 rounded-xl bg-[#4A0E17] px-5 py-2.5 font-black text-white shadow-sm transition hover:bg-[#601520] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {isSubmitting ? "Saving Entry..." : "Save Financial Entry"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
