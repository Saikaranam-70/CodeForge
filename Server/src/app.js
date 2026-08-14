const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Route imports
const userRoutes = require("./routes/userRoutes");
const problemRoutes = require("./routes/problemRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Initialize Express app
const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// API Route Registration
app.use("/api/auth", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/users", userProfileRoutes);
app.use("/api/ai", aiRoutes);

// Health Check Endpoint
app.use("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Centralized Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

module.exports = app;

