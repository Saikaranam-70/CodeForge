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

// Enable trust proxy for Render, Vercel, and Cloudflare reverse proxies
app.set("trust proxy", 1);

// Whitelisted origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5147",
  "https://code-forge-one-woad.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools (e.g. mobile, curl, Postman, SSR)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }

    // Permissive fallback for production web app
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};

// Apply CORS before other middlewares (cors middleware natively handles preflight OPTIONS requests)
app.use(cors(corsOptions));

// Configure Helmet with cross-origin friendly options
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
  })
);

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
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

module.exports = app;
