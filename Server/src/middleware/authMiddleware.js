const jwt = require("jsonwebtoken");
const redis = require("../config/redis");
const User = require("../models/User");

const SECRET_KEY = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token and enforce single active device session.
 */
const verifyToken = async (req, res, next) => {
  try {
    // Step 1: Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided" });
    }

    // Step 2: Extract and verify JWT
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    // Step 3: Check active session ID in Redis cache
    let activeSessionId = null;
    const cacheKey = `active_session:${decoded.userId}`;

    if (redis.status === "ready") {
      try {
        activeSessionId = await redis.get(cacheKey);
      } catch (redisError) {
        console.warn("Redis GET warning in authMiddleware:", redisError.message);
      }
    }

    // Step 4: If not found in cache, check database
    if (!activeSessionId) {
      const user = await User.findById(decoded.userId).select("activeSessionId");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      activeSessionId = user.activeSessionId;

      // Populate Redis cache for subsequent requests (7 days TTL)
      if (activeSessionId && redis.status === "ready") {
        try {
          await redis.setex(cacheKey, 7 * 24 * 3600, activeSessionId);
        } catch (redisError) {
          console.warn("Redis SET warning in authMiddleware:", redisError.message);
        }
      }
    }

    // Step 5: Compare session IDs to invalidate concurrent sessions
    if (!activeSessionId || decoded.sessionId !== activeSessionId) {
      return res.status(401).json({
        message: "Session invalidated. Another device logged in using these credentials."
      });
    }

    // Attach decoded user payload to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * Middleware to verify Admin role access.
 */
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
};

verifyToken.verifyAdmin = verifyAdmin;

module.exports = verifyToken;