const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true
  },
  constraints: {
    type: String
  },
  inputFormat: {
    type: String
  },
  outputFormat: {
    type: String
  },
  sampleTestCases: [{
    input: {
      type: String
    },
    output: {
      type: String
    },
    explanation: {
      type: String
    }
  }],
  hiddenTestCases: [{
    input: {
      type: String,
      default: ""
    },
    output: {
      type: String,
      default: ""
    }
  }],
  timeLimit: {
    type: Number,
    default: 2000 // Time limit in milliseconds
  },
  memoryLimit: {
    type: Number,
    default: 64 // Memory limit in MB
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ["approved", "pending", "rejected"],
    default: "approved"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Problem", problemSchema);