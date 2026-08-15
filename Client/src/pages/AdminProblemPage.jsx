import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import { 
  PlusCircle, 
  Sparkles, 
  Trash2, 
  Plus, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  X,
  ShieldCheck,
  Check,
  AlertCircle,
  Inbox,
  Send,
  Eye,
  Globe,
  Download,
  Users,
  Terminal,
  Trophy,
  Activity,
  Edit3,
  Search,
  Lock,
  Timer,
  ExternalLink,
  Flame,
  UserCheck,
  UserX,
  RefreshCw,
  Hash,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

const AdminProblemPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'allProblems' | 'users' | 'rooms' | 'create' | 'ai'

  // Platform Analytics State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProblems: 0,
    pendingProposals: 0,
    activeRooms: 0,
    totalSubmissions: 0,
    serverStatus: "Online",
    judgeEngine: "Active"
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Tab 1: Pending Proposals State
  const [pendingProblems, setPendingProblems] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [previewProblem, setPreviewProblem] = useState(null);

  // Tab 2: All Problems State
  const [allProblems, setAllProblems] = useState([]);
  const [loadingAllProblems, setLoadingAllProblems] = useState(false);
  const [problemSearchQuery, setProblemSearchQuery] = useState("");
  const [problemDiffFilter, setProblemDiffFilter] = useState("All");
  const [editingProblem, setEditingProblem] = useState(null);
  const [isUpdatingProblem, setIsUpdatingProblem] = useState(false);

  // Tab 3: Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [processingUserId, setProcessingUserId] = useState(null);

  // Tab 4: Live Rooms State
  const [roomsList, setRoomsList] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [processingRoomId, setProcessingRoomId] = useState(null);

  // Tab 5: Create Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGeneratingTestCases, setIsAiGeneratingTestCases] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Medium",
    constraints: "",
    inputFormat: "",
    outputFormat: "",
    timeLimit: 2000,
    memoryLimit: 128,
    sampleTestCases: [{ input: "", output: "", explanation: "" }],
    hiddenTestCases: [{ input: "", output: "" }]
  });

  // Tab 6: LeetCode & AI Generator State
  const [leetCodeInput, setLeetCodeInput] = useState("");
  const [isImportingLeetCode, setIsImportingLeetCode] = useState(false);
  const [aiTopic, setAiTopic] = useState("Dynamic Programming");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Fetch Platform Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get("/users/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.warn("Failed to fetch platform stats:", err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Pending Proposals
  const fetchPendingProblems = async () => {
    setLoadingPending(true);
    try {
      const res = await apiClient.get("/problems/admin/pending");
      setPendingProblems(res.data.problems || []);
    } catch (err) {
      toast.error("Failed to load pending proposals");
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch All Problems
  const fetchAllProblems = async () => {
    setLoadingAllProblems(true);
    try {
      const res = await apiClient.get("/problems/admin/all");
      setAllProblems(res.data.problems || []);
    } catch (err) {
      toast.error("Failed to load all problems");
    } finally {
      setLoadingAllProblems(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiClient.get("/users/admin/all");
      setUsersList(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load users list");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Rooms
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await apiClient.get("/room/admin/all");
      setRoomsList(res.data.rooms || []);
    } catch (err) {
      toast.error("Failed to load active rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchPendingProblems();
    fetchAllProblems();
  }, []);

  // On Tab Switch, load specific tab data
  useEffect(() => {
    if (activeTab === "pending") fetchPendingProblems();
    if (activeTab === "allProblems") fetchAllProblems();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "rooms") fetchRooms();
  }, [activeTab]);

  // Approve Problem
  const handleApprove = async (id, title) => {
    setProcessingId(id);
    try {
      await apiClient.put(`/problems/${id}/approve`);
      toast.success(`🎉 Problem "${title}" approved and published to the live arena!`);
      setPendingProblems((prev) => prev.filter((p) => p._id !== id));
      if (previewProblem && previewProblem._id === id) setPreviewProblem(null);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve problem");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Problem
  const handleReject = async (id, title) => {
    setProcessingId(id);
    try {
      await apiClient.put(`/problems/${id}/reject`);
      toast.success(`Problem "${title}" rejected.`);
      setPendingProblems((prev) => prev.filter((p) => p._id !== id));
      if (previewProblem && previewProblem._id === id) setPreviewProblem(null);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject problem");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Problem
  const handleDeleteProblem = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    setProcessingId(id);
    try {
      await apiClient.delete(`/problems/${id}`);
      toast.success(`Problem "${title}" deleted from platform.`);
      setAllProblems((prev) => prev.filter((p) => p._id !== id));
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete problem");
    } finally {
      setProcessingId(null);
    }
  };

  // Save Problem Edit
  const handleSaveProblemEdit = async (e) => {
    e.preventDefault();
    if (!editingProblem) return;

    setIsUpdatingProblem(true);
    try {
      const res = await apiClient.put(`/problems/${editingProblem._id}`, editingProblem);
      toast.success(`Problem "${editingProblem.title}" updated successfully!`);
      setAllProblems((prev) => prev.map((p) => (p._id === editingProblem._id ? res.data.problem : p)));
      setEditingProblem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update problem");
    } finally {
      setIsUpdatingProblem(false);
    }
  };

  // Toggle User Role
  const handleToggleUserRole = async (userId, username, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change ${username}'s role to ${nextRole.toUpperCase()}?`)) return;

    setProcessingUserId(userId);
    try {
      await apiClient.put(`/users/admin/${userId}/role`, { role: nextRole });
      toast.success(`Updated ${username} to ${nextRole}`);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user account "${username}"? This cannot be undone.`)) return;

    setProcessingUserId(userId);
    try {
      await apiClient.delete(`/users/admin/${userId}`);
      toast.success(`User "${username}" deleted.`);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Terminate Live Room
  const handleTerminateRoom = async (roomId, roomName) => {
    if (!window.confirm(`Force close and delete room "${roomName}"?`)) return;

    setProcessingRoomId(roomId);
    try {
      await apiClient.delete(`/room/admin/${roomId}`);
      toast.success(`Room "${roomName}" closed.`);
      setRoomsList((prev) => prev.filter((r) => r.id !== roomId));
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to terminate room");
    } finally {
      setProcessingRoomId(null);
    }
  };

  // Import from LeetCode
  const handleImportFromLeetCode = async (e) => {
    e?.preventDefault();
    if (!leetCodeInput.trim()) {
      toast.error("Please enter a LeetCode problem URL or title");
      return;
    }

    setIsImportingLeetCode(true);
    try {
      const res = await apiClient.post("/ai/import-leetcode", {
        urlOrTitle: leetCodeInput.trim()
      });

      const { problem } = res.data;
      setFormData({
        title: problem.title || "",
        description: problem.description || "",
        difficulty: problem.difficulty || "Medium",
        constraints: problem.constraints || "",
        inputFormat: problem.inputFormat || "",
        outputFormat: problem.outputFormat || "",
        timeLimit: problem.timeLimit || 2000,
        memoryLimit: problem.memoryLimit || 128,
        sampleTestCases: problem.sampleTestCases?.length ? problem.sampleTestCases : [{ input: "", output: "", explanation: "" }],
        hiddenTestCases: problem.hiddenTestCases?.length ? problem.hiddenTestCases : [{ input: "", output: "" }]
      });

      toast.success(`🎉 Imported "${problem.title}" from LeetCode! Switched to editor.`);
      setActiveTab("create");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to import LeetCode problem");
    } finally {
      setIsImportingLeetCode(false);
    }
  };

  // AI Testcases generator
  const handleGenerateTestCasesWithAi = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please enter problem Title and Description first so AI knows what to test!");
      return;
    }

    setIsAiGeneratingTestCases(true);
    try {
      const res = await apiClient.post("/ai/generate-testcases", {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        constraints: formData.constraints
      });

      const { testCases } = res.data;
      setFormData((prev) => ({
        ...prev,
        constraints: testCases.constraints || prev.constraints,
        inputFormat: testCases.inputFormat || prev.inputFormat,
        outputFormat: testCases.outputFormat || prev.outputFormat,
        sampleTestCases: testCases.sampleTestCases?.length ? testCases.sampleTestCases : prev.sampleTestCases,
        hiddenTestCases: testCases.hiddenTestCases?.length ? testCases.hiddenTestCases : prev.hiddenTestCases
      }));

      toast.success("✨ AI generated complete test suite with verified outputs!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate AI test cases");
    } finally {
      setIsAiGeneratingTestCases(false);
    }
  };

  // AI Full Problem Generator
  const handleGenerateAiProblem = async (e) => {
    e.preventDefault();
    setIsAiGenerating(true);
    try {
      const res = await apiClient.post("/ai/generate-problem", {
        topic: aiTopic,
        difficulty: aiDifficulty
      });

      const generated = res.data.problem;
      setFormData({
        title: generated.title || "",
        description: generated.description || "",
        difficulty: generated.difficulty || "Medium",
        constraints: generated.constraints || "",
        inputFormat: generated.inputFormat || "",
        outputFormat: generated.outputFormat || "",
        timeLimit: 2000,
        memoryLimit: 128,
        sampleTestCases: generated.sampleTestCases?.length ? generated.sampleTestCases : [{ input: "", output: "", explanation: "" }],
        hiddenTestCases: generated.hiddenTestCases?.length ? generated.hiddenTestCases : [{ input: "", output: "" }]
      });

      toast.success("✨ AI generated new problem! Switched to editor.");
      setActiveTab("create");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate problem with AI");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Create Problem Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/problems", formData);
      toast.success(`🎉 Problem "${formData.title}" published to live arena!`);
      setFormData({
        title: "",
        description: "",
        difficulty: "Medium",
        constraints: "",
        inputFormat: "",
        outputFormat: "",
        timeLimit: 2000,
        memoryLimit: 128,
        sampleTestCases: [{ input: "", output: "", explanation: "" }],
        hiddenTestCases: [{ input: "", output: "" }]
      });
      fetchStats();
      setActiveTab("allProblems");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create problem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAllProblems = allProblems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(problemSearchQuery.toLowerCase());
    if (problemDiffFilter !== "All" && p.difficulty !== problemDiffFilter) return false;
    return matchesSearch;
  });

  const filteredUsers = usersList.filter((u) => {
    return (
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  });

  return (
    <div className="container py-3 py-md-4">
      {/* Top Banner */}
      <div className="clay-card p-3 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="row align-items-center g-3">
          <div className="col-12 col-lg-7">
            <div className="clay-badge mb-2 text-warning">
              <ShieldCheck size={16} />
              <span>Admin Command Center</span>
            </div>
            <h2 className="fw-bold mb-2">Platform Administration & Approvals</h2>
            <p className="text-muted mb-0" style={{ maxWidth: "600px" }}>
              Approve community problem proposals, manage challenges, oversee user accounts, and monitor live multiplayer arenas.
            </p>
          </div>
          <div className="col-12 col-lg-5 text-lg-end d-flex gap-2 justify-content-start justify-content-lg-end flex-wrap">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === "pending") fetchPendingProblems();
                if (activeTab === "allProblems") fetchAllProblems();
                if (activeTab === "users") fetchUsers();
                if (activeTab === "rooms") fetchRooms();
                toast.success("Refreshed all metrics!");
              }}
              className="clay-btn py-2 px-3 flex-fill flex-sm-grow-0 justify-content-center"
              title="Refresh all data"
            >
              <RefreshCw size={15} />
              <span>Refresh Data</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className="clay-btn clay-btn-primary py-2 px-3 flex-fill flex-sm-grow-0 justify-content-center"
            >
              <Plus size={16} />
              <span>Create Problem</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 PLATFORM METRICS CARDS */}
      <div className="row g-3 mb-4">
        {/* Pending Review Card */}
        <div className="col-6 col-md-3">
          <div 
            onClick={() => setActiveTab("pending")}
            className={`clay-card p-3 cursor-pointer h-100 ${pendingProblems.length > 0 ? "border-warning" : ""}`}
            style={{ cursor: "pointer", transition: "transform 0.2s" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-semibold text-muted">Pending Review</span>
              <Inbox size={18} className="text-warning" />
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold mb-0 text-warning">{pendingProblems.length}</h3>
              {pendingProblems.length > 0 && (
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill py-0 px-2 small">
                  Action Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Problems Card */}
        <div className="col-6 col-md-3">
          <div 
            onClick={() => setActiveTab("allProblems")}
            className="clay-card p-3 cursor-pointer h-100"
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-semibold text-muted">Total Problems</span>
              <Terminal size={18} className="text-primary" />
            </div>
            <h3 className="fw-bold mb-0 text-primary">{stats.totalProblems || allProblems.length}</h3>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="col-6 col-md-3">
          <div 
            onClick={() => setActiveTab("users")}
            className="clay-card p-3 cursor-pointer h-100"
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-semibold text-muted">Registered Coders</span>
              <Users size={18} className="text-success" />
            </div>
            <h3 className="fw-bold mb-0 text-success">{stats.totalUsers || usersList.length}</h3>
          </div>
        </div>

        {/* Active Multiplayer Rooms Card */}
        <div className="col-6 col-md-3">
          <div 
            onClick={() => setActiveTab("rooms")}
            className="clay-card p-3 cursor-pointer h-100"
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-semibold text-muted">Live Rooms</span>
              <Activity size={18} className="text-info" />
            </div>
            <h3 className="fw-bold mb-0 text-info">{stats.activeRooms || roomsList.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="clay-card p-2 mb-4">
        <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveTab("pending")}
            className={`clay-btn py-2 px-3 text-nowrap flex-shrink-0 ${activeTab === "pending" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.86rem" }}
          >
            <Inbox size={15} />
            <span>Pending Proposals ({pendingProblems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("allProblems")}
            className={`clay-btn py-2 px-3 text-nowrap flex-shrink-0 ${activeTab === "allProblems" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.86rem" }}
          >
            <Terminal size={15} />
            <span>Problem Repository ({allProblems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`clay-btn py-2 px-3 text-nowrap flex-shrink-0 ${activeTab === "users" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.86rem" }}
          >
            <Users size={15} />
            <span>User Accounts ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rooms")}
            className={`clay-btn py-2 px-3 text-nowrap flex-shrink-0 ${activeTab === "rooms" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.86rem" }}
          >
            <Activity size={15} />
            <span>Live Rooms ({roomsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`clay-btn py-2 px-3 text-nowrap flex-shrink-0 ${activeTab === "create" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.86rem" }}
          >
            <PlusCircle size={15} />
            <span>Create Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`clay-btn py-2 px-3 text-nowrap flex-shrink-0 ${activeTab === "ai" ? "clay-btn-ai" : ""}`}
            style={{ fontSize: "0.86rem" }}
          >
            <Sparkles size={15} />
            <span>AI & LeetCode Importer</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PENDING PROPOSALS & APPROVALS
          ========================================================================= */}
      {activeTab === "pending" && (
        <div className="d-flex flex-column gap-3">
          {loadingPending ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
              <h5 className="fw-semibold">Loading community proposals...</h5>
            </div>
          ) : pendingProblems.length === 0 ? (
            <div className="clay-card p-5 text-center">
              <div className="d-inline-flex p-3 rounded-circle text-success mb-3" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
                <CheckCircle2 size={36} />
              </div>
              <h5 className="fw-bold mb-1">All Caught Up!</h5>
              <p className="text-muted mb-0">There are no pending problem proposals waiting for review.</p>
            </div>
          ) : (
            pendingProblems.map((prob) => (
              <div key={prob._id} className="clay-card p-3 p-md-4">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                  <div className="flex-fill" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      <h5 className="fw-bold mb-0 text-truncate" style={{ color: "var(--text-primary)", maxWidth: "100%" }}>
                        {prob.title}
                      </h5>
                      <span className={`clay-badge ${
                        prob.difficulty === "Easy" ? "badge-easy" : prob.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                      }`}>
                        {prob.difficulty}
                      </span>
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill py-1 px-2 small">
                        ⏳ Pending Approval
                      </span>
                    </div>

                    <p className="text-muted small mb-3 text-truncate" style={{ maxWidth: "800px" }}>
                      {prob.description}
                    </p>

                    <div className="d-flex align-items-center gap-3 text-muted small flex-wrap">
                      <span><strong>Proposed By:</strong> {prob.createdBy?.username || "Community Coder"}</span>
                      <span><strong>Sample Cases:</strong> {prob.sampleTestCases?.length || 0}</span>
                      <span><strong>Hidden Cases:</strong> {prob.hiddenTestCases?.length || 0}</span>
                      <span><strong>Limits:</strong> {prob.timeLimit}ms / {prob.memoryLimit}MB</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0 w-100 w-md-auto justify-content-end">
                    <button
                      onClick={() => setPreviewProblem(prob)}
                      className="clay-btn py-2 px-3 flex-fill flex-md-grow-0 justify-content-center"
                    >
                      <Eye size={15} />
                      <span>Inspect Details</span>
                    </button>

                    <button
                      onClick={() => handleReject(prob._id, prob.title)}
                      disabled={processingId === prob._id}
                      className="clay-btn clay-btn-danger py-2 px-3 flex-fill flex-md-grow-0 justify-content-center"
                    >
                      <X size={15} />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(prob._id, prob.title)}
                      disabled={processingId === prob._id}
                      className="clay-btn clay-btn-success py-2 px-4 flex-fill flex-md-grow-0 justify-content-center text-white"
                    >
                      {processingId === prob._id ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Approve & Publish 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ALL PROBLEMS REPOSITORY MANAGER
          ========================================================================= */}
      {activeTab === "allProblems" && (
        <div>
          {/* Search & Filter Bar */}
          <div className="clay-card p-3 mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-7">
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Search problems by title..."
                    value={problemSearchQuery}
                    onChange={(e) => setProblemSearchQuery(e.target.value)}
                    className="clay-input ps-5"
                  />
                  <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                </div>
              </div>
              <div className="col-12 col-md-5 d-flex gap-2 justify-content-start justify-content-md-end flex-wrap">
                {["All", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setProblemDiffFilter(diff)}
                    className={`clay-btn flex-fill flex-md-grow-0 py-2 px-3 small ${problemDiffFilter === diff ? "clay-btn-primary" : ""}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Problems List */}
          {loadingAllProblems ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
              <h5 className="fw-semibold">Loading problems repository...</h5>
            </div>
          ) : filteredAllProblems.length === 0 ? (
            <div className="clay-card p-5 text-center">
              <h5 className="fw-bold mb-1">No problems found</h5>
              <p className="text-muted">Try changing your search query or create a new challenge.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredAllProblems.map((prob) => (
                <div key={prob._id} className="clay-card p-3 p-md-4">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="flex-fill" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h5 className="fw-bold mb-0 text-truncate" style={{ color: "var(--text-primary)", maxWidth: "100%" }}>
                          {prob.title}
                        </h5>
                        <span className={`clay-badge ${
                          prob.difficulty === "Easy" ? "badge-easy" : prob.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                        }`}>
                          {prob.difficulty}
                        </span>
                        <span className={`badge ${prob.isApproved !== false ? "bg-success-subtle text-success border border-success-subtle" : "bg-danger-subtle text-danger border border-danger-subtle"} rounded-pill py-0 px-2 small`}>
                          {prob.isApproved !== false ? "● Published" : "● Rejected"}
                        </span>
                      </div>

                      <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: "700px" }}>
                        {prob.description}
                      </p>

                      <div className="d-flex align-items-center gap-3 text-muted small flex-wrap">
                        <span><strong>Samples:</strong> {prob.sampleTestCases?.length || 0}</span>
                        <span><strong>Hidden:</strong> {prob.hiddenTestCases?.length || 0}</span>
                        <span><strong>Limits:</strong> {prob.timeLimit}ms / {prob.memoryLimit}MB</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0 w-100 w-md-auto justify-content-end">
                      <Link
                        to={`/problems/${prob._id}`}
                        target="_blank"
                        className="clay-btn py-2 px-3 flex-fill flex-md-grow-0 justify-content-center"
                        title="Open in Workspace"
                      >
                        <ExternalLink size={15} />
                        <span>Workspace</span>
                      </Link>

                      <button
                        onClick={() => setEditingProblem(prob)}
                        className="clay-btn py-2 px-3 flex-fill flex-md-grow-0 justify-content-center"
                        title="Edit Problem"
                      >
                        <Edit3 size={15} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProblem(prob._id, prob.title)}
                        disabled={processingId === prob._id}
                        className="clay-btn clay-btn-danger py-2 px-3 flex-fill flex-md-grow-0 justify-content-center"
                        title="Delete Problem"
                      >
                        <Trash2 size={15} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: USER ACCOUNTS MANAGER
          ========================================================================= */}
      {activeTab === "users" && (
        <div>
          <div className="clay-card p-3 mb-3">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="clay-input ps-5"
              />
              <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
              <h5 className="fw-semibold">Loading user accounts...</h5>
            </div>
          ) : (
            <div className="clay-card p-3 p-md-4 table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ color: "var(--text-primary)" }}>
                <thead>
                  <tr className="text-muted small border-bottom" style={{ borderColor: "var(--border-glass)" }}>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Solved Challenges</th>
                    <th>Current Streak</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-bottom" style={{ borderColor: "var(--border-glass)" }}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-2 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", fontSize: "0.8rem", fontWeight: 700 }}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <strong>{u.username}</strong>
                        </div>
                      </td>
                      <td className="text-muted small">{u.email}</td>
                      <td>
                        <span className={`clay-badge ${u.role === "admin" ? "text-warning border-warning" : "text-primary"}`} style={{ fontSize: "0.75rem" }}>
                          {u.role === "admin" ? "🛡️ Admin" : "Coder"}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary py-1 px-2">{u.solvedCount || 0} Solved</span>
                      </td>
                      <td>
                        <span className="text-warning small fw-bold">🔥 {u.streakCount || 0} Days</span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <button
                            onClick={() => handleToggleUserRole(u.id, u.username, u.role)}
                            disabled={processingUserId === u.id}
                            className={`clay-btn py-1 px-2 small ${u.role === "admin" ? "text-warning" : "clay-btn-primary"}`}
                            style={{ fontSize: "0.75rem" }}
                            title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          >
                            {u.role === "admin" ? "Demote to Coder" : "Promote to Admin 🛡️"}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={processingUserId === u.id}
                            className="clay-btn clay-btn-danger p-1"
                            style={{ width: "28px", height: "28px", borderRadius: "6px" }}
                            title="Delete user account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: LIVE MULTIPLAYER ROOMS OVERSEER
          ========================================================================= */}
      {activeTab === "rooms" && (
        <div>
          {loadingRooms ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
              <h5 className="fw-semibold">Loading live rooms...</h5>
            </div>
          ) : roomsList.length === 0 ? (
            <div className="clay-card p-5 text-center">
              <Activity size={40} className="text-muted mb-2" />
              <h5 className="fw-bold mb-1">No Active Rooms</h5>
              <p className="text-muted mb-0">There are currently no active collaborative rooms running.</p>
            </div>
          ) : (
            <div className="row g-3">
              {roomsList.map((room) => (
                <div key={room.id} className="col-12 col-md-6">
                  <div className="clay-card p-3 p-md-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h5 className="fw-bold mb-0 text-truncate" style={{ color: "var(--text-primary)", maxWidth: "60%" }}>
                          {room.name}
                        </h5>
                        <div className="clay-badge font-monospace text-primary fw-bold" style={{ fontSize: "0.78rem" }}>
                          <Hash size={12} />
                          <span>{room.roomCode}</span>
                        </div>
                      </div>

                      <div className="text-muted small mb-3">
                        <div><strong>Host:</strong> {room.host} ({room.hostEmail || "Coder"})</div>
                        <div><strong>Active Online:</strong> {room.liveCount || 1} participant(s)</div>
                        <div><strong>Challenges:</strong> {room.problems?.length || 0} attached</div>
                        {room.isPrivate && <div className="text-warning mt-1">🔒 Locked (PIN: {room.passcode})</div>}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Link
                        to={`/room/${room.id}`}
                        target="_blank"
                        className="clay-btn clay-btn-primary py-2 px-3 flex-fill justify-content-center"
                      >
                        <ExternalLink size={15} />
                        <span>Enter Room 🚀</span>
                      </Link>

                      <button
                        onClick={() => handleTerminateRoom(room.id, room.name)}
                        disabled={processingRoomId === room.id}
                        className="clay-btn clay-btn-danger py-2 px-3 flex-shrink-0"
                        title="Force terminate room"
                      >
                        <Trash2 size={15} />
                        <span>Terminate</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: CREATE CHALLENGE FORM (MANUAL + AI TEST CASES)
          ========================================================================= */}
      {activeTab === "create" && (
        <div className="clay-card p-3 p-md-5">
          <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-4" style={{ borderColor: "var(--border-glass)" }}>
            <div className="d-flex align-items-center gap-2">
              <PlusCircle size={22} className="text-primary" />
              <h4 className="fw-bold mb-0">Create & Publish Challenge</h4>
            </div>

            <button
              type="button"
              onClick={handleGenerateTestCasesWithAi}
              disabled={isAiGeneratingTestCases}
              className="clay-btn clay-btn-ai py-2 px-3"
            >
              {isAiGeneratingTestCases ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>AI Generating Test Cases...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Auto-Generate Test Suite with AI</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="d-flex flex-column gap-3">
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <label className="form-label small fw-semibold">Problem Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Valid Parentheses Combination"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="clay-input"
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Difficulty Level</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="clay-input"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label small fw-semibold">Problem Statement Description</label>
              <textarea
                name="description"
                rows={4}
                placeholder="Describe the algorithmic problem clearly with edge cases..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="clay-input"
                required
              />
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Input Format</label>
                <input
                  type="text"
                  name="inputFormat"
                  placeholder="e.g. Array of integers 'nums' and integer 'target'"
                  value={formData.inputFormat}
                  onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                  className="clay-input"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Output Format</label>
                <input
                  type="text"
                  name="outputFormat"
                  placeholder="e.g. Indices of the two numbers in ascending order"
                  value={formData.outputFormat}
                  onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                  className="clay-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label small fw-semibold">Constraints</label>
              <textarea
                name="constraints"
                rows={2}
                placeholder="e.g. 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9"
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                className="clay-input font-monospace"
              />
            </div>

            {/* Limits */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Time Limit (Milliseconds)</label>
                <input
                  type="number"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  className="clay-input"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Memory Limit (MB)</label>
                <input
                  type="number"
                  name="memoryLimit"
                  value={formData.memoryLimit}
                  onChange={(e) => setFormData({ ...formData, memoryLimit: e.target.value })}
                  className="clay-input"
                />
              </div>
            </div>

            {/* Sample Testcases */}
            <div className="mt-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label small fw-semibold mb-0">Sample Test Cases (Visible to Coders)</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sampleTestCases: [...formData.sampleTestCases, { input: "", output: "", explanation: "" }] })}
                  className="clay-btn py-1 px-2 small"
                >
                  <Plus size={13} />
                  <span>Add Sample Case</span>
                </button>
              </div>

              {formData.sampleTestCases.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-3 mb-2" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="small">Sample Case #{idx + 1}</strong>
                    {formData.sampleTestCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sampleTestCases: formData.sampleTestCases.filter((_, i) => i !== idx) })}
                        className="clay-btn p-1 text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        placeholder="Input: [2,7,11,15], target = 9"
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...formData.sampleTestCases];
                          updated[idx].input = e.target.value;
                          setFormData({ ...formData, sampleTestCases: updated });
                        }}
                        className="clay-input py-1 font-monospace"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        placeholder="Expected Output: [0,1]"
                        value={tc.output}
                        onChange={(e) => {
                          const updated = [...formData.sampleTestCases];
                          updated[idx].output = e.target.value;
                          setFormData({ ...formData, sampleTestCases: updated });
                        }}
                        className="clay-input py-1 font-monospace"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hidden Testcases */}
            <div className="mt-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label small fw-semibold mb-0">Hidden Test Cases (For Automated Judge Evaluation)</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hiddenTestCases: [...formData.hiddenTestCases, { input: "", output: "" }] })}
                  className="clay-btn py-1 px-2 small"
                >
                  <Plus size={13} />
                  <span>Add Hidden Case</span>
                </button>
              </div>

              {formData.hiddenTestCases.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-3 mb-2" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="small text-muted">Hidden Case #{idx + 1}</strong>
                    {formData.hiddenTestCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hiddenTestCases: formData.hiddenTestCases.filter((_, i) => i !== idx) })}
                        className="clay-btn p-1 text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        placeholder="Hidden Input: [3,2,4], target = 6"
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...formData.hiddenTestCases];
                          updated[idx].input = e.target.value;
                          setFormData({ ...formData, hiddenTestCases: updated });
                        }}
                        className="clay-input py-1 font-monospace"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        placeholder="Hidden Output: [1,2]"
                        value={tc.output}
                        onChange={(e) => {
                          const updated = [...formData.hiddenTestCases];
                          updated[idx].output = e.target.value;
                          setFormData({ ...formData, hiddenTestCases: updated });
                        }}
                        className="clay-input py-1 font-monospace"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: "var(--border-glass)" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn clay-btn-primary py-2 px-5"
              >
                {isSubmitting ? "Publishing to Arena..." : "Publish Challenge 🚀"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 6: AI & LEETCODE PROBLEM IMPORTER
          ========================================================================= */}
      {activeTab === "ai" && (
        <div className="row g-4">
          {/* LeetCode 1-Click Import Card */}
          <div className="col-12 col-lg-6">
            <div className="clay-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Globe size={22} className="text-warning" />
                  <h4 className="fw-bold mb-0">1-Click LeetCode Importer</h4>
                </div>
                <p className="text-muted small mb-4">
                  Paste any LeetCode problem URL or slug (e.g. <code>https://leetcode.com/problems/trapping-rain-water/</code> or <code>two-sum</code>) to automatically extract title, descriptions, constraints, and testcases!
                </p>

                <form onSubmit={handleImportFromLeetCode} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-semibold">LeetCode URL or Slug</label>
                    <input
                      type="text"
                      placeholder="e.g. https://leetcode.com/problems/course-schedule/"
                      value={leetCodeInput}
                      onChange={(e) => setLeetCodeInput(e.target.value)}
                      className="clay-input font-monospace"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isImportingLeetCode}
                    className="clay-btn clay-btn-primary py-2 px-4 justify-content-center"
                  >
                    {isImportingLeetCode ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Scraping & Importing LeetCode Problem...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Import to Editor 🚀</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* AI Generator by Topic Card */}
          <div className="col-12 col-lg-6">
            <div className="clay-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Sparkles size={22} className="text-primary" />
                  <h4 className="fw-bold mb-0">AI SDE Challenge Synthesizer</h4>
                </div>
                <p className="text-muted small mb-4">
                  Generate novel FAANG-level coding interview challenges based on DSA topic and difficulty with verified automated test suites.
                </p>

                <form onSubmit={handleGenerateAiProblem} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-semibold">Target DSA Topic</label>
                    <select
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="clay-input"
                    >
                      <option value="Dynamic Programming">Dynamic Programming (DP)</option>
                      <option value="Two Pointers & Sliding Window">Two Pointers & Sliding Window</option>
                      <option value="Trees & Binary Search Trees">Trees & Binary Search Trees</option>
                      <option value="Graphs (BFS, DFS, Dijkstra)">Graphs (BFS, DFS, Dijkstra)</option>
                      <option value="Tries & String Hashing">Tries & String Hashing</option>
                      <option value="Bit Manipulation">Bit Manipulation</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label small fw-semibold">Difficulty</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="clay-input"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAiGenerating}
                    className="clay-btn clay-btn-ai py-2 px-4 justify-content-center text-white"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>AI Synthesizing Problem & Testcases...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Synthesize New Challenge ✨</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INSPECT / PREVIEW PROPOSAL MODAL
          ========================================================================= */}
      {previewProblem && (
        <div className="glass-modal-backdrop" onClick={() => setPreviewProblem(null)}>
          <div className="glass-modal-content p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px" }}>
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3" style={{ borderColor: "var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold mb-0">{previewProblem.title}</h5>
                <span className={`clay-badge ${
                  previewProblem.difficulty === "Easy" ? "badge-easy" : previewProblem.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                }`}>
                  {previewProblem.difficulty}
                </span>
              </div>
              <button onClick={() => setPreviewProblem(null)} className="clay-btn p-1" style={{ width: "32px", height: "32px", borderRadius: "8px" }}>
                <X size={16} />
              </button>
            </div>

            <div className="d-flex flex-column gap-3" style={{ maxHeight: "65vh", overflowY: "auto" }}>
              <div>
                <strong>Description:</strong>
                <p className="mt-1 small" style={{ whiteSpace: "pre-wrap" }}>{previewProblem.description}</p>
              </div>

              {previewProblem.constraints && (
                <div>
                  <strong>Constraints:</strong>
                  <pre className="p-2 rounded bg-dark text-light small mt-1 font-monospace">{previewProblem.constraints}</pre>
                </div>
              )}

              {previewProblem.sampleTestCases?.length > 0 && (
                <div>
                  <strong>Sample Test Cases:</strong>
                  {previewProblem.sampleTestCases.map((tc, i) => (
                    <div key={i} className="p-2 rounded mt-1 small font-monospace" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                      <div>Input: <code>{tc.input}</code></div>
                      <div>Expected: <code>{tc.output}</code></div>
                    </div>
                  ))}
                </div>
              )}

              {previewProblem.hiddenTestCases?.length > 0 && (
                <div>
                  <strong>Hidden Test Cases:</strong>
                  {previewProblem.hiddenTestCases.map((tc, i) => (
                    <div key={i} className="p-2 rounded mt-1 small font-monospace" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                      <div>Input: <code>{tc.input}</code></div>
                      <div>Expected: <code>{tc.output}</code></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: "var(--border-glass)" }}>
              <button
                onClick={() => handleReject(previewProblem._id, previewProblem.title)}
                disabled={processingId === previewProblem._id}
                className="clay-btn clay-btn-danger py-2 px-3"
              >
                Reject Proposal
              </button>
              <button
                onClick={() => handleApprove(previewProblem._id, previewProblem.title)}
                disabled={processingId === previewProblem._id}
                className="clay-btn clay-btn-success py-2 px-4 text-white"
              >
                Approve & Publish to Arena 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT PROBLEM MODAL
          ========================================================================= */}
      {editingProblem && (
        <div className="glass-modal-backdrop" onClick={() => setEditingProblem(null)}>
          <div className="glass-modal-content p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px" }}>
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3" style={{ borderColor: "var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-2">
                <Edit3 size={20} className="text-primary" />
                <h5 className="fw-bold mb-0">Edit Challenge: {editingProblem.title}</h5>
              </div>
              <button onClick={() => setEditingProblem(null)} className="clay-btn p-1" style={{ width: "32px", height: "32px", borderRadius: "8px" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProblemEdit} className="d-flex flex-column gap-3" style={{ maxHeight: "68vh", overflowY: "auto" }}>
              <div className="row g-2">
                <div className="col-8">
                  <label className="form-label small fw-semibold">Title</label>
                  <input
                    type="text"
                    value={editingProblem.title}
                    onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                    className="clay-input"
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold">Difficulty</label>
                  <select
                    value={editingProblem.difficulty}
                    onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value })}
                    className="clay-input"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label small fw-semibold">Description</label>
                <textarea
                  rows={4}
                  value={editingProblem.description}
                  onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                  className="clay-input"
                  required
                />
              </div>

              <div>
                <label className="form-label small fw-semibold">Constraints</label>
                <textarea
                  rows={2}
                  value={editingProblem.constraints || ""}
                  onChange={(e) => setEditingProblem({ ...editingProblem, constraints: e.target.value })}
                  className="clay-input font-monospace"
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small fw-semibold">Time Limit (ms)</label>
                  <input
                    type="number"
                    value={editingProblem.timeLimit || 2000}
                    onChange={(e) => setEditingProblem({ ...editingProblem, timeLimit: e.target.value })}
                    className="clay-input"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Memory Limit (MB)</label>
                  <input
                    type="number"
                    value={editingProblem.memoryLimit || 128}
                    onChange={(e) => setEditingProblem({ ...editingProblem, memoryLimit: e.target.value })}
                    className="clay-input"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: "var(--border-glass)" }}>
                <button type="button" onClick={() => setEditingProblem(null)} className="clay-btn py-2 px-3">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdatingProblem} className="clay-btn clay-btn-primary py-2 px-4">
                  {isUpdatingProblem ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProblemPage;
