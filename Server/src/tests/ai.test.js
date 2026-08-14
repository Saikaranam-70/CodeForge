require("dotenv").config();
jest.setTimeout(45000); // 45s timeout for AI API calls

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const redis = require("../config/redis");

describe("AI Engine & Failover Integration Tests", () => {
  let testUser = {
    username: `aitester_${Date.now()}`,
    email: `aitester_${Date.now()}@example.com`,
    password: "password123"
  };

  let userToken = null;
  let userId = null;

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
  });

  afterAll(async () => {
    await User.deleteOne({ _id: userId });
    await mongoose.connection.close();
    await redis.quit();
  });

  test("1. POST /api/ai/review - Should return Big-O complexity and code analysis", async () => {
    const sampleCode = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) {
            return [map.get(complement), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const res = await request(app)
      .post("/api/ai/review")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        code: sampleCode,
        language: "javascript",
        problemTitle: "Two Sum"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.provider).toBeDefined();
    expect(res.body.review).toBeDefined();
    expect(res.body.review.timeComplexity).toBeDefined();
    expect(res.body.review.spaceComplexity).toBeDefined();
  });

  test("2. POST /api/ai/hint - Should return Socratic guidance for a problem", async () => {
    const res = await request(app)
      .post("/api/ai/hint")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        problemTitle: "Longest Substring Without Repeating Characters",
        problemDescription: "Given a string s, find the length of the longest substring without repeating characters.",
        hintLevel: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hint).toBeDefined();
    expect(res.body.hint.hint).toBeDefined();
  });

  test("3. POST /api/ai/debug - Should diagnose bug and generate counterexample", async () => {
    const buggyCode = `
      function isPalindrome(s) {
        return s === s.split('').reverse().join(''); // fails on case sensitivity and punctuation
      }
    `;

    const res = await request(app)
      .post("/api/ai/debug")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        code: buggyCode,
        language: "javascript",
        problemTitle: "Valid Palindrome",
        verdict: "Wrong Answer",
        failingInput: '"A man, a plan, a canal: Panama"',
        expectedOutput: "true",
        actualOutput: "false"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.debug).toBeDefined();
    expect(res.body.debug.bugExplanation).toBeDefined();
  });

  test("4. POST /api/ai/generate-problem - Should synthesize a complete algorithmic problem", async () => {
    const res = await request(app)
      .post("/api/ai/generate-problem")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        topic: "Binary Search",
        difficulty: "Easy"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.problem).toBeDefined();
    expect(res.body.problem.title).toBeDefined();
    expect(res.body.problem.sampleTestCases).toBeDefined();
    expect(Array.isArray(res.body.problem.sampleTestCases)).toBe(true);
  });
});
