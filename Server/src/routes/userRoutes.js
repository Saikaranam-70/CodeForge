const express = require("express");
const { 
  register, 
  login, 
  me, 
  getAdminUsers, 
  updateUserRole, 
  deleteUser, 
  getPlatformStats 
} = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Authentication endpoints
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);

// Admin Management endpoints
router.get("/admin/all", verifyToken, verifyAdmin, getAdminUsers);
router.get("/admin/stats", verifyToken, verifyAdmin, getPlatformStats);
router.put("/admin/:id/role", verifyToken, verifyAdmin, updateUserRole);
router.delete("/admin/:id", verifyToken, verifyAdmin, deleteUser);

module.exports = router;