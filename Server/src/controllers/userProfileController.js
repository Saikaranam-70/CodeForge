const User = require("../models/User");
const Problem = require("../models/Problem");
const redis = require("../config/redis");

/**
 * Fetch detailed user profile, stats, streak data, global rank, and activity log
 * GET /api/users/:username/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `profile:${username}`;

    // Step 1: Query user from database with populated solved problems
    const user = await User.findOne({ username })
      .populate("solvedProblems", "title difficulty")
      .select("username createdAt streakCount longestStreak lastActiveDate solvedProblems solvedStats activityLog");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const solvedTotal = user.solvedProblems ? user.solvedProblems.length : 0;

    // Dynamically compute exact breakdown to ensure 100% data fidelity
    const easyCount = user.solvedProblems.filter((p) => p && p.difficulty === "Easy").length;
    const mediumCount = user.solvedProblems.filter((p) => p && p.difficulty === "Medium").length;
    const hardCount = user.solvedProblems.filter((p) => p && p.difficulty === "Hard").length;

    // Calculate real-time global leaderboard rank
    const higherRankedUsers = await User.countDocuments({
      $expr: { $gt: [{ $size: { $ifNull: ["$solvedProblems", []] } }, solvedTotal] }
    });
    const globalRank = higherRankedUsers + 1;

    // Format user profile payload
    const profileData = {
      username: user.username,
      createdAt: user.createdAt,
      globalRank,
      streaks: {
        currentStreak: user.streakCount,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate
      },
      stats: {
        solvedTotal,
        solvedBreakdown: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        }
      },
      activityLog: user.activityLog || []
    };

    // Cache profile in Redis (60 seconds TTL)
    if (redis.status === "ready") {
      try {
        await redis.setex(cacheKey, 60, JSON.stringify(profileData));
      } catch (err) {
        console.warn("Redis SET warning in getUserProfile:", err.message);
      }
    }

    return res.status(200).json(profileData);
  } catch (error) {
    console.error("Get User Profile Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetch global leaderboard ranked by solved problems count or streak count
 * GET /api/users/leaderboard?sortBy=solved&limit=10
 */
const getLeaderboard = async (req, res) => {
  try {
    const sortBy = req.query.sortBy === "streak" ? "streakCount" : "solvedCount";
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = `leaderboard:sortBy_${sortBy}:limit_${limit}`;

    // Step 1: Check Redis cache
    if (redis.status === "ready") {
      try {
        const cachedLeaderboard = await redis.get(cacheKey);
        if (cachedLeaderboard) {
          return res.status(200).json(JSON.parse(cachedLeaderboard));
        }
      } catch (error) {
        console.warn("Redis GET warning in getLeaderboard:", error.message);
      }
    }

    // Step 2: Query database based on selected ranking mode
    let users;
    if (sortBy === "streakCount") {
      users = await User.find()
        .select("username streakCount solvedProblems")
        .sort({ streakCount: -1, createdAt: 1 })
        .limit(limit);
    } else {
      users = await User.aggregate([
        {
          $project: {
            username: 1,
            streakCount: 1,
            solvedCount: { $size: { $ifNull: ["$solvedProblems", []] } }
          }
        },
        { $sort: { solvedCount: -1, streakCount: -1 } },
        { $limit: limit }
      ]);
    }

    // Step 3: Format response data with dynamic ranking positions
    const leaderboardData = users.map((u, index) => ({
      rank: index + 1,
      username: u.username,
      solvedCount: u.solvedCount !== undefined ? u.solvedCount : (u.solvedProblems ? u.solvedProblems.length : 0),
      streak: u.streakCount
    }));

    // Step 4: Cache leaderboard in Redis (30 seconds TTL)
    if (redis.status === "ready") {
      try {
        await redis.setex(cacheKey, 30, JSON.stringify(leaderboardData));
      } catch (error) {
        console.warn("Redis SET warning in getLeaderboard:", error.message);
      }
    }

    return res.status(200).json(leaderboardData);
  } catch (error) {
    console.error("Get Leaderboard Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  getLeaderboard
};
