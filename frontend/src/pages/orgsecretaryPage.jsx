import SecretaryDashboard from "../component/organization-main/secretaryDashboard"; // Adjust path if needed

export default function OrgSecretaryPage({ user, org }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <SecretaryDashboard user={user} org={org} />
    </div>
  );
}
