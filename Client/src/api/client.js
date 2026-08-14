import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach JWT token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("codeforge_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If single session was invalidated or token expired
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem("codeforge_token")) {
        localStorage.removeItem("codeforge_token");
        localStorage.removeItem("codeforge_user");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login?sessionExpired=true";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
