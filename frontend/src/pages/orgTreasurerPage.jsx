import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import TreasurerDashboard from "../component/organization-main/treasurerDashboard";

export default function OrgTreasurerPage({ user, org }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Class treasurers have their own slim portal; never serve them the
    // full organization treasury (stale sessions, bookmarks, manual URLs).
    API.get("/auth/me")
      .then((currentUser) => {
        if (!mounted) return;
        const organization = currentUser?.organization;
        const organizationType =
          typeof organization === "object"
            ? organization?.organizationType
            : null;
        if (
          currentUser?.role === "treasurer" &&
          organizationType === "class"
        ) {
          navigate("/class-treasurer-dashboard", { replace: true });
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        if (mounted) setAllowed(true);
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TreasurerDashboard user={user} org={org} />
    </div>
  );
}
