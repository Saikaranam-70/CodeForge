import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { 
  Terminal, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ArrowRight, 
  Flame, 
  Sparkles,
  Loader2,
  Shuffle,
  Tag,
  BookOpen,
  Code2
} from "lucide-react";
import toast from "react-hot-toast";

import SEOHead from "../components/SEOHead";

const TOPIC_FILTERS = [
  "All Topics",
  "🔥 Top Interview 150",
  "Arrays & Hashing",
  "Two Pointers & Sliding Window",
  "Dynamic Programming",
  "Trees & Graphs",
  "Binary Search",
  "Stack & Queue"
];

const ProblemsPage = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 200,
    totalPages: 1,
    totalProblems: 0
  });

  const fetchProblems = async (page = 1, difficulty = selectedDifficulty) => {
    setLoading(true);
    try {
      let url = `/problems?page=${page}&limit=200`;
      if (difficulty !== "All") {
        url += `&difficulty=${difficulty}`;
      }
      const res = await apiClient.get(url);
      setProblems(res.data.problems || []);
      setPagination({
        page: res.data.page || res.data.currentPage || 1,
        limit: res.data.limit || 200,
        totalPages: res.data.totalPages || 1,
        totalProblems: res.data.totalProblems || res.data.totalCount || (res.data.problems ? res.data.problems.length : 0)
      });
    } catch (err) {
      toast.error("Failed to load problems repository");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems(1, selectedDifficulty);
  }, [selectedDifficulty]);

  const handleDifficultyChange = (diff) => {
    setSelectedDifficulty(diff);
  };

  const handlePickRandom = () => {
    if (problems.length === 0) return;
    const randomIdx = Math.floor(Math.random() * problems.length);
    const randomProblem = problems[randomIdx];
    navigate(`/problems/${randomProblem._id}`);
  };

  // Filter problems by search query and topic
  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedTopic === "All Topics") return true;
    if (selectedTopic === "🔥 Top Interview 150") return true;

    const title = p.title.toLowerCase();
    if (selectedTopic === "Arrays & Hashing") {
      return title.includes("duplicate") || title.includes("anagram") || title.includes("two sum") || title.includes("group") || title.includes("product") || title.includes("sudoku") || title.includes("sequence");
    }
    if (selectedTopic === "Two Pointers & Sliding Window") {
      return title.includes("palindrome") || title.includes("water") || title.includes("stock") || title.includes("substring") || title.includes("window") || title.includes("trapping");
    }
    if (selectedTopic === "Dynamic Programming") {
      return title.includes("stairs") || title.includes("robber") || title.includes("coin") || title.includes("subsequence") || title.includes("path") || title.includes("edit");
    }
    if (selectedTopic === "Trees & Graphs") {
      return title.includes("tree") || title.includes("island") || title.includes("graph") || title.includes("course") || title.includes("ladder") || title.includes("bst");
    }
    if (selectedTopic === "Binary Search") {
      return title.includes("search") || title.includes("koko") || title.includes("median") || title.includes("matrix") || title.includes("rotated");
    }
    if (selectedTopic === "Stack & Queue") {
      return title.includes("parentheses") || title.includes("stack") || title.includes("queue") || title.includes("temperatures") || title.includes("fleet") || title.includes("histogram");
    }
    return true;
  });

  return (
    <div className="container py-3 py-md-4">
      <SEOHead
        title="NeetCode 150 & Algorithmic Problem Repository"
        description="Explore and solve 150+ curated NeetCode coding interview challenges with automated judge evaluation, detailed test suites, and sub-100ms execution."
        keywords="NeetCode 150, LeetCode problems, FAANG DSA challenges, coding practice, dynamic programming, binary search, trees and graphs, two pointers"
        canonical="https://codeforge.dev/problems"
      />
      {/* Top Banner */}
      <div className="clay-card p-3 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="row align-items-center g-3">
          <div className="col-12 col-lg-7">
            <div className="clay-badge mb-2 mb-md-3 text-primary">
              <Terminal size={15} />
              <span>Algorithmic Problem Arena</span>
            </div>
            <h2 className="fw-bold mb-2">Master Data Structures & Algorithms</h2>
            <p className="text-muted mb-0" style={{ maxWidth: "600px" }}>
              Solve curated interview questions with automated judge testing, real-time Big-O analysis, and live AI SDE mock interviewing.
            </p>
          </div>
          <div className="col-12 col-lg-5 text-lg-end d-flex gap-2 justify-content-start justify-content-lg-end flex-wrap">
            <button
              onClick={handlePickRandom}
              className="clay-btn py-2 px-3 text-warning flex-fill flex-sm-grow-0 justify-content-center"
              style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              <Shuffle size={16} />
              <span>Pick Random Problem</span>
            </button>
            <Link to="/rooms" className="clay-btn clay-btn-primary py-2 px-3 flex-fill flex-sm-grow-0 justify-content-center">
              <Sparkles size={16} />
              <span>Multiplayer Arena</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Topic Roadmap Filter Chips */}
      <div className="d-flex gap-2 mb-3 pb-2 overflow-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {TOPIC_FILTERS.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`clay-btn py-1 px-3 text-nowrap flex-shrink-0 ${selectedTopic === topic ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.82rem" }}
          >
            <span>{topic}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          {/* Search Box */}
          <div className="col-12 col-md-6 col-lg-7">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search problems by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input ps-5"
              />
              <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            </div>
          </div>

          {/* Difficulty Filters */}
          <div className="col-12 col-md-6 col-lg-5 d-flex justify-content-start justify-content-md-end gap-2 flex-wrap">
            {["All", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => handleDifficultyChange(diff)}
                className={`clay-btn flex-fill flex-md-grow-0 py-2 px-3 ${selectedDifficulty === diff ? "clay-btn-primary" : ""}`}
                style={{ fontSize: "0.85rem" }}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problem Count Indicator */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="small fw-semibold text-muted">
          Showing <span className="text-primary fw-bold">{filteredProblems.length}</span> of <span className="fw-bold">{problems.length}</span> Challenges
          {selectedDifficulty !== "All" && ` • ${selectedDifficulty}`}
          {selectedTopic !== "All Topics" && ` • ${selectedTopic}`}
        </div>
        {(searchQuery || selectedDifficulty !== "All" || selectedTopic !== "All Topics") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDifficulty("All");
              setSelectedTopic("All Topics");
            }}
            className="clay-btn py-1 px-2 text-danger"
            style={{ fontSize: "0.78rem" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="text-center py-5">
          <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
          <h5 className="fw-semibold">Loading problems repository...</h5>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="clay-card p-4 p-md-5 text-center">
          <Code2 size={40} className="text-muted mb-3" />
          <h5 className="fw-bold mb-2">No problems match your filters</h5>
          <p className="text-muted mb-3">Try resetting your topic filter or search query.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDifficulty("All");
              setSelectedTopic("All Topics");
            }}
            className="clay-btn clay-btn-primary py-2 px-3"
            style={{ fontSize: "0.85rem" }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredProblems.map((problem) => {
            const badgeClass =
              problem.difficulty === "Easy"
                ? "badge-easy"
                : problem.difficulty === "Medium"
                ? "badge-medium"
                : "badge-hard";

            return (
              <div
                key={problem._id}
                className="clay-card p-3 p-md-4"
              >
                <div className="row align-items-center g-3">
                  {/* Left Info Column */}
                  <div className="col-12 col-md-8 col-lg-9">
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      <h5 className="fw-bold mb-0" style={{ color: "var(--text-primary)", fontSize: "1.12rem" }}>
                        {problem.title}
                      </h5>
                      <span className={`clay-badge ${badgeClass}`}>{problem.difficulty}</span>
                    </div>

                    <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: "100%", lineHeight: "1.5" }}>
                      {problem.description}
                    </p>

                    <div className="d-flex align-items-center gap-3 text-muted small flex-wrap">
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={14} />
                        <span>{problem.timeLimit || 2000}ms</span>
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Cpu size={14} />
                        <span>{problem.memoryLimit || 128}MB</span>
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <span>{problem.sampleTestCases?.length || 0} Sample Cases</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Action Button Column */}
                  <div className="col-12 col-md-4 col-lg-3 text-md-end">
                    <Link
                      to={`/problems/${problem._id}`}
                      className="clay-btn clay-btn-primary py-2 px-3 w-100 justify-content-center text-nowrap"
                    >
                      <span>Solve Challenge</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProblemsPage;
