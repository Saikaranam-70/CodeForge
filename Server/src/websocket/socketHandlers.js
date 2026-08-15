const url = require("url");
const jwt = require("jsonwebtoken");
const { WebSocket } = require("ws");
const redis = require("../config/redis");
const Room = require("../models/Room");

// In-memory registry for active room connections: Map<roomId, Set<WebSocket>>
const rooms = new Map();

// In-memory cache for room state (active code, language, selected problem index): Map<roomId, { code, language, selectedProblemIdx, expiresAt }>
const roomStates = new Map();

// In-memory registry for active video/audio call participants: Map<roomId, Map<userId, { userId, username, micMuted, camOff, screenSharing }>>
const roomCallParticipants = new Map();

// In-memory cache for collaborative whiteboard strokes: Map<roomId, Array<strokeAction>>
const roomBoardStates = new Map();

const isSocketOpen = (client) => client && client.readyState === WebSocket.OPEN;

const broadcastToRoom = (roomId, eventName, payload, excludeSocket = null) => {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;

  roomClients.forEach((client) => {
    if (client !== excludeSocket && isSocketOpen(client)) {
      try {
        client.send(JSON.stringify({ event: eventName, payload }));
      } catch (sendErr) {
        console.warn("Failed to broadcast message to socket:", sendErr.message);
      }
    }
  });
};

/**
 * Returns number of active online connections for a room
 */
const getLiveMemberCount = (roomId) => {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return 0;
  let count = 0;
  roomClients.forEach((client) => {
    if (isSocketOpen(client)) count++;
  });
  return count;
};

/**
 * Returns list of active room IDs
 */
const getLiveRoomIds = () => {
  const activeIds = [];
  rooms.forEach((clients, roomId) => {
    let hasOpen = false;
    clients.forEach((c) => {
      if (isSocketOpen(c)) hasOpen = true;
    });
    if (hasOpen) activeIds.push(roomId);
  });
  return activeIds;
};

/**
 * Handle incoming WebSocket connections and dispatch room events
 */
const handleConnection = (wss) => {
  // Keep-alive heartbeat: ping active clients every 25 seconds to prevent cloud load-balancer drops
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 25000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  wss.on("connection", async (ws, req) => {
    try {
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Step 1: Extract and verify JWT token from connection query string
      const parsedUrl = url.parse(req.url, true);
      const token = parsedUrl.query.token;

      if (!token) {
        ws.close(4001, "Unauthorized");
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtErr) {
        ws.close(4001, "Invalid token");
        return;
      }

      ws.user = {
        userId: decoded.userId || decoded.id || decoded._id,
        username: decoded.username || "Coder"
      };

      let currentRoomId = null;

      // Step 2: Handle incoming client messages
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());
          const { event, payload } = data;

          // Event 1: User joins room
          if (event === "room:join") {
            const { roomId } = payload || {};
            if (!roomId) return;

            // If socket was in a previous room, remove it
            if (currentRoomId && currentRoomId !== roomId && rooms.has(currentRoomId)) {
              rooms.get(currentRoomId).delete(ws);
              if (roomCallParticipants.has(currentRoomId)) {
                roomCallParticipants.get(currentRoomId).delete(ws.user.userId);
              }
            }

            currentRoomId = roomId;

            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Set());
            }
            rooms.get(roomId).add(ws);

            // Fetch room state from in-memory cache or Redis
            let state = roomStates.get(roomId) || {
              code: "",
              language: "javascript",
              selectedProblemIdx: 0,
              expiresAt: null
            };

            if (redis.status === "ready") {
              try {
                const storedCode = await redis.get(`room:code:${roomId}`);
                const storedLang = await redis.get(`room:lang:${roomId}`);
                const storedProbIdx = await redis.get(`room:prob:${roomId}`);
                if (storedCode !== null) state.code = storedCode;
                if (storedLang !== null) state.language = storedLang;
                if (storedProbIdx !== null) state.selectedProblemIdx = parseInt(storedProbIdx, 10) || 0;
              } catch (err) {
                console.warn("Redis GET warning in room:join:", err.message);
              }
            }

            // Fetch room expiration if not already cached
            if (!state.expiresAt && String(roomId).match(/^[0-9a-fA-F]{24}$/)) {
              try {
                const roomDoc = await Room.findById(roomId).select("expiresAt");
                if (roomDoc && roomDoc.expiresAt) {
                  state.expiresAt = roomDoc.expiresAt;
                }
              } catch (docErr) {}
            }

            roomStates.set(roomId, state);

            // Compile active members list
            const members = [];
            rooms.get(roomId).forEach((client) => {
              if (client.user && isSocketOpen(client)) {
                members.push({
                  userId: client.user.userId,
                  username: client.user.username
                });
              }
            });

            // Get current active callers in room
            const callers = roomCallParticipants.has(roomId)
              ? Array.from(roomCallParticipants.get(roomId).values())
              : [];

            // Broadcast joined state to all participants in the room
            broadcastToRoom(roomId, "room:joined", {
              members,
              currentCode: state.code,
              currentLanguage: state.language,
              selectedProblemIdx: state.selectedProblemIdx,
              expiresAt: state.expiresAt,
              activeCallers: callers,
              joinedUser: ws.user
            });
          }

          // Event 2: Code content or language change
          if (event === "code:change") {
            const { roomId, changes, language } = payload || {};
            if (!roomId) return;

            const state = roomStates.get(roomId) || {
              code: "",
              language: language || "javascript",
              selectedProblemIdx: 0
            };

            if (changes && typeof changes.text === "string") {
              state.code = changes.text;
            }
            if (language) {
              state.language = language;
            }
            roomStates.set(roomId, state);

            // Cache in Redis (24 hours TTL) if available
            if (redis.status === "ready") {
              try {
                if (changes && typeof changes.text === "string") {
                  await redis.setex(`room:code:${roomId}`, 86400, changes.text);
                }
                if (language) {
                  await redis.setex(`room:lang:${roomId}`, 86400, language);
                }
              } catch (err) {
                console.warn("Redis SET warning in code:change:", err.message);
              }
            }

            // Broadcast code changes to all other peers in the room (excluding sender)
            if (rooms.has(roomId)) {
              broadcastToRoom(roomId, "code:change", payload, ws);
            }
          }

          // Event 3: Problem selection switch
          if (event === "problem:change") {
            const { roomId, selectedProblemIdx } = payload || {};
            if (!roomId) return;

            const state = roomStates.get(roomId) || {
              code: "",
              language: "javascript",
              selectedProblemIdx: 0
            };
            state.selectedProblemIdx = typeof selectedProblemIdx === "number" ? selectedProblemIdx : 0;
            roomStates.set(roomId, state);

            if (redis.status === "ready") {
              try {
                await redis.setex(`room:prob:${roomId}`, 86400, String(selectedProblemIdx));
              } catch (err) {
                console.warn("Redis SET warning in problem:change:", err.message);
              }
            }

            // Broadcast problem change to everyone including sender/peers
            if (rooms.has(roomId)) {
              broadcastToRoom(roomId, "problem:change", {
                roomId,
                selectedProblemIdx,
                user: ws.user
              });
            }
          }

          // Event 4: Cursor position change
          if (event === "cursor:move") {
            const { roomId } = payload || {};
            if (roomId && rooms.has(roomId)) {
              broadcastToRoom(roomId, "cursor:move", {
                ...payload,
                user: ws.user
              }, ws);
            }
          }

          // Event 5: Live room chat message
          if (event === "chat:message") {
            const { roomId, message: msgText } = payload || {};
            if (roomId && rooms.has(roomId) && msgText) {
              broadcastToRoom(roomId, "chat:message", {
                roomId,
                message: msgText,
                user: ws.user,
                timestamp: new Date().toISOString()
              });
            }
          }

          // ==========================================
          // WEBRTC VIDEO & AUDIO CALL SIGNALING EVENTS
          // ==========================================

          // Event 6: User joins Video Call in Room
          if (event === "webrtc:join") {
            const { roomId, micMuted, camOff } = payload || {};
            if (!roomId) return;

            if (!roomCallParticipants.has(roomId)) {
              roomCallParticipants.set(roomId, new Map());
            }

            const callMap = roomCallParticipants.get(roomId);
            const callerInfo = {
              userId: ws.user.userId,
              username: ws.user.username,
              micMuted: !!micMuted,
              camOff: !!camOff,
              screenSharing: false
            };

            // Existing callers before adding this user
            const existingCallers = Array.from(callMap.values()).filter(
              (c) => String(c.userId) !== String(ws.user.userId)
            );

            callMap.set(ws.user.userId, callerInfo);

            // 1. Reply to joining user with list of callers already in the room
            if (isSocketOpen(ws)) {
              ws.send(
                JSON.stringify({
                  event: "webrtc:room-callers",
                  payload: {
                    callers: existingCallers
                  }
                })
              );
            }

            // 2. Broadcast to other members in room that this user joined video call
            broadcastToRoom(
              roomId,
              "webrtc:peer-joined",
              {
                caller: callerInfo
              },
              ws
            );
          }

          // Event 7: WebRTC Direct Signaling (Offer, Answer, ICE Candidate)
          if (event === "webrtc:signal") {
            const { roomId, targetUserId, signalData, type } = payload || {};
            if (!roomId || !targetUserId || !signalData) return;

            const roomClients = rooms.get(roomId);
            if (roomClients) {
              roomClients.forEach((client) => {
                if (
                  client.user &&
                  String(client.user.userId) === String(targetUserId) &&
                  isSocketOpen(client)
                ) {
                  try {
                    client.send(
                      JSON.stringify({
                        event: "webrtc:signal",
                        payload: {
                          senderUserId: ws.user.userId,
                          senderUsername: ws.user.username,
                          signalData,
                          type
                        }
                      })
                    );
                  } catch (err) {
                    console.warn("Failed to route WebRTC signal:", err.message);
                  }
                }
              });
            }
          }

          // Event 8: WebRTC Media State Toggle (Mute/Unmute Mic, Cam On/Off, Screen Share)
          if (event === "webrtc:media-state") {
            const { roomId, micMuted, camOff, screenSharing } = payload || {};
            if (roomId && roomCallParticipants.has(roomId)) {
              const callMap = roomCallParticipants.get(roomId);
              if (callMap.has(ws.user.userId)) {
                const current = callMap.get(ws.user.userId);
                if (typeof micMuted === "boolean") current.micMuted = micMuted;
                if (typeof camOff === "boolean") current.camOff = camOff;
                if (typeof screenSharing === "boolean") current.screenSharing = screenSharing;
                callMap.set(ws.user.userId, current);
              }

              broadcastToRoom(roomId, "webrtc:media-state", {
                userId: ws.user.userId,
                micMuted,
                camOff,
                screenSharing
              });
            }
          }

          // Event 9: WebRTC User Leaves Call
          if (event === "webrtc:leave") {
            const { roomId } = payload || {};
            if (roomId && roomCallParticipants.has(roomId)) {
              const callMap = roomCallParticipants.get(roomId);
              callMap.delete(ws.user.userId);
              if (callMap.size === 0) {
                roomCallParticipants.delete(roomId);
              }

              broadcastToRoom(roomId, "webrtc:peer-left", {
                userId: ws.user.userId,
                username: ws.user.username
              });
            }
          }

          // ==========================================
          // COLLABORATIVE WHITEBOARD EVENTS
          // ==========================================

          // Event 10: Real-time stroke/shape drawn on board
          if (event === "board:draw") {
            const { roomId, action } = payload || {};
            if (roomId && action) {
              if (!roomBoardStates.has(roomId)) {
                roomBoardStates.set(roomId, []);
              }
              const history = roomBoardStates.get(roomId);
              history.push(action);
              if (history.length > 2500) {
                history.shift(); // Keep buffer bounded
              }

              if (redis.status === "ready") {
                try {
                  redis.setex(`room:board:${roomId}`, 86400, JSON.stringify(history)).catch(() => {});
                } catch (e) {}
              }

              // Broadcast stroke to other peers in the room
              if (rooms.has(roomId)) {
                broadcastToRoom(
                  roomId,
                  "board:draw",
                  {
                    action,
                    user: ws.user
                  },
                  ws
                );
              }
            }
          }

          // Event 11: Clear Whiteboard Canvas
          if (event === "board:clear") {
            const { roomId } = payload || {};
            if (roomId) {
              roomBoardStates.set(roomId, []);
              if (redis.status === "ready") {
                try {
                  redis.del(`room:board:${roomId}`).catch(() => {});
                } catch (e) {}
              }

              broadcastToRoom(roomId, "board:clear", {
                user: ws.user
              });
            }
          }

          // Event 12: Real-time Laser Pointer / Cursor on Board
          if (event === "board:laser") {
            const { roomId, point } = payload || {};
            if (roomId && point && rooms.has(roomId)) {
              broadcastToRoom(
                roomId,
                "board:laser",
                {
                  point,
                  user: ws.user
                },
                ws
              );
            }
          }

          // Event 13: Fetch full Whiteboard State
          if (event === "board:get-state") {
            const { roomId } = payload || {};
            if (roomId) {
              let history = roomBoardStates.get(roomId) || [];
              if (history.length === 0 && redis.status === "ready") {
                try {
                  const cached = await redis.get(`room:board:${roomId}`);
                  if (cached) {
                    history = JSON.parse(cached);
                    roomBoardStates.set(roomId, history);
                  }
                } catch (e) {}
              }

              if (isSocketOpen(ws)) {
                ws.send(
                  JSON.stringify({
                    event: "board:init",
                    payload: { history }
                  })
                );
              }
            }
          }
        } catch (err) {
          console.error("WebSocket message handling error:", err.message);
        }
      });

      // Step 3: Handle client disconnection
      ws.on("close", () => {
        if (currentRoomId && rooms.has(currentRoomId)) {
          rooms.get(currentRoomId).delete(ws);

          // If user was in call, clean up call participant state
          if (roomCallParticipants.has(currentRoomId)) {
            const callMap = roomCallParticipants.get(currentRoomId);
            if (callMap.has(ws.user.userId)) {
              callMap.delete(ws.user.userId);
              if (callMap.size === 0) {
                roomCallParticipants.delete(currentRoomId);
              }
              broadcastToRoom(currentRoomId, "webrtc:peer-left", {
                userId: ws.user.userId,
                username: ws.user.username
              });
            }
          }

          if (rooms.get(currentRoomId).size === 0) {
            rooms.delete(currentRoomId);
          } else {
            const members = [];
            rooms.get(currentRoomId).forEach((client) => {
              if (client.user && isSocketOpen(client)) {
                members.push({
                  userId: client.user.userId,
                  username: client.user.username
                });
              }
            });

            broadcastToRoom(currentRoomId, "room:joined", {
              members,
              leftUser: ws.user
            });
          }
        }
      });
    } catch (error) {
      console.error("WebSocket connection error:", error.message);
      try {
        ws.close(4003, "Internal server error");
      } catch (closeErr) {}
    }
  });
};

module.exports = {
  handleConnection,
  getLiveMemberCount,
  getLiveRoomIds
};
