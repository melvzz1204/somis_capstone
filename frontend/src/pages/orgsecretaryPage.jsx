import React from "react";
import SecretaryDashboard from "../component/organization-main/secretaryDashboard"; // 👈 Adjust path based on where SecretaryDashboard.jsx is located

export default function OrgSecretaryPage() {
  // Retrieve logged-in user & org info from localStorage (or replace with your AuthContext / custom hook)
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const org =
    JSON.parse(localStorage.getItem("organization") || "null") ||
    user?.organization;

  return (
    <div className="min-h-screen bg-slate-50">
      <SecretaryDashboard user={user} org={org} />
    </div>
  );
}
