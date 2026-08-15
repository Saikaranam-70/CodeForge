const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["register", "forgot_password"],
    required: true,
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expires: 0 } // Automatic MongoDB TTL cleanup
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for fast queries
otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model("Otp", otpSchema);
