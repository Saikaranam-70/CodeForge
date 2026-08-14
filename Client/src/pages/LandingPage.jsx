import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Sparkles, Users, ShieldCheck, Zap } from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: Code2,
      title: "Real-time coding rooms",
      text: "Collaborate with teammates, track changes live, and solve problems together."
    },
    {
      icon: Users,
      title: "Competitive learning",
      text: "Practice coding challenges, climb leaderboards, and keep your streak alive."
    },
    {
      icon: ShieldCheck,
      title: "Secure execution",
      text: "Every submission runs in an isolated environment with strict safeguards."
    },
    {
      icon: Zap,
      title: "AI-assisted workflow",
      text: "Move from problem-solving to production-ready thinking with smart support."
    }
  ];

  return (
    <div className="container py-5">
      <div className="row align-items-center justify-content-center g-5 py-5">
        <div className="col-12 col-lg-6">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4" style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "var(--accent-primary)" }}>
            <Sparkles size={16} />
            <span className="fw-semibold small">CodeForge Workspace</span>
          </div>

          <h1 className="display-4 fw-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Build, compete, and ship smarter with every session.
          </h1>

          <p className="lead mb-4" style={{ color: "var(--text-secondary)" }}>
            A collaborative coding platform for teams, problem solvers, and developers who want faster learning and stronger execution.
          </p>

          <div className="d-flex flex-wrap gap-3 mb-5">
            <Link to="/login" className="clay-btn clay-btn-primary px-4 py-3">
              <span>Get started</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/problems" className="clay-btn px-4 py-3">
              Explore problems
            </Link>
          </div>

          <div className="d-flex flex-wrap gap-4 small" style={{ color: "var(--text-secondary)" }}>
            <span>⚡ Live rooms</span>
            <span>🧠 AI guidance</span>
            <span>🏆 Leaderboards</span>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="clay-card p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <p className="small mb-1 text-uppercase" style={{ letterSpacing: "0.08em", color: "var(--text-secondary)" }}>
                  Platform snapshot
                </p>
                <h3 className="fw-bold mb-0" style={{ color: "var(--text-primary)" }}>Why teams choose CodeForge</h3>
              </div>
            </div>

            <div className="d-grid gap-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="d-flex gap-3 align-items-start p-3 rounded-4" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-3" style={{ width: "42px", height: "42px", background: "var(--accent-gradient)", color: "#fff" }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h5 className="mb-1" style={{ color: "var(--text-primary)" }}>{title}</h5>
                    <p className="small mb-0" style={{ color: "var(--text-secondary)" }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
