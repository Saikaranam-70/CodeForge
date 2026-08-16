const express = require("express");
const { 
  createProblem, 
  proposeProblem,
  getAllProblems, 
  getPendingProblems,
  getAdminAllProblems,
  approveProblem,
  rejectProblem,
  updateProblem,
  deleteProblem,
  getProblemById 
} = require("../controllers/problemController");
const { submitSolution, runCode } = require("../controllers/submissionController");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin endpoints
router.get("/admin/pending", verifyToken, verifyAdmin, getPendingProblems);
router.get("/admin/all", verifyToken, verifyAdmin, getAdminAllProblems);
router.put("/:id/approve", verifyToken, verifyAdmin, approveProblem);
router.put("/:id/reject", verifyToken, verifyAdmin, rejectProblem);
router.put("/:id", verifyToken, verifyAdmin, updateProblem);
router.delete("/:id", verifyToken, verifyAdmin, deleteProblem);

// Community problem proposal by any logged-in user
router.post("/propose", verifyToken, proposeProblem);

// Direct problem creation by admin
router.post("/", verifyToken, verifyAdmin, createProblem);

// Problem browsing & execution/submission
router.get("/", getAllProblems);
router.get("/:id", getProblemById);
router.post("/:id/run", verifyToken, runCode);
router.post("/:id/submit", verifyToken, submitSolution);

module.exports = router;
