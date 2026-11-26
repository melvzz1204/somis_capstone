import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { realtimeSocket } from "./api/socket";
import LandingPage from "./pages/landingPage.jsx";
import TermsModal from "./component/termsModal.jsx";
import RouteFallback from "./component/routeFallback.jsx";

// Every dashboard is split into its own chunk. A student never downloads the
// admin/treasurer/adviser code, and the public landing page stays small.
const AdminDashboard = lazy(() => import("./pages/adminDashboard.jsx"));
const StudentPage = lazy(() => import("./pages/studentPage.jsx"));
const SetUpAccount = lazy(() => import("./pages/setupAccount.jsx"));
const ResetPassword = lazy(() => import("./pages/resetPassword.jsx"));
const OrgDashboard = lazy(() => import("./pages/orgDashboard.jsx"));
const SuborgDashboard = lazy(() => import("./pages/suborgDashboard.jsx"));
const OrgSecretaryPage = lazy(() => import("./pages/orgsecretaryPage.jsx"));
const OrgTreasurerPage = lazy(() => import("./pages/orgTreasurerPage.jsx"));
const AdviserDashboard = lazy(() => import("./pages/adviserDashboard.jsx"));
const DirectorDashboard = lazy(() => import("./pages/directorDashboard.jsx"));
const ClassDashboard = lazy(() => import("./pages/classDashboard.jsx"));
const ClassTreasurerDashboard = lazy(
  () => import("./pages/classTreasurerDashboard.jsx"),
);
const OrgPioPage = lazy(() => import("./pages/orgPioPage.jsx"));
const ClearanceVisualHarness = lazy(
  () => import("./component/organization-main/ClearanceVisualHarness.jsx"),
);

function App() {
  useEffect(() => {
    // Keep the shared realtime connection active without remounting the current
    // route. Remounting destroys active upload/scanning modals.
    const handleDataUpdated = () => {};
    realtimeSocket.on("data-updated", handleDataUpdated);

    return () => {
      realtimeSocket.off("data-updated", handleDataUpdated);
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/student-dashboard" element={<StudentPage />} />
          <Route path="/setup-account" element={<SetUpAccount />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/org-dashboard" element={<OrgDashboard />} />
          <Route path="/suborg-dashboard" element={<SuborgDashboard />} />
          <Route path="/org-secretary" element={<OrgSecretaryPage />} />
          <Route path="/org-treasurer" element={<OrgTreasurerPage />} />
          <Route path="/org-pio" element={<OrgPioPage />} />
          <Route path="/adviser-dashboard" element={<AdviserDashboard />} />
          <Route
            path="/__clearance-preview"
            element={<ClearanceVisualHarness />}
          />
          <Route
            path="/dean-dashboard"
            element={<AdviserDashboard portalRole="dean" />}
          />
          <Route path="/director-dashboard" element={<DirectorDashboard />} />
          <Route path="/class-dashboard" element={<ClassDashboard />} />
          <Route
            path="/class-treasurer-dashboard"
            element={<ClassTreasurerDashboard />}
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <TermsModal />
    </BrowserRouter>
  );
}

export default App;
