import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "./toastContext";

export const useLogout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const logout = async () => {
    try {
      // 1. Optional API call to invalidate token on the backend
      await API.post("/auth/logout").catch(() => {
        /* Ignore error if backend endpoint isn't set up */
      });
    } finally {
      // 2. Clear local storage & session state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // 3. Clear default Axios Authorization header
      if (API.defaults.headers.common["Authorization"]) {
        delete API.defaults.headers.common["Authorization"];
      }

      // 4. Redirect to login page and replace browser history entry
      showToast("Signed out successfully.", "info");
      navigate("/login", { replace: true });
    }
  };

  return logout;
};
