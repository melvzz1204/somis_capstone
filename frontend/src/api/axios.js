import axios from "axios";

// 1. Central Instance Configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});
// 2. Request Interceptor: Attach Bearer Token Automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 3. Response Interceptor: Data Unwrapping & Global Error Catching
API.interceptors.response.use(
  // Automatically extract response.data so components don't need { data } destructuring
  (response) => response.data,

  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || "An unexpected error occurred.";

    // Handle 401 Unauthorized (Expired / Invalid Token)
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 👈 Redirect to landing page only if the user isn't already there
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    // Pass structured error object to catch blocks in components
    return Promise.reject({
      status,
      message,
      originalError: error,
    });
  },
);

export default API;
