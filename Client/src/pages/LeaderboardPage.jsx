import React, { useState, useEffect } from "react";
import apiClient from "../api/client";
import { 
  Trophy, 
  Flame, 
  Medal, 
  CheckCircle, 
  Award, 
  Loader2, 
  Crown,
  Sparkles,
  Code2
} from "lucide-react";
import toast from "react-hot-toast";
import SEOHead from "../components/SEOHead";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState("solved"); // 'solved' | 'streaks'
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (sort = sortBy) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/users/leaderboard?sortBy=${sort}&limit=50`);
      setLeaderboard(res.data || []);
    } catch (err) {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(sortBy);
  }, [sortBy]);

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="container py-3 py-md-4">
      <SEOHead
        title="Global Leaderboard & Top Algorithmic Coders"
        description="Check out the global rankings on CodeForge. Discover the top competitive coders leading in NeetCode 150 problem completions and daily coding streaks."
        keywords="CodeForge leaderboard, top coders, competitive programming rankings, coding streaks, FAANG interview prep leaderboards"
        canonical="https://codeforge.dev/leaderboard"
      />
      {/* Banner */}
      <div className="clay-card p-3 p-md-5 mb-4 text-center">
        <div className="clay-badge mb-2 mb-md-3 text-warning">
          <Trophy size={16} />
          <span>Global Rankings</span>
        </div>
        <h2 className="fw-bold mb-2">CodeForge Global Hall of Fame</h2>
        <p className="text-muted mx-auto mb-3 mb-md-4" style={{ maxWidth: "600px" }}>
          Top algorithmic coders ranked by problems conquered and daily consistency streaks.
        </p>

        {/* Sort Switcher */}
        <div className="d-inline-flex flex-column flex-sm-row gap-1 p-1 rounded-3 w-100 w-sm-auto" style={{ background: "var(--bg-glass)" }}>
          <button
            onClick={() => setSortBy("solved")}
            className={`clay-btn py-2 px-3 px-md-4 justify-content-center ${sortBy === "solved" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.88rem" }}
          >
            <CheckCircle size={16} />
            <span>Most Problems Solved</span>
          </button>
          <button
            onClick={() => setSortBy("streaks")}
            className={`clay-btn py-2 px-3 px-md-4 justify-content-center ${sortBy === "streaks" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.88rem" }}
          >
            <Flame size={16} />
            <span>Longest Streaks</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
          <h5 className="fw-semibold">Loading Leaderboard Rankings...</h5>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="clay-card p-4 p-md-5 text-center">
          <h5>No rankings available yet. Solve a challenge to claim #1!</h5>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="row g-3 mb-4 justify-content-center">
              {/* Rank 2 - Silver */}
              {top3[1] && (
                <div className="col-12 col-md-4 order-2 order-md-1">
                  <div className="clay-card p-3 p-md-4 text-center h-100 mt-md-4" style={{ borderColor: "#94a3b8" }}>
                    <div className="clay-badge mb-2 text-secondary">
                      <Medal size={16} />
                      <span>Rank #2 (Silver)</span>
                    </div>
                    <h5 className="fw-bold mb-1">{top3[1].username}</h5>
                    <div className="d-flex justify-content-center gap-3 mt-3 text-muted small">
                      <div>
                        <strong>{top3[1].solvedCount || 0}</strong> Solved
                      </div>
                      <div>
                        <span className="text-warning fw-semibold">🔥 {top3[1].streak || top3[1].currentStreak || 0}d</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 1 - Gold (Center) */}
              {top3[0] && (
                <div className="col-12 col-md-4 order-1 order-md-2">
                  <div 
                    className="clay-card p-3 p-md-4 text-center h-100" 
                    style={{ 
                      borderColor: "#f59e0b", 
                      boxShadow: "0 12px 30px rgba(245, 158, 11, 0.2), var(--clay-shadow)" 
                    }}
                  >
                    <div className="d-inline-flex p-2 rounded-circle mb-2" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                      <Crown size={28} />
                    </div>
                    <div className="clay-badge mb-2 text-warning">
                      <Trophy size={16} />
                      <span>Rank #1 (Champion)</span>
                    </div>
                    <h4 className="fw-bold mb-1">{top3[0].username}</h4>
                    <div className="d-flex justify-content-center gap-4 mt-3 small">
                      <div>
                        <span className="fs-5 fw-bold text-primary">{top3[0].solvedCount || 0}</span>
                        <div className="text-muted">Solved</div>
                      </div>
                      <div>
                        <span className="fs-5 fw-bold text-warning">🔥 {top3[0].streak || top3[0].currentStreak || 0}d</span>
                        <div className="text-muted">Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 3 - Bronze */}
              {top3[2] && (
                <div className="col-12 col-md-4 order-3 order-md-3">
                  <div className="clay-card p-3 p-md-4 text-center h-100 mt-md-4" style={{ borderColor: "#b45309" }}>
                    <div className="clay-badge mb-2 text-warning">
                      <Award size={16} />
                      <span>Rank #3 (Bronze)</span>
                    </div>
                    <h5 className="fw-bold mb-1">{top3[2].username}</h5>
                    <div className="d-flex justify-content-center gap-3 mt-3 text-muted small">
                      <div>
                        <strong>{top3[2].solvedCount || 0}</strong> Solved
                      </div>
                      <div>
                        <span className="text-warning fw-semibold">🔥 {top3[2].streak || top3[2].currentStreak || 0}d</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remaining Rankings Table */}
          <div className="clay-card p-3 p-md-4 table-responsive">
            <h5 className="fw-bold mb-3">Complete Leaderboard Rankings</h5>
            <table className="table table-hover align-middle mb-0" style={{ color: "var(--text-primary)" }}>
              <thead>
                <tr className="text-muted small border-bottom" style={{ borderColor: "var(--border-glass)" }}>
                  <th scope="col" style={{ width: "80px" }}>Rank</th>
                  <th scope="col">Coder</th>
                  <th scope="col">Problems Solved</th>
                  <th scope="col">Current Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, index) => (
                  <tr key={u.username || index} className="border-bottom" style={{ borderColor: "var(--border-glass)" }}>
                    <td className="fw-bold">
                      {index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : index === 2 ? "🥉 #3" : `#${index + 1}`}
                    </td>
                    <td>
                      <span className="fw-semibold">{u.username}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary px-3 py-2">{u.solvedCount || 0} Solved</span>
                    </td>
                    <td>
                      <span className="clay-badge text-warning py-1 px-3">
                        <Flame size={14} fill="#f59e0b" />
                        <span>{u.streak || u.currentStreak || 0} Days</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
