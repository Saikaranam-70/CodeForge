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
  Download
} from "lucide-react";
import toast from "react-hot-toast";

const AdminProblemPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'create' | 'ai'
  
  // Pending Proposals State
  const [pendingProblems, setPendingProblems] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // LeetCode Import State
  const [leetCodeInput, setLeetCodeInput] = useState("");
  const [isImportingLeetCode, setIsImportingLeetCode] = useState(false);

  // Form State
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
    sampleTestCases: [
      { input: "", output: "", explanation: "" }
    ],
    hiddenTestCases: [
      { input: "", output: "" }
    ]
  });

  // AI Modal State
  const [aiTopic, setAiTopic] = useState("Dynamic Programming");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Fetch pending proposals
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

  useEffect(() => {
    fetchPendingProblems();
  }, []);

  const handleApprove = async (id, title) => {
    setProcessingId(id);
    try {
      await apiClient.put(`/problems/${id}/approve`);
      toast.success(`🎉 Problem "${title}" approved and published to arena!`);
      setPendingProblems((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve problem");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, title) => {
    setProcessingId(id);
    try {
      await apiClient.put(`/problems/${id}/reject`);
      toast.success(`Problem "${title}" rejected.`);
      setPendingProblems((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject problem");
    } finally {
      setProcessingId(null);
    }
  };

  // Import directly from LeetCode
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
        sampleTestCases: problem.sampleTestCases && problem.sampleTestCases.length > 0 
          ? problem.sampleTestCases 
          : [{ input: "", output: "", explanation: "" }],
        hiddenTestCases: problem.hiddenTestCases && problem.hiddenTestCases.length > 0 
          ? problem.hiddenTestCases 
          : [{ input: "", output: "" }]
      });

      toast.success(`🎉 Imported "${problem.title}" from LeetCode! Switched to editor.`);
      setActiveTab("create");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to import LeetCode problem");
    } finally {
      setIsImportingLeetCode(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Sample Testcase handlers
  const handleSampleChange = (index, field, value) => {
    const updated = [...formData.sampleTestCases];
    updated[index][field] = value;
    setFormData({ ...formData, sampleTestCases: updated });
  };

  const addSampleTestCase = () => {
    setFormData({
      ...formData,
      sampleTestCases: [...formData.sampleTestCases, { input: "", output: "", explanation: "" }]
    });
  };

  const removeSampleTestCase = (index) => {
    if (formData.sampleTestCases.length <= 1) return;
    setFormData({
      ...formData,
      sampleTestCases: formData.sampleTestCases.filter((_, i) => i !== index)
    });
  };

  // Hidden Testcase handlers
  const handleHiddenChange = (index, field, value) => {
    const updated = [...formData.hiddenTestCases];
    updated[index][field] = value;
    setFormData({ ...formData, hiddenTestCases: updated });
  };

  const addHiddenTestCase = () => {
    setFormData({
      ...formData,
      hiddenTestCases: [...formData.hiddenTestCases, { input: "", output: "" }]
    });
  };

  const removeHiddenTestCase = (index) => {
    if (formData.hiddenTestCases.length <= 1) return;
    setFormData({
      ...formData,
      hiddenTestCases: formData.hiddenTestCases.filter((_, i) => i !== index)
    });
  };

  // AI Test Cases & Verified Answers Generator
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
        sampleTestCases: testCases.sampleTestCases && testCases.sampleTestCases.length > 0 
          ? testCases.sampleTestCases 
          : prev.sampleTestCases,
        hiddenTestCases: testCases.hiddenTestCases && testCases.hiddenTestCases.length > 0 
          ? testCases.hiddenTestCases 
          : prev.hiddenTestCases
      }));

      toast.success("✨ AI generated complete test suite with verified outputs!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate AI test cases");
    } finally {
      setIsAiGeneratingTestCases(false);
    }
  };

  // AI Full Problem Generation
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
        timeLimit: generated.timeLimit || 2000,
        memoryLimit: generated.memoryLimit || 128,
        sampleTestCases: generated.sampleTestCases || [{ input: "", output: "", explanation: "" }],
        hiddenTestCases: generated.hiddenTestCases || [{ input: "", output: "" }]
      });

      toast.success("AI generated the complete problem! Switched to editor.");
      setActiveTab("create");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate problem via AI");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Submit Problem
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please provide problem title and description");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/problems", formData);
      toast.success("Problem published directly to arena!");
      navigate(`/problems/${res.data.problemId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create problem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="clay-card p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="row align-items-center">
          <div className="col-12 col-lg-8">
            <div className="clay-badge mb-3 text-warning">
              <ShieldCheck size={16} />
              <span>CodeForge Admin Operations</span>
            </div>
            <h2 className="fw-bold mb-2">Admin Problem Control Hub</h2>
            <p className="text-muted mb-0" style={{ maxWidth: "650px" }}>
              Review and approve community problems, import any challenge directly from LeetCode, or synthesize automated test cases with AI.
            </p>
          </div>
          <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0 d-flex gap-2 justify-content-lg-end flex-wrap">
            <button
              onClick={() => setActiveTab("ai")}
              className="clay-btn clay-btn-ai py-2 px-4"
            >
              <Sparkles size={18} />
              <span>AI Problem Setter</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 LEETCODE DIRECT IMPORT BAR */}
      <div className="clay-card p-4 mb-4" style={{ border: "1px solid rgba(245, 158, 11, 0.35)", background: "var(--bg-glass)" }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="clay-badge text-warning font-monospace fw-bold" style={{ fontSize: "0.85rem" }}>
            <Globe size={14} />
            <span>LeetCode Direct Import</span>
          </div>
          <span className="text-muted small">Fetch any official problem, description, constraints & hidden testcases</span>
        </div>

        <form onSubmit={handleImportFromLeetCode} className="row g-2 align-items-center">
          <div className="col-12 col-md-9">
            <input
              type="text"
              placeholder="e.g. https://leetcode.com/problems/container-with-most-water/ OR 3Sum OR Trapping Rain Water"
              value={leetCodeInput}
              onChange={(e) => setLeetCodeInput(e.target.value)}
              className="clay-input py-2"
            />
          </div>
          <div className="col-12 col-md-3">
            <button
              type="submit"
              disabled={isImportingLeetCode}
              className="clay-btn clay-btn-primary w-100 py-2 justify-content-center text-warning"
              style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.4)" }}
            >
              {isImportingLeetCode ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Import from LeetCode</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tab Navigation */}
      <div className="d-flex gap-2 mb-4 p-1 rounded-3" style={{ background: "var(--bg-glass)" }}>
        <button
          onClick={() => { setActiveTab("pending"); fetchPendingProblems(); }}
          className={`clay-btn flex-fill py-2 ${activeTab === "pending" ? "clay-btn-primary" : ""}`}
        >
          <Inbox size={16} />
          <span>Pending Approvals ({pendingProblems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`clay-btn flex-fill py-2 ${activeTab === "create" ? "clay-btn-primary" : ""}`}
        >
          <PlusCircle size={16} />
          <span>Create / Publish Challenge</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`clay-btn flex-fill py-2 ${activeTab === "ai" ? "clay-btn-primary" : ""}`}
        >
          <Sparkles size={16} />
          <span>AI Generator Studio</span>
        </button>
      </div>

      {/* TAB 1: PENDING COMMUNITY APPROVALS */}
      {activeTab === "pending" && (
        <div>
          {loadingPending ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
              <h5 className="fw-semibold">Loading pending proposals...</h5>
            </div>
          ) : pendingProblems.length === 0 ? (
            <div className="clay-card p-5 text-center">
              <CheckCircle2 size={48} className="text-success mb-3" />
              <h5 className="fw-bold mb-2">No pending problem proposals</h5>
              <p className="text-muted mb-3">All community problem submissions have been reviewed and approved!</p>
              <button onClick={() => setActiveTab("create")} className="clay-btn clay-btn-primary py-2 px-4">
                <Plus size={16} />
                <span>Create New Challenge</span>
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {pendingProblems.map((prob) => (
                <div key={prob._id} className="col-12">
                  <div className="clay-card p-4">
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h4 className="fw-bold mb-0">{prob.title}</h4>
                          <span className={`clay-badge ${
                            prob.difficulty === "Easy" ? "badge-easy" : prob.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                          }`}>
                            {prob.difficulty}
                          </span>
                        </div>
                        <div className="small text-muted">
                          Proposed by: <strong>{prob.createdBy?.username || "Community Coder"}</strong> • Submitted: {new Date(prob.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => handleReject(prob._id, prob.title)}
                          disabled={processingId === prob._id}
                          className="clay-btn clay-btn-danger py-2 px-3"
                          style={{ fontSize: "0.85rem" }}
                        >
                          <X size={15} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleApprove(prob._id, prob.title)}
                          disabled={processingId === prob._id}
                          className="clay-btn clay-btn-primary py-2 px-4"
                          style={{ fontSize: "0.85rem" }}
                        >
                          {processingId === prob._id ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <>
                              <Check size={15} />
                              <span>Approve & Publish to Arena</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Problem Statement Preview */}
                    <div className="p-3 rounded-3 mb-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                      <div className="fw-semibold small mb-1">Description:</div>
                      <p className="small mb-2" style={{ whiteSpace: "pre-wrap" }}>{prob.description}</p>

                      {prob.constraints && (
                        <div>
                          <div className="fw-semibold small mb-1">Constraints:</div>
                          <pre className="p-2 rounded bg-dark text-light small mb-2 font-monospace">{prob.constraints}</pre>
                        </div>
                      )}

                      <div className="row g-2 mt-2">
                        <div className="col-12 col-md-6">
                          <span className="small text-muted">Public Sample Cases: <strong>{prob.sampleTestCases?.length || 0}</strong></span>
                        </div>
                        <div className="col-12 col-md-6">
                          <span className="small text-muted">Hidden Judging Cases: <strong>{prob.hiddenTestCases?.length || 0}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL PROBLEM CREATOR WITH AI TESTCASE SYNTHESIS */}
      {activeTab === "create" && (
        <form onSubmit={handleSubmit} className="clay-card p-4 p-md-5 d-flex flex-column gap-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3 border-bottom" style={{ borderColor: "var(--border-glass)" }}>
            <div>
              <h4 className="fw-bold mb-1">Publish New Challenge</h4>
              <small className="text-muted">Will publish immediately to the live public problem arena</small>
            </div>
            <button
              type="button"
              onClick={handleGenerateTestCasesWithAi}
              disabled={isAiGeneratingTestCases}
              className="clay-btn clay-btn-ai py-2 px-3"
              style={{ fontSize: "0.85rem" }}
            >
              {isAiGeneratingTestCases ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Synthesizing Testcases...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>🤖 Synthesize Testcases with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Basic Info */}
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label small fw-semibold text-muted">Problem Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Trapping Rain Water"
                className="clay-input"
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted">Difficulty Level</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="clay-input"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label small fw-semibold text-muted">Problem Statement (Markdown Supported)</label>
            <textarea
              name="description"
              rows="6"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Explain the problem clearly with background, rules, and notes..."
              className="clay-input"
              required
            />
          </div>

          {/* Limits & Constraints */}
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted">Constraints</label>
              <textarea
                name="constraints"
                rows="3"
                value={formData.constraints}
                onChange={handleInputChange}
                placeholder="1 <= nums.length <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
                className="clay-input"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted">Input Format</label>
              <textarea
                name="inputFormat"
                rows="3"
                value={formData.inputFormat}
                onChange={handleInputChange}
                placeholder="First line integer N, second line array..."
                className="clay-input"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted">Output Format</label>
              <textarea
                name="outputFormat"
                rows="3"
                value={formData.outputFormat}
                onChange={handleInputChange}
                placeholder="Return the maximum computed answer..."
                className="clay-input"
              />
            </div>
          </div>

          {/* Sample Test Cases */}
          <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold mb-0">Public Sample Test Cases</h5>
              <button
                type="button"
                onClick={addSampleTestCase}
                className="clay-btn py-1 px-3"
                style={{ fontSize: "0.85rem" }}
              >
                <Plus size={15} />
                <span>Add Sample</span>
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {formData.sampleTestCases.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="small">Sample Case #{idx + 1}</strong>
                    {formData.sampleTestCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSampleTestCase(idx)}
                        className="clay-btn p-1 text-danger"
                        style={{ width: "28px", height: "28px" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-md-5">
                      <label className="small text-muted">Input</label>
                      <textarea
                        rows="2"
                        value={tc.input}
                        onChange={(e) => handleSampleChange(idx, "input", e.target.value)}
                        className="clay-input font-monospace small"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-5">
                      <label className="small text-muted">Output</label>
                      <textarea
                        rows="2"
                        value={tc.output}
                        onChange={(e) => handleSampleChange(idx, "output", e.target.value)}
                        className="clay-input font-monospace small text-success"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="small text-muted">Explanation</label>
                      <textarea
                        rows="2"
                        value={tc.explanation}
                        onChange={(e) => handleSampleChange(idx, "explanation", e.target.value)}
                        className="clay-input small"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Test Cases */}
          <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold mb-0">Hidden Judging Test Cases</h5>
              <button
                type="button"
                onClick={addHiddenTestCase}
                className="clay-btn py-1 px-3"
                style={{ fontSize: "0.85rem" }}
              >
                <Plus size={15} />
                <span>Add Hidden Case</span>
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {formData.hiddenTestCases.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="small text-danger">🔒 Hidden Case #{idx + 1}</strong>
                    {formData.hiddenTestCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHiddenTestCase(idx)}
                        className="clay-btn p-1 text-danger"
                        style={{ width: "28px", height: "28px" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="small text-muted">Hidden Input</label>
                      <textarea
                        rows="2"
                        value={tc.input}
                        onChange={(e) => handleHiddenChange(idx, "input", e.target.value)}
                        className="clay-input font-monospace small"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="small text-muted">Hidden Output</label>
                      <textarea
                        rows="2"
                        value={tc.output}
                        onChange={(e) => handleHiddenChange(idx, "output", e.target.value)}
                        className="clay-input font-monospace small text-success"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: "var(--border-glass)" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn clay-btn-primary py-3 px-5 fs-6"
            >
              {isSubmitting ? (
                <span>Publishing Problem...</span>
              ) : (
                <>
                  <Save size={18} />
                  <span>Publish Problem to Arena</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: AI PROBLEM SETTER STUDIO */}
      {activeTab === "ai" && (
        <div className="clay-card p-4 p-md-5" style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <Sparkles size={24} className="text-warning" />
            <h4 className="fw-bold mb-0">AI LeetCode Problem Setter</h4>
          </div>
          <p className="text-muted mb-4">
            Select an algorithmic topic and target difficulty. The AI engine will write the full problem story, formal constraints, input/output formats, sample cases, and multiple hidden test cases with verified outputs.
          </p>

          <form onSubmit={handleGenerateAiProblem} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small fw-semibold text-muted">Topic / Data Structure</label>
              <select
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="clay-input"
              >
                <option value="Dynamic Programming">Dynamic Programming (DP)</option>
                <option value="Binary Search">Binary Search</option>
                <option value="Graphs & Shortest Path">Graphs (BFS / DFS / Dijkstra)</option>
                <option value="Two Pointers & Sliding Window">Two Pointers & Sliding Window</option>
                <option value="Monotonic Stack & Queue">Monotonic Stack & Queue</option>
                <option value="Trees & Binary Search Trees">Trees & BST</option>
                <option value="Backtracking & Recursion">Backtracking & Recursion</option>
                <option value="Greedy Algorithms">Greedy Algorithms</option>
              </select>
            </div>

            <div>
              <label className="form-label small fw-semibold text-muted">Difficulty</label>
              <div className="d-flex gap-2">
                {["Easy", "Medium", "Hard"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAiDifficulty(d)}
                    className={`clay-btn flex-fill py-2 ${aiDifficulty === d ? "clay-btn-primary" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isAiGenerating}
              className="clay-btn clay-btn-ai py-3 px-4 mt-3 justify-content-center"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Synthesizing Algorithmic Problem...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Synthesize Full Problem</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProblemPage;
