import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  Code2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  Zap,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  Eye,
  EyeOff,
  Edit3
} from "lucide-react";
import toast from "react-hot-toast";
import SEOHead from "../components/SEOHead";

const AuthPage = () => {
  // Navigation & URL Handling
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendRegisterOtp, verifyRegisterOtp, forgotPassword, resetPassword, resendOtp, isLoading, isAuthenticated } = useAuthStore();

  // Mode: "login" | "register" | "forgot"
  const [mode, setMode] = useState("login");
  
  // Registration Flow Step (1: Form, 2: OTP Verification)
  const [regStep, setRegStep] = useState(1);

  // Forgot Password Flow Step (1: Email Request, 2: OTP & New Password)
  const [forgotStep, setForgotStep] = useState(1);

  // Form Fields
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 6-digit OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);

  // Resend Timer (in seconds)
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/problems");
    }
  }, [isAuthenticated, navigate]);

  // Handle URL params e.g. session expired or register redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("sessionExpired") === "true") {
      toast.error("Your session was terminated because you logged in from another browser or device (Single Active Session).", {
        duration: 6000
      });
    }
    if (location.pathname === "/register") {
      setMode("register");
    } else if (location.pathname === "/login") {
      setMode("login");
    }
  }, [location]);

  // Resend OTP Countdown Effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // OTP Box Handlers
  const handleOtpChange = (index, value) => {
    // Only accept numeric single digit
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const digit = cleaned.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input box
    if (index < 5 && digit !== "") {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  const resetOtpBoxes = () => {
    setOtp(["", "", "", "", "", ""]);
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password.");
      return;
    }
    const res = await login(formData.email, formData.password);
    if (res.success) {
      toast.success(`Welcome back, ${res.user.username}!`);
      navigate("/problems");
    } else {
      toast.error(res.error);
    }
  };

  // 2. Submit Register Step 1: Send OTP
  const handleRegisterStep1 = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all registration fields.");
      return;
    }
    if (formData.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const res = await sendRegisterOtp(formData.username.trim(), formData.email.trim(), formData.password);
    if (res.success) {
      toast.success("Verification code sent to your email!");
      resetOtpBoxes();
      setRegStep(2);
      setResendTimer(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } else {
      toast.error(res.error);
    }
  };

  // 3. Submit Register Step 2: Verify OTP
  const handleRegisterStep2 = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    const res = await verifyRegisterOtp(
      formData.username.trim(),
      formData.email.trim(),
      formData.password,
      enteredOtp
    );

    if (res.success) {
      toast.success("Account verified and registered successfully!");
      navigate("/problems");
    } else {
      toast.error(res.error);
    }
  };

  // 4. Submit Forgot Password Step 1: Send Reset OTP
  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    const res = await forgotPassword(formData.email.trim());
    if (res.success) {
      toast.success("Password reset code sent to your email!");
      resetOtpBoxes();
      setForgotStep(2);
      setResendTimer(60);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } else {
      toast.error(res.error);
    }
  };

  // 5. Submit Forgot Password Step 2: Reset Password
  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast.error("Please enter the 6-digit reset code.");
      return;
    }
    if (!formData.newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const res = await resetPassword(formData.email.trim(), enteredOtp, formData.newPassword);
    if (res.success) {
      toast.success("Password reset successfully! Please log in with your new password.");
      setMode("login");
      setForgotStep(1);
      setFormData({ ...formData, password: "", confirmPassword: "", newPassword: "", confirmNewPassword: "" });
    } else {
      toast.error(res.error);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    const type = mode === "register" ? "register" : "forgot_password";
    const res = await resendOtp(formData.email.trim(), type, formData.username);
    if (res.success) {
      toast.success("A new verification code was sent to your email!");
      setResendTimer(60);
      resetOtpBoxes();
      otpInputRefs.current[0]?.focus();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <SEOHead
        title={mode === "login" ? "Sign In to CodeForge" : mode === "register" ? "Create Your CodeForge Account" : "Reset Password"}
        description="Join thousands of developers practicing FAANG coding interviews, solving NeetCode 150 challenges, and pair programming in real-time."
        keywords="CodeForge login, CodeForge register, coding platform signup, competitive programming account"
        canonical={`https://codeforge.dev/${mode === "register" ? "register" : "login"}`}
      />
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-9 col-lg-6 col-xl-5">
          <div className="clay-card p-4 p-md-5">
            {/* Header / Brand */}
            <div className="text-center mb-4">
              <div 
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "18px",
                  background: mode === "forgot" 
                    ? "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" 
                    : "var(--accent-gradient)",
                  boxShadow: mode === "forgot" 
                    ? "0 8px 25px rgba(239, 68, 68, 0.4)" 
                    : "0 8px 25px rgba(99, 102, 241, 0.4)",
                  color: "#fff"
                }}
              >
                {mode === "forgot" ? <KeyRound size={30} /> : <Code2 size={32} />}
              </div>

              {/* Title & Description depending on Mode & Step */}
              {mode === "login" && (
                <>
                  <h3 className="fw-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Welcome Back
                  </h3>
                  <p className="small mb-0" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    Elevate your algorithmic coding skills and compete in live arenas.
                  </p>
                </>
              )}

              {mode === "register" && regStep === 1 && (
                <>
                  <h3 className="fw-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Create Account
                  </h3>
                  <p className="small mb-0" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    Join CodeForge to solve problems, compete, and learn with AI guidance.
                  </p>
                </>
              )}

              {mode === "register" && regStep === 2 && (
                <>
                  <h3 className="fw-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Verify Your Email
                  </h3>
                  <p className="small mb-2" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    We've sent a 6-digit verification code to:
                  </p>
                  <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                    <span className="small fw-bold" style={{ color: "var(--accent-primary)" }}>{formData.email}</span>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="btn btn-link p-0 text-decoration-none"
                      title="Edit email"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </>
              )}

              {mode === "forgot" && forgotStep === 1 && (
                <>
                  <h3 className="fw-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Reset Password
                  </h3>
                  <p className="small mb-0" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    Enter your registered email and we'll send you an OTP code to reset your password.
                  </p>
                </>
              )}

              {mode === "forgot" && forgotStep === 2 && (
                <>
                  <h3 className="fw-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Set New Password
                  </h3>
                  <p className="small mb-2" style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    Enter the code sent to <strong style={{ color: "var(--accent-primary)" }}>{formData.email}</strong> and pick a strong password.
                  </p>
                </>
              )}
            </div>

            {/* Mode Switcher Tabs (Only shown when not in OTP step) */}
            {mode !== "forgot" && regStep === 1 && (
              <div className="d-flex p-1 rounded-3 mb-4" style={{ background: "var(--bg-glass)" }}>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setRegStep(1); }}
                  className={`clay-btn flex-fill py-2 ${mode === "login" ? "clay-btn-primary" : ""}`}
                  style={{ fontSize: "0.9rem" }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setRegStep(1); }}
                  className={`clay-btn flex-fill py-2 ${mode === "register" ? "clay-btn-primary" : ""}`}
                  style={{ fontSize: "0.9rem" }}
                >
                  Register
                </button>
              </div>
            )}

            {/* ================================================================ */}
            {/* VIEW 1: LOGIN FORM */}
            {/* ================================================================ */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="d-flex flex-column gap-3">
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setForgotStep(1); }}
                      className="btn btn-link p-0 small text-decoration-none fw-semibold"
                      style={{ color: "var(--accent-primary)", fontSize: "0.82rem" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="clay-input ps-5 pe-5"
                      required
                    />
                    <Lock size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="clay-btn clay-btn-primary py-3 mt-2 w-100 justify-content-center"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In to Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================================================================ */}
            {/* VIEW 2: REGISTER STEP 1 (Details) */}
            {/* ================================================================ */}
            {mode === "register" && regStep === 1 && (
              <form onSubmit={handleRegisterStep1} className="d-flex flex-column gap-3">
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
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="clay-input ps-5 pe-5"
                      required
                    />
                    <Lock size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="clay-btn clay-btn-primary py-3 mt-2 w-100 justify-content-center"
                >
                  {isLoading ? (
                    <span>Sending Verification Code...</span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================================================================ */}
            {/* VIEW 3: REGISTER STEP 2 (OTP Verification) */}
            {/* ================================================================ */}
            {mode === "register" && regStep === 2 && (
              <form onSubmit={handleRegisterStep2} className="d-flex flex-column gap-4">
                <div className="text-center">
                  <label className="form-label small fw-semibold mb-3">Enter 6-Digit Code</label>
                  <div className="d-flex justify-content-center gap-2 gap-sm-3" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-digit-input"
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Cooldown Timer */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <span className="small text-muted">
                      Resend code in <strong style={{ color: "var(--accent-amber)" }}>{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="btn btn-link p-0 small text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <RotateCcw size={14} />
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                </div>

                <div className="d-flex flex-column gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={isLoading || otp.join("").length !== 6}
                    className="clay-btn clay-btn-primary py-3 w-100 justify-content-center"
                  >
                    {isLoading ? (
                      <span>Verifying & Creating Account...</span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Verify & Create Account</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="clay-btn py-2 w-100 justify-content-center text-muted"
                    style={{ fontSize: "0.88rem" }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Registration Details</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================================================================ */}
            {/* VIEW 4: FORGOT PASSWORD STEP 1 (Email Input) */}
            {/* ================================================================ */}
            {mode === "forgot" && forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label small fw-semibold">Your Registered Email</label>
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="clay-btn clay-btn-primary py-3 mt-2 w-100 justify-content-center"
                >
                  {isLoading ? (
                    <span>Sending Reset Code...</span>
                  ) : (
                    <>
                      <span>Send Password Reset Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="clay-btn py-2 w-100 justify-content-center text-muted mt-1"
                  style={{ fontSize: "0.88rem" }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Sign In</span>
                </button>
              </form>
            )}

            {/* ================================================================ */}
            {/* VIEW 5: FORGOT PASSWORD STEP 2 (OTP & New Password) */}
            {/* ================================================================ */}
            {mode === "forgot" && forgotStep === 2 && (
              <form onSubmit={handleForgotStep2} className="d-flex flex-column gap-3">
                <div className="text-center">
                  <label className="form-label small fw-semibold mb-2">Enter 6-Digit Reset Code</label>
                  <div className="d-flex justify-content-center gap-2 gap-sm-3 mb-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-digit-input"
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {resendTimer > 0 ? (
                    <span className="small text-muted" style={{ fontSize: "0.8rem" }}>
                      Resend code in <strong style={{ color: "var(--accent-amber)" }}>{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="btn btn-link p-0 small text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold"
                      style={{ color: "var(--accent-primary)", fontSize: "0.82rem" }}
                    >
                      <RotateCcw size={13} />
                      <span>Resend Code</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="form-label small fw-semibold">New Password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="clay-input ps-5 pe-5"
                      required
                    />
                    <Lock size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-semibold">Confirm New Password</label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      placeholder="Repeat new password"
                      className="clay-input ps-5 pe-5"
                      required
                    />
                    <Lock size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--accent-primary)" }} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={isLoading || otp.join("").length !== 6}
                    className="clay-btn clay-btn-primary py-3 w-100 justify-content-center"
                  >
                    {isLoading ? (
                      <span>Resetting Password...</span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Reset Password & Sign In</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode("login"); setForgotStep(1); }}
                    className="clay-btn py-2 w-100 justify-content-center text-muted"
                    style={{ fontSize: "0.88rem" }}
                  >
                    <ArrowLeft size={16} />
                    <span>Cancel & Return to Login</span>
                  </button>
                </div>
              </form>
            )}

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
                <span>Verified OTP Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
