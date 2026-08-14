import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { useAuthStore } from "./store/authStore";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import RoomsPage from "./pages/RoomsPage";
import RoomArena from "./pages/RoomArena";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminProblemPage from "./pages/AdminProblemPage";
import CreateProblemPage from "./pages/CreateProblemPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider>
      <Router>
        {/* Animated background ambient glow */}
        <div className="bg-ambient-glow"></div>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-glass)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              borderRadius: "14px",
              fontWeight: 500,
              fontSize: "0.9rem"
            }
          }}
        />

        <div className="d-flex flex-column min-vh-100">
          <Navbar />

          <main className="flex-fill">
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Authentication */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />

              {/* Problems Explorer & Solver */}
              <Route path="/problems" element={<ProblemsPage />} />
              <Route
                path="/problems/:id"
                element={
                  <ProtectedRoute>
                    <ProblemWorkspace />
                  </ProtectedRoute>
                }
              />

              {/* Propose Problem (Community Problem Setter) */}
              <Route
                path="/create-problem"
                element={
                  <ProtectedRoute>
                    <CreateProblemPage />
                  </ProtectedRoute>
                }
              />

              {/* Collaborative Multiplayer Rooms */}
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <RoomsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/room/:id"
                element={
                  <ProtectedRoute>
                    <RoomArena />
                  </ProtectedRoute>
                }
              />

              {/* Leaderboard */}
              <Route path="/leaderboard" element={<LeaderboardPage />} />

              {/* Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Approvals & Problem Hub */}
              <Route
                path="/admin/problems"
                element={
                  <AdminRoute>
                    <AdminProblemPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/create-problem"
                element={
                  <AdminRoute>
                    <AdminProblemPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin"
                element={<Navigate to="/admin/problems" replace />}
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
