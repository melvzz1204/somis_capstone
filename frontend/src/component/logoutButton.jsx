import { useState } from "react";
import { useLogout } from "../util/useLogout"; // Adjust path if needed

// Inline Logout SVG Icon
const LogoutIcon = ({ className = "w-4 h-4" }) => (
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
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

/**
 * Global Logout Button Component
 *
 * @param {string} variant - 'sidebar' | 'menu' | 'icon' | 'button'
 * @param {boolean} showConfirmModal - Whether to ask for confirmation before logout
 * @param {string} className - Additional custom Tailwind CSS overrides
 */
export default function LogoutButton({
  variant = "sidebar",
  showConfirmModal = true,
  className = "",
}) {
  const logout = useLogout();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogoutClick = () => {
    if (showConfirmModal) {
      setIsOpen(true);
    } else {
      logout();
    }
  };

  const renderTrigger = () => {
    switch (variant) {
      case "sidebar":
        return (
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/30 active:scale-[0.98] ${className}`}
          >
            <LogoutIcon className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="truncate">Sign Out</span>
          </button>
        );

      case "menu":
        return (
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer ${className}`}
          >
            <LogoutIcon className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate">Sign Out</span>
          </button>
        );

      case "icon":
        return (
          <button
            type="button"
            onClick={handleLogoutClick}
            title="Sign Out"
            className={`p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer ${className}`}
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        );

      case "mobile":
        return (
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`mobile-tabbar-item mobile-tabbar-logout ${className}`}
            aria-label="Sign out of SOMIS"
          >
            <LogoutIcon className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        );

      case "button":
      default:
        return (
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`w-full px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${className}`}
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}

      {/* CONFIRMATION MODAL */}
      {isOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div className="modal-panel max-w-sm p-5 sm:p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <LogoutIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3
                id="logout-dialog-title"
                className="text-base font-extrabold text-[#4A0E17]"
              >
                Confirm Sign Out
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to end your session? You will need to log
                back in to access your dashboard.
              </p>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-1/2 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-1/2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
