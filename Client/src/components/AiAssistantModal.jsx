import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/client";
import { 
  Sparkles, 
  X, 
  Brain, 
  Gauge, 
  Bug, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Loader2,
  Mic,
  Send,
  Award,
  ArrowRightLeft,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Volume2
} from "lucide-react";
import toast from "react-hot-toast";

const LANGUAGE_TARGETS = [
  { id: "python", label: "Python 3" },
  { id: "java", label: "Java 17" },
  { id: "cpp", label: "C++ (GCC 12)" },
  { id: "javascript", label: "JavaScript (Node.js)" },
  { id: "typescript", label: "TypeScript" },
  { id: "go", label: "Go (Golang)" },
  { id: "rust", label: "Rust" }
];

const AiAssistantModal = ({ 
  isOpen, 
  onClose, 
  problemId, 
  problemTitle, 
  problemDescription, 
  currentCode, 
  currentLanguage, 
  lastVerdict, 
  lastError,
  onApplyConvertedCode
}) => {
  const [activeTab, setActiveTab] = useState("hint"); // 'hint' | 'review' | 'debug' | 'interview' | 'convert'
  const [hintLevel, setHintLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // AI data cache
  const [aiData, setAiData] = useState({
    hint: null,
    review: null,
    debug: null
  });

  // Mock Interview State
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [interviewEvaluation, setInterviewEvaluation] = useState(null);
  const chatEndRef = useRef(null);

  // Convert Code State
  const [targetLang, setTargetLang] = useState("python");
  const [convertedCode, setConvertedCode] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (activeTab === "interview" && interviewMessages.length === 0) {
      // Start greeting
      startInterview();
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewMessages, activeTab]);

  if (!isOpen) return null;

  // 1. Fetch Socratic Hint
  const handleFetchHint = async (level) => {
    setLoading(true);
    setHintLevel(level);
    try {
      const res = await apiClient.post("/ai/hint", {
        problemId,
        problemTitle,
        problemDescription,
        code: currentCode,
        language: currentLanguage,
        hintLevel: level
      });
      setAiData((prev) => ({ ...prev, hint: res.data.hint }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get AI hint");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Code Review & Big-O
  const handleFetchReview = async () => {
    if (!currentCode || currentCode.trim().length === 0) {
      toast.error("Write some code in the editor before requesting a review!");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/ai/review", {
        problemId,
        problemTitle,
        problemDescription,
        code: currentCode,
        language: currentLanguage
      });
      setAiData((prev) => ({ ...prev, review: res.data.review }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get AI code review");
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Debugging & Counterexample
  const handleFetchDebug = async () => {
    if (!currentCode || currentCode.trim().length === 0) {
      toast.error("Write some code first to debug!");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/ai/debug", {
        problemId,
        problemTitle,
        problemDescription,
        code: currentCode,
        language: currentLanguage,
        verdict: lastVerdict,
        errorOutput: lastError
      });
      setAiData((prev) => ({ ...prev, debug: res.data.debug }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to debug code");
    } finally {
      setLoading(false);
    }
  };

  // 4. Mock Interview Start & Chat
  const startInterview = async () => {
    setIsInterviewLoading(true);
    try {
      const res = await apiClient.post("/ai/mock-interview", {
        messages: [],
        code: currentCode,
        problemTitle,
        problemDescription,
        action: "chat"
      });
      setInterviewMessages([
        { role: "assistant", content: res.data.message }
      ]);
    } catch (err) {
      toast.error("Failed to start mock interview");
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const handleSendInterviewMessage = async (e) => {
    e.preventDefault();
    if (!interviewInput.trim()) return;

    const newMsgs = [...interviewMessages, { role: "user", content: interviewInput.trim() }];
    setInterviewMessages(newMsgs);
    setInterviewInput("");
    setIsInterviewLoading(true);

    try {
      const res = await apiClient.post("/ai/mock-interview", {
        messages: newMsgs,
        code: currentCode,
        problemTitle,
        problemDescription,
        action: "chat"
      });
      setInterviewMessages((prev) => [...prev, { role: "assistant", content: res.data.message }]);
    } catch (err) {
      toast.error("Failed to send message to interviewer");
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const handleEvaluateInterview = async () => {
    setIsInterviewLoading(true);
    try {
      const res = await apiClient.post("/ai/mock-interview", {
        messages: interviewMessages,
        code: currentCode,
        problemTitle,
        problemDescription,
        action: "evaluate"
      });
      setInterviewEvaluation(res.data.evaluation);
      toast.success("🎉 FAANG Interview Scorecard Generated!");
    } catch (err) {
      toast.error("Failed to evaluate interview");
    } finally {
      setIsInterviewLoading(false);
    }
  };

  // 5. Code Language Converter
  const handleConvertCode = async () => {
    if (!currentCode || currentCode.trim().length === 0) {
      toast.error("Please write code in the editor before converting!");
      return;
    }
    setIsConverting(true);
    try {
      const res = await apiClient.post("/ai/convert-language", {
        code: currentCode,
        fromLanguage: currentLanguage,
        toLanguage: targetLang,
        problemTitle
      });
      setConvertedCode(res.data.translatedCode || "");
      toast.success(`Translated code to ${targetLang}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to translate code");
    } finally {
      setIsConverting(false);
    }
  };

  const copyConverted = () => {
    navigator.clipboard.writeText(convertedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Converted code copied to clipboard!");
  };

  return (
    <div className="glass-modal-backdrop" onClick={onClose}>
      <div 
        className="glass-modal-content p-4 p-md-5 position-relative" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "780px", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Modal Header */}
        <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-4" style={{ borderColor: "var(--border-glass)" }}>
          <div className="d-flex align-items-center gap-2">
            <div 
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "var(--accent-gradient)",
                color: "#fff"
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h5 className="fw-bold mb-0">AI Algorithmic Co-Pilot & Studio</h5>
              <small className="text-muted">Multi-model intelligence (Gemini 2.0 + Groq Llama 3.3)</small>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="clay-btn p-1"
            style={{ width: "32px", height: "32px", borderRadius: "8px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="d-flex gap-2 mb-4 p-1 rounded-3 flex-wrap" style={{ background: "var(--bg-glass)" }}>
          <button
            onClick={() => setActiveTab("hint")}
            className={`clay-btn flex-fill py-2 ${activeTab === "hint" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Lightbulb size={15} />
            <span>Socratic Hints</span>
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`clay-btn flex-fill py-2 ${activeTab === "review" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Gauge size={15} />
            <span>Code Review & Big-O</span>
          </button>

          <button
            onClick={() => setActiveTab("debug")}
            className={`clay-btn flex-fill py-2 ${activeTab === "debug" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Bug size={15} />
            <span>Smart Debug</span>
          </button>

          <button
            onClick={() => setActiveTab("interview")}
            className={`clay-btn flex-fill py-2 ${activeTab === "interview" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Mic size={15} />
            <span>Mock Interview</span>
          </button>

          <button
            onClick={() => setActiveTab("convert")}
            className={`clay-btn flex-fill py-2 ${activeTab === "convert" ? "clay-btn-primary" : ""}`}
            style={{ fontSize: "0.85rem" }}
          >
            <ArrowRightLeft size={15} />
            <span>Convert Lang</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-5">
            <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
            <h6 className="fw-semibold">AI is analyzing your algorithm...</h6>
          </div>
        )}

        {/* TAB 1: SOCRATIC HINTS */}
        {!loading && activeTab === "hint" && (
          <div>
            <p className="text-muted small mb-3">
              Get targeted hints without revealing the full answer. Choose the guidance level you need:
            </p>

            <div className="d-flex gap-2 mb-4">
              {[
                { lvl: 1, title: "1. Intuition" },
                { lvl: 2, title: "2. Pattern" },
                { lvl: 3, title: "3. Pseudocode" }
              ].map((h) => (
                <button
                  key={h.lvl}
                  onClick={() => handleFetchHint(h.lvl)}
                  className={`clay-btn flex-fill py-2 ${hintLevel === h.lvl && aiData.hint ? "clay-btn-primary" : ""}`}
                  style={{ fontSize: "0.85rem" }}
                >
                  {h.title}
                </button>
              ))}
            </div>

            {aiData.hint ? (
              <div className="clay-card-static p-4 d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 text-primary">{aiData.hint.title}</h6>
                  <span className="badge bg-primary">Level {aiData.hint.hintLevel}</span>
                </div>

                <p className="small mb-0" style={{ lineHeight: "1.6" }}>{aiData.hint.hint}</p>

                {aiData.hint.guidingQuestion && (
                  <div className="p-3 rounded-3" style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                    <div className="d-flex align-items-center gap-2 mb-1 text-primary fw-bold small">
                      <Brain size={16} />
                      <span>Think About This:</span>
                    </div>
                    <div className="small font-italic">{aiData.hint.guidingQuestion}</div>
                  </div>
                )}

                {aiData.hint.nextStep && (
                  <div className="small text-muted">
                    <strong>Next Action:</strong> {aiData.hint.nextStep}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <button onClick={() => handleFetchHint(1)} className="clay-btn clay-btn-primary py-2 px-4">
                  <Lightbulb size={16} />
                  <span>Reveal Level 1 Intuition Hint</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CODE REVIEW & BIG-O VISUALIZER */}
        {!loading && activeTab === "review" && (
          <div>
            {aiData.review ? (
              <div className="d-flex flex-column gap-3">
                <div className="row g-2">
                  <div className="col-4">
                    <div className="clay-card-static p-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1 text-primary small mb-1">
                        <Clock size={15} />
                        <span>Time</span>
                      </div>
                      <h6 className="fw-bold mb-0 text-primary">{aiData.review.timeComplexity}</h6>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="clay-card-static p-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1 text-info small mb-1">
                        <Cpu size={15} />
                        <span>Space</span>
                      </div>
                      <h6 className="fw-bold mb-0 text-info">{aiData.review.spaceComplexity}</h6>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="clay-card-static p-3 text-center">
                      <div className="small text-success mb-1">Quality Score</div>
                      <h6 className="fw-bold mb-0 text-success">{aiData.review.score || 8} / 10</h6>
                    </div>
                  </div>
                </div>

                {/* Big-O Spectrum Curve */}
                <div className="clay-card-static p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold small text-muted">Big-O Efficiency Spectrum:</span>
                    <span className="badge bg-primary">{aiData.review.timeComplexity}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1 rounded-2 p-1 font-monospace" style={{ background: "var(--bg-glass)", fontSize: "0.75rem" }}>
                    <span className="badge bg-success flex-fill text-center">O(1)</span>
                    <span className="badge bg-success flex-fill text-center">O(log N)</span>
                    <span className="badge bg-primary flex-fill text-center">O(N)</span>
                    <span className="badge bg-info flex-fill text-center">O(N log N)</span>
                    <span className="badge bg-warning text-dark flex-fill text-center">O(N²)</span>
                    <span className="badge bg-danger flex-fill text-center">O(2ᴺ)</span>
                  </div>
                </div>

                <div className="clay-card-static p-3">
                  <div className="fw-bold small text-muted mb-2">Complexity Analysis:</div>
                  <p className="small mb-0" style={{ lineHeight: "1.5" }}>{aiData.review.complexityAnalysis}</p>
                </div>

                {aiData.review.bottlenecks?.length > 0 && (
                  <div className="p-3 rounded-3" style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                    <div className="d-flex align-items-center gap-1 text-danger fw-bold small mb-2">
                      <AlertTriangle size={16} />
                      <span>Bottlenecks & Edge Cases:</span>
                    </div>
                    <ul className="mb-0 ps-3 small">
                      {aiData.review.bottlenecks.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiData.review.cleanCodeSuggestions && (
                  <div className="p-3 rounded-3" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div className="d-flex align-items-center gap-1 text-success fw-bold small mb-1">
                      <CheckCircle2 size={16} />
                      <span>Refactoring Advice:</span>
                    </div>
                    <div className="small">{aiData.review.cleanCodeSuggestions}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <button onClick={handleFetchReview} className="clay-btn clay-btn-ai py-2 px-4">
                  <Gauge size={16} />
                  <span>Analyze Code Complexity & Big-O</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SMART DEBUG */}
        {!loading && activeTab === "debug" && (
          <div>
            {aiData.debug ? (
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3" style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                  <div className="d-flex align-items-center gap-1 text-danger fw-bold small mb-1">
                    <Bug size={16} />
                    <span>Bug Diagnosis:</span>
                  </div>
                  <div className="small mb-1"><strong>Location:</strong> {aiData.debug.bugLocation}</div>
                  <div className="small">{aiData.debug.bugExplanation}</div>
                </div>

                {aiData.debug.counterExample && (
                  <div className="clay-card-static p-3">
                    <div className="fw-bold small text-warning mb-2">⚡ Minimal Failing Counterexample:</div>
                    <div className="bg-dark p-2 rounded-2 text-light font-monospace small mb-2">
                      <div>Input: {aiData.debug.counterExample.input}</div>
                      <div className="text-success">Expected: {aiData.debug.counterExample.expectedOutput}</div>
                      <div className="text-danger">Your Code Output: {aiData.debug.counterExample.actualUserOutput}</div>
                    </div>
                  </div>
                )}

                {aiData.debug.howToFix && (
                  <div className="p-3 rounded-3" style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                    <div className="fw-bold small text-primary mb-1">🛠️ How to Fix:</div>
                    <div className="small">{aiData.debug.howToFix}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <button onClick={handleFetchDebug} className="clay-btn clay-btn-danger py-2 px-4">
                  <Bug size={16} />
                  <span>Find Breaking Bug & Counterexample</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FAANG MOCK TECHNICAL INTERVIEW */}
        {!loading && activeTab === "interview" && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom" style={{ borderColor: "var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
                <span className="small fw-semibold">FAANG Technical Mock Interview Active</span>
              </div>
              <button
                onClick={handleEvaluateInterview}
                disabled={isInterviewLoading}
                className="clay-btn clay-btn-primary py-1 px-3"
                style={{ fontSize: "0.8rem" }}
              >
                <Award size={14} />
                <span>Generate SDE Scorecard</span>
              </button>
            </div>

            {/* Chat Thread */}
            <div className="p-3 rounded-3 d-flex flex-column gap-2 overflow-auto" style={{ background: "var(--bg-glass)", maxHeight: "320px", minHeight: "220px" }}>
              {interviewMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-3 small ${
                    msg.role === "user"
                      ? "bg-primary text-white align-self-end"
                      : "clay-card-static align-self-start"
                  }`}
                  style={{ maxWidth: "85%" }}
                >
                  <div className="fw-bold mb-1" style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                    {msg.role === "user" ? "Candidate (You)" : "Staff Engineer Interviewer"}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{msg.content}</div>
                </div>
              ))}
              {isInterviewLoading && (
                <div className="clay-card-static p-2 align-self-start small d-flex align-items-center gap-2 text-muted">
                  <Loader2 className="animate-spin" size={14} />
                  <span>Interviewer is analyzing your response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendInterviewMessage} className="d-flex gap-2">
              <input
                type="text"
                placeholder="Explain your approach, edge cases, or ask questions to the interviewer..."
                value={interviewInput}
                onChange={(e) => setInterviewInput(e.target.value)}
                className="clay-input py-2"
                style={{ fontSize: "0.88rem" }}
              />
              <button type="submit" disabled={isInterviewLoading} className="clay-btn clay-btn-primary p-2 flex-shrink-0" style={{ width: "42px" }}>
                <Send size={16} />
              </button>
            </form>

            {/* Evaluation Scorecard */}
            {interviewEvaluation && (
              <div className="clay-card-static p-4 mt-2" style={{ border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Award size={24} className="text-warning" />
                    <h5 className="fw-bold mb-0">Official SDE Interview Evaluation</h5>
                  </div>
                  <span className={`badge px-3 py-2 fs-6 ${
                    interviewEvaluation.hiringRecommendation?.includes("Hire") ? "bg-success" : "bg-danger"
                  }`}>
                    {interviewEvaluation.hiringRecommendation}
                  </span>
                </div>

                <div className="row g-2 mb-3 text-center">
                  <div className="col-3">
                    <div className="clay-badge py-2 px-2 w-100 justify-content-center">
                      <span>Problem Solving: {interviewEvaluation.scores?.problemSolving || 8}/10</span>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="clay-badge py-2 px-2 w-100 justify-content-center">
                      <span>Code Quality: {interviewEvaluation.scores?.codeQuality || 8}/10</span>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="clay-badge py-2 px-2 w-100 justify-content-center">
                      <span>Communication: {interviewEvaluation.scores?.communication || 8}/10</span>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="clay-badge py-2 px-2 w-100 justify-content-center">
                      <span>Edge Cases: {interviewEvaluation.scores?.edgeCases || 8}/10</span>
                    </div>
                  </div>
                </div>

                <p className="small mb-2 text-muted">{interviewEvaluation.feedbackSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CROSS-LANGUAGE CODE CONVERTER */}
        {!loading && activeTab === "convert" && (
          <div className="d-flex flex-column gap-3">
            <p className="text-muted small mb-1">
              Translate your current solution into any target language with idiomatic LeetCode conventions:
            </p>

            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-8">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="clay-input py-2 fw-semibold"
                >
                  {LANGUAGE_TARGETS.map((t) => (
                    <option key={t.id} value={t.id}>
                      Translate to {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <button
                  onClick={handleConvertCode}
                  disabled={isConverting}
                  className="clay-btn clay-btn-ai w-100 py-2 justify-content-center"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="animate-spin" size={15} />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={15} />
                      <span>Translate Solution</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {convertedCode && (
              <div className="clay-card-static p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small fw-semibold text-success">Translated Code ({targetLang}):</span>
                  <div className="d-flex gap-2">
                    <button onClick={copyConverted} className="clay-btn py-1 px-2 small" style={{ fontSize: "0.8rem" }}>
                      {copiedCode ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      <span>{copiedCode ? "Copied!" : "Copy"}</span>
                    </button>
                    {onApplyConvertedCode && (
                      <button
                        onClick={() => {
                          onApplyConvertedCode(convertedCode, targetLang);
                          onClose();
                        }}
                        className="clay-btn clay-btn-primary py-1 px-2 small"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <Zap size={14} />
                        <span>Apply to Editor</span>
                      </button>
                    )}
                  </div>
                </div>

                <pre className="p-3 rounded-2 bg-dark text-light font-monospace small mb-0" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {convertedCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="d-flex justify-content-end mt-4 pt-3 border-top" style={{ borderColor: "var(--border-glass)" }}>
          <button onClick={onClose} className="clay-btn py-2 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
