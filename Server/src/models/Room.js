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
    default: Date.now,
    expires: 86400 // TTL of 24 hours
  }
});

module.exports = mongoose.model("Room", roomSchema);