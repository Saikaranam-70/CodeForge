import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Maximize2,
  Minimize2,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Radio
} from "lucide-react";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

const VideoCallOverlay = ({
  roomId,
  user,
  wsRef,
  isCallActive,
  onLeaveCall,
  onJoinCall
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState(new Map()); // Map<userId, { pc, stream, user, micMuted, camOff, isSpeaking, screenSharing }>
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [viewMode, setViewMode] = useState("dock"); // 'dock' | 'expanded' | 'collapsed'
  const [selectedPeerId, setSelectedPeerId] = useState(null); // Pin peer

  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map()); // Mutable ref for peer connections
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Keep peersRef updated
  const updatePeerState = (userId, patch) => {
    setPeers((prev) => {
      const next = new Map(prev);
      if (next.has(userId)) {
        next.set(userId, { ...next.get(userId), ...patch });
      }
      return next;
    });
  };

  // Setup Voice Activity Detection (AnalyserNode)
  const setupVoiceDetection = (stream, onSpeakingChange) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let isSpeaking = false;
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speakingNow = average > 18; // threshold for voice
        if (speakingNow !== isSpeaking) {
          isSpeaking = speakingNow;
          onSpeakingChange(speakingNow);
        }
        animId = requestAnimationFrame(checkVolume);
      };

      let animId = requestAnimationFrame(checkVolume);

      return {
        stop: () => {
          cancelAnimationFrame(animId);
          source.disconnect();
          analyser.disconnect();
          if (audioCtx.state !== "closed") {
            audioCtx.close().catch(() => {});
          }
        }
      };
    } catch (err) {
      console.warn("Audio analyser error:", err);
      return null;
    }
  };

  // Create Peer Connection
  const createPeerConnection = useCallback((targetUserId, targetUser) => {
    if (peersRef.current.has(targetUserId)) {
      return peersRef.current.get(targetUserId).pc;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    let voiceDetector = null;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "webrtc:signal",
            payload: {
              roomId,
              targetUserId,
              signalData: { candidate: event.candidate },
              type: "candidate"
            }
          })
        );
      }
    };

    // Handle Remote Track received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      
      // Setup audio analyzer for peer speaking detection
      if (remoteStream.getAudioTracks().length > 0 && !voiceDetector) {
        voiceDetector = setupVoiceDetection(remoteStream, (speaking) => {
          updatePeerState(targetUserId, { isSpeaking: speaking });
        });
      }

      setPeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(targetUserId) || {
          user: targetUser,
          micMuted: false,
          camOff: false,
          isSpeaking: false,
          screenSharing: false
        };
        next.set(targetUserId, {
          ...existing,
          pc,
          stream: remoteStream,
          user: targetUser || existing.user
        });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        if (voiceDetector) voiceDetector.stop();
      }
    };

    const peerObj = {
      pc,
      stream: null,
      user: targetUser,
      micMuted: false,
      camOff: false,
      isSpeaking: false,
      screenSharing: false,
      voiceDetector
    };

    peersRef.current.set(targetUserId, peerObj);
    setPeers(new Map(peersRef.current));

    return pc;
  }, [roomId, wsRef]);

  // Initiate call by sending Offer to a peer
  const initiateOffer = useCallback(async (targetUserId, targetUser) => {
    try {
      const pc = createPeerConnection(targetUserId, targetUser);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "webrtc:signal",
            payload: {
              roomId,
              targetUserId,
              signalData: { sdp: pc.localDescription },
              type: "offer"
            }
          })
        );
      }
    } catch (err) {
      console.error("Failed to create offer for peer:", targetUserId, err);
    }
  }, [createPeerConnection, roomId, wsRef]);

  // Handle incoming signaling messages
  useEffect(() => {
    if (!wsRef.current) return;

    const handleMessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: evt, payload } = data;

        // 1. Existing Callers in Room when I join
        if (evt === "webrtc:room-callers") {
          const { callers } = payload || {};
          if (Array.isArray(callers)) {
            for (const caller of callers) {
              const callerId = caller.userId;
              if (callerId && callerId !== user?.id) {
                // I create offer to all existing callers
                initiateOffer(callerId, caller);
              }
            }
          }
        }

        // 2. New Peer Joined the Call
        if (evt === "webrtc:peer-joined") {
          const { caller } = payload || {};
          if (caller && caller.userId !== user?.id) {
            // New peer joined. They will receive our caller list and offer to us,
            // or we can register their presence
            createPeerConnection(caller.userId, caller);
            toast.success(`📹 ${caller.username} connected to Video Call!`, { icon: "🎙️", duration: 3000 });
          }
        }

        // 3. WebRTC Signal (Offer / Answer / Candidate)
        if (evt === "webrtc:signal") {
          const { senderUserId, senderUsername, signalData, type } = payload || {};
          if (!senderUserId || senderUserId === user?.id) return;

          let pc = peersRef.current.get(senderUserId)?.pc;
          if (!pc) {
            pc = createPeerConnection(senderUserId, { userId: senderUserId, username: senderUsername });
          }

          if (type === "offer" && signalData?.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  event: "webrtc:signal",
                  payload: {
                    roomId,
                    targetUserId: senderUserId,
                    signalData: { sdp: pc.localDescription },
                    type: "answer"
                  }
                })
              );
            }
          } else if (type === "answer" && signalData?.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          } else if (type === "candidate" && signalData?.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } catch (candErr) {
              console.warn("Error adding ICE candidate:", candErr);
            }
          }
        }

        // 4. Remote Peer Media State Change (Mute, Cam, Screen)
        if (evt === "webrtc:media-state") {
          const { userId, micMuted, camOff, screenSharing } = payload || {};
          if (userId && userId !== user?.id) {
            updatePeerState(userId, {
              ...(typeof micMuted === "boolean" ? { micMuted } : {}),
              ...(typeof camOff === "boolean" ? { camOff } : {}),
              ...(typeof screenSharing === "boolean" ? { screenSharing } : {})
            });
          }
        }

        // 5. Peer Left Call
        if (evt === "webrtc:peer-left") {
          const { userId, username } = payload || {};
          if (userId && peersRef.current.has(userId)) {
            const peerObj = peersRef.current.get(userId);
            if (peerObj.voiceDetector) peerObj.voiceDetector.stop();
            if (peerObj.pc) peerObj.pc.close();
            peersRef.current.delete(userId);
            setPeers(new Map(peersRef.current));
            toast(`👋 ${username || "Peer"} left video call`, { icon: "ℹ️", duration: 3000 });
          }
        }
      } catch (err) {
        console.error("WebRTC message processing error:", err);
      }
    };

    const ws = wsRef.current;
    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [createPeerConnection, initiateOffer, roomId, user?.id, wsRef]);

  // Start Local Media Stream when Call is Activated
  useEffect(() => {
    let detector = null;

    const startLocalStream = async () => {
      if (!isCallActive) return;
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (mediaErr) {
          // Fallback to audio only if video camera is unavailable/denied
          console.warn("Camera failed, falling back to audio only:", mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsCameraOff(true);
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup local speaking detection
        detector = setupVoiceDetection(stream, (speaking) => {
          setIsLocalSpeaking(speaking && !isMuted);
        });

        // Notify room that we joined the call
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              event: "webrtc:join",
              payload: {
                roomId,
                micMuted: isMuted,
                camOff: isCameraOff
              }
            })
          );
        }
      } catch (err) {
        console.error("Failed to access camera/mic:", err);
        toast.error("Could not access microphone or camera. Please check permissions.");
        onLeaveCall();
      }
    };

    if (isCallActive && !localStreamRef.current) {
      startLocalStream();
    }

    return () => {
      if (detector) detector.stop();
    };
  }, [isCallActive, onLeaveCall, roomId, wsRef]);

  // Cleanup on Component Unmount or Leaving Call
  const handleHangup = () => {
    // 1. Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);
    }

    // 2. Close peer connections
    peersRef.current.forEach((peerObj) => {
      if (peerObj.voiceDetector) peerObj.voiceDetector.stop();
      if (peerObj.pc) peerObj.pc.close();
    });
    peersRef.current.clear();
    setPeers(new Map());

    // 3. Notify server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "webrtc:leave",
          payload: { roomId }
        })
      );
    }

    onLeaveCall();
  };

  // Toggle Microphone (Talk / Mute)
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = !isMuted;
      audioTrack.enabled = !nextMuted;
      setIsMuted(nextMuted);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "webrtc:media-state",
            payload: {
              roomId,
              micMuted: nextMuted,
              camOff: isCameraOff,
              screenSharing: isScreenSharing
            }
          })
        );
      }
      toast(nextMuted ? "🔇 Microphone Muted" : "🎙️ Microphone Live (Talking)", { duration: 1800 });
    }
  };

  // Toggle Camera (On / Off)
  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextCamOff = !isCameraOff;
      videoTrack.enabled = !nextCamOff;
      setIsCameraOff(nextCamOff);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "webrtc:media-state",
            payload: {
              roomId,
              micMuted: isMuted,
              camOff: nextCamOff,
              screenSharing: isScreenSharing
            }
          })
        );
      }
      toast(nextCamOff ? "📷 Camera Disabled" : "📹 Camera Enabled", { duration: 1800 });
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace track on all active peer connections
        peersRef.current.forEach((peerObj) => {
          const senders = peerObj.pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Update local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);
        toast.success("🖥️ Sharing your screen with the room!");

        screenTrack.onended = () => {
          revertFromScreenShare();
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              event: "webrtc:media-state",
              payload: {
                roomId,
                micMuted: isMuted,
                camOff: isCameraOff,
                screenSharing: true
              }
            })
          );
        }
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    } else {
      revertFromScreenShare();
    }
  };

  const revertFromScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);

    // Revert peer video senders to camera track
    if (localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      peersRef.current.forEach((peerObj) => {
        const senders = peerObj.pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "webrtc:media-state",
          payload: {
            roomId,
            micMuted: isMuted,
            camOff: isCameraOff,
            screenSharing: false
          }
        })
      );
    }
    toast("🖥️ Stopped screen sharing", { duration: 1800 });
  };

  // Helper to attach stream to peer video elements
  const PeerVideoTile = ({ peerId, peerData }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current && peerData.stream) {
        videoRef.current.srcObject = peerData.stream;
        videoRef.current.play().catch(() => {});
      }
    }, [peerData.stream]);

    const isSpeaking = peerData.isSpeaking;
    const isMutedPeer = peerData.micMuted;
    const isCamOffPeer = peerData.camOff;
    const isPinned = selectedPeerId === peerId;

    return (
      <div
        className={`call-video-tile position-relative rounded-3 overflow-hidden d-flex align-items-center justify-content-center ${
          isSpeaking ? "tile-speaking" : ""
        } ${isPinned ? "border-primary" : ""}`}
        style={{
          background: "#0f172a",
          minHeight: viewMode === "expanded" ? "220px" : "110px",
          height: viewMode === "expanded" ? "240px" : "130px",
          width: viewMode === "expanded" ? "100%" : "180px",
          flexShrink: 0,
          border: isSpeaking ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: isSpeaking ? "0 0 16px rgba(16, 185, 129, 0.45)" : "none",
          transition: "all 0.25s ease"
        }}
        onClick={() => setSelectedPeerId(isPinned ? null : peerId)}
        title="Click to pin/unpin video"
      >
        {/* Remote Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-100 h-100 object-fit-cover ${isCamOffPeer ? "d-none" : "d-block"}`}
        />

        {/* Fallback Avatar if Camera Off */}
        {isCamOffPeer && (
          <div className="d-flex flex-column align-items-center justify-content-center gap-1 text-light p-2">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${
                isSpeaking ? "speaking-avatar-pulse" : ""
              }`}
              style={{
                width: viewMode === "expanded" ? "64px" : "42px",
                height: viewMode === "expanded" ? "64px" : "42px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                fontSize: viewMode === "expanded" ? "1.4rem" : "1rem",
                boxShadow: isSpeaking ? "0 0 12px #10b981" : "none"
              }}
            >
              {(peerData.user?.username || "P").slice(0, 2).toUpperCase()}
            </div>
            <span className="small text-muted" style={{ fontSize: "0.72rem" }}>
              Camera Off
            </span>
          </div>
        )}

        {/* User Tag & Status Badges */}
        <div
          className="position-absolute bottom-0 start-0 end-0 p-1 px-2 d-flex align-items-center justify-content-between text-white"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", fontSize: "0.75rem" }}
        >
          <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: "110px" }}>
            {isSpeaking && <Radio size={12} className="text-success animate-pulse" />}
            <span className="fw-semibold text-truncate">{peerData.user?.username || "Teammate"}</span>
          </div>

          <div className="d-flex align-items-center gap-1">
            {isMutedPeer ? (
              <span className="p-1 rounded-circle bg-danger text-white" title="Muted">
                <MicOff size={10} />
              </span>
            ) : (
              <span className="p-1 rounded-circle bg-success text-white" title="Live Microphone">
                <Mic size={10} />
              </span>
            )}
            {peerData.screenSharing && (
              <span className="p-1 rounded-circle bg-primary text-white" title="Sharing Screen">
                <MonitorUp size={10} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isCallActive) {
    return null;
  }

  const totalCallers = peers.size + 1;

  return (
    <div
      className={`video-call-container position-fixed ${
        viewMode === "collapsed"
          ? "call-collapsed"
          : viewMode === "expanded"
          ? "call-expanded"
          : "call-docked"
      }`}
      style={{
        zIndex: 1040,
        bottom: viewMode === "expanded" ? "20px" : "20px",
        right: viewMode === "expanded" ? "20px" : "20px",
        left: viewMode === "expanded" ? "20px" : "auto",
        maxWidth: viewMode === "expanded" ? "1200px" : "780px",
        width: viewMode === "expanded" ? "calc(100vw - 40px)" : "auto",
        maxHeight: viewMode === "expanded" ? "80vh" : "auto",
        margin: viewMode === "expanded" ? "0 auto" : "0"
      }}
    >
      <div
        className="clay-card-static p-2 p-md-3"
        style={{
          background: "var(--bg-surface-elevated)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-glass)",
          boxShadow: "var(--shadow-xl)"
        }}
      >
        {/* Header Strip */}
        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom" style={{ borderColor: "var(--border-glass)" }}>
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex p-1 rounded-circle text-success"
              style={{ background: "rgba(16, 185, 129, 0.15)" }}
            >
              <Radio size={14} className="animate-pulse" />
            </div>
            <span className="fw-bold small" style={{ color: "var(--text-primary)" }}>
              Live Room Call ({totalCallers} {totalCallers === 1 ? "Member" : "Members"})
            </span>
            {isLocalSpeaking && (
              <span className="badge bg-success-subtle text-success border border-success-subtle small py-0 px-1" style={{ fontSize: "0.7rem" }}>
                Speaking 🔊
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-1">
            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === "expanded" ? "dock" : "expanded")}
              className="clay-btn p-1"
              style={{ width: "28px", height: "28px" }}
              title={viewMode === "expanded" ? "Dock to Bottom Strip" : "Expand Full Grid"}
            >
              {viewMode === "expanded" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            <button
              onClick={() => setViewMode(viewMode === "collapsed" ? "dock" : "collapsed")}
              className="clay-btn p-1"
              style={{ width: "28px", height: "28px" }}
              title={viewMode === "collapsed" ? "Show Call Bar" : "Minimize Call Bar"}
            >
              {viewMode === "collapsed" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Video Grid / Strip (Hidden when collapsed) */}
        {viewMode !== "collapsed" && (
          <div
            className={`d-flex gap-2 overflow-x-auto py-1 mb-2 align-items-center ${
              viewMode === "expanded" ? "row g-2 overflow-y-auto" : "flex-nowrap"
            }`}
            style={{
              maxHeight: viewMode === "expanded" ? "55vh" : "150px",
              scrollbarWidth: "thin"
            }}
          >
            {/* Local Video Tile (You) */}
            <div
              className={`call-video-tile position-relative rounded-3 overflow-hidden d-flex align-items-center justify-content-center ${
                viewMode === "expanded" ? "col-12 col-md-6 col-lg-4" : ""
              } ${isLocalSpeaking ? "tile-speaking" : ""}`}
              style={{
                background: "#0f172a",
                minHeight: viewMode === "expanded" ? "220px" : "110px",
                height: viewMode === "expanded" ? "240px" : "130px",
                width: viewMode === "expanded" ? "100%" : "180px",
                flexShrink: 0,
                border: isLocalSpeaking ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: isLocalSpeaking ? "0 0 16px rgba(16, 185, 129, 0.45)" : "none"
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-100 h-100 object-fit-cover ${isCameraOff ? "d-none" : "d-block"}`}
                style={{ transform: isScreenSharing ? "none" : "scaleX(-1)" }}
              />

              {isCameraOff && (
                <div className="d-flex flex-column align-items-center justify-content-center gap-1 text-light p-2">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${
                      isLocalSpeaking ? "speaking-avatar-pulse" : ""
                    }`}
                    style={{
                      width: viewMode === "expanded" ? "64px" : "42px",
                      height: viewMode === "expanded" ? "64px" : "42px",
                      background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                      fontSize: viewMode === "expanded" ? "1.4rem" : "1rem",
                      boxShadow: isLocalSpeaking ? "0 0 12px #10b981" : "none"
                    }}
                  >
                    {(user?.username || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="small text-muted" style={{ fontSize: "0.72rem" }}>
                    Camera Off
                  </span>
                </div>
              )}

              {/* Local User Tag */}
              <div
                className="position-absolute bottom-0 start-0 end-0 p-1 px-2 d-flex align-items-center justify-content-between text-white"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", fontSize: "0.75rem" }}
              >
                <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: "110px" }}>
                  <span className="fw-bold text-truncate">{user?.username || "You"} (You)</span>
                </div>

                <div className="d-flex align-items-center gap-1">
                  {isMuted ? (
                    <span className="p-1 rounded-circle bg-danger text-white" title="Muted">
                      <MicOff size={10} />
                    </span>
                  ) : (
                    <span className="p-1 rounded-circle bg-success text-white" title="Mic On">
                      <Mic size={10} />
                    </span>
                  )}
                  {isScreenSharing && (
                    <span className="p-1 rounded-circle bg-primary text-white" title="Screen Sharing">
                      <MonitorUp size={10} />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remote Peer Video Tiles */}
            {Array.from(peers.entries()).map(([peerId, peerData]) => (
              <div
                key={peerId}
                className={viewMode === "expanded" ? "col-12 col-md-6 col-lg-4" : ""}
                style={{ flexShrink: 0 }}
              >
                <PeerVideoTile peerId={peerId} peerData={peerData} />
              </div>
            ))}
          </div>
        )}

        {/* Interactive Controls Bar */}
        <div className="d-flex align-items-center justify-content-center gap-2 pt-1 flex-wrap">
          {/* Mute / Talk Button */}
          <button
            onClick={toggleMute}
            className={`clay-btn py-1 px-3 d-flex align-items-center gap-2 ${
              isMuted ? "clay-btn-danger" : "clay-btn-primary"
            }`}
            style={{ fontSize: "0.82rem", borderRadius: "10px" }}
            title={isMuted ? "Unmute Microphone (Talk)" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
            <span className="fw-semibold">{isMuted ? "Muted" : "Talk / Mic On"}</span>
          </button>

          {/* Camera On / Off Button */}
          <button
            onClick={toggleCamera}
            className={`clay-btn py-1 px-3 d-flex align-items-center gap-2 ${
              isCameraOff ? "clay-btn-danger" : ""
            }`}
            style={{ fontSize: "0.82rem", borderRadius: "10px" }}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? <VideoOff size={15} /> : <Video size={15} />}
            <span className="d-none d-sm-inline">{isCameraOff ? "Cam Off" : "Cam On"}</span>
          </button>

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`clay-btn py-1 px-3 d-flex align-items-center gap-2 ${
              isScreenSharing ? "clay-btn-primary bg-info text-dark" : ""
            }`}
            style={{ fontSize: "0.82rem", borderRadius: "10px" }}
            title={isScreenSharing ? "Stop Screen Share" : "Share Your Screen"}
          >
            <MonitorUp size={15} />
            <span className="d-none d-sm-inline">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
          </button>

          {/* Leave / Hangup Button */}
          <button
            onClick={handleHangup}
            className="clay-btn clay-btn-danger py-1 px-3 d-flex align-items-center gap-2"
            style={{ fontSize: "0.82rem", borderRadius: "10px" }}
            title="Leave Call"
          >
            <PhoneOff size={15} />
            <span className="fw-semibold">Leave Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallOverlay;
