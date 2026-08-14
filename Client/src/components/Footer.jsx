import React from "react";
import { Link } from "react-router-dom";
import { Code2, Heart, Sparkles, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-5 py-4 border-top" style={{ borderColor: "var(--border-glass)", background: "var(--bg-glass)" }}>
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
        {/* Brand */}
        <div className="d-flex align-items-center justify-content-center gap-2">
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent-gradient)",
              color: "#fff"
            }}
          >
            <Code2 size={18} />
          </div>
          <span className="fw-bold" style={{ color: "var(--text-primary)" }}>
            CodeForge <span className="text-muted fw-normal fs-6">© {new Date().getFullYear()}</span>
          </span>
        </div>

        {/* Live Status Indicator */}
        <div className="clay-badge py-1 px-3" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <span 
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 8px #10b981"
            }}
          ></span>
          <span>Judge Engine & AI Gateway Active</span>
        </div>

        {/* Links */}
        <div className="d-flex align-items-center gap-3" style={{ fontSize: "0.88rem" }}>
          <Link to="/problems" className="text-decoration-none" style={{ color: "var(--text-secondary)" }}>
            Problems
          </Link>
          <Link to="/rooms" className="text-decoration-none" style={{ color: "var(--text-secondary)" }}>
            Multiplayer
          </Link>
          <Link to="/leaderboard" className="text-decoration-none" style={{ color: "var(--text-secondary)" }}>
            Leaderboard
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
