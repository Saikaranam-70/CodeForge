const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redis = require("../config/redis");

const SECRET_KEY = process.env.JWT_SECRET;

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Step 1: Check if user already exists with given email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Step 2: Hash password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: Create and save new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Login user and issue JWT token with single active session ID
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(403).json({ message: "Invalid email or password" });
    }

    // Step 2: Validate password hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Step 3: Generate new unique active session ID
    const activeSessionId = crypto.randomUUID();
    user.activeSessionId = activeSessionId;
    await user.save();

    // Step 4: Cache active session in Redis (7 days TTL)
    if (redis.status === "ready") {
      try {
        await redis.setex(`active_session:${user._id}`, 7 * 24 * 3600, activeSessionId);
      } catch (redisError) {
        console.warn("Redis SET warning for active session:", redisError.message);
      }
    }

    // Step 5: Sign JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        sessionId: activeSessionId,
        role: user.role
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successfull",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Fetch authenticated user profile details
 * GET /api/auth/me
 */
const me = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `user:${userId}`;

    // Step 1: Check Redis cache first
    if (redis.status === "ready") {
      try {
        const cachedUser = await redis.get(cacheKey);
        if (cachedUser) {
          return res.status(200).json(JSON.parse(cachedUser));
        }
      } catch (redisError) {
        console.warn("Redis GET warning in me controller:", redisError.message);
      }
    }

    // Step 2: Fetch user from database
    const user = await User.findById(userId).select(
      "username email createdAt streakCount longestStreak solvedStats"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      solvedStats: user.solvedStats
    };

    // Step 3: Cache user data in Redis (1 hour TTL)
    if (redis.status === "ready") {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(userData));
      } catch (redisError) {
        console.warn("Redis SET warning in me controller:", redisError.message);
      }
    }

    return res.status(200).json(userData);
  } catch (error) {
    console.error("GET /me Controller Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  me
};