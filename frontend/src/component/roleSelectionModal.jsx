const UserIcon = ({ className = "w-5 h-5" }) => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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

export default function RoleSelectionModal({
  isOpen = true,
  onClose,
  onOfficerSelect,
  onStudentSelect,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-lg p-5 sm:p-8 space-y-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        )}

        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#4A0E17]">
            Welcome to SOMIS Portal
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please specify your primary role to customize your workspace
            dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onStudentSelect}
            className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#4A0E17] hover:bg-rose-50/30 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-[#4A0E17]/10 transition-colors shrink-0">
              <UserIcon className="w-6 h-6 text-[#4A0E17]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#4A0E17]">
                Regular Student Member
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                I want to join student orgs, track event participation, and view
                end-of-term clearance status.
              </p>
            </div>
          </button>

          <button
            onClick={onOfficerSelect}
            className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50/30 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-amber-50 rounded-lg group-hover:bg-[#D4AF37]/20 transition-colors shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#7A610D]">
                Student Org Officer / Executive
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                I am a Secretary, Treasurer, or Officer managing organization
                rosters, ledgers, and proposals.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
