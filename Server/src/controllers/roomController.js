const Room = require("../models/Room");
const Problem = require("../models/Problem");
const User = require("../models/User");
const redis = require("../config/redis");

/**
 * Generate a short 6-character unique room code (e.g. CR-8F3A)
 */
const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "CR-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Helper function to clear paginated room list caches in Redis
 */
const clearRoomListCaches = async () => {
  if (redis.status === "ready") {
    try {
      const keys = await redis.keys("room_list:*");
      const oldKeys = await redis.keys("rooms_list:*");
      const allKeys = [...keys, ...oldKeys];
      if (allKeys.length > 0) {
        await redis.del(allKeys);
      }
    } catch (error) {
      console.warn("Redis clear room list cache warning:", error.message);
    }
  }
};

/**
 * Helper function to cache room details in Redis (24 hours TTL)
 */
const cacheRoomDetails = async (roomId, roomData) => {
  if (redis.status === "ready") {
    try {
      const cacheKey = `room:${roomId}`;
      await redis.setex(cacheKey, 86400, JSON.stringify(roomData));
    } catch (error) {
      console.warn("Redis cache room details warning:", error.message);
    }
  }
};

/**
 * Helper function to delete room from Redis cache
 */
const deleteRoomFromCache = async (roomId) => {
  if (redis.status === "ready") {
    try {
      const cacheKey = `room:${roomId}`;
      await redis.del(cacheKey);
    } catch (error) {
      console.warn("Redis delete room cache warning:", error.message);
    }
  }
};

/**
 * Create a new collaborative room with optional passcode lock
 * POST /api/room
 */
const createRoom = async (req, res) => {
  try {
    const { name, problemIds, isPrivate, passcode } = req.body;
    const hostId = req.user.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Room name is required" });
    }

    // If no problemIds passed, automatically attach all existing problems in database
    let targetProblemIds = Array.isArray(problemIds) && problemIds.length > 0 ? problemIds : [];
    if (targetProblemIds.length === 0) {
      const allProbs = await Problem.find().select("_id").limit(10);
      targetProblemIds = allProbs.map((p) => p._id);
    }

    // Deduplicate problem IDs
    const uniqueProblemIds = [...new Set(targetProblemIds.map((id) => id.toString()))];

    // Generate unique room code
    let roomCode = generateRoomCode();
    let codeExists = await Room.findOne({ roomCode });
    while (codeExists) {
      roomCode = generateRoomCode();
      codeExists = await Room.findOne({ roomCode });
    }

    const hasPasscode = !!(passcode && passcode.trim().length > 0);
    const roomIsPrivate = !!(isPrivate || hasPasscode);

    // Create and save room
    const newRoom = new Room({
      name: name.trim(),
      roomCode,
      isPrivate: roomIsPrivate,
      passcode: hasPasscode ? passcode.trim() : null,
      problems: uniqueProblemIds,
      hostId,
      participants: [hostId]
    });
    const savedRoom = await newRoom.save();

    // Populate room fields for response
    const populatedRoom = await Room.findById(savedRoom._id)
      .populate("problems", "title difficulty constraints inputFormat outputFormat sampleTestCases timeLimit memoryLimit")
      .populate("hostId", "username email")
      .populate("participants", "username email solvedStats");

    // Update caches
    await cacheRoomDetails(savedRoom._id, populatedRoom);
    await clearRoomListCaches();

    return res.status(201).json({
      message: "Room created successfully",
      room: populatedRoom
    });
  } catch (error) {
    console.error("Create Room Error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Join room by human-friendly 6-char Room Code (e.g. CR-8F3A) with passcode verification
 * POST /api/room/join-by-code
 */
const joinRoomByCode = async (req, res) => {
  try {
    const { roomCode, passcode } = req.body;
    const userId = req.user.userId;

    if (!roomCode || roomCode.trim().length === 0) {
      return res.status(400).json({ message: "Room Code is required" });
    }

    const cleanCode = roomCode.trim().toUpperCase();

    // Find room by roomCode or by _id if passed ObjectId
    let room = await Room.findOne({ roomCode: cleanCode });
    if (!room && cleanCode.match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(cleanCode);
    }

    if (!room) {
      return res.status(404).json({ message: `No active room found with Code: ${cleanCode}` });
    }

    const isHost = room.hostId.toString() === userId.toString();
    const isParticipant = room.participants.some(
      (pId) => pId.toString() === userId.toString()
    );

    // Passcode validation for locked rooms
    if (room.isPrivate && room.passcode && !isHost && !isParticipant) {
      if (!passcode || passcode.trim() !== room.passcode) {
        return res.status(403).json({
          message: passcode ? "Incorrect room passcode" : "This room is locked. Passcode required.",
          isLocked: true,
          requiresPasscode: true,
          roomName: room.name,
          roomCode: room.roomCode
        });
      }
    }

    // Add user to participants if not already present
    if (!isParticipant) {
      room.participants.push(userId);
      await room.save();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate("problems", "title difficulty constraints inputFormat outputFormat sampleTestCases timeLimit memoryLimit")
      .populate("hostId", "username email")
      .populate("participants", "username email solvedStats");

    await cacheRoomDetails(room._id, populatedRoom);
    await clearRoomListCaches();

    return res.status(200).json({
      message: "Successfully joined the room",
      room: populatedRoom
    });
  } catch (error) {
    console.error("Join By Code Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Join an existing collaborative room by ObjectId with passcode verification
 * POST /api/room/:id/join
 */
const joinRoom = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { passcode } = req.body || {};
    const userId = req.user.userId;

    let room;
    if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(roomId);
    } else {
      room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    }

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isHost = room.hostId.toString() === userId.toString();
    const isParticipant = room.participants.some(
      (pId) => pId.toString() === userId.toString()
    );

    // Passcode validation for locked rooms
    if (room.isPrivate && room.passcode && !isHost && !isParticipant) {
      if (!passcode || passcode.trim() !== room.passcode) {
        return res.status(403).json({
          message: passcode ? "Incorrect room passcode" : "This room is locked. Passcode required.",
          isLocked: true,
          requiresPasscode: true,
          roomName: room.name,
          roomCode: room.roomCode
        });
      }
    }

    if (!isParticipant) {
      room.participants.push(userId);
      await room.save();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate("problems", "title difficulty constraints inputFormat outputFormat sampleTestCases timeLimit memoryLimit")
      .populate("hostId", "username email")
      .populate("participants", "username email solvedStats");

    await cacheRoomDetails(room._id, populatedRoom);
    await clearRoomListCaches();

    return res.status(200).json({
      message: "Successfully joined the room",
      room: populatedRoom
    });
  } catch (error) {
    console.error("Join Room Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Leave a collaborative room
 * POST /api/room/:id/leave
 */
const leaveRoom = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const userId = req.user.userId;

    let room = await Room.findById(roomId);
    if (!room && roomId.match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(roomId);
    }
    if (!room) {
      room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    }

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.participants = room.participants.filter(
      (pId) => pId.toString() !== userId.toString()
    );

    if (room.participants.length === 0) {
      await Room.findByIdAndDelete(room._id);
      await deleteRoomFromCache(room._id);
      await clearRoomListCaches();

      return res.status(200).json({
        message: "Successfully left. Room deleted as it had no active participants.",
        roomDeleted: true
      });
    }

    if (room.hostId.toString() === userId.toString()) {
      room.hostId = room.participants[0];
    }

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate("problems", "title difficulty constraints inputFormat outputFormat sampleTestCases timeLimit memoryLimit")
      .populate("hostId", "username email")
      .populate("participants", "username email solvedStats");

    await cacheRoomDetails(room._id, updatedRoom);
    await clearRoomListCaches();

    return res.status(200).json({
      message: "Successfully left the room",
      roomDeleted: false,
      room: updatedRoom
    });
  } catch (error) {
    console.error("Leave Room Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const { getLiveMemberCount } = require("../websocket/socketHandlers");

/**
 * Get details of a single room by ID or Room Code (Checks passcode if private)
 * GET /api/room/:id
 */
const getRoomById = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const userId = req.user ? req.user.userId : null;
    const passcodeHeader = req.headers["x-room-passcode"] || req.query.passcode;

    let room = null;

    if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(roomId);
    } else {
      room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    }

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isHost = userId && room.hostId.toString() === userId.toString();
    const isParticipant = userId && room.participants.some((pId) => pId.toString() === userId.toString());

    // If private and user not host/participant, check passcode
    if (room.isPrivate && room.passcode && !isHost && !isParticipant) {
      if (!passcodeHeader || passcodeHeader.trim() !== room.passcode) {
        return res.status(403).json({
          message: "This room is locked. Passcode required.",
          isLocked: true,
          requiresPasscode: true,
          roomName: room.name,
          roomCode: room.roomCode
        });
      }
    }

    // Auto-register user as participant if authenticated and not yet listed
    if (userId && !isParticipant) {
      room.participants.push(userId);
      await room.save();
      await clearRoomListCaches();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate("problems", "title difficulty description constraints inputFormat outputFormat sampleTestCases timeLimit memoryLimit")
      .populate("hostId", "username email")
      .populate("participants", "username email solvedStats");

    return res.status(200).json({ room: populatedRoom });
  } catch (error) {
    console.error("Get Room By ID Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get paginated list of active rooms (Includes isPrivate and isLive indicators)
 * GET /api/room?page=1&limit=20
 */
const getActiveRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const [rooms, totalCount] = await Promise.all([
      Room.find()
        .populate("problems", "title difficulty")
        .populate("hostId", "username")
        .select("name roomCode isPrivate passcode hostId problems participants createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Room.countDocuments()
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const responseData = {
      rooms: rooms.map((room) => {
        const liveCount = getLiveMemberCount(room._id.toString());
        const dbCount = room.participants ? room.participants.length : 0;
        const participantCount = Math.max(dbCount, liveCount);

        return {
          id: room._id,
          name: room.name,
          roomCode: room.roomCode || "CR-" + room._id.toString().slice(-4).toUpperCase(),
          isPrivate: !!(room.isPrivate || room.passcode),
          isLive: liveCount > 0,
          liveCount,
          host: room.hostId ? room.hostId.username : "Unknown",
          problems: room.problems.map((p) => ({
            id: p._id,
            title: p.title,
            difficulty: p.difficulty
          })),
          participantCount,
          createdAt: room.createdAt
        };
      }),
      totalPages,
      totalCount,
      currentPage: page
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Get Active Rooms Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  joinRoomByCode,
  leaveRoom,
  getRoomById,
  getActiveRooms
};
