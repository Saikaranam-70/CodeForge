require("dotenv").config();
jest.setTimeout(30000); // 30s timeout for cloud services

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Problem = require("../models/Problem");
const redis = require("../config/redis");

describe("Problem CRUD and Access Control Integration Tests", () => {
  let regularUser = {
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@example.com`,
    password: "password123",
    role: "user"
  };

  let adminUser = {
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    password: "password123",
    role: "admin"
  };

  let testProblem = {
    title: "Test Problem",
    description: "This is a test problem description",
    difficulty: "Medium",
    constraints: "None",
    inputFormat: "Integer",
    outputFormat: "Integer",
    sampleTestCases: [{ input: "1", output: "1", explanation: "Identity" }],
    hiddenTestCases: [{ input: "2", output: "2" }],
    timeLimit: 1000,
    memoryLimit: 32
  };

  let regularToken = null;
  let adminToken = null;
  let createdProblemId = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codeforge_test";
      await mongoose.connect(mongoUri);
    }

    // Register regular user
    await request(app).post("/api/auth/register").send(regularUser);
    // Login regular user
    const resReg = await request(app).post("/api/auth/login").send({
      email: regularUser.email,
      password: regularUser.password
    });
    regularToken = resReg.body.token;

    // Register admin user
    await request(app).post("/api/auth/register").send(adminUser);
    // Login admin user
    const resAdm = await request(app).post("/api/auth/login").send({
      email: adminUser.email,
      password: adminUser.password
    });
    adminToken = resAdm.body.token;
  });

  afterAll(async () => {
    // Clean up test problems and users
    if (createdProblemId) {
      await Problem.findByIdAndDelete(createdProblemId);
      if (redis.status === "ready") {
        await redis.del(`problem:${createdProblemId}`);
        await redis.del("problems_list:*"); // clear any wildcard lists
      }
    }
    await User.deleteOne({ email: regularUser.email });
    await User.deleteOne({ email: adminUser.email });

    await mongoose.connection.close();
    await redis.quit();
  });

  test("1. Regular User should fail to create problem with 403 Forbidden", async () => {
    const response = await request(app)
      .post("/api/problems")
      .set("Authorization", `Bearer ${regularToken}`)
      .send(testProblem);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("Forbidden");
  });

  test("2. Admin User should succeed to create problem with 201 Created", async () => {
    const response = await request(app)
      .post("/api/problems")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(testProblem);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Problem created successfully");
    expect(response.body.problemId).toBeDefined();
    createdProblemId = response.body.problemId;
  });

  test("3. Regular User should be able to list all problems", async () => {
    const response = await request(app)
      .get("/api/problems?page=1&limit=20")
      .set("Authorization", `Bearer ${regularToken}`);

    expect(response.status).toBe(200);
    expect(response.body.problems).toBeDefined();
    expect(Array.isArray(response.body.problems)).toBe(true);

    // Find our created problem in the listing
    const found = response.body.problems.find((p) => p._id === createdProblemId);
    expect(found).toBeDefined();
    // hiddenTestCases should NOT be present on items in the listing
    expect(found.hiddenTestCases).toBeUndefined();
  });

  test("4. Regular User should be able to fetch problem by ID, and hiddenTestCases must be stripped", async () => {
    const response = await request(app)
      .get(`/api/problems/${createdProblemId}`)
      .set("Authorization", `Bearer ${regularToken}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(testProblem.title);
    expect(response.body.difficulty).toBe(testProblem.difficulty);

    // Ensure hiddenTestCases is removed for anti-cheating security
    expect(response.body.hiddenTestCases).toBeUndefined();

    // Ensure sampleTestCases (which are public) are still there
    expect(response.body.sampleTestCases).toBeDefined();
    expect(response.body.sampleTestCases[0].input).toBe("1");
  });
});

