import React from "react";
import StudentDashboard from "../component/organization-main/studentDashboard"; // Adjust path if needed

export default function OrgSecretaryPage({ user, org }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <StudentDashboard user={user} org={org} />
    </div>
  );
}
