import { create } from "zustand";
import apiClient from "../api/client";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("codeforge_user") || "null"),
  token: localStorage.getItem("codeforge_token") || null,
  isAuthenticated: !!localStorage.getItem("codeforge_token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token, user } = response.data;

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
      set({
        user: response.data,
        isAuthenticated: true
      });
      localStorage.setItem("codeforge_user", JSON.stringify(response.data));
    } catch (err) {
      get().logout();
    }
  }
}));
