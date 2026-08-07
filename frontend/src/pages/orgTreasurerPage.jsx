import TreasurerDashboard from "../component/organization-main/treasurerDashboard";

export default function OrgTreasurerPage({ user, org }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TreasurerDashboard user={user} org={org} />
    </div>
  );
}
