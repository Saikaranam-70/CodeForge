const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  reviewCode,
  getHint,
  debugCode,
  generateProblem,
  generateTestCases,
  importLeetCodeProblem,
  conductMockInterview,
  convertLanguage
} = require("../controllers/aiController");

const router = express.Router();

// Require user authentication for AI endpoints
router.use(verifyToken);

// AI Features
router.post("/review", reviewCode);
router.post("/hint", getHint);
router.post("/debug", debugCode);
router.post("/generate-problem", generateProblem);
router.post("/generate-testcases", generateTestCases);
router.post("/import-leetcode", importLeetCodeProblem);
router.post("/mock-interview", conductMockInterview);
router.post("/convert-language", convertLanguage);

module.exports = router;
