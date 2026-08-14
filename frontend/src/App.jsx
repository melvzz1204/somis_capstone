import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { realtimeSocket } from "./api/socket";
import LandingPage from "./pages/landingPage.jsx";
import AdminDashboard from "./pages/adminDashboard.jsx";
import StudentPage from "./pages/studentPage.jsx";
import SetUpAccount from "./pages/setupAccount.jsx";
import OrgDashboard from "./pages/orgDashboard.jsx";
import OrgSecretaryPage from "./pages/orgsecretaryPage.jsx";
import OrgTreasurerPage from "./pages/orgTreasurerPage.jsx";
import AdviserDashboard from "./pages/adviserDashboard.jsx";
import OrgPioPage from "./pages/orgPioPage.jsx";

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentPage />} />
        <Route path="/setup-account" element={<SetUpAccount />} />
        <Route path="/org-dashboard" element={<OrgDashboard />} />
        <Route path="/org-secretary" element={<OrgSecretaryPage />} />
        <Route path="/org-treasurer" element={<OrgTreasurerPage />} />
        <Route path="/org-pio" element={<OrgPioPage />} />
        <Route path="/adviser-dashboard" element={<AdviserDashboard />} />
        <Route
          path="/dean-dashboard"
          element={<AdviserDashboard portalRole="dean" />}
        />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
