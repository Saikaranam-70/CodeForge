import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../context/ThemeContext";
import { 
  Code2, 
  Terminal, 
  Users, 
  Trophy, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  PlusCircle, 
  Menu, 
  X,
  Sparkles,
  Flame,
  ShieldCheck,
  Plus
} from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-navbar sticky-top py-2 px-2 px-md-3 px-lg-4 mb-3 mb-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        {/* Brand Logo */}
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--accent-gradient)",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
              color: "#fff"
            }}
          >
            <Code2 size={22} />
          </div>
          <div>
            <span className="fw-bold fs-5 tracking-tight" style={{ color: "var(--text-primary)" }}>
              Code<span style={{ color: "var(--accent-primary)" }}>Forge</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Visible on large screens) */}
        <div className="d-none d-lg-flex align-items-center gap-2">
          <Link
            to="/problems"
            className={`clay-btn py-2 px-3 ${isActive("/problems") ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.88rem" }}
          >
            <Terminal size={16} />
            <span>Problems</span>
          </Link>

          <Link
            to="/rooms"
            className={`clay-btn py-2 px-3 ${isActive("/rooms") ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.88rem" }}
          >
            <Users size={16} />
            <span>Live Rooms</span>
          </Link>

          <Link
            to="/leaderboard"
            className={`clay-btn py-2 px-3 ${isActive("/leaderboard") ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.88rem" }}
          >
            <Trophy size={16} />
            <span>Leaderboard</span>
          </Link>

          {/* User Propose Problem */}
          {isAuthenticated && user?.role !== "admin" && (
            <Link
              to="/create-problem"
              className={`clay-btn py-2 px-3 ${isActive("/create-problem") ? "clay-btn-primary" : ""}`}
              style={{ fontSize: "0.88rem" }}
            >
              <Plus size={16} />
              <span>Propose Problem</span>
            </Link>
          )}

          {/* Admin Hub */}
          {user?.role === "admin" && (
            <Link
              to="/admin/problems"
              className={`clay-btn py-2 px-3 text-warning ${isActive("/admin/problems") ? "clay-btn-primary" : ""}`}
              style={{ fontSize: "0.88rem", border: "1px solid rgba(245, 158, 11, 0.4)" }}
            >
              <ShieldCheck size={16} />
              <span>Admin Hub</span>
            </Link>
          )}
        </div>

        {/* Right Section: Theme Toggle + User Actions + Mobile Toggle */}
        <div className="d-flex align-items-center gap-1 gap-sm-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="clay-btn p-1 p-sm-2"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
            style={{ width: "38px", height: "38px", borderRadius: "10px" }}
          >
            {isDark ? <Sun size={18} className="text-warning" /> : <Moon size={18} style={{ color: "var(--accent-primary)" }} />}
          </button>

          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-1 gap-sm-2">
              {/* Streak Badge */}
              {user?.streaks?.currentStreak > 0 && (
                <div 
                  className="clay-badge d-none d-sm-flex align-items-center gap-1 py-1 px-2"
                  style={{ color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)", fontSize: "0.8rem" }}
                  title={`${user.streaks.currentStreak} Day Streak!`}
                >
                  <Flame size={14} fill="#f59e0b" />
                  <span>{user.streaks.currentStreak}d</span>
                </div>
              )}

              {/* Profile Link */}
              <Link
                to="/profile"
                className="clay-btn py-1 px-2 px-sm-3 d-flex align-items-center gap-1 gap-sm-2"
                style={{ fontSize: "0.85rem", height: "38px" }}
              >
                <User size={16} style={{ color: "var(--accent-primary)" }} />
                <span className="d-none d-sm-inline fw-semibold text-truncate" style={{ maxWidth: "100px" }}>{user?.username}</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="clay-btn p-1 p-sm-2"
                title="Logout"
                style={{ width: "38px", height: "38px", borderRadius: "10px", color: "var(--accent-rose)" }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-1 gap-sm-2">
              <Link to="/login" className="clay-btn py-1 px-2 px-sm-3" style={{ fontSize: "0.85rem", height: "38px" }}>
                Login
              </Link>
              <Link to="/register" className="clay-btn clay-btn-primary py-1 px-2 px-sm-3" style={{ fontSize: "0.85rem", height: "38px" }}>
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button (Visible on screens < 992px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="clay-btn p-1 p-sm-2 d-lg-none"
            style={{ width: "38px", height: "38px", borderRadius: "10px" }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="d-lg-none pt-3 pb-2 px-2 d-flex flex-column gap-2 border-top mt-2" style={{ borderColor: "var(--border-glass)" }}>
          <Link
            to="/problems"
            onClick={() => setMobileMenuOpen(false)}
            className={`clay-btn justify-content-start py-2 px-3 ${isActive("/problems") ? "clay-btn-primary" : ""}`}
          >
            <Terminal size={17} />
            <span>Problems</span>
          </Link>

          <Link
            to="/rooms"
            onClick={() => setMobileMenuOpen(false)}
            className={`clay-btn justify-content-start py-2 px-3 ${isActive("/rooms") ? "clay-btn-primary" : ""}`}
          >
            <Users size={17} />
            <span>Live Rooms</span>
          </Link>

          <Link
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`clay-btn justify-content-start py-2 px-3 ${isActive("/leaderboard") ? "clay-btn-primary" : ""}`}
          >
            <Trophy size={17} />
            <span>Leaderboard</span>
          </Link>

          {user?.role === "admin" ? (
            <Link
              to="/admin/problems"
              onClick={() => setMobileMenuOpen(false)}
              className={`clay-btn justify-content-start py-2 px-3 text-warning ${isActive("/admin/problems") ? "clay-btn-primary" : ""}`}
            >
              <ShieldCheck size={17} />
              <span>Admin Hub</span>
            </Link>
          ) : (
            <Link
              to="/create-problem"
              onClick={() => setMobileMenuOpen(false)}
              className={`clay-btn justify-content-start py-2 px-3 ${isActive("/create-problem") ? "clay-btn-primary" : ""}`}
            >
              <Plus size={17} />
              <span>Propose Problem</span>
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="clay-btn justify-content-start py-2 px-3"
            >
              <User size={17} />
              <span>My Profile ({user?.username})</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
