import { create } from "zustand";
import apiClient from "../api/client";

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("codeforge_user");
    const token = localStorage.getItem("codeforge_token");
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user.role && token) {
      const decoded = parseJwt(token);
      if (decoded?.role) user.role = decoded.role;
    }
    if (!user.role) {
      if (user.email === "admin@codeforge.dev" || user.username === "admin") {
        user.role = "admin";
      }
    }
    return user;
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem("codeforge_token") || null,
  isAuthenticated: !!localStorage.getItem("codeforge_token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token, user } = response.data;

      // Extract role if not explicitly in user object
      const decoded = parseJwt(token);
      if (decoded?.role && !user.role) {
        user.role = decoded.role;
      }
      if (!user.role && (email === "admin@codeforge.dev" || user.username === "admin")) {
        user.role = "admin";
      }

      localStorage.setItem("codeforge_token", token);
      localStorage.setItem("codeforge_user", JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please check credentials.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Send registration OTP to email
  sendRegisterOtp: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/send-register-otp", { username, email, password });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send verification code.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Verify OTP and complete registration
  verifyRegisterOtp: async (username, email, password, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/verify-register-otp", { username, email, password, otp });
      const { token, user } = response.data;

      if (token) {
        const decoded = parseJwt(token);
        if (decoded?.role && !user.role) {
          user.role = decoded.role;
        }
        localStorage.setItem("codeforge_token", token);
        localStorage.setItem("codeforge_user", JSON.stringify(user));
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        set({ isLoading: false, error: null });
      }

      return { success: true, user, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "OTP verification failed.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Request password reset OTP
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to request password reset.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Reset password using OTP
  resetPassword: async (email, otp, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/reset-password", { email, otp, newPassword });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reset password.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Resend OTP code
  resendOtp: async (email, type = "register", username = "") => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/resend-otp", { email, type, username });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to resend code.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Direct register (legacy/fallback)
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/register", { username, email, password });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem("codeforge_token");
    localStorage.removeItem("codeforge_user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("codeforge_token");
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      const user = response.data;
      const decoded = parseJwt(token);
      if (decoded?.role && !user.role) {
        user.role = decoded.role;
      }
      if (!user.role && (user.email === "admin@codeforge.dev" || user.username === "admin")) {
        user.role = "admin";
      }

      set({
        user,
        isAuthenticated: true
      });
      localStorage.setItem("codeforge_user", JSON.stringify(user));
    } catch (err) {
      get().logout();
    }
  }
}));
