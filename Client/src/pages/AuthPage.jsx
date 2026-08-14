import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  Code2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  Zap,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const { login, register, isLoading, error, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/problems");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Check if session was expired / invalidated
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("sessionExpired") === "true") {
      toast.error("Your session was terminated because you logged in from another browser or device (Single Active Session).", {
        duration: 6000
      });
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminDemoLogin = async () => {
    setFormData({
      username: "admin",
      email: "admin@codeforge.dev",
      password: "AdminPassword123!"
    });
    const res = await login("admin@codeforge.dev", "AdminPassword123!");
    if (res.success) {
      toast.success("Logged in as Admin (admin@codeforge.dev)!");
      navigate("/admin/problems");
    } else {
      toast.error(res.error || "Admin login failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      if (!formData.email || !formData.password) {
        toast.error("Please enter your email and password");
        return;
      }
      const res = await login(formData.email, formData.password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.username}!`);
        navigate("/problems");
      } else {
        toast.error(res.error);
      }
    } else {
      if (!formData.username || !formData.email || !formData.password) {
        toast.error("Please fill in all registration fields");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      const res = await register(formData.username, formData.email, formData.password);
      if (res.success) {
        toast.success("Account created successfully! Logging you in...");
        const loginRes = await login(formData.email, formData.password);
        if (loginRes.success) {
          navigate("/problems");
        }
      } else {
        toast.error(res.error);
      }
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="clay-card p-4 p-md-5">
            {/* Header / Brand */}
            <div className="text-center mb-4">
              <div 
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "var(--accent-gradient)",
                  boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
                  color: "#fff"
                }}
              >
                <Code2 size={32} />
              </div>
              <h3 className="fw-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {isLogin ? "Welcome Back" : "Join CodeForge"}
              </h3>
              <p className="small mb-0" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {isLogin 
                  ? "Elevate your algorithmic coding skills and collaborate in real-time" 
                  : "Start solving problems, competing, and learning with AI guidance"}
              </p>
            </div>

            {/* Quick Admin Demo Login Button */}
            {isLogin && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={handleAdminDemoLogin}
                  disabled={isLoading}
                  className="clay-btn py-2 px-3 w-100 justify-content-center text-warning"
                  style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.35)", fontSize: "0.85rem" }}
                >
                  <ShieldCheck size={16} />
                  <span>👑 Quick Admin Demo Login</span>
                </button>
              </div>
            )}

            {/* Mode Switcher Pills */}
            <div className="d-flex p-1 rounded-3 mb-4" style={{ background: "var(--bg-glass)" }}>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`clay-btn flex-fill py-2 ${isLogin ? "clay-btn-primary" : ""}`}
                style={{ fontSize: "0.9rem" }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`clay-btn flex-fill py-2 ${!isLogin ? "clay-btn-primary" : ""}`}
                style={{ fontSize: "0.9rem" }}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              {!isLogin && (
                <div>
                  <label className="form-label small fw-semibold">Username</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. coder_alex"
                      className="clay-input ps-5"
                      required
                    />
                    <User size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label small fw-semibold">Email Address</label>
                <div className="position-relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="clay-input ps-5"
                    required
                  />
                  <Mail size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>

              <div>
                <label className="form-label small fw-semibold">Password</label>
                <div className="position-relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="clay-input ps-5"
                    required
                  />
                  <Lock size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="clay-btn clay-btn-primary py-3 mt-3 w-100 justify-content-center"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In to Account" : "Create My Account"}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Feature Highlights */}
            <div className="mt-4 pt-3 border-top d-flex justify-content-between flex-wrap gap-2" style={{ borderColor: "var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-1 small" style={{ color: "var(--accent-amber)" }}>
                <Sparkles size={14} />
                <span>AI Co-Pilot</span>
              </div>
              <div className="d-flex align-items-center gap-1 small" style={{ color: "var(--accent-cyan)" }}>
                <Zap size={14} />
                <span>Live Multiplayer</span>
              </div>
              <div className="d-flex align-items-center gap-1 small" style={{ color: "var(--accent-emerald)" }}>
                <CheckCircle size={14} />
                <span>Single Active Session</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
