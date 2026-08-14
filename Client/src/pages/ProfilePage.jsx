import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/client";
import { useAuthStore } from "../store/authStore";
import { 
  User, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Calendar, 
  Activity, 
  Award, 
  Clock,
  Loader2,
  Code2,
  Crown,
  Medal
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#10b981", "#f59e0b", "#f43f5e"];

const ProfilePage = () => {
  const { username: paramUsername } = useParams();
  const { user: currentUser } = useAuthStore();
  
  const targetUsername = paramUsername || currentUser?.username;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUsername) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/users/${targetUsername}/profile`);
        setProfile(res.data);
      } catch (err) {
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetUsername]);

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <Loader2 className="animate-spin text-primary mb-3" size={48} style={{ animation: "spin 1s linear infinite" }} />
        <h5 className="fw-semibold">Loading Coder Profile...</h5>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-5 text-center">
        <h4>User profile not found</h4>
        <Link to="/problems" className="clay-btn clay-btn-primary mt-3">
          Explore Problems
        </Link>
      </div>
    );
  }

  const easyCount = profile.stats?.solvedBreakdown?.easy ?? profile.stats?.easy ?? 0;
  const mediumCount = profile.stats?.solvedBreakdown?.medium ?? profile.stats?.medium ?? 0;
  const hardCount = profile.stats?.solvedBreakdown?.hard ?? profile.stats?.hard ?? 0;
  const totalSolved = profile.stats?.solvedTotal ?? (easyCount + mediumCount + hardCount);

  const chartData = [
    { name: "Easy", value: easyCount },
    { name: "Medium", value: mediumCount },
    { name: "Hard", value: hardCount }
  ];

  const hasAnySolved = totalSolved > 0;

  return (
    <div className="container py-4">
      {/* Profile Header Banner */}
      <div className="clay-card p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "var(--accent-gradient)",
                boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
                color: "#fff"
              }}
            >
              <User size={38} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h3 className="fw-bold mb-0">{profile.username}</h3>
                <span className="badge bg-primary px-3 py-1 text-uppercase">{profile.role || "Member"}</span>
                {profile.globalRank && (
                  <span className="clay-badge text-warning py-1 px-3 fw-bold">
                    <Crown size={14} fill="#f59e0b" />
                    <span>Rank #{profile.globalRank} Global</span>
                  </span>
                )}
              </div>
              <p className="text-muted small mb-0">{profile.email || "CodeForge Algorithmic Master"}</p>
            </div>
          </div>

          {/* Streaks Callout */}
          <div className="d-flex gap-3 flex-wrap">
            <div className="clay-card-static p-3 text-center" style={{ minWidth: "120px" }}>
              <div className="d-flex align-items-center justify-content-center gap-1 text-warning mb-1">
                <Flame size={18} fill="#f59e0b" />
                <span className="fw-bold fs-5">{profile.streaks?.currentStreak || 0}</span>
              </div>
              <small className="text-muted">Current Streak</small>
            </div>

            <div className="clay-card-static p-3 text-center" style={{ minWidth: "120px" }}>
              <div className="d-flex align-items-center justify-content-center gap-1 text-primary mb-1">
                <Award size={18} />
                <span className="fw-bold fs-5">{profile.streaks?.longestStreak || 0}</span>
              </div>
              <small className="text-muted">Longest Streak</small>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        {/* Problems Solved Visualizer */}
        <div className="col-12 col-lg-6">
          <div className="clay-card p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Trophy size={18} className="text-primary" />
              <span>Problems Solved Breakdown</span>
            </h5>

            <div className="row align-items-center">
              <div className="col-6" style={{ height: "180px" }}>
                {hasAnySolved ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.value > 0)}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted small text-center">
                    No problems solved yet
                  </div>
                )}
              </div>

              <div className="col-6 d-flex flex-column gap-2">
                <div className="clay-badge badge-easy justify-content-between py-2 px-3">
                  <span>Easy:</span>
                  <strong>{easyCount}</strong>
                </div>
                <div className="clay-badge badge-medium justify-content-between py-2 px-3">
                  <span>Medium:</span>
                  <strong>{mediumCount}</strong>
                </div>
                <div className="clay-badge badge-hard justify-content-between py-2 px-3">
                  <span>Hard:</span>
                  <strong>{hardCount}</strong>
                </div>
                <div className="small text-muted text-end mt-1">
                  Total Solved: <strong className="text-primary fs-6">{totalSolved}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Consistency Info */}
        <div className="col-12 col-lg-6">
          <div className="clay-card p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Activity size={18} className="text-info" />
              <span>Coding Consistency Log</span>
            </h5>

            <p className="text-muted small mb-3">
              Daily code submissions keep your streak active. Submissions made before midnight count towards daily activity.
            </p>

            <div className="p-3 rounded-3 mb-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small text-muted">Last Active Date:</span>
                <span className="fw-semibold small">
                  {profile.streaks?.lastActiveDate 
                    ? new Date(profile.streaks.lastActiveDate).toLocaleDateString()
                    : "Active Today"}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">Total Recorded Activity Days:</span>
                <span className="fw-semibold small text-primary">{profile.activityLog?.length || 1} Days</span>
              </div>
            </div>

            <Link to="/problems" className="clay-btn clay-btn-primary py-2 px-4 w-100 justify-content-center">
              <span>Solve a Challenge Today</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
