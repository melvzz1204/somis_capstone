import React from "react";
import TreasurerDashboard from "../component/organization-main/treasurerDashboard"; // Adjust path if needed

export default function OrgSecretaryPage({ user, org }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TreasurerDashboard user={user} org={org} />
    </div>
  );
}
