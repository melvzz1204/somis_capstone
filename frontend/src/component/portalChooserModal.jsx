import { getOfficerPortalLabel } from "../util/portalChoice";

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

export default function PortalChooserModal({
  user,
  onOfficerSelect,
  onMemberSelect,
}) {
  if (!user) return null;

  const officerLabel = getOfficerPortalLabel(user.role);
  const displayName = user.name || "there";

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-lg p-5 sm:p-8 space-y-6 relative">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#4A0E17]">
            Welcome back, {displayName}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your account is registered as{" "}
            <span className="font-bold text-[#4A0E17]">
              {officerLabel}
            </span>
            , and you are also listed as a regular organization member.
            Which portal do you want to open?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onOfficerSelect}
            className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50/30 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-amber-50 rounded-lg group-hover:bg-[#D4AF37]/20 transition-colors shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#7A610D]">
                Officer Portal — {officerLabel}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage rosters, dues, meetings, resolutions, and proposals for
                your organization.
              </p>
            </div>
          </button>

          <button
            onClick={onMemberSelect}
            className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#4A0E17] hover:bg-rose-50/30 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-[#4A0E17]/10 transition-colors shrink-0">
              <UserIcon className="w-6 h-6 text-[#4A0E17]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#4A0E17]">
                Member Portal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Continue as a regular student member — pay dues, join events
                and meetings, and track your clearance.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
