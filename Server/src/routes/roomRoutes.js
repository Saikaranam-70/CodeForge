const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  createRoom,
  joinRoom,
  joinRoomByCode,
  leaveRoom,
  getRoomById,
  getActiveRooms
} = require("../controllers/roomController");

const router = express.Router();

// Require authentication for all room routes
router.use(verifyToken);

// Room management endpoints
router.post("/", createRoom);
router.post("/join-by-code", joinRoomByCode);
router.get("/", getActiveRooms);
router.get("/:id", getRoomById);
router.post("/:id/join", joinRoom);
router.post("/:id/leave", leaveRoom);

module.exports = router;