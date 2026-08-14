const http = require("http");
const dotenv = require("dotenv");
const { WebSocketServer } = require("ws");

// Load environment variables from .env file
dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const redis = require("./src/config/redis");
const { handleConnection } = require("./src/websocket/socketHandlers");

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize WebSocket Server without standalone port (handled via HTTP upgrade)
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade protocol on the HTTP server
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Attach WebSocket connection listeners
handleConnection(wss);

// Start server function
const startServer = async () => {
  try {
    // 1. Connect to MongoDB database
    await connectDB();

    // 2. Test Redis connection (Optional fallback if offline)
    try {
      await redis.ping();
      console.log("Redis connected successfully.");
    } catch (redisError) {
      console.warn("⚠️ Warning: Redis is offline. Caching & live room states will be disabled.");
    }

    // 3. Start listening on designated port
    server.listen(PORT, () => {
      console.log(`Server listening on HTTP and WebSocket protocol on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
