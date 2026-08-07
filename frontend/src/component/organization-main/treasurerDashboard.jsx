import { useState, useEffect } from "react";
import API from "../../api/axios";
import LogoutButton from "../logoutButton";
import FeeModal from "./feesModal";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Data States
  const [transactions, setTransactions] = useState([]);
  const [feeDrives, setFeeDrives] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [transactionForm, setTransactionForm] = useState({
    title: "",
    type: "expense",
    category: "Events & Logistics",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
  });

  // Fetch all treasury data on mount or organization switch.
  useEffect(() => {
    let isActive = true;

    const fetchTreasuryData = async () => {
      const [transactionsResult, feesResult] = await Promise.allSettled([
        API.get(orgId ? `/transactions?org=${orgId}` : "/transactions"),
        API.get("/fees"),
      ]);

      if (!isActive) return;

      if (transactionsResult.status === "fulfilled") {
        const data =
          transactionsResult.value.data?.data ||
          transactionsResult.value.data ||
          [];
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        console.error(
          "Failed to fetch treasury transactions:",
          transactionsResult.reason,
        );
        setTransactions([]);
      }

      if (feesResult.status === "fulfilled") {
        const data = feesResult.value.data?.data || feesResult.value.data || [];
        setFeeDrives(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch dues collections:", feesResult.reason);
        setFeeDrives([]);
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
    setActiveTab("fees");
  };

  // Dynamic Calculations
  const totalIncome = transactions
    .filter(
      (t) => t.type === "income" && (t.status === "Approved" || !t.status),
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

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
    const matchesFilter =
      filterType === "all" ||
      (filterType === "income" && t.type === "income") ||
      (filterType === "expense" && t.type === "expense") ||
      (filterType === "pending" && t.status === "Pending");

    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Handle Record Creation
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!transactionForm.title || !transactionForm.amount) return;

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
      const newEntry = res.data?.data ||
        res.data || { ...payload, _id: Date.now().toString() };
      setTransactions((prev) => [newEntry, ...prev]);
    } catch (err) {
      console.error("Failed to create transaction entry:", err);
      // Fallback for instant UI response
      setTransactions((prev) => [
        { ...payload, _id: Date.now().toString() },
        ...prev,
      ]);
    } finally {
      setIsSubmitting(false);
      setIsTransactionModalOpen(false);
      setTransactionForm({
        title: "",
        type: "expense",
        category: "Events & Logistics",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 font-sans flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#4A0E17] border-r border-[#36080E] flex flex-col justify-between hidden md:flex shrink-0 p-6 text-white shadow-2xl">
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
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[#4A0E17]" />
            <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider hidden sm:inline-block">
              Marinduque State University — OVPSAS Treasurer Workspace
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs ml-auto">
            {/* Dynamic Academic Year Badge */}
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#7A610D] font-bold tracking-tight shadow-2xs">
              {dynamicAcademicYear}
            </span>
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* PAGE BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20 text-xs font-extrabold rounded-full uppercase tracking-wider">
                  Treasurer Workspace
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {orgName}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#4A0E17] tracking-tight">
                Welcome back, {upperName}
              </h1>
              <p className="text-xs text-slate-500">
                Monitor treasury cash balances, track budget utilization, log
                disbursements, and manage receipts.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => setIsFeeModalOpen(true)}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
              >
                <PlusIcon className="w-4 h-4 text-[#36080E]" />
                <span>Create Dues Collection</span>
              </button>
              <button
                onClick={() => {
                  setTransactionForm((prev) => ({ ...prev, type: "expense" }));
                  setIsTransactionModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-white border border-[#4A0E17]/20 text-[#4A0E17] hover:bg-[#4A0E17] hover:text-white transition-all text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Record Expense</span>
              </button>

              <button
                onClick={() => {
                  setTransactionForm((prev) => ({ ...prev, type: "income" }));
                  setIsTransactionModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
              >
                <PlusIcon className="w-4 h-4 text-[#36080E]" />
                <span>Record Entry</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC METRIC CARDS OVERVIEW */}
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
                Total Revenues
              </p>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-extrabold text-[#4A0E17]">
                  ₱
                  {totalIncome.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <span className="text-[11px] text-[#7A610D] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2 py-0.5 rounded-md font-bold">
                  Approved
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
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
                  >
                    <PlusIcon className="w-4 h-4 text-[#36080E]" />
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
                  {["all", "income", "expense", "pending"].map((type) => (
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
                <div className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((tx, idx) => (
                    <div
                      key={tx._id || tx.id || idx}
                      className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            tx.type === "income"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">{tx.title}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="text-[#4A0E17] font-bold">
                              {tx.category}
                            </span>
                            {" • "}
                            <span>Ref: {tx.reference || "N/A"}</span>
                            {" • "}
                            <span>{formatDate(tx.date)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <span
                          className={`font-extrabold text-sm ${
                            tx.type === "income"
                              ? "text-emerald-700"
                              : "text-slate-800"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}₱
                          {Number(tx.amount || 0).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            tx.status === "Approved" || !tx.status
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : tx.status === "Pending"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {tx.status || "Approved"}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  onClick={() => setIsFeeModalOpen(true)}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-[#B8860B]/30"
                >
                  <PlusIcon className="w-4 h-4 text-[#36080E]" />
                  <span>Add Dues Collection</span>
                </button>
              </div>

              {feeDrives.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    No Dues Collection Created Yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Click “Add Dues Collection” to create a collection for
                    membership or activities.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {feeDrives.map((fee, idx) => (
                    <div
                      key={fee._id || fee.id || idx}
                      className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 hover:border-[#D4AF37] transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#4A0E17] text-sm">
                            {fee.title}
                          </h4>
                          <span className="text-xs font-black text-[#7A610D] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg shrink-0">
                            ₱{Number(fee.amount || 0).toFixed(2)}
                          </span>
                        </div>
                        {fee.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {fee.description}
                          </p>
                        )}
                      </div>
                      <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Applies To:</span>
                          <span className="font-bold text-slate-700">
                            {fee.targetYearLevel || "All"}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 4: BUDGET ALLOCATIONS */}
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

      {/* DYNAMIC FEE MODAL */}
      <FeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        onSubmitSuccess={handleFeeCreated}
        org={currentOrg}
        user={currentUser}
      />

      {/* DYNAMIC RECORD TRANSACTION MODAL */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#4A0E17]">
                  Record Financial Entry
                </h3>
                <p className="text-[11px] text-slate-500">
                  Log an official revenue or disbursement into the treasury
                  ledger.
                </p>
              </div>
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleTransactionSubmit}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Entry Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setTransactionForm({ ...transactionForm, type: "income" })
                    }
                    className={`py-2 rounded-lg font-bold cursor-pointer transition-all ${
                      transactionForm.type === "income"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    + Income Entry
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTransactionForm({
                        ...transactionForm,
                        type: "expense",
                      })
                    }
                    className={`py-2 rounded-lg font-bold cursor-pointer transition-all ${
                      transactionForm.type === "expense"
                        ? "bg-[#4A0E17] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    - Expense Entry
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Title / Particulars <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Assembly Refreshments / T-Shirt Sales"
                  value={transactionForm.title}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={transactionForm.category}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17] bg-white font-medium"
                  >
                    <option value="Events & Logistics">
                      Events & Logistics
                    </option>
                    <option value="Operational Supplies">
                      Operational Supplies
                    </option>
                    <option value="Membership Dues">Membership Dues</option>
                    <option value="Sponsorship">Sponsorship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount (₱) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date <span className="text-rose-600">*</span>
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#36080E] font-bold rounded-lg transition-all cursor-pointer border border-[#B8860B]/30 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
