const express = require("express");
const { 
  createProblem, 
  proposeProblem,
  getAllProblems, 
  getPendingProblems,
  approveProblem,
  rejectProblem,
  getProblemById 
} = require("../controllers/problemController");
const { submitSolution } = require("../controllers/submissionController");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin approval endpoints
router.get("/admin/pending", verifyToken, verifyAdmin, getPendingProblems);
router.put("/:id/approve", verifyToken, verifyAdmin, approveProblem);
router.put("/:id/reject", verifyToken, verifyAdmin, rejectProblem);

// Community problem proposal by any logged-in user
router.post("/propose", verifyToken, proposeProblem);

// Direct problem creation by admin
router.post("/", verifyToken, verifyAdmin, createProblem);

// Problem browsing & submission
router.get("/", verifyToken, getAllProblems);
router.get("/:id", verifyToken, getProblemById);
router.post("/:id/submit", verifyToken, submitSolution);

module.exports = router;
