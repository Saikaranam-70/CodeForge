const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Initialize Redis client with automatic reconnect configuration
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.slice(0, targetError.length) === targetError) {
      return true;
    }
    return false;
  }
});

// Event Listeners
redis.on("connect", () => {
  console.log("Redis connecting...");
});

redis.on("ready", () => {
  console.log("Redis Client connected and ready to use.");
});

redis.on("error", (err) => {
  console.error("Redis Connection Error:", err.message);
});

redis.on("close", () => {
  console.log("Redis connection closed.");
});

module.exports = redis;
