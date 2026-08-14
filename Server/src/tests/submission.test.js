require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const redis = require("../config/redis");

describe("Submission Flow Integration Tests", () => {
  let testUser = {
    username: `tester_${Date.now()}`,
    email: `tester_${Date.now()}@example.com`,
    password: "password123"
  };

  let jsProblem = {
    title: "JS Square Problem",
    description: "Return square of input",
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

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codeforge_test";
      await mongoose.connect(mongoUri);
    }

    // Register user
    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password
    });
    userToken = loginRes.body.token;
    userId = loginRes.body.user.id;

    // Create a problem (using database directly to avoid admin restriction in test suite)
    const prob = new Problem(jsProblem);
    await prob.save();
    problemId = prob._id.toString();
  });

  afterAll(async () => {
    await User.deleteOne({ _id: userId });
    await Problem.deleteOne({ _id: problemId });
    await Submission.deleteMany({ userId });
    await mongoose.connection.close();
    await redis.quit();
  });

  test("1. Should run JS solution successfully and verify Accepted status", async () => {
    const correctJsCode = `
      const fs = require('fs');
      const input = fs.readFileSync(0, 'utf-8').trim();
      const num = parseInt(input);
      console.log(num * num);
    `;

    const res = await request(app)
      .post(`/api/problems/${problemId}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ code: correctJsCode, language: "javascript" });

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe("Accepted");
    expect(res.body.submissionId).toBeDefined();
    expect(res.body.userStats).toBeDefined();
    expect(res.body.userStats.streakCount).toBe(1);
  });

  test("2. Should catch Wrong Answer when output is incorrect", async () => {
    const wrongJsCode = `
      console.log(42);
    `;

    const res = await request(app)
      .post(`/api/problems/${problemId}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ code: wrongJsCode, language: "javascript" });

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe("Wrong Answer");
  });

  test("3. Should return RunTime Error for bad syntax code", async () => {
    const syntaxErrCode = `
      const fs = require('fs); // syntax error quote missing
    `;

    const res = await request(app)
      .post(`/api/problems/${problemId}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ code: syntaxErrCode, language: "javascript" });

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe("RunTime Error");
    expect(res.body.errorOutput).toBeDefined();
  });
});

