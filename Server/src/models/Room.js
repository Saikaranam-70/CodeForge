const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  roomCode: {
    type: String,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  passcode: {
    type: String,
    default: null,
    trim: true
  },
  durationMinutes: {
    type: Number,
    default: 120, // 2 hours default
    min: 15,
    max: 1440 // up to 24 hours
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 } // MongoDB TTL index to auto-delete when expiresAt is reached
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true
  }],
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to ensure expiresAt is populated based on durationMinutes
roomSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    const mins = this.durationMinutes || 120;
    this.expiresAt = new Date(Date.now() + mins * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema);