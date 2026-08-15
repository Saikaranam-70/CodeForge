import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { 
  Users, 
  Plus, 
  Search, 
  Play, 
  Sparkles, 
  Clock, 
  UserCheck, 
  X, 
  Loader2, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Copy, 
  Hash, 
  KeyRound, 
  ShieldCheck,
  Hourglass,
  Timer
} from "lucide-react";
import toast from "react-hot-toast";
import SEOHead from "../components/SEOHead";

const DURATION_OPTIONS = [
  { value: 30, label: "30 Mins", desc: "Quick Blitz" },
  { value: 60, label: "1 Hour", desc: "Mock Interview" },
  { value: 120, label: "2 Hours", desc: "Standard (Default)" },
  { value: 240, label: "4 Hours", desc: "Hackathon Sprint" },
  { value: 480, label: "8 Hours", desc: "Full Session" },
  { value: 1440, label: "24 Hours", desc: "All Day Arena" }
];

const formatRemainingTime = (expiresAt, remainingSeconds) => {
  let secs = remainingSeconds;
  if (expiresAt && (!secs || secs <= 0)) {
    secs = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }
  if (!secs || secs <= 0) return "Expiring soon";

  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m left`;
  }
  return `${mins}m left`;
};

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all"); // 'all' | 'live'
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [roomName, setRoomName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");

  // Passcode Unlock Modal State
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedRoomToUnlock, setSelectedRoomToUnlock] = useState(null);
  const [unlockPasscode, setUnlockPasscode] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const navigate = useNavigate();

  const fetchRooms = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await apiClient.get("/room");
      setRooms(res.data.rooms || []);
    } catch (err) {
      if (showLoading) toast.error("Failed to load active rooms");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchAvailableProblems = async () => {
    try {
      const res = await apiClient.get("/problems?limit=50");
      const list = res.data.problems || [];
      setProblems(list);
      // Auto-select all available problems by default
      if (list.length > 0 && selectedProblemIds.length === 0) {
        setSelectedProblemIds(list.map((p) => p._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRooms(true);
    fetchAvailableProblems();

    // Auto-poll every 8 seconds for live room counts and expiry
    const interval = setInterval(() => {
      fetchRooms(false);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Handle joining via room code bar
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) {
      toast.error("Please enter a valid Room Code");
      return;
    }

    setIsJoiningByCode(true);
    try {
      const res = await apiClient.post("/room/join-by-code", {
        roomCode: roomCodeInput.trim().toUpperCase()
      });

      toast.success(`Joined room: ${res.data.room?.name}!`);
      navigate(`/room/${res.data.room._id}`);
    } catch (err) {
      if (err.response?.data?.requiresPasscode) {
        setSelectedRoomToUnlock({
          roomCode: roomCodeInput.trim().toUpperCase(),
          name: err.response.data.roomName || "Locked Room"
        });
        setUnlockModalOpen(true);
      } else if (err.response?.status === 410) {
        toast.error("This collaborative room session has expired.");
      } else {
        toast.error(err.response?.data?.message || "Failed to join room with that code");
      }
    } finally {
      setIsJoiningByCode(false);
    }
  };

  // Handle entering a room from list
  const handleEnterRoom = async (room) => {
    const targetId = room.id || room._id;
    if (room.isPrivate) {
      setSelectedRoomToUnlock(room);
      setUnlockPasscode("");
      setUnlockModalOpen(true);
    } else {
      navigate(`/room/${targetId}`);
    }
  };

  // Submit Passcode to Unlock & Join
  const handleUnlockAndJoin = async (e) => {
    e.preventDefault();
    if (!unlockPasscode.trim()) {
      toast.error("Please enter the room passcode");
      return;
    }

    setIsUnlocking(true);
    try {
      let res;
      if (selectedRoomToUnlock.roomCode) {
        res = await apiClient.post("/room/join-by-code", {
          roomCode: selectedRoomToUnlock.roomCode,
          passcode: unlockPasscode.trim()
        });
      } else {
        const targetId = selectedRoomToUnlock.id || selectedRoomToUnlock._id;
        res = await apiClient.post(`/room/${targetId}/join`, {
          passcode: unlockPasscode.trim()
        });
      }

      toast.success(`🔓 Unlocked room: "${res.data.room.name}"!`);
      setUnlockModalOpen(false);
      navigate(`/room/${res.data.room._id}`);
    } catch (err) {
      if (err.response?.status === 410) {
        toast.error("This room session has expired.");
        setUnlockModalOpen(false);
        fetchRooms(false);
      } else {
        toast.error(err.response?.data?.message || "Incorrect room passcode");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    if (isPrivate && !passcode.trim()) {
      toast.error("Please provide a passcode for the private locked room");
      return;
    }

    const problemIdsToSend = selectedProblemIds.length > 0 
      ? selectedProblemIds 
      : problems.map((p) => p._id);

    setIsCreating(true);
    try {
      const res = await apiClient.post("/room", {
        name: roomName.trim(),
        problemIds: problemIdsToSend,
        durationMinutes: parseInt(durationMinutes, 10) || 120,
        isPrivate,
        passcode: isPrivate ? passcode.trim() : null
      });

      toast.success(`Room "${res.data.room.name}" created! Active for ${durationMinutes} mins`);
      setIsCreateModalOpen(false);
      navigate(`/room/${res.data.room._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleProblemSelection = (id) => {
    if (selectedProblemIds.includes(id)) {
      if (selectedProblemIds.length <= 1) {
        toast.error("At least 1 problem must remain attached to the room");
        return;
      }
      setSelectedProblemIds(selectedProblemIds.filter((pId) => pId !== id));
    } else {
      setSelectedProblemIds([...selectedProblemIds, id]);
    }
  };

  const copyRoomCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Room Code "${code}" copied to clipboard!`);
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.roomCode && r.roomCode.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (roomFilter === "live") {
      return !!r.isLive || (r.liveCount > 0);
    }
    return true;
  });

  return (
    <div className="container py-3 py-md-4">
      <SEOHead
        title="Collaborative Multiplayer Coding Arenas"
        description="Join live multiplayer coding rooms, practice mock technical interviews with WebRTC video calling, interactive whiteboard, and real-time Monaco editor."
        keywords="collaborative coding rooms, multiplayer coding arena, pair programming, technical mock interview, live code sharing, WebRTC video coding"
        canonical="https://codeforge.dev/rooms"
      />
      {/* Header Banner */}
      <div className="clay-card p-3 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="row align-items-center g-3">
          <div className="col-12 col-lg-7">
            <div className="clay-badge mb-2 mb-md-3 text-primary">
              <Users size={15} />
              <span>Real-Time Multiplayer Arena</span>
            </div>
            <h2 className="fw-bold mb-2">Collaborative Code Rooms</h2>
            <p className="text-muted mb-0" style={{ maxWidth: "600px" }}>
              Pair program in real-time with peers, synchronize code instantly across devices, and set custom room lifespans.
            </p>
          </div>
          <div className="col-12 col-lg-5 text-lg-end d-flex gap-2 justify-content-start justify-content-lg-end flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="clay-btn clay-btn-primary py-2 px-4 w-100 w-sm-auto"
            >
              <Plus size={18} />
              <span>Create New Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK JOIN WITH ROOM CODE BAR */}
      <div className="clay-card p-3 p-md-4 mb-4" style={{ background: "var(--bg-glass)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-5">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-3 text-primary" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h6 className="fw-bold mb-0">Join with Room Code</h6>
                <small className="text-muted">Have a 6-character room code from a peer?</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-7">
            <form onSubmit={handleJoinByCode} className="d-flex gap-2 flex-column flex-sm-row">
              <input
                type="text"
                placeholder="e.g. CR-8F3A"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                className="clay-input py-2 font-monospace text-uppercase fw-bold flex-fill"
                style={{ letterSpacing: "1px" }}
              />
              <button
                type="submit"
                disabled={isJoiningByCode}
                className="clay-btn clay-btn-primary py-2 px-4 flex-shrink-0 justify-content-center"
              >
                {isJoiningByCode ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <span>Enter</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6 col-lg-7">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search active rooms by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input ps-5"
              />
              <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-5 d-flex gap-2 justify-content-start justify-content-md-end flex-wrap">
            <button
              onClick={() => setRoomFilter("all")}
              className={`clay-btn flex-fill flex-md-grow-0 py-2 px-3 small ${roomFilter === "all" ? "clay-btn-primary" : ""}`}
              style={{ fontSize: "0.85rem" }}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setRoomFilter("live")}
              className={`clay-btn flex-fill flex-md-grow-0 py-2 px-3 small ${roomFilter === "live" ? "clay-btn-primary" : ""}`}
              style={{ fontSize: "0.85rem" }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }}></span>
              <span>Live Now ({rooms.filter(r => r.isLive || r.liveCount > 0).length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      {loading ? (
        <div className="text-center py-5">
          <Loader2 className="animate-spin text-primary mb-3" size={40} style={{ animation: "spin 1s linear infinite" }} />
          <h5 className="fw-semibold">Loading collaborative rooms...</h5>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="clay-card p-4 p-md-5 text-center">
          <Users size={48} className="text-muted mb-3" />
          <h5 className="fw-bold mb-2">No {roomFilter === "live" ? "live" : "active"} rooms found</h5>
          <p className="text-muted mb-3">Be the first to create a live room and invite your peers!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="clay-btn clay-btn-primary py-2 px-4"
          >
            <Plus size={18} />
            <span>Create Room</span>
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {filteredRooms.map((room) => {
            const targetId = room.id || room._id;
            const isRoomLive = room.isLive || (room.liveCount > 0);
            const remainingText = formatRemainingTime(room.expiresAt, room.remainingSeconds);

            return (
              <div key={targetId} className="col-12 col-md-6 col-lg-4">
                <div className="clay-card p-3 p-md-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                      <h5 className="fw-bold mb-0 text-truncate" style={{ color: "var(--text-primary)", maxWidth: "70%" }}>
                        {room.name}
                      </h5>
                      <div className="d-flex align-items-center gap-1">
                        {room.isPrivate ? (
                          <span className="clay-badge text-warning font-monospace" style={{ background: "rgba(245, 158, 11, 0.15)", fontSize: "0.75rem" }}>
                            <Lock size={12} />
                            <span>Locked</span>
                          </span>
                        ) : isRoomLive ? (
                          <span className="clay-badge badge-easy d-flex align-items-center gap-1">
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }}></span>
                            <span>{room.liveCount || room.participantCount || 1} live</span>
                          </span>
                        ) : (
                          <span className="clay-badge">
                            <UserCheck size={14} />
                            <span>{room.participantCount || 1} joined</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Room Code Badge & Timer Badge */}
                    <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="clay-badge font-monospace text-primary fw-bold" style={{ fontSize: "0.8rem", background: "var(--bg-glass)" }}>
                          <Hash size={12} />
                          <span>{room.roomCode || ("CR-" + targetId.slice(-4).toUpperCase())}</span>
                        </div>
                        <button
                          onClick={(e) => copyRoomCode(room.roomCode || ("CR-" + targetId.slice(-4).toUpperCase()), e)}
                          className="clay-btn p-1"
                          style={{ width: "26px", height: "26px", borderRadius: "6px" }}
                          title="Copy Room Code"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* Expiry Badge */}
                      <span className="clay-badge small text-muted" style={{ fontSize: "0.74rem" }}>
                        <Timer size={12} className="text-primary" />
                        <span>{remainingText}</span>
                      </span>
                    </div>

                    <div className="text-muted small mb-3">
                      <div><strong>Challenges:</strong> {room.problems?.length || 0} Problem(s)</div>
                      <div><strong>Host:</strong> {room.host || "Coder"}</div>
                      {room.isPrivate && <div className="text-warning small mt-1">🔒 Requires passcode to join</div>}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleEnterRoom(room)}
                      className={`clay-btn w-100 py-2 px-3 justify-content-center ${room.isPrivate ? "clay-btn-ai text-warning" : "clay-btn-primary"}`}
                    >
                      {room.isPrivate ? (
                        <>
                          <Lock size={15} />
                          <span>Unlock Room</span>
                        </>
                      ) : (
                        <>
                          <span>Enter Room</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔒 PASSCODE UNLOCK MODAL */}
      {unlockModalOpen && selectedRoomToUnlock && (
        <div className="glass-modal-backdrop" onClick={() => setUnlockModalOpen(false)}>
          <div 
            className="glass-modal-content p-3 p-md-4" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px" }}
          >
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3" style={{ borderColor: "var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-2">
                <Lock size={22} className="text-warning" />
                <h5 className="fw-bold mb-0">Locked Private Room</h5>
              </div>
              <button 
                onClick={() => setUnlockModalOpen(false)} 
                className="clay-btn p-1"
                style={{ width: "32px", height: "32px", borderRadius: "8px" }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-muted small mb-3">
              Room <strong>"{selectedRoomToUnlock.name}"</strong> is passcode protected. Enter the passcode set by the host to join:
            </p>

            <form onSubmit={handleUnlockAndJoin} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small fw-semibold">Enter Room Passcode</label>
                <input
                  type="password"
                  placeholder="e.g. 1234 or secret passcode"
                  value={unlockPasscode}
                  onChange={(e) => setUnlockPasscode(e.target.value)}
                  className="clay-input py-2 font-monospace"
                  autoFocus
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockModalOpen(false)}
                  className="clay-btn py-2 px-3 flex-fill flex-sm-grow-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUnlocking}
                  className="clay-btn clay-btn-primary py-2 px-4 flex-fill flex-sm-grow-0"
                >
                  {isUnlocking ? "Unlocking..." : "Unlock & Join Arena 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {isCreateModalOpen && (
        <div className="glass-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="glass-modal-content p-3 p-md-4" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3" style={{ borderColor: "var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-2">
                <Users size={22} className="text-primary" />
                <h5 className="fw-bold mb-0">Create Collaborative Room</h5>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="clay-btn p-1"
                style={{ width: "32px", height: "32px", borderRadius: "8px" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small fw-semibold">Room Name</label>
                <input
                  type="text"
                  placeholder="e.g. SDE Interview Coding Arena"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="clay-input"
                  required
                />
              </div>

              {/* ⏳ DURATION SELECTOR */}
              <div>
                <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                  <Hourglass size={14} className="text-primary" />
                  <span>Room Time Period / Lifespan (Auto-expires after time)</span>
                </label>
                <div className="row g-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <div key={opt.value} className="col-6 col-sm-4">
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(opt.value)}
                        className={`clay-card-static w-100 p-2 text-start ${
                          durationMinutes === opt.value ? "border-primary text-primary" : ""
                        }`}
                        style={{
                          border: durationMinutes === opt.value ? "2px solid var(--accent-primary)" : "1px solid var(--border-glass)",
                          background: durationMinutes === opt.value ? "rgba(99, 102, 241, 0.12)" : "var(--bg-glass)",
                          cursor: "pointer",
                          borderRadius: "12px"
                        }}
                      >
                        <div className="fw-bold small">{opt.label}</div>
                        <div className="text-muted" style={{ fontSize: "0.68rem" }}>{opt.desc}</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🔒 LOCK ROOM TOGGLE */}
              <div className="p-3 rounded-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <Lock size={18} className="text-warning" />
                    <div>
                      <strong className="small d-block">Private Passcode Lock</strong>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>Prevent unauthorized users from joining</span>
                    </div>
                  </div>

                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="privateSwitch"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      style={{ cursor: "pointer", width: "40px", height: "20px" }}
                    />
                  </div>
                </div>

                {isPrivate && (
                  <div className="mt-2 pt-2 border-top" style={{ borderColor: "var(--border-glass)" }}>
                    <label className="form-label small fw-semibold">Set Room Passcode / PIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234 or team-pass"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="clay-input font-monospace"
                      required={isPrivate}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label small fw-semibold mb-0">Select Problems for the Room</label>
                  <span className="small text-muted">{selectedProblemIds.length} Selected</span>
                </div>
                <div className="p-3 rounded-3 d-flex flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto", background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
                  {problems.map((p) => {
                    const isSelected = selectedProblemIds.includes(p._id);
                    return (
                      <div
                        key={p._id}
                        onClick={() => toggleProblemSelection(p._id)}
                        className={`p-2 rounded-2 d-flex align-items-center justify-content-between cursor-pointer ${
                          isSelected ? "bg-primary text-white" : ""
                        }`}
                        style={{ cursor: "pointer", transition: "background 0.2s" }}
                      >
                        <span className="small fw-semibold text-truncate" style={{ maxWidth: "75%" }}>{p.title}</span>
                        <span className={`badge ${p.difficulty === "Easy" ? "bg-success" : p.difficulty === "Medium" ? "bg-warning" : "bg-danger"}`}>
                          {p.difficulty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-2 pt-2 border-top" style={{ borderColor: "var(--border-glass)" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="clay-btn py-2 px-3 flex-fill flex-sm-grow-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="clay-btn clay-btn-primary py-2 px-4 flex-fill flex-sm-grow-0"
                >
                  {isCreating ? "Creating..." : "Launch Room 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
