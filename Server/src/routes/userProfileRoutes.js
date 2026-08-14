const express = require("express");
const { getUserProfile, getLeaderboard } = require("../controllers/userProfileController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// User profile and leaderboard endpoints
router.get("/leaderboard", verifyToken, getLeaderboard);
router.get("/:username/profile", verifyToken, getUserProfile);

module.exports = router;

