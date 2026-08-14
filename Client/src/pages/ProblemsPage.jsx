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
    limit: 20,
    totalPages: 1,
    totalProblems: 0
  });

  const fetchProblems = async (page = 1, difficulty = selectedDifficulty) => {
    setLoading(true);
    try {
      let url = `/problems?page=${page}&limit=${pagination.limit}`;
      if (difficulty !== "All") {
        url += `&difficulty=${difficulty}`;
      }
      const res = await apiClient.get(url);
      setProblems(res.data.problems || []);
      setPagination({
        page: res.data.page || 1,
        limit: res.data.limit || 20,
        totalPages: res.data.totalPages || 1,
        totalProblems: res.data.totalProblems || 0
      });
    } catch (err) {
      toast.error("Failed to load problems");
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
    const randomProb = problems[Math.floor(Math.random() * problems.length)];
    toast.success(`Picked "${randomProb.title}"! Loading workspace...`);
    navigate(`/problems/${randomProb._id}`);
  };

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTopic === "All Topics" || selectedTopic === "🔥 Top Interview 150") {
      return matchesSearch;
    }

    const titleAndDesc = (p.title + " " + p.description).toLowerCase();
    if (selectedTopic === "Arrays & Hashing") {
      return matchesSearch && (titleAndDesc.includes("array") || titleAndDesc.includes("sum") || titleAndDesc.includes("hash"));
    }
    if (selectedTopic === "Two Pointers & Sliding Window") {
      return matchesSearch && (titleAndDesc.includes("pointer") || titleAndDesc.includes("window") || titleAndDesc.includes("water") || titleAndDesc.includes("substring") || titleAndDesc.includes("palindrome"));
    }
    if (selectedTopic === "Dynamic Programming") {
      return matchesSearch && (titleAndDesc.includes("dp") || titleAndDesc.includes("dynamic") || titleAndDesc.includes("stairs") || titleAndDesc.includes("climb"));
    }
    if (selectedTopic === "Trees & Graphs") {
      return matchesSearch && (titleAndDesc.includes("tree") || titleAndDesc.includes("graph") || titleAndDesc.includes("node"));
    }
    if (selectedTopic === "Binary Search") {
      return matchesSearch && (titleAndDesc.includes("binary") || titleAndDesc.includes("search"));
    }
    if (selectedTopic === "Stack & Queue") {
      return matchesSearch && (titleAndDesc.includes("stack") || titleAndDesc.includes("queue") || titleAndDesc.includes("parentheses"));
    }
    return matchesSearch;
  });

  return (
    <div className="container py-3 py-md-4">
      {/* Header Banner */}
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
          <p className="text-muted mb-0">Try resetting your topic filter or search query.</p>
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
                className="clay-card p-3 p-md-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                style={{ minWidth: 0, overflow: "hidden" }}
              >
                {/* Problem Info - minWidth: 0 prevents flex child from overflowing */}
                <div className="flex-fill" style={{ minWidth: 0, overflow: "hidden" }}>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <h5 className="fw-bold mb-0 text-truncate" style={{ color: "var(--text-primary)", maxWidth: "100%" }}>
                      {problem.title}
                    </h5>
                    <span className={`clay-badge ${badgeClass}`}>{problem.difficulty}</span>
                  </div>

                  <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: "100%" }}>
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

                {/* Solve Action Button */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0 w-100 w-md-auto">
                  <Link
                    to={`/problems/${problem._id}`}
                    className="clay-btn clay-btn-primary py-2 px-3 text-nowrap w-100 w-md-auto justify-content-center"
                  >
                    <span>Solve Challenge</span>
                    <ArrowRight size={16} />
                  </Link>
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
