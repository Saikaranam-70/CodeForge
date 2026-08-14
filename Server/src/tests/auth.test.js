require("dotenv").config();
jest.setTimeout(30000); // 30-second timeout for cloud connections

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const redis = require("../config/redis");

describe("Authentication & Single Active Session Integration Tests", () => {
  let testUser = {
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: "password123"
  };
  let token1 = null;
  let token2 = null;

  beforeAll(async () => {
    // Ensure database connection is established
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codeforge_test";
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser.email) {
      await User.deleteOne({ email: testUser.email });
    }
    // Close DB & Redis connections to allow Jest to exit cleanly
    await mongoose.connection.close();
    await redis.quit();
  });

  test("1. Should successfully register a new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User created successfully");
  });

  test("2. Should reject registration for existing email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });

  test("3. First Login: Should succeed and return token1", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successfull");
    expect(response.body.token).toBeDefined();
    token1 = response.body.token;
  });

  test("4. Access /me: Should succeed with token1", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.username).toBe(testUser.username);
  });

  test("5. Second Login: Should succeed and return token2 (invalidating token1)", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successfull");
    expect(response.body.token).toBeDefined();
    token2 = response.body.token;

    // Assert token2 is different from token1
    expect(token2).not.toBe(token1);
  });

  test("6. Access /me with token2: Should succeed", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token2}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testUser.email);
  });

  test("7. Access /me with token1 (previous session): Should fail with 401 Unauthorized", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token1}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("Session invalidated");
  });
});

