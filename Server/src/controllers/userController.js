const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const Problem = require("../models/Problem");
const Room = require("../models/Room");
const Submission = require("../models/Submission");
const redis = require("../config/redis");
const { sendRegistrationOtpEmail, sendForgotPasswordOtpEmail } = require("../services/emailService");

const SECRET_KEY = process.env.JWT_SECRET || "codeforge_jwt_secret";

// Helper: Generate secure 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP for Registration Verification
 * POST /api/auth/send-register-otp
 */
const sendRegisterOtp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check if email already registered
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Check if username already taken
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Check cooldown (45 seconds)
    const existingOtp = await Otp.findOne({ email: normalizedEmail, type: "register" });
    if (existingOtp && existingOtp.lastSentAt) {
      const secondsSinceLastSent = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSent < 45) {
        const waitSecs = Math.ceil(45 - secondsSinceLastSent);
        return res.status(429).json({
          message: `Please wait ${waitSecs} seconds before requesting a new verification code.`
        });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in MongoDB
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, type: "register" },
      {
        email: normalizedEmail,
        otp,
        type: "register",
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    // Also store in Redis cache if available
    if (redis && redis.status === "ready") {
      try {
        await redis.setex(`otp:register:${normalizedEmail}`, 600, otp);
      } catch (err) {}
    }

    // Send email via Brevo
    await sendRegistrationOtpEmail(normalizedEmail, otp, cleanUsername);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email."
    });
  } catch (error) {
    console.error("Send Register OTP Error:", error);
    return res.status(500).json({ message: error.message || "Failed to send verification code" });
  }
};

/**
 * Verify Registration OTP and create user account
 * POST /api/auth/verify-register-otp
 */
const verifyRegisterOtp = async (req, res) => {
  try {
    const { username, email, password, otp, role } = req.body;

    if (!username || !email || !password || !otp) {
      return res.status(400).json({ message: "All fields including OTP code are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check again if user exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: cleanUsername }]
    });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    // Fetch OTP record
    const otpRecord = await Otp.findOne({ email: normalizedEmail, type: "register" });
    if (!otpRecord) {
      return res.status(400).json({ message: "No verification code found or it has expired. Please request a new code." });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Too many failed attempts. Please request a new verification code." });
    }

    if (otpRecord.otp !== otp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create active session ID
    const activeSessionId = crypto.randomUUID();

    // Create user
    const newUser = new User({
      username: cleanUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      isVerified: true,
      activeSessionId
    });

    await newUser.save();

    // Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });
    if (redis && redis.status === "ready") {
      try {
        await redis.del(`otp:register:${normalizedEmail}`);
        await redis.setex(`active_session:${newUser._id}`, 7 * 24 * 3600, activeSessionId);
      } catch (err) {}
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser._id,
        username: newUser.username,
        sessionId: activeSessionId,
        role: newUser.role
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Account verified and created successfully!",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error during verification" });
  }
};

/**
 * Request Password Reset OTP
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    // Check cooldown (45 seconds)
    const existingOtp = await Otp.findOne({ email: normalizedEmail, type: "forgot_password" });
    if (existingOtp && existingOtp.lastSentAt) {
      const secondsSinceLastSent = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSent < 45) {
        const waitSecs = Math.ceil(45 - secondsSinceLastSent);
        return res.status(429).json({
          message: `Please wait ${waitSecs} seconds before requesting a new reset code.`
        });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, type: "forgot_password" },
      {
        email: normalizedEmail,
        otp,
        type: "forgot_password",
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    if (redis && redis.status === "ready") {
      try {
        await redis.setex(`otp:forgot:${normalizedEmail}`, 600, otp);
      } catch (err) {}
    }

    await sendForgotPasswordOtpEmail(normalizedEmail, otp, user.username);

    return res.status(200).json({
      success: true,
      message: "Password reset verification code has been sent to your email."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: error.message || "Failed to process forgot password request" });
  }
};

/**
 * Reset Password using OTP
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail, type: "forgot_password" });
    if (!otpRecord) {
      return res.status(400).json({ message: "No password reset request found or code has expired. Please request a new code." });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Reset code has expired. Please request a new code." });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Too many failed attempts. Please request a new reset code." });
    }

    if (otpRecord.otp !== otp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    // Invalidate active session across all devices for security
    user.activeSessionId = null;
    await user.save();

    // Invalidate Redis caches
    if (redis && redis.status === "ready") {
      try {
        await redis.del(`active_session:${user._id}`);
        await redis.del(`user:${user._id}`);
        await redis.del(`otp:forgot:${normalizedEmail}`);
      } catch (err) {}
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: error.message || "Failed to reset password" });
  }
};

/**
 * Resend OTP Code
 * POST /api/auth/resend-otp
 */
const resendOtp = async (req, res) => {
  try {
    const { email, type = "register", username } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (type === "register") {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }
    } else if (type === "forgot_password") {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (!existingUser) {
        return res.status(404).json({ message: "No account found with this email." });
      }
    }

    // Cooldown check (45 seconds)
    const existingOtp = await Otp.findOne({ email: normalizedEmail, type });
    if (existingOtp && existingOtp.lastSentAt) {
      const secondsSinceLastSent = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSent < 45) {
        const waitSecs = Math.ceil(45 - secondsSinceLastSent);
        return res.status(429).json({
          message: `Please wait ${waitSecs} seconds before requesting a new code.`
        });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, type },
      {
        email: normalizedEmail,
        otp,
        type,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    if (type === "register") {
      await sendRegistrationOtpEmail(normalizedEmail, otp, username);
    } else {
      const user = await User.findOne({ email: normalizedEmail });
      await sendForgotPasswordOtpEmail(normalizedEmail, otp, user ? user.username : username);
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email."
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ message: error.message || "Failed to resend verification code" });
  }
};

/**
 * Register a new user (Direct registration for backward compatibility / tests)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    const cleanUsername = username?.trim();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: normalizedEmail }, { username: cleanUsername }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: cleanUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      isVerified: true
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

    const normalizedEmail = email?.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(403).json({ message: "Invalid email or password" });
    }

    // Validate password hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate new unique active session ID
    const activeSessionId = crypto.randomUUID();
    user.activeSessionId = activeSessionId;
    await user.save();

    // Cache active session in Redis (7 days TTL)
    if (redis && redis.status === "ready") {
      try {
        await redis.setex(`active_session:${user._id}`, 7 * 24 * 3600, activeSessionId);
      } catch (redisError) {
        console.warn("Redis SET warning for active session:", redisError.message);
      }
    }

    // Sign JWT token
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
        email: user.email,
        role: user.role
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

    // Check Redis cache first
    if (redis && redis.status === "ready") {
      try {
        const cachedUser = await redis.get(cacheKey);
        if (cachedUser) {
          return res.status(200).json(JSON.parse(cachedUser));
        }
      } catch (redisError) {
        console.warn("Redis GET warning in me controller:", redisError.message);
      }
    }

    // Fetch user from database
    const user = await User.findById(userId).select(
      "username email role createdAt streakCount longestStreak solvedStats solvedProblems isVerified"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      isVerified: user.isVerified !== undefined ? user.isVerified : true,
      createdAt: user.createdAt,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      solvedStats: user.solvedStats,
      solvedProblemsCount: user.solvedProblems?.length || 0
    };

    // Cache user data in Redis (1 hour TTL)
    if (redis && redis.status === "ready") {
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

/**
 * Get all users list for Admin management
 * GET /api/users/admin/all
 */
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role || "user",
        streakCount: u.streakCount || 0,
        longestStreak: u.longestStreak || 0,
        solvedCount: u.solvedProblems?.length || (u.solvedStats ? (u.solvedStats.easy + u.solvedStats.medium + u.solvedStats.hard) : 0),
        solvedStats: u.solvedStats || { easy: 0, medium: 0, hard: 0 },
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error("Get Admin Users Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update user role (Promote to Admin / Demote to User)
 * PUT /api/users/admin/:id/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    // Invalidate user cache
    if (redis && redis.status === "ready") {
      try {
        await redis.del(`user:${id}`);
      } catch (err) {}
    }

    return res.status(200).json({
      message: `User ${user.username} role updated to ${role}`,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error("Update User Role Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete user account
 * DELETE /api/users/admin/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.userId === id) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (redis && redis.status === "ready") {
      try {
        await redis.del(`user:${id}`);
        await redis.del(`active_session:${id}`);
      } catch (err) {}
    }

    return res.status(200).json({
      message: `User account "${deleted.username}" deleted successfully.`
    });
  } catch (error) {
    console.error("Delete User Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get comprehensive platform analytics
 * GET /api/users/admin/stats
 */
const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalProblems, pendingProposals, activeRooms, totalSubmissions] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments({ isApproved: true }),
      Problem.countDocuments({ status: "pending" }),
      Room.countDocuments({ $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }] }),
      Submission ? Submission.countDocuments() : 0
    ]);

    return res.status(200).json({
      totalUsers,
      totalProblems,
      pendingProposals,
      activeRooms,
      totalSubmissions,
      serverStatus: "Online",
      judgeEngine: "Docker / Isolated Multi-Language Engine Active",
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Get Platform Stats Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  sendRegisterOtp,
  verifyRegisterOtp,
  forgotPassword,
  resetPassword,
  resendOtp,
  register,
  login,
  me,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getPlatformStats
};