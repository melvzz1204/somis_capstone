import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage.jsx";
import AdminDashboard from "./pages/adminDashboard.jsx";
import StudentDashboard from "./pages/studentDashboard.jsx";
import SetUpAccount from "./pages/setupAccount.jsx";
import Login from "./pages/login.jsx";
import OrgDashboard from "./pages/orgDashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/setup-account" element={<SetUpAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/org-dashboard" element={<OrgDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
