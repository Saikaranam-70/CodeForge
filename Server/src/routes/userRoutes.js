const express = require("express");
const { register, login, me } = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Authentication endpoints
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);

module.exports = router;