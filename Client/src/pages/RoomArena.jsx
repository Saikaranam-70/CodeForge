import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import apiClient from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../context/ThemeContext";
import { 
  Users, 
  Send, 
  MessageSquare, 
  Code2, 
  ChevronLeft, 
  Sparkles, 
  LogOut, 
  Loader2,
  Copy,
  Terminal,
  Clock,
  Cpu,
  Hash,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Wifi,
  WifiOff,
  User
} from "lucide-react";
import toast from "react-hot-toast";

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

const getWebSocketUrl = (jwtToken) => {
  if (import.meta.env.VITE_WS_URL) {
    const base = import.meta.env.VITE_WS_URL.replace(/\/+$/, "");
    return `${base}/?token=${encodeURIComponent(jwtToken)}`;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Dynamically convert http(s) to ws(s) and remove trailing /api
    const wsBase = apiUrl
      .replace(/^http(s?):\/\//i, "ws$1://")
      .replace(/\/api\/?$/i, "")
      .replace(/\/+$/, "");
    return `${wsBase}/?token=${encodeURIComponent(jwtToken)}`;
  }
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `${isHttps ? "wss" : "ws"}://${host}:5000/?token=${encodeURIComponent(jwtToken)}`;
};

const getLeetCodeStarterCode = (problemTitle = "", lang = "javascript") => {
  const title = (problemTitle || "").toLowerCase();

  if (title.includes("two sum")) {
    switch (lang) {
      case "java":
        return `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        \n        return new int[]{};\n    }\n}`;
      case "python":
        return `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass\n`;
      case "cpp":
        return `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        \n        return {};\n    }\n};`;
      case "typescript":
        return `function twoSum(nums: number[], target: number): number[] {\n    // Write your solution here\n    return [];\n}`;
      case "go":
        return `func twoSum(nums []int, target int) []int {\n    // Write your solution here\n    return []int{}\n}`;
      case "rust":
        return `impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        // Write your solution here\n        vec![]\n    }\n}`;
      case "c":
        return `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* res = (int*)malloc(2 * sizeof(int));\n    // Write your solution here\n    return res;\n}`;
      case "javascript":
      default:
        return `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your solution here\n    \n};`;
    }
  }

  if (title.includes("palindrome")) {
    switch (lang) {
      case "java":
        return `class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your solution here\n        \n        return false;\n    }\n}`;
      case "python":
        return `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your solution here\n        pass\n`;
      case "cpp":
        return `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your solution here\n        \n        return false;\n    }\n};`;
      case "c":
        return `bool isPalindrome(char* s) {\n    // Write your solution here\n    return false;\n}`;
      case "typescript":
        return `function isPalindrome(s: string): boolean {\n    // Write your solution here\n    return false;\n}`;
      case "go":
        return `func isPalindrome(s string) bool {\n    // Write your solution here\n    return false\n}`;
      case "rust":
        return `impl Solution {\n    pub fn is_palindrome(s: String) -> bool {\n        // Write your solution here\n        false\n    }\n}`;
      case "javascript":
      default:
        return `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    // Write your solution here\n    \n};`;
    }
  }

  if (title.includes("longest substring")) {
    switch (lang) {
      case "java":
        return `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        \n        return 0;\n    }\n}`;
      case "python":
        return `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your solution here\n        pass\n`;
      case "cpp":
        return `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        \n        return 0;\n    }\n};`;
      case "typescript":
        return `function lengthOfLongestSubstring(s: string): number {\n    // Write your solution here\n    return 0;\n}`;
      case "go":
        return `func lengthOfLongestSubstring(s string) int {\n    // Write your solution here\n    return 0\n}`;
      case "rust":
        return `impl Solution {\n    pub fn length_of_longest_substring(s: String) -> i32 {\n        // Write your solution here\n        0\n    }\n}`;
      case "javascript":
      default:
        return `/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    // Write your solution here\n    \n};`;
    }
  }

  if (title.includes("climbing") || title.includes("climb")) {
    switch (lang) {
      case "java":
        return `class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n        \n        return 0;\n    }\n}`;
      case "python":
        return `class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your solution here\n        pass\n`;
      case "cpp":
        return `class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your solution here\n        \n        return 0;\n    }\n};`;
      case "typescript":
        return `function climbStairs(n: number): number {\n    // Write your solution here\n    return 0;\n}`;
      case "go":
        return `func climbStairs(n int) int {\n    // Write your solution here\n    return 0\n}`;
      case "rust":
        return `impl Solution {\n    pub fn climb_stairs(n: i32) -> i32 {\n        // Write your solution here\n        0\n    }\n}`;
      case "javascript":
      default:
        return `/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    // Write your solution here\n    \n};`;
    }
  }

  if (title.includes("trapping") || title.includes("rain")) {
    switch (lang) {
      case "java":
        return `class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        \n        return 0;\n    }\n}`;
      case "python":
        return `class Solution:\n    def trap(self, height: list[int]) -> int:\n        # Write your solution here\n        pass\n`;
      case "cpp":
        return `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        \n        return 0;\n    }\n};`;
      case "typescript":
        return `function trap(height: number[]): number {\n    // Write your solution here\n    return 0;\n}`;
      case "go":
        return `func trap(height []int) int {\n    // Write your solution here\n    return 0\n}`;
      case "rust":
        return `impl Solution {\n    pub fn trap(height: Vec<i32>) -> i32 {\n        // Write your solution here\n        0\n    }\n}`;
      case "javascript":
      default:
        return `/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    // Write your solution here\n    \n};`;
    }
  }

  switch (lang) {
    case "java":
      return `class Solution {\n    public String solve(String input) {\n        // Write your solution here\n        return input;\n    }\n}`;
    case "python":
      return `class Solution:\n    def solve(self, input: str) -> str:\n        # Write your solution here\n        return input\n`;
    case "cpp":
      return `class Solution {\npublic:\n    string solve(string input) {\n        // Write your solution here\n        return input;\n    }\n};`;
    case "c":
      return `char* solve(char* input) {\n    // Write your solution here\n    return input;\n}`;
    case "typescript":
      return `function solve(input: string): string {\n    // Write your solution here\n    return input;\n}`;
    case "go":
      return `func solve(input string) string {\n    // Write your solution here\n    return input\n}`;
    case "rust":
      return `impl Solution {\n    pub fn solve(input: String) -> String {\n        // Write your solution here\n        input\n    }\n}`;
    case "javascript":
    default:
      return `/**\n * @param {string} input\n * @return {string}\n */\nvar solve = function(input) {\n    // Write your solution here\n    return input;\n};`;
  }
};

const RoomArena = () => {
  const { id: roomId } = useParams();
  const { user, token } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);

  // Locked Room State
  const [isLockedRoom, setIsLockedRoom] = useState(false);
  const [roomPasscode, setRoomPasscode] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeSideTab, setActiveSideTab] = useState("problem"); // 'problem' | 'chat'

  // WebSocket Connection State
  const [wsStatus, setWsStatus] = useState("connecting"); // 'connected' | 'connecting' | 'disconnected'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isManuallyClosed = useRef(false);

  // Sync refs to avoid echo feedback loops
  const lastSentCode = useRef("");
  const lastReceivedCode = useRef("");
  const chatBottomRef = useRef(null);

  const normalizeMembers = (list = []) => {
    const seen = new Map();
    list.forEach((member) => {
      if (member?.userId) {
        seen.set(String(member.userId), member);
      }
    });
    return [...seen.values()];
  };

  // Fetch Room Details
  useEffect(() => {
    let isMounted = true;
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/room/${roomId}`);
        if (!isMounted) return;
        const roomData = res.data.room;
        setRoom(roomData);
        setIsLockedRoom(false);

        // If no code set yet, load starter code for the first problem
        const initialProb = roomData?.problems?.[0];
        const initialCode = getLeetCodeStarterCode(initialProb?.title, language);
        setCode(initialCode);
        lastSentCode.current = initialCode;
        lastReceivedCode.current = initialCode;
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.data?.requiresPasscode) {
          setIsLockedRoom(true);
        } else {
          toast.error("Failed to load room details");
          navigate("/rooms");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId, navigate]);

  // Handle Unlock
  const handleUnlockRoom = async (e) => {
    e.preventDefault();
    if (!roomPasscode.trim()) {
      toast.error("Please enter the room passcode");
      return;
    }

    setIsUnlocking(true);
    try {
      const res = await apiClient.post(`/room/${roomId}/join`, {
        passcode: roomPasscode.trim()
      });
      const roomData = res.data.room;
      setRoom(roomData);
      setIsLockedRoom(false);
      const initialProb = roomData?.problems?.[0];
      const initialCode = getLeetCodeStarterCode(initialProb?.title, language);
      setCode(initialCode);
      lastSentCode.current = initialCode;
      lastReceivedCode.current = initialCode;
      toast.success("🔓 Unlocked and joined collaborative room!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect room passcode");
    } finally {
      setIsUnlocking(false);
    }
  };

  // Connect / Reconnect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!token || !roomId || isLockedRoom) return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setWsStatus("connecting");
    const wsUrl = getWebSocketUrl(token);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        ws.send(
          JSON.stringify({
            event: "room:join",
            payload: { roomId }
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { event: evt, payload } = data;

          if (evt === "room:joined") {
            if (payload.members) {
              setMembers(normalizeMembers(payload.members));
            }
            if (payload.currentCode !== undefined && payload.currentCode !== null && payload.currentCode.trim().length > 0) {
              lastReceivedCode.current = payload.currentCode;
              setCode(payload.currentCode);
            }
            if (payload.currentLanguage) {
              setLanguage(payload.currentLanguage);
            }
            if (typeof payload.selectedProblemIdx === "number") {
              setSelectedProblemIdx(payload.selectedProblemIdx);
            }

            // Notification on peer join/leave
            if (payload.joinedUser && payload.joinedUser.userId !== user?.id) {
              toast.success(`👋 ${payload.joinedUser.username} joined the arena!`, { duration: 3000 });
            }
            if (payload.leftUser && payload.leftUser.userId !== user?.id) {
              toast(`🚪 ${payload.leftUser.username} left the room`, { icon: 'ℹ️', duration: 3000 });
            }
          }

          if (evt === "code:change") {
            if (payload.changes?.text !== undefined) {
              lastReceivedCode.current = payload.changes.text;
              setCode(payload.changes.text);
            }
            if (payload.language) {
              setLanguage(payload.language);
            }
          }

          if (evt === "problem:change") {
            if (typeof payload.selectedProblemIdx === "number") {
              setSelectedProblemIdx(payload.selectedProblemIdx);
              if (payload.user && payload.user.userId !== user?.id) {
                toast(`📌 ${payload.user.username} switched to Challenge #${payload.selectedProblemIdx + 1}`, { icon: '🔄' });
              }
            }
          }

          if (evt === "chat:message") {
            setMessages((prev) => [...prev, payload]);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
        if (!isManuallyClosed.current) {
          // Schedule auto-reconnect
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
        setWsStatus("disconnected");
      };
    } catch (wsInitErr) {
      console.error("Failed to initialize WebSocket:", wsInitErr);
      setWsStatus("disconnected");
    }
  }, [token, roomId, isLockedRoom, user?.id]);

  useEffect(() => {
    isManuallyClosed.current = false;
    connectWebSocket();

    return () => {
      isManuallyClosed.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeSideTab]);

  // Handle local code edit
  const handleCodeChange = (newCode) => {
    const codeVal = newCode || "";
    setCode(codeVal);

    // Skip echo if change came from remote peer
    if (codeVal === lastReceivedCode.current) {
      return;
    }

    if (codeVal === lastSentCode.current) {
      return;
    }

    lastSentCode.current = codeVal;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "code:change",
          payload: {
            roomId,
            changes: { text: codeVal },
            language
          }
        })
      );
    }
  };

  // Handle language switch in room
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const activeProb = room?.problems?.[selectedProblemIdx];
    const newTemplate = getLeetCodeStarterCode(activeProb?.title, newLang);
    setCode(newTemplate);
    lastSentCode.current = newTemplate;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "code:change",
          payload: {
            roomId,
            changes: { text: newTemplate },
            language: newLang
          }
        })
      );
    }
  };

  // Handle problem challenge switch in room
  const handleProblemChange = (newIdx) => {
    setSelectedProblemIdx(newIdx);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "problem:change",
          payload: {
            roomId,
            selectedProblemIdx: newIdx
          }
        })
      );
    }
  };

  // Load active problem template into editor
  const handleLoadProblemTemplate = () => {
    const activeProb = room?.problems?.[selectedProblemIdx];
    const newTemplate = getLeetCodeStarterCode(activeProb?.title, language);
    setCode(newTemplate);
    lastSentCode.current = newTemplate;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "code:change",
          payload: {
            roomId,
            changes: { text: newTemplate },
            language
          }
        })
      );
    }
    toast.success(`Loaded signature template for "${activeProb?.title || "Problem"}"`);
  };

  // Send in-room chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "chat:message",
          payload: {
            roomId,
            message: chatInput.trim()
          }
        })
      );
      setChatInput("");
    } else {
      toast.error("WebSocket disconnected. Reconnecting...");
      connectWebSocket();
    }
  };

  // Submit code for judgment
  const handleSubmitCode = async () => {
    const activeProb = room?.problems?.[selectedProblemIdx];
    if (!activeProb) {
      toast.error("No problem selected for evaluation");
      return;
    }
    if (!code || code.trim().length === 0) {
      toast.error("Please write code before submitting");
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await apiClient.post(`/problems/${activeProb._id}/submit`, {
        code,
        language
      });

      setSubmissionResult(res.data);
      if (res.data.verdict === "Accepted") {
        toast.success("🎉 Team Solution Accepted!", { duration: 4000 });
      } else {
        toast.error(`Verdict: ${res.data.verdict}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Evaluation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRoomCode = () => {
    const codeToCopy = room?.roomCode || ("CR-" + roomId.slice(-4).toUpperCase());
    navigator.clipboard.writeText(codeToCopy);
    toast.success(`Room Code ${codeToCopy} copied! Share with friends.`);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied to clipboard!");
  };

  const handleLeaveRoom = async () => {
    try {
      await apiClient.post(`/room/${roomId}/leave`);
      toast.success("Left the room");
      navigate("/rooms");
    } catch (err) {
      navigate("/rooms");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <Loader2 className="animate-spin text-primary mb-3" size={48} style={{ animation: "spin 1s linear infinite" }} />
        <h5 className="fw-semibold">Connecting to Collaborative Room Arena...</h5>
      </div>
    );
  }

  if (isLockedRoom) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
        <div className="clay-card p-4 p-md-5 text-center" style={{ maxWidth: "460px", width: "100%" }}>
          <div 
            className="d-inline-flex p-3 rounded-circle text-warning mb-3"
            style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
          >
            <Lock size={36} />
          </div>
          <h4 className="fw-bold mb-2">Private Locked Room</h4>
          <p className="text-muted small mb-4">
            This room is passcode protected by the host to prevent unauthorized users from entering.
          </p>

          <form onSubmit={handleUnlockRoom} className="d-flex flex-column gap-3">
            <div>
              <input
                type="password"
                placeholder="Enter room passcode / PIN"
                value={roomPasscode}
                onChange={(e) => setRoomPasscode(e.target.value)}
                className="clay-input font-monospace text-center py-2 fs-6"
                autoFocus
                required
              />
            </div>

            <div className="d-flex gap-2">
              <Link to="/rooms" className="clay-btn py-2 px-3 flex-fill justify-content-center">
                Back to Lobby
              </Link>
              <button
                type="submit"
                disabled={isUnlocking}
                className="clay-btn clay-btn-primary py-2 px-4 flex-fill justify-content-center"
              >
                {isUnlocking ? "Unlocking..." : "Unlock & Enter 🚀"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeProblem = room?.problems?.[selectedProblemIdx] || room?.problems?.[0];
  const roomCodeDisplay = room?.roomCode || ("CR-" + roomId.slice(-4).toUpperCase());
  const activeMembersCount = Math.max(members.length, 1);

  return (
    <div className="container-fluid px-3 px-lg-4 py-3" style={{ minHeight: "90vh" }}>
      {/* Top Header */}
      <div className="clay-card-static p-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rooms" className="clay-btn py-1 px-3" style={{ fontSize: "0.85rem" }}>
            <ChevronLeft size={16} />
            <span>Lobby</span>
          </Link>

          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-primary)" }}>{room?.name}</h5>
              <div className="clay-badge font-monospace text-primary fw-bold" style={{ fontSize: "0.82rem", background: "var(--bg-glass)" }}>
                <Hash size={12} />
                <span>{roomCodeDisplay}</span>
              </div>
              <button
                onClick={copyRoomCode}
                className="clay-btn p-1"
                style={{ width: "26px", height: "26px", borderRadius: "6px" }}
                title="Copy Room Code"
              >
                <Copy size={12} />
              </button>
            </div>
            <div className="d-flex align-items-center gap-2 mt-1">
              <small className="text-muted">Multiplayer Live Synchronized Session</small>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill py-0 px-2 small" style={{ fontSize: "0.7rem" }}>
                ● Active
              </span>
            </div>
          </div>
        </div>

        {/* Active Members & Actions */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Member Avatars list */}
          <div className="d-none d-md-flex align-items-center gap-1 clay-card-static py-1 px-2">
            {members.length === 0 ? (
              <span className="small text-muted px-1">{user?.username || "You"} (Active)</span>
            ) : (
              members.slice(0, 4).map((m, idx) => (
                <span
                  key={m.userId || idx}
                  className={`clay-badge py-0 px-2 small ${m.userId === user?.id ? "text-primary fw-bold" : ""}`}
                  style={{ fontSize: "0.75rem" }}
                  title={m.username}
                >
                  {m.username} {m.userId === user?.id ? "(You)" : ""}
                </span>
              ))
            )}
            {members.length > 4 && (
              <span className="clay-badge py-0 px-1 small" style={{ fontSize: "0.7rem" }}>
                +{members.length - 4}
              </span>
            )}
          </div>

          <button
            onClick={copyInviteLink}
            className="clay-btn py-1 px-3 small"
            style={{ fontSize: "0.82rem" }}
          >
            <Copy size={13} />
            <span>Share Link</span>
          </button>

          <div className="d-flex align-items-center gap-1 clay-badge py-1 px-3">
            <Users size={14} className="text-success" />
            <span>{activeMembersCount} Online</span>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="clay-btn clay-btn-danger py-1 px-3"
            style={{ fontSize: "0.85rem" }}
          >
            <LogOut size={15} />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      <div className="row g-3">
        {/* Left Side: Problem Statement & Live Chat Toggle */}
        <div className="col-12 col-lg-5">
          <div className="clay-card-static p-3 h-100 d-flex flex-column" style={{ maxHeight: "calc(100vh - 140px)" }}>
            {/* Tab Controls */}
            <div className="d-flex gap-2 mb-3 p-1 rounded-3" style={{ background: "var(--bg-glass)" }}>
              <button
                onClick={() => setActiveSideTab("problem")}
                className={`clay-btn flex-fill py-2 ${activeSideTab === "problem" ? "clay-btn-primary" : ""}`}
                style={{ fontSize: "0.85rem" }}
              >
                <BookOpen size={16} />
                <span>Problem ({room?.problems?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveSideTab("chat")}
                className={`clay-btn flex-fill py-2 ${activeSideTab === "chat" ? "clay-btn-primary" : ""}`}
                style={{ fontSize: "0.85rem" }}
              >
                <MessageSquare size={16} />
                <span>Live Chat ({messages.length})</span>
              </button>
            </div>

            {/* Tab 1: Active Problem Statement */}
            {activeSideTab === "problem" && (
              <div className="flex-fill overflow-auto d-flex flex-column gap-3 pe-1">
                {room?.problems && room.problems.length > 1 && (
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-muted">Select Room Challenge (Syncs with peers):</label>
                    <select
                      value={selectedProblemIdx}
                      onChange={(e) => handleProblemChange(parseInt(e.target.value, 10))}
                      className="clay-input py-1 px-3 fw-semibold"
                      style={{ fontSize: "0.88rem" }}
                    >
                      {room.problems.map((p, idx) => (
                        <option key={p._id || idx} value={idx}>
                          #{idx + 1} - {p.title} ({p.difficulty})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeProblem ? (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="fw-bold mb-0">{activeProblem.title}</h5>
                      <span className={`clay-badge ${
                        activeProblem.difficulty === "Easy" ? "badge-easy" : activeProblem.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                      }`}>
                        {activeProblem.difficulty}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3 text-muted small mb-3">
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={13} />
                        <span>{activeProblem.timeLimit || 2000}ms</span>
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Cpu size={13} />
                        <span>{activeProblem.memoryLimit || 64}MB</span>
                      </span>
                    </div>

                    <div className="mb-3" style={{ fontSize: "0.92rem", lineHeight: "1.55" }}>
                      <div className="fw-semibold mb-1" style={{ color: "var(--text-primary)" }}>Description:</div>
                      <p style={{ whiteSpace: "pre-wrap" }}>{activeProblem.description}</p>
                    </div>

                    {activeProblem.constraints && (
                      <div className="mb-3">
                        <div className="fw-semibold mb-1 small" style={{ color: "var(--text-primary)" }}>Constraints:</div>
                        <pre className="p-2 rounded-2 bg-dark text-light small font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                          {activeProblem.constraints}
                        </pre>
                      </div>
                    )}

                    {activeProblem.sampleTestCases && activeProblem.sampleTestCases.length > 0 && (
                      <div className="mb-3">
                        <div className="fw-semibold mb-1 small" style={{ color: "var(--text-primary)" }}>Sample Test Cases:</div>
                        {activeProblem.sampleTestCases.map((tc, idx) => (
                          <div key={idx} className="p-2 rounded-2 mb-2 font-monospace" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                            <div className="small text-muted">Input:</div>
                            <pre className="p-1 rounded bg-dark text-light small mb-1">{tc.input}</pre>
                            <div className="small text-muted">Expected:</div>
                            <pre className="p-1 rounded bg-dark text-success small mb-0">{tc.output}</pre>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleLoadProblemTemplate}
                      className="clay-btn py-1 px-3 w-100 justify-content-center mt-2"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <RotateCcw size={14} />
                      <span>Load Starter Template into Editor</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    No problem selected in this room.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Live Room Chat */}
            {activeSideTab === "chat" && (
              <div className="flex-fill d-flex flex-column h-100 justify-content-between">
                <div className="flex-fill overflow-auto d-flex flex-column gap-2 mb-3 p-2 rounded-2" style={{ background: "var(--bg-glass)", maxHeight: "420px" }}>
                  {messages.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      No messages yet. Say hello to your team!
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded-3 small ${
                          msg.user?.userId === user?.id 
                            ? "bg-primary text-white align-self-end" 
                            : "clay-card-static align-self-start"
                        }`}
                        style={{ maxWidth: "80%" }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                          <strong style={{ fontSize: "0.75rem" }}>{msg.user?.username || "Teammate"}</strong>
                          <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>{msg.message}</div>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message to team..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="clay-input py-2"
                    style={{ fontSize: "0.85rem" }}
                  />
                  <button type="submit" className="clay-btn clay-btn-primary p-2" style={{ width: "40px" }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Synchronized Collaborative Monaco Editor & Judge */}
        <div className="col-12 col-lg-7">
          <div className="d-flex flex-column gap-3">
            <div className="clay-card-static p-3 d-flex flex-column" style={{ minHeight: "520px" }}>
              {/* Toolbar */}
              <div className="d-flex align-items-center justify-content-between pb-3 mb-2 border-bottom flex-wrap gap-2" style={{ borderColor: "var(--border-glass)" }}>
                <div className="d-flex align-items-center gap-2">
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
                </div>

                {/* Connection Status Badge */}
                <div className="d-flex align-items-center gap-2">
                  {wsStatus === "connected" && (
                    <div className="clay-badge badge-easy d-flex align-items-center gap-2">
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }}></span>
                      <span>Live Keystroke Sync Active</span>
                    </div>
                  )}
                  {wsStatus === "connecting" && (
                    <div className="clay-badge text-warning d-flex align-items-center gap-2" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
                      <Loader2 size={12} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                      <span>Connecting Sync...</span>
                    </div>
                  )}
                  {wsStatus === "disconnected" && (
                    <button
                      onClick={connectWebSocket}
                      className="clay-badge text-danger d-flex align-items-center gap-2 border border-danger-subtle cursor-pointer"
                      style={{ background: "rgba(239, 68, 68, 0.15)", cursor: "pointer" }}
                      title="Click to reconnect"
                    >
                      <WifiOff size={12} />
                      <span>Disconnected (Click to Reconnect)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-fill rounded-3 overflow-hidden" style={{ minHeight: "380px", height: "380px", border: "1px solid var(--border-glass)" }}>
                <Editor
                  height="100%"
                  language={LANGUAGE_OPTIONS.find((l) => l.id === language)?.monaco || "javascript"}
                  value={code}
                  onChange={handleCodeChange}
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
              <div className="d-flex align-items-center justify-content-between pt-3 mt-2 border-top flex-wrap gap-2" style={{ borderColor: "var(--border-glass)" }}>
                <span className="text-muted small">
                  Collaborative multiplayer workspace • All keystrokes sync live
                </span>

                <button
                  onClick={handleSubmitCode}
                  disabled={isSubmitting}
                  className="clay-btn clay-btn-primary py-2 px-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} style={{ animation: "spin 1s linear infinite" }} />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Run & Evaluate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* In-Room Verdict Panel */}
            {submissionResult && (
              <div className="clay-card-static p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    {submissionResult.verdict === "Accepted" ? (
                      <CheckCircle2 size={24} className="text-success" />
                    ) : (
                      <XCircle size={24} className="text-danger" />
                    )}
                    <h5 className={`fw-bold mb-0 ${submissionResult.verdict === "Accepted" ? "text-success" : "text-danger"}`}>
                      {submissionResult.verdict}
                    </h5>
                  </div>

                  <div className="d-flex gap-2">
                    <span className="clay-badge">Runtime: {submissionResult.executionTime || 0}ms</span>
                    <span className="clay-badge">Passed: {submissionResult.testCasesPassed || 0} / {submissionResult.totalTestCases || 0}</span>
                  </div>
                </div>

                {submissionResult.failingTestCase && (
                  <div className="p-3 rounded-3 font-monospace small" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                    <div className="text-danger fw-bold mb-1">Failed at Testcase #{submissionResult.failingTestCase.testCaseNumber}</div>
                    <div className="text-muted mb-1">Input: {submissionResult.failingTestCase.input}</div>
                    <div className="text-danger mb-1">Your Output: {submissionResult.failingTestCase.actual || "(empty)"}</div>
                    <div className="text-success">Expected: {submissionResult.failingTestCase.expected}</div>
                  </div>
                )}

                {submissionResult.errorOutput && !submissionResult.failingTestCase && (
                  <pre className="p-2 bg-dark text-danger rounded-2 small mb-0 font-monospace" style={{ whiteSpace: "pre-wrap" }}>
                    {submissionResult.errorOutput}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomArena;
