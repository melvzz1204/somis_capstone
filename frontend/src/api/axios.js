import axios from "axios";

// 1. Central Instance Configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000, // 10 second timeout to prevent hanging requests
  headers: {
    "Content-Type": "application/json",
  },
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
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
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
