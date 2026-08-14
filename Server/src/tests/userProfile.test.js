require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Room = require("../models/Room");
const redis = require("../config/redis");

describe("Profile and Room API Integration Tests", () => {
  let testUser = {
    username: `profiletester_${Date.now()}`,
    email: `profiletester_${Date.now()}@example.com`,
    password: "password123"
  };

  let sampleProblem = {
    title: "Profile Test Problem",
    description: "Test description",
    difficulty: "Easy",
    constraints: "None",
    inputFormat: "Number",
    outputFormat: "Number",
    sampleTestCases: [{ input: "5", output: "25" }],
    hiddenTestCases: [{ input: "10", output: "100" }],
    timeLimit: 2000,
    memoryLimit: 32
  };

  let userToken = null;
  let userId = null;
  let problemId = null;
  let roomId = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codeforge_test";
      await mongoose.connect(mongoUri);
    }

    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password
    });
    userToken = loginRes.body.token;
    userId = loginRes.body.user.id;

    const prob = new Problem(sampleProblem);
    await prob.save();
    problemId = prob._id.toString();
  });

  afterAll(async () => {
    await User.deleteOne({ _id: userId });
    await Problem.deleteOne({ _id: problemId });
    if (roomId) {
      await Room.deleteOne({ _id: roomId });
    }
    await mongoose.connection.close();
    await redis.quit();
  });

  test("1. Should fetch user profile details successfully", async () => {
    const res = await request(app)
      .get(`/api/users/${testUser.username}/profile`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(testUser.username);
    expect(res.body.streaks).toBeDefined();
    expect(res.body.stats).toBeDefined();
  });

  test("2. Should fetch leaderboard successfully", async () => {
    const res = await request(app)
      .get("/api/users/leaderboard?sortBy=solved&limit=5")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("3. Should create collaborative room successfully", async () => {
    const res = await request(app)
      .post("/api/room")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Test Room 123",
        problemIds: [problemId]
      });

    expect(res.status).toBe(201);
    expect(res.body.room).toBeDefined();
    expect(res.body.room.name).toBe("Test Room 123");
    expect(res.body.room.problems.length).toBe(1);
    roomId = res.body.room._id;
  });
});

