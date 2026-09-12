import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import LogoutButton from "../component/logoutButton";

export default function SuborgDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    API.get("/auth/me")
      .then((currentUser) => {
        const organization = currentUser?.organization;
        if (currentUser?.role !== "org_admin") {
          navigate("/", { replace: true });
          return;
        }
        if (organization?.organizationType !== "suborganization") {
          navigate("/org-dashboard", { replace: true });
          return;
        }
        if (mounted) setUser(currentUser);
      })
      .catch((requestError) => {
        if (mounted)
          setError(requestError.message || "Unable to load dashboard.");
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const organization = user?.organization;
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-sm text-rose-800">
        {error}
      </div>
    );
  }
  if (!user || !organization) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800">
      <header className="bg-[#4A0E17] px-5 py-4 text-white shadow-lg sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              SOMIS Suborganization Portal
            </p>
            <h1 className="mt-1 text-xl font-extrabold">{organization.name}</h1>
            <p className="text-xs text-rose-100/75">
              {organization.acronym} · {organization.college}
            </p>
          </div>
          <LogoutButton variant="button" showConfirmModal={true} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-10">
        <section className="rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7A610D]">
            Welcome, {user.name}
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#4A0E17]">
            Your dashboard is ready.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage your suborganization workspace, officers, members,
            activities, and required documents from this portal.
          </p>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Organization Type", "Suborganization"],
            [
              "Parent Organization",
              organization.parentOrganization?.name || "Main organization",
            ],
            ["Recognition Status", organization.status || "Active"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="mt-2 font-bold text-[#4A0E17]">{value}</p>
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#4A0E17]">Workspace modules</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Overview",
              "Officers & Members",
              "Resolutions",
              "Organization Documents",
            ].map((module) => (
              <div
                key={module}
                className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700"
              >
                {module}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
