const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/authMiddleware");
const {
  createRoom,
  joinRoom,
  joinRoomByCode,
  leaveRoom,
  getRoomById,
  getActiveRooms,
  getAdminRooms,
  adminTerminateRoom
} = require("../controllers/roomController");

const router = express.Router();

// Require authentication for all room routes
router.use(verifyToken);

// Admin Room management
router.get("/admin/all", verifyAdmin, getAdminRooms);
router.delete("/admin/:id", verifyAdmin, adminTerminateRoom);

// User Room management endpoints
router.post("/", createRoom);
router.post("/join-by-code", joinRoomByCode);
router.get("/", getActiveRooms);
router.get("/:id", getRoomById);
router.post("/:id/join", joinRoom);
router.post("/:id/leave", leaveRoom);

module.exports = router;