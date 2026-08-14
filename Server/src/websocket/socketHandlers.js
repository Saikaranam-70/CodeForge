const url = require("url");
const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

// In-memory registry for active room connections: Map<roomId, Set<WebSocket>>
const rooms = new Map();

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

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = {
        userId: decoded.userId,
        username: decoded.username
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
            currentRoomId = roomId;

            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Set());
            }
            rooms.get(roomId).add(ws);

            let currentCode = "";
            let currentLanguage = "javascript";

            // Fetch current room code & language state from Redis
            if (redis.status === "ready") {
              try {
                const storedCode = await redis.get(`room:code:${roomId}`);
                const storedLang = await redis.get(`room:lang:${roomId}`);
                if (storedCode !== null) currentCode = storedCode;
                if (storedLang !== null) currentLanguage = storedLang;
              } catch (err) {
                console.warn("Redis GET warning in room:join:", err.message);
              }
            }

            // Compile active members list
            const members = [];
            rooms.get(roomId).forEach((client) => {
              if (client.user) {
                members.push({
                  userId: client.user.userId,
                  username: client.user.username
                });
              }
            });

            // Broadcast joined state to all participants in the room
            const joinResponse = JSON.stringify({
              event: "room:joined",
              payload: {
                members,
                currentCode,
                currentLanguage
              }
            });

            rooms.get(roomId).forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(joinResponse);
              }
            });
          }

          // Event 2: Code content or language change
          if (event === "code:change") {
            const { roomId, changes } = payload;

            // Cache updated code and language in Redis (24 hours TTL)
            if (redis.status === "ready") {
              try {
                if (changes && typeof changes.text === "string") {
                  await redis.setex(`room:code:${roomId}`, 86400, changes.text);
                }
                if (payload.language) {
                  await redis.setex(`room:lang:${roomId}`, 86400, payload.language);
                }
              } catch (err) {
                console.warn("Redis SET warning in code:change:", err.message);
              }
            }

            // Broadcast code changes to all other peers in the room
            if (rooms.has(roomId)) {
              rooms.get(roomId).forEach((client) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                  client.send(
                    JSON.stringify({
                      event: "code:change",
                      payload
                    })
                  );
                }
              });
            }
          }

          // Event 3: Cursor position change
          if (event === "cursor:move") {
            const { roomId } = payload;
            if (rooms.has(roomId)) {
              rooms.get(roomId).forEach((client) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                  client.send(
                    JSON.stringify({
                      event: "cursor:move",
                      payload: {
                        ...payload,
                        user: ws.user
                      }
                    })
                  );
                }
              });
            }
          }

          // Event 4: Live room chat message
          if (event === "chat:message") {
            const { roomId, message: msgText } = payload;
            if (rooms.has(roomId)) {
              rooms.get(roomId).forEach((client) => {
                if (client.readyState === ws.OPEN) {
                  client.send(
                    JSON.stringify({
                      event: "chat:message",
                      payload: {
                        roomId,
                        message: msgText,
                        user: ws.user,
                        timestamp: new Date().toISOString()
                      }
                    })
                  );
                }
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
              if (client.user) {
                members.push({
                  userId: client.user.userId,
                  username: client.user.username
                });
              }
            });

            rooms.get(currentRoomId).forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(
                  JSON.stringify({
                    event: "room:joined",
                    payload: {
                      members
                    }
                  })
                );
              }
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
  handleConnection
};

