import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import { useAuthStore } from "../store/authStore";
import { 
  PlusCircle, 
  Sparkles, 
  Trash2, 
  Plus, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  X, 
  ShieldCheck, 
  ExternalLink,
  Download,
  Zap,
  Globe
} from "lucide-react";
import toast from "react-hot-toast";

const CreateProblemPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGeneratingTestCases, setIsAiGeneratingTestCases] = useState(false);
  const [isImportingLeetCode, setIsImportingLeetCode] = useState(false);
  const [leetCodeInput, setLeetCodeInput] = useState("");

  // Form State
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

      toast.success(`🎉 Imported "${problem.title}" from LeetCode! Form auto-filled.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to import LeetCode problem");
    } finally {
      setIsImportingLeetCode(false);
    }
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

      toast.success("✨ AI generated comprehensive testcases and verified outputs!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate AI test cases");
    } finally {
      setIsAiGeneratingTestCases(false);
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
      const targetEndpoint = user?.role === "admin" ? "/problems" : "/problems/propose";
      const res = await apiClient.post(targetEndpoint, formData);
      if (res.data.isApproved) {
        toast.success("Problem published directly to arena!");
        navigate(`/problems/${res.data.problemId}`);
      } else {
        toast.success("🎉 Problem proposal submitted! Admins will review and publish it to the arena.");
        navigate("/problems");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit problem");
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
            <div className="clay-badge mb-3 text-info">
              <PlusCircle size={15} />
              <span>Community Problem Studio</span>
            </div>
            <h2 className="fw-bold mb-2">Propose a Challenge</h2>
            <p className="text-muted mb-0" style={{ maxWidth: "600px" }}>
              Submit new algorithmic challenges for CodeForge. Import directly from LeetCode with 1 click or synthesize edge-case test suites using AI.
            </p>
          </div>

          <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
            <button
              type="button"
              onClick={handleGenerateTestCasesWithAi}
              disabled={isAiGeneratingTestCases}
              className="clay-btn clay-btn-ai py-2 px-4"
            >
              {isAiGeneratingTestCases ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Testcases with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 IMPORT DIRECTLY FROM LEETCODE BOX */}
      <div className="clay-card p-4 mb-4" style={{ border: "1px solid rgba(245, 158, 11, 0.35)", background: "var(--bg-glass)" }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="clay-badge text-warning font-monospace fw-bold" style={{ fontSize: "0.85rem" }}>
            <Globe size={14} />
            <span>LeetCode Direct Import</span>
          </div>
          <span className="text-muted small">Import any LeetCode problem, description, constraints & verified test cases</span>
        </div>

        <form onSubmit={handleImportFromLeetCode} className="row g-2 align-items-center">
          <div className="col-12 col-md-9">
            <input
              type="text"
              placeholder="e.g. https://leetcode.com/problems/container-with-most-water/ OR 3Sum OR Merge Intervals"
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

      {/* Info notice about approval */}
      <div className="clay-card p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <ShieldCheck size={20} className="text-success" />
          <span className="small text-muted">
            {user?.role === "admin" 
              ? "👑 Logged in as Admin: Your problem publishes immediately to the public arena."
              : "🛡️ Community Submissions: Once submitted, CodeForge Admins review and approve your problem to make it live."}
          </span>
        </div>
        {user?.role === "admin" && (
          <Link to="/admin/problems" className="clay-btn py-1 px-3 small" style={{ fontSize: "0.82rem" }}>
            Admin Approvals Hub ↗
          </Link>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="clay-card p-4 p-md-5 d-flex flex-column gap-4">
        {/* Basic Info */}
        <div className="row g-3">
          <div className="col-12 col-md-8">
            <label className="form-label small fw-semibold text-muted">Problem Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Container With Most Water"
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
            placeholder="Describe the problem, input specifications, rules, and notes..."
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
              placeholder="Return the computed result..."
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
                      placeholder="e.g. 9\n2 7 11 15"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-5">
                    <label className="small text-muted">Expected Output</label>
                    <textarea
                      rows="2"
                      value={tc.output}
                      onChange={(e) => handleSampleChange(idx, "output", e.target.value)}
                      className="clay-input font-monospace small text-success"
                      placeholder="e.g. 0 1"
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
                      placeholder="e.g. nums[0] + nums[1] == 9"
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
                    <label className="small text-muted">Hidden Expected Output</label>
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
              <span>Submitting Proposal...</span>
            ) : (
              <>
                <Send size={18} />
                <span>{user?.role === "admin" ? "Publish Problem to Arena" : "Submit Problem for Review"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProblemPage;
