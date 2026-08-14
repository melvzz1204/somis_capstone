import PioDashboard from "../component/organization-main/pioDashboard";

export default function OrgPioPage({ user, org }) {
  return <PioDashboard user={user} org={org} />;
}
