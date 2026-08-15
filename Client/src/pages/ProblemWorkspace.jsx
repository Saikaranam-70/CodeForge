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
const getLeetCodeStarterCode = (problemTitle = "", lang = "javascript") => {
  const title = problemTitle.toLowerCase();

  // 1. Two Sum
  if (title.includes("two sum")) {
    switch (lang) {
      case "java":
        return `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
        return new int[]{};
    }
}`;
      case "python":
        return `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass
`;
      case "cpp":
        return `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
        return {};
    }
};`;
      case "javascript":
        return `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your solution here
    
};`;
      case "typescript":
        return `function twoSum(nums: number[], target: number): number[] {
    // Write your solution here
    
    return [];
}`;
      case "c":
        return `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your solution here
    *returnSize = 0;
    return NULL;
}`;
      case "go":
        return `func twoSum(nums []int, target int) []int {
    // Write your solution here
    return []int{}
}`;
      case "rust":
        return `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // Write your solution here
        vec![]
    }
}`;
      default:
        break;
    }
  }

  // 2. Valid Palindrome
  if (title.includes("palindrome")) {
    switch (lang) {
      case "java":
        return `class Solution {
    public boolean isPalindrome(String s) {
        // Write your solution here
        
        return false;
    }
}`;
      case "python":
        return `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your solution here
        pass
`;
      case "cpp":
        return `class Solution {
public:
    bool isPalindrome(string s) {
        // Write your solution here
        
        return false;
    }
};`;
      case "javascript":
        return `/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
    // Write your solution here
    
};`;
      case "typescript":
        return `function isPalindrome(s: string): boolean {
    // Write your solution here
    
    return false;
}`;
      case "go":
        return `func isPalindrome(s string) bool {
    // Write your solution here
    return false
}`;
      case "rust":
        return `impl Solution {
    pub fn is_palindrome(s: String) -> bool {
        // Write your solution here
        false
    }
}`;
      default:
        break;
    }
  }

  // 3. Longest Substring Without Repeating Characters
  if (title.includes("longest substring")) {
    switch (lang) {
      case "java":
        return `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution here
        
        return 0;
    }
}`;
      case "python":
        return `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your solution here
        pass
`;
      case "cpp":
        return `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your solution here
        
        return 0;
    }
};`;
      case "javascript":
        return `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    // Write your solution here
    
};`;
      default:
        break;
    }
  }

  // 4. Climbing Stairs
  if (title.includes("climbing stairs") || title.includes("climb")) {
    switch (lang) {
      case "java":
        return `class Solution {
    public int climbStairs(int n) {
        // Write your solution here
        
        return 0;
    }
}`;
      case "python":
        return `class Solution:
    def climbStairs(self, n: int) -> int:
        # Write your solution here
        pass
`;
      case "cpp":
        return `class Solution {
public:
    int climbStairs(int n) {
        // Write your solution here
        
        return 0;
    }
};`;
      case "javascript":
        return `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    // Write your solution here
    
};`;
      default:
        break;
    }
  }

  // 5. Trapping Rain Water
  if (title.includes("trapping") || title.includes("rain water")) {
    switch (lang) {
      case "java":
        return `class Solution {
    public int trap(int[] height) {
        // Write your solution here
        
        return 0;
    }
}`;
      case "python":
        return `class Solution:
    def trap(self, height: list[int]) -> int:
        # Write your solution here
        pass
`;
      case "cpp":
        return `class Solution {
public:
    int trap(vector<int>& height) {
        // Write your solution here
        
        return 0;
    }
};`;
      case "javascript":
        return `/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
    // Write your solution here
    
};`;
      default:
        break;
    }
  }

  // Default LeetCode signature for any problem
  switch (lang) {
    case "java":
      return `class Solution {
    public String solve(String input) {
        // Write your algorithm here
        
        return input;
    }
}`;
    case "python":
      return `class Solution:
    def solve(self, input: str) -> str:
        # Write your algorithm here
        return input
`;
    case "cpp":
      return `class Solution {
public:
    string solve(string input) {
        // Write your algorithm here
        
        return input;
    }
};`;
    case "typescript":
      return `function solve(input: string): string {
    // Write your algorithm here
    return input;
}`;
    case "c":
      return `char* solve(char* input) {
    // Write your algorithm here
    return input;
}`;
    case "go":
      return `func solve(input string) string {
    // Write your algorithm here
    return input
}`;
    case "rust":
      return `impl Solution {
    pub fn solve(input: String) -> String {
        // Write your algorithm here
        input
    }
}`;
    case "javascript":
    default:
      return `/**
 * @param {string} input
 * @return {string}
 */
var solve = function(input) {
    // Write your algorithm here
    return input;
};`;
  }
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeTab, setActiveTab] = useState("description"); // 'description' | 'customTest'
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
                  theme={isDark ? "vs-dark" : "light"}
                  options={{
                    fontSize: 14,
                    fontFamily: "JetBrains Mono, monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    lineNumbers: "on"
                  }}
                />
              </div>


              {/* Bottom Actions */}
              <div className="d-flex align-items-center justify-content-between pt-3 mt-2 border-top" style={{ borderColor: "var(--border-glass)" }}>
                <div className="text-muted small">
                  <span>Press Submit to evaluate all hidden test cases.</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="clay-btn clay-btn-primary py-2 px-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Judging...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Solution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submission / Verdict Results Box */}
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
                      {submissionResult.verdict}
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

                {/* Failing Testcase Detailed Inspection */}
                {submissionResult.failingTestCase && (
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

                {/* Execution Trace / Compiler Error if any */}
                {submissionResult.errorOutput && !submissionResult.failingTestCase && (
                  <div className="mt-2">
                    <div className="small fw-semibold text-danger mb-1">Compiler / Execution Trace:</div>
                    <pre className="p-2 bg-dark text-danger rounded-2 small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
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

