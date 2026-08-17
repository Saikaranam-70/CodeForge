import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import confetti from "canvas-confetti";
import apiClient from "../api/client";
import { useTheme } from "../context/ThemeContext";
import AiAssistantModal from "../components/AiAssistantModal";
import { 
  Play, 
  Send, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Copy, 
  ChevronLeft, 
  Terminal,
  Loader2,
  Flame,
  Bug,
  ArrowRightLeft,
  Zap,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import SEOHead from "../components/SEOHead";


const LANGUAGE_OPTIONS = [
  { id: "javascript", label: "JavaScript (Node.js 22 LTS)", monaco: "javascript" },
  { id: "typescript", label: "TypeScript (v5.6 / Node 22)", monaco: "typescript" },
  { id: "python", label: "Python 3 (v3.12)", monaco: "python" },
  { id: "cpp", label: "C++ (GCC 14 / C++23)", monaco: "cpp" },
  { id: "java", label: "Java 21 LTS (OpenJDK 21)", monaco: "java" },
  { id: "c", label: "C (GCC 14 / C17)", monaco: "c" },
  { id: "go", label: "Go (v1.23)", monaco: "go" },
  { id: "rust", label: "Rust (v1.80+)", monaco: "rust" }
];

/**
 * Returns clean LeetCode-style class/function signatures matching each problem
 */
import { getLeetCodeStarterCode } from "../utils/starterCode";

const ProblemWorkspace = () => {
  const { id } = useParams();
  const { isDark } = useTheme();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(`codeforge:problem_lang:${id}`) || localStorage.getItem("codeforge:last_lang") || "javascript";
    } catch (e) {
      return "javascript";
    }
  });
  const [code, setCode] = useState(() => {
    try {
      const savedLang = localStorage.getItem(`codeforge:problem_lang:${id}`) || localStorage.getItem("codeforge:last_lang") || "javascript";
      return localStorage.getItem(`codeforge:problem_code:${id}:${savedLang}`) || "";
    } catch (e) {
      return "";
    }
  });
  
  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [consoleTab, setConsoleTab] = useState("testcases"); // 'testcases' | 'runResults' | 'custom'
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [selectedRunCaseIdx, setSelectedRunCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");

  // AI Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("editor"); // 'editor' | 'description'

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/problems/${id}`);
        setProblem(res.data);

        const currentLang = localStorage.getItem(`codeforge:problem_lang:${id}`) || language || "javascript";
        const savedCode = localStorage.getItem(`codeforge:problem_code:${id}:${currentLang}`);
        if (savedCode && savedCode.trim().length > 0) {
          setCode(savedCode);
        } else {
          setCode(getLeetCodeStarterCode(res.data?.title, currentLang));
        }
      } catch (err) {
        toast.error("Failed to load problem statement");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleCodeChange = (newCode) => {
    const val = newCode || "";
    setCode(val);
    try {
      localStorage.setItem(`codeforge:problem_code:${id}:${language}`, val);
    } catch (e) {}
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    try {
      localStorage.setItem(`codeforge:problem_lang:${id}`, newLang);
      localStorage.setItem("codeforge:last_lang", newLang);
    } catch (e) {}

    const savedCodeForNewLang = localStorage.getItem(`codeforge:problem_code:${id}:${newLang}`);
    if (savedCodeForNewLang && savedCodeForNewLang.trim().length > 0) {
      setCode(savedCodeForNewLang);
    } else {
      const newStarter = getLeetCodeStarterCode(problem?.title, newLang);
      setCode(newStarter);
    }
  };

  const handleResetCode = () => {
    const starter = getLeetCodeStarterCode(problem?.title, language);
    setCode(starter);
    try {
      localStorage.removeItem(`codeforge:problem_code:${id}:${language}`);
    } catch (e) {}
    toast.success("Code reset to LeetCode starter signature!");
  };

  const playVictorySound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } catch (err) {}
  };

  // Run code against sample test cases or custom input
  const handleRunCode = async () => {
    if (!code || code.trim().length === 0) {
      toast.error("Please write your code solution before running");
      return;
    }

    setIsRunning(true);
    setRunResult(null);

    try {
      const res = await apiClient.post(`/problems/${id}/run`, {
        code,
        language,
        customInput: consoleTab === "custom" && customInput.trim().length > 0 ? customInput : undefined
      });

      setRunResult(res.data);
      setConsoleTab("runResults");
      setSelectedRunCaseIdx(0);

      if (res.data.type === "sample") {
        if (res.data.passedCases === res.data.totalCases && res.data.totalCases > 0) {
          toast.success(`🎉 All ${res.data.totalCases} sample test cases passed!`, { duration: 3000 });
        } else {
          toast.error(`Sample cases: ${res.data.passedCases}/${res.data.totalCases} passed`);
        }
      } else if (res.data.type === "custom") {
        toast.success("Code executed on custom input!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  // Full submission evaluation against all hidden test cases
  const handleSubmit = async () => {
    if (!code || code.trim().length === 0) {
      toast.error("Please write your code solution before submitting");
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await apiClient.post(`/problems/${id}/submit`, {
        code,
        language
      });

      setSubmissionResult(res.data);

      if (res.data.verdict === "Accepted") {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 }
        });
        playVictorySound();
        toast.success("🎉 Solution Accepted! High Score!", { duration: 4000 });
      } else {
        toast.error(`Verdict: ${res.data.verdict}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Input copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <Loader2 className="animate-spin text-primary mb-3" size={48} style={{ animation: "spin 1s linear infinite" }} />
        <h5 className="fw-semibold">Loading Problem Workspace...</h5>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container py-5 text-center">
        <h4>Problem not found</h4>
        <Link to="/problems" className="clay-btn clay-btn-primary mt-3">
          Back to Problems
        </Link>
      </div>
    );
  }

  const problemJsonLd = problem ? {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": `${problem.title} — Algorithmic Challenge`,
    "description": problem.description?.slice(0, 200) || "CodeForge Algorithmic Challenge",
    "programmingLanguage": language,
    "educationalLevel": problem.difficulty,
    "timeRequired": `PT${Math.round((problem.timeLimit || 2000) / 1000)}S`,
    "isPartOf": {
      "@type": "Course",
      "name": "NeetCode 150 & FAANG Coding Interview Curriculum",
      "url": "https://codeforge.dev/problems"
    }
  } : null;

  return (
    <div className="container-fluid px-2 px-md-3 px-lg-4 py-2 py-md-3" style={{ minHeight: "90vh" }}>
      {problem && (
        <SEOHead
          title={`${problem.title} (${problem.difficulty})`}
          description={`Solve "${problem.title}" with optimal Big-O algorithmic complexity on CodeForge. Supported in C++, Java, Python, JavaScript, Rust, Go, TypeScript.`}
          keywords={`${problem.title}, ${problem.difficulty} DSA problem, NeetCode 150, LeetCode solution, algorithmic challenge, online judge`}
          canonical={`https://codeforge.dev/problems/${id}`}
          jsonLd={problemJsonLd}
        />
      )}
      {/* Top Breadcrumb & Actions */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/problems" className="clay-btn py-1 px-2 px-md-3" style={{ fontSize: "0.85rem" }}>
            <ChevronLeft size={16} />
            <span className="d-none d-sm-inline">Problems</span>
          </Link>
          <h5 className="fw-bold mb-0 text-truncate" style={{ color: "var(--text-primary)", maxWidth: "200px" }}>
            {problem.title}
          </h5>
          <span 
            className={`clay-badge ${
              problem.difficulty === "Easy"
                ? "badge-easy"
                : problem.difficulty === "Medium"
                ? "badge-medium"
                : "badge-hard"
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        {/* AI Assistant Trigger */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="clay-btn clay-btn-ai py-2 px-3 d-flex align-items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Sparkles size={16} />
          <span>Ask AI Co-Pilot</span>
        </button>
      </div>

      {/* Mobile / Tablet Tab Toggle (Visible on screens < 992px) */}
      <div className="d-lg-none mb-3 arena-mobile-tabs">
        <div className="d-flex gap-1 p-1 rounded-3 clay-card-static">
          <button
            onClick={() => setMobileTab("editor")}
            className={`clay-btn flex-fill py-1 px-2 ${mobileTab === "editor" ? "clay-btn-primary" : ""}`}
          >
            <span>💻 Code Editor</span>
          </button>
          <button
            onClick={() => setMobileTab("description")}
            className={`clay-btn flex-fill py-1 px-2 ${mobileTab === "description" ? "clay-btn-primary" : ""}`}
          >
            <span>📖 Problem Statement</span>
          </button>
        </div>
      </div>

      <div className="row g-3">
        {/* Left Column: Problem Details & Constraints */}
        <div className={`col-12 col-lg-5 ${mobileTab !== "description" ? "d-none d-lg-block" : ""}`}>
          <div className="clay-card-static p-4 h-100 d-flex flex-column" style={{ maxHeight: "calc(100vh - 150px)", overflowY: "auto" }}>
            {/* Title & Metadata */}
            <div className="mb-3">
              <h4 className="fw-bold mb-2">{problem.title}</h4>
              <div className="d-flex align-items-center gap-3 text-muted small">
                <span className="d-flex align-items-center gap-1">
                  <Clock size={14} />
                  <span>Time Limit: {problem.timeLimit}ms</span>
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Cpu size={14} />
                  <span>Memory: {problem.memoryLimit}MB</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
              <div className="fw-semibold mb-2" style={{ color: "var(--text-primary)" }}>Problem Statement:</div>
              <p style={{ whiteSpace: "pre-wrap" }}>{problem.description}</p>
            </div>

            {/* Input & Output Format */}
            {(problem.inputFormat || problem.outputFormat) && (
              <div className="mb-4">
                {problem.inputFormat && (
                  <div className="mb-2">
                    <span className="fw-semibold small">Input Format: </span>
                    <span className="small text-muted">{problem.inputFormat}</span>
                  </div>
                )}
                {problem.outputFormat && (
                  <div>
                    <span className="fw-semibold small">Output Format: </span>
                    <span className="small text-muted">{problem.outputFormat}</span>
                  </div>
                )}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && (
              <div className="p-3 rounded-3 mb-4" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                <div className="fw-bold small text-muted mb-1">Constraints:</div>
                <pre className="mb-0 small font-monospace text-primary" style={{ whiteSpace: "pre-wrap" }}>
                  {problem.constraints}
                </pre>
              </div>
            )}

            {/* Sample Test Cases */}
            {problem.sampleTestCases?.length > 0 && (
              <div className="mb-3">
                <div className="fw-bold small mb-2">Sample Test Cases:</div>
                <div className="d-flex flex-column gap-3">
                  {problem.sampleTestCases.map((tc, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-3" 
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-semibold small text-muted">Example {index + 1}:</span>
                        <button 
                          onClick={() => copyToClipboard(tc.input)}
                          className="clay-btn p-1"
                          style={{ width: "26px", height: "26px", borderRadius: "6px" }}
                          title="Copy input"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      <div className="mb-2">
                        <div className="small text-muted">Input:</div>
                        <pre className="p-2 rounded-2 bg-dark text-light small mb-1">{tc.input}</pre>
                      </div>

                      <div className="mb-2">
                        <div className="small text-muted">Output:</div>
                        <pre className="p-2 rounded-2 bg-dark text-success small mb-0">{tc.output}</pre>
                      </div>

                      {tc.explanation && (
                        <div className="small text-muted mt-1">
                          <em>Explanation:</em> {tc.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monaco Code Editor & Verdict Panel */}
        <div className={`col-12 col-lg-7 ${mobileTab !== "editor" ? "d-none d-lg-block" : ""}`}>
          <div className="d-flex flex-column gap-3 h-100">
            {/* Editor Container */}
            <div className="clay-card-static p-3 d-flex flex-column" style={{ minHeight: "520px" }}>
              {/* Toolbar */}
              <div className="d-flex align-items-center justify-content-between pb-3 mb-2 border-bottom" style={{ borderColor: "var(--border-glass)" }}>
                {/* Language Picker & Converter */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="small fw-semibold text-muted">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="clay-btn py-1 px-3 fw-semibold"
                    style={{ fontSize: "0.85rem", outline: "none" }}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="clay-btn py-1 px-2 text-info"
                    style={{ fontSize: "0.8rem" }}
                    title="Translate code to another language with AI"
                  >
                    <ArrowRightLeft size={13} />
                    <span>AI Convert</span>
                  </button>
                </div>

                {/* Reset Code */}
                <button
                  onClick={handleResetCode}
                  className="clay-btn py-1 px-3"
                  style={{ fontSize: "0.82rem" }}
                  title="Reset to starter template"
                >
                  <RotateCcw size={14} />
                  <span>Reset Code</span>
                </button>
              </div>


              {/* Monaco Editor */}
              <div className="flex-fill rounded-3 overflow-hidden" style={{ minHeight: "360px", border: "1px solid var(--border-glass)" }}>
                <Editor
                  height="100%"
                  language={LANGUAGE_OPTIONS.find((l) => l.id === language)?.monaco || "javascript"}
                  value={code}
                  onChange={(val) => handleCodeChange(val || "")}
                  onMount={(editor, monaco) => {
                    if (typeof document !== "undefined" && document.fonts) {
                      document.fonts.ready.then(() => {
                        monaco.editor.remeasureFonts();
                      });
                    }
                    setTimeout(() => monaco.editor.remeasureFonts(), 150);
                    setTimeout(() => monaco.editor.remeasureFonts(), 600);
                  }}
                  theme={isDark ? "vs-dark" : "light"}
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
                    lineHeight: 22,
                    letterSpacing: 0,
                    fontLigatures: false,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    cursorStyle: "line",
                    cursorWidth: 2,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    lineNumbers: "on",
                    renderWhitespace: "none",
                    padding: { top: 12, bottom: 12 }
                  }}
                />
              </div>


              {/* Bottom Console Tabs & Action Buttons */}
              <div className="d-flex align-items-center justify-content-between pt-3 mt-2 border-top flex-wrap gap-2" style={{ borderColor: "var(--border-glass)" }}>
                {/* Console Tabs */}
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setConsoleTab("testcases")}
                    className={`clay-btn py-1 px-3 ${consoleTab === "testcases" ? "clay-btn-primary" : ""}`}
                    style={{ fontSize: "0.82rem" }}
                  >
                    <Terminal size={14} />
                    <span>Sample Testcases</span>
                  </button>
                  <button
                    onClick={() => setConsoleTab("runResults")}
                    className={`clay-btn py-1 px-3 ${consoleTab === "runResults" ? "clay-btn-primary" : ""}`}
                    style={{ fontSize: "0.82rem" }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Run Results {runResult?.testResults ? `(${runResult.passedCases}/${runResult.totalCases})` : ""}</span>
                  </button>
                  <button
                    onClick={() => setConsoleTab("custom")}
                    className={`clay-btn py-1 px-3 ${consoleTab === "custom" ? "clay-btn-primary" : ""}`}
                    style={{ fontSize: "0.82rem" }}
                  >
                    <span>Custom Input</span>
                  </button>
                </div>

                {/* Run & Submit Execution Buttons */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="clay-btn py-2 px-3 d-flex align-items-center gap-2"
                    style={{ fontSize: "0.85rem", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)" }}
                    title="Run code against sample test cases (Fast test)"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="animate-spin text-primary" size={16} />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play size={15} className="text-primary" />
                        <span>Run Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isRunning}
                    className="clay-btn clay-btn-primary py-2 px-4 d-flex align-items-center gap-2"
                    style={{ fontSize: "0.85rem" }}
                    title="Submit code for evaluation against all test cases"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Judging...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Solution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Console Card (Testcases, Run Results, Custom Input) */}
            <div className="clay-card-static p-3 p-md-4">
              {/* Tab 1: Sample Testcases */}
              {consoleTab === "testcases" && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-semibold small text-muted">Sample Test Cases (Problem Statement)</span>
                    <span className="small text-muted">{problem.sampleTestCases?.length || 0} cases provided</span>
                  </div>

                  {problem.sampleTestCases && problem.sampleTestCases.length > 0 ? (
                    <div>
                      {/* Case selector tabs */}
                      <div className="d-flex gap-2 mb-3 overflow-auto pb-1">
                        {problem.sampleTestCases.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedSampleIdx(idx)}
                            className={`clay-btn py-1 px-3 ${selectedSampleIdx === idx ? "clay-btn-primary" : ""}`}
                            style={{ fontSize: "0.82rem" }}
                          >
                            <span>Case {idx + 1}</span>
                          </button>
                        ))}
                      </div>

                      {/* Active Case Details */}
                      {problem.sampleTestCases[selectedSampleIdx] && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="small text-muted fw-semibold">Input:</span>
                              <button
                                onClick={() => copyToClipboard(problem.sampleTestCases[selectedSampleIdx].input)}
                                className="clay-btn p-1"
                                style={{ width: "24px", height: "24px" }}
                                title="Copy input"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            <pre className="p-2 rounded-2 bg-dark text-light small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                              {problem.sampleTestCases[selectedSampleIdx].input || "(Empty input)"}
                            </pre>
                          </div>

                          <div>
                            <span className="small text-muted fw-semibold d-block mb-1">Expected Output:</span>
                            <pre className="p-2 rounded-2 bg-dark text-success small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                              {problem.sampleTestCases[selectedSampleIdx].output || "(Empty output)"}
                            </pre>
                          </div>

                          {problem.sampleTestCases[selectedSampleIdx].explanation && (
                            <div className="small text-muted mt-1">
                              <em>Explanation:</em> {problem.sampleTestCases[selectedSampleIdx].explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted small py-2">No sample test cases defined for this challenge.</div>
                  )}
                </div>
              )}

              {/* Tab 2: Run Results (Shows Passed/Failed for Each Sample Test Case) */}
              {consoleTab === "runResults" && (
                <div>
                  {!runResult ? (
                    <div className="text-center py-4 text-muted">
                      <Terminal size={32} className="mb-2 opacity-50" />
                      <div className="fw-semibold small">No test run results yet</div>
                      <div className="small opacity-75 mt-1">Click <strong>"Run Code"</strong> above to test your algorithm on sample test cases.</div>
                    </div>
                  ) : runResult.type === "custom" ? (
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`clay-badge ${runResult.verdict === "Success" || runResult.verdict === "Accepted" ? "badge-easy" : "badge-hard"}`}>
                            {runResult.verdict}
                          </span>
                          <span className="small text-muted">Runtime: {runResult.executionTime}ms</span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <span className="small text-muted fw-semibold">Custom Input:</span>
                        <pre className="p-2 rounded-2 bg-dark text-light small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                          {runResult.input}
                        </pre>
                      </div>

                      <div className="mb-2">
                        <span className="small text-muted fw-semibold">Output:</span>
                        <pre className="p-2 rounded-2 bg-dark text-success small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                          {runResult.actualOutput || "(No output)"}
                        </pre>
                      </div>

                      {runResult.errorOutput && (
                        <div className="mt-2 p-2 rounded-2 bg-dark text-danger small font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                          {runResult.errorOutput}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Top Summary Banner */}
                      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom" style={{ borderColor: "var(--border-glass)" }}>
                        <div className="d-flex align-items-center gap-2">
                          {runResult.passedCases === runResult.totalCases ? (
                            <CheckCircle2 size={20} className="text-success" />
                          ) : (
                            <XCircle size={20} className="text-danger" />
                          )}
                          <span className={`fw-bold ${runResult.passedCases === runResult.totalCases ? "text-success" : "text-danger"}`}>
                            {runResult.passedCases === runResult.totalCases ? "Sample Cases Passed" : "Sample Cases Failed"}
                          </span>
                          <span className={`clay-badge ${runResult.passedCases === runResult.totalCases ? "badge-easy" : "badge-medium"}`}>
                            {runResult.passedCases} / {runResult.totalCases} Passed
                          </span>
                        </div>

                        <div className="small text-muted">
                          ⚡ Runtime: <strong className="text-primary">{runResult.executionTime}ms</strong>
                        </div>
                      </div>

                      {/* Test Case Selectors */}
                      {runResult.testResults && runResult.testResults.length > 0 && (
                        <div>
                          <div className="d-flex gap-2 mb-3 overflow-auto pb-1">
                            {runResult.testResults.map((tc, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedRunCaseIdx(idx)}
                                className={`clay-btn py-1 px-3 d-flex align-items-center gap-2 ${
                                  selectedRunCaseIdx === idx ? "clay-btn-primary" : ""
                                }`}
                                style={{ fontSize: "0.82rem" }}
                              >
                                {tc.status === "Passed" ? (
                                  <span className="text-success fw-bold">✓</span>
                                ) : (
                                  <span className="text-danger fw-bold">✗</span>
                                )}
                                <span>Case {tc.caseNumber}</span>
                              </button>
                            ))}
                          </div>

                          {/* Selected Case Inspection */}
                          {runResult.testResults[selectedRunCaseIdx] && (
                            <div className="d-flex flex-column gap-2">
                              <div>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <span className="small text-muted fw-semibold">Input:</span>
                                  <button
                                    onClick={() => copyToClipboard(runResult.testResults[selectedRunCaseIdx].input)}
                                    className="clay-btn p-1"
                                    style={{ width: "24px", height: "24px" }}
                                    title="Copy input"
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <pre className="p-2 rounded-2 bg-dark text-light small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                                  {runResult.testResults[selectedRunCaseIdx].input || "(Empty input)"}
                                </pre>
                              </div>

                              <div className="row g-2">
                                <div className="col-12 col-md-6">
                                  <span className="small fw-semibold d-block mb-1" style={{ color: runResult.testResults[selectedRunCaseIdx].status === "Passed" ? "var(--bs-success)" : "var(--bs-danger)" }}>
                                    Your Output:
                                  </span>
                                  <pre
                                    className={`p-2 rounded-2 bg-dark small mb-0 font-monospace ${
                                      runResult.testResults[selectedRunCaseIdx].status === "Passed" ? "text-success" : "text-danger"
                                    }`}
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {runResult.testResults[selectedRunCaseIdx].actualOutput || "(No output / Empty)"}
                                  </pre>
                                </div>

                                <div className="col-12 col-md-6">
                                  <span className="small text-success fw-semibold d-block mb-1">Expected Output:</span>
                                  <pre className="p-2 rounded-2 bg-dark text-success small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                                    {runResult.testResults[selectedRunCaseIdx].expectedOutput}
                                  </pre>
                                </div>
                              </div>

                              {runResult.testResults[selectedRunCaseIdx].errorOutput && (
                                <div className="mt-2 p-2 rounded-2 bg-dark text-danger small font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                                  <div className="fw-bold mb-1">Diagnostic Output:</div>
                                  {runResult.testResults[selectedRunCaseIdx].errorOutput}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Custom Input */}
              {consoleTab === "custom" && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold small text-muted">Test with Custom Input</span>
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning || isSubmitting}
                      className="clay-btn py-1 px-3"
                      style={{ fontSize: "0.8rem" }}
                    >
                      <Play size={13} className="text-primary" />
                      <span>Run Custom Input</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input test case here..."
                    className="clay-input font-monospace small w-100"
                    style={{ resize: "vertical" }}
                  />
                </div>
              )}
            </div>

            {/* Official Submission / Verdict Results Box */}
            {submissionResult && (
              <div className="clay-card-static p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    {submissionResult.verdict === "Accepted" ? (
                      <CheckCircle2 size={24} className="text-success" />
                    ) : (
                      <XCircle size={24} className="text-danger" />
                    )}
                    <h5 
                      className={`fw-bold mb-0 ${
                        submissionResult.verdict === "Accepted" ? "text-success" : "text-danger"
                      }`}
                    >
                      Official Verdict: {submissionResult.verdict}
                    </h5>
                  </div>

                  {submissionResult.verdict !== "Accepted" && (
                    <button
                      onClick={() => setIsAiModalOpen(true)}
                      className="clay-btn clay-btn-ai py-1 px-3"
                      style={{ fontSize: "0.82rem" }}
                    >
                      <Bug size={14} />
                      <span>Why did I fail? (AI Debug)</span>
                    </button>
                  )}
                </div>

                {/* Percentile Stats on Accepted */}
                {submissionResult.verdict === "Accepted" && (
                  <div className="row g-2 mb-3 mt-1">
                    <div className="col-12 col-md-6">
                      <div className="p-2 rounded-2 d-flex align-items-center justify-content-between" style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                        <span className="small text-muted">⚡ Runtime Speed:</span>
                        <span className="fw-bold small text-success">Beats 98.6% of coders</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-2 rounded-2 d-flex align-items-center justify-content-between" style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                        <span className="small text-muted">💾 Memory Efficiency:</span>
                        <span className="fw-bold small text-primary">Beats 94.2% of coders</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="row g-2 mb-3">
                  <div className="col-6 col-md-4">
                    <div className="clay-badge py-2 px-3 w-100 justify-content-center">
                      <span>Runtime: {submissionResult.executionTime || 0}ms</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="clay-badge py-2 px-3 w-100 justify-content-center">
                      <span>Memory: {submissionResult.memoryUsed || 0}KB</span>
                    </div>
                  </div>
                  {submissionResult.testCasesPassed !== undefined && (
                    <div className="col-12 col-md-4">
                      <div className={`clay-badge py-2 px-3 w-100 justify-content-center ${
                        submissionResult.testCasesPassed === submissionResult.totalTestCases ? "badge-easy" : "badge-medium"
                      }`}>
                        <span>Passed: {submissionResult.testCasesPassed} / {submissionResult.totalTestCases} cases</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Failing Testcase Detailed Inspection (Only when it's not a compilation error) */}
                {submissionResult.failingTestCase && submissionResult.verdict !== "Compilation Error" && (
                  <div className="mt-3 p-3 rounded-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-semibold small text-danger">
                        ❌ Failed at Testcase #{submissionResult.failingTestCase.testCaseNumber} of {submissionResult.totalTestCases}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="small fw-semibold" style={{ color: "var(--text-secondary)" }}>Input:</div>
                      <pre className="p-2 rounded-2 bg-dark text-light small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                        {submissionResult.failingTestCase.input}
                      </pre>
                    </div>

                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <div className="small fw-semibold text-danger">Your Output:</div>
                        <pre className="p-2 rounded-2 bg-dark text-danger small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                          {submissionResult.failingTestCase.actual || "(No output / Empty)"}
                        </pre>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="small fw-semibold text-success">Expected Output:</div>
                        <pre className="p-2 rounded-2 bg-dark text-success small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                          {submissionResult.failingTestCase.expected}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Execution Trace / Compiler Error Box (Always rendered if errorOutput is present) */}
                {submissionResult.errorOutput && (
                  <div className="mt-3 p-3 rounded-3" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-danger" />
                      <span className="small fw-bold text-danger">
                        {submissionResult.verdict === "Compilation Error" ? "Compiler Diagnostic Output:" : "Runtime / Execution Error Trace:"}
                      </span>
                    </div>
                    <pre className="p-3 bg-dark text-danger rounded-2 small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap", maxHeight: "240px", overflowY: "auto", fontSize: "0.82rem" }}>
                      {submissionResult.errorOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        problemId={problem._id}
        problemTitle={problem.title}
        problemDescription={problem.description}
        currentCode={code}
        currentLanguage={language}
        lastVerdict={submissionResult?.verdict}
        lastError={submissionResult?.errorOutput}
        onApplyConvertedCode={(newCode, newLang) => {
          setCode(newCode);
          if (newLang) setLanguage(newLang);
          toast.success(`Applied ${newLang} solution to editor!`);
        }}
      />
    </div>
  );
};

export default ProblemWorkspace;

