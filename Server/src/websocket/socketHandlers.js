const url = require("url");
const jwt = require("jsonwebtoken");
const { WebSocket } = require("ws");
const redis = require("../config/redis");

// In-memory registry for active room connections: Map<roomId, Set<WebSocket>>
const rooms = new Map();

// In-memory cache for room state (active code, language, selected problem index): Map<roomId, { code, language, selectedProblemIdx }>
const roomStates = new Map();

const isSocketOpen = (client) => client && client.readyState === WebSocket.OPEN;

const broadcastToRoom = (roomId, eventName, payload, excludeSocket = null) => {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;

  roomClients.forEach((client) => {
    if (client !== excludeSocket && isSocketOpen(client)) {
      client.send(JSON.stringify({ event: eventName, payload }));
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
  wss.on("connection", async (ws, req) => {
    try {
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
            const { roomId } = payload;
            if (!roomId) return;

            // If socket was in a previous room, remove it
            if (currentRoomId && currentRoomId !== roomId && rooms.has(currentRoomId)) {
              rooms.get(currentRoomId).delete(ws);
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
              selectedProblemIdx: 0
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

            // Broadcast joined state to all participants in the room
            broadcastToRoom(roomId, "room:joined", {
              members,
              currentCode: state.code,
              currentLanguage: state.language,
              selectedProblemIdx: state.selectedProblemIdx,
              joinedUser: ws.user
            });
          }

          // Event 2: Code content or language change
          if (event === "code:change") {
            const { roomId, changes, language } = payload;
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

            // Broadcast code changes to all other peers in the room
            if (rooms.has(roomId)) {
              broadcastToRoom(roomId, "code:change", payload, ws);
            }
          }

          // Event 3: Problem selection switch
          if (event === "problem:change") {
            const { roomId, selectedProblemIdx } = payload;
            if (!roomId) return;

            const state = roomStates.get(roomId) || {
              code: "",
              language: "javascript",
              selectedProblemIdx: 0
            };
            state.selectedProblemIdx = selectedProblemIdx;
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
            const { roomId } = payload;
            if (rooms.has(roomId)) {
              broadcastToRoom(roomId, "cursor:move", {
                ...payload,
                user: ws.user
              }, ws);
            }
          }

          // Event 5: Live room chat message
          if (event === "chat:message") {
            const { roomId, message: msgText } = payload;
            if (rooms.has(roomId)) {
              broadcastToRoom(roomId, "chat:message", {
                roomId,
                message: msgText,
                user: ws.user,
                timestamp: new Date().toISOString()
              });
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
      ws.close(4003, "Internal server error");
    }
  });
};

module.exports = {
  handleConnection,
  getLiveMemberCount,
  getLiveRoomIds
};
