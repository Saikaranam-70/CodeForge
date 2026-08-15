require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Otp = require("../models/Otp");
const redis = require("../config/redis");

describe("Email Verification & Password Reset with OTP", () => {
  const timestamp = Date.now();
  const testUser = {
    username: `otpuser_${timestamp}`,
    email: `test_otp_${timestamp}@example.com`,
    password: "Password@123"
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codeforge_test";
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await User.deleteOne({ email: testUser.email });
    await Otp.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
    if (redis && redis.status === "ready") {
      await redis.quit();
    }
  });

  test("1. Should reject verify-register-otp if no OTP requested", async () => {
    const res = await request(app)
      .post("/api/auth/verify-register-otp")
      .send({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        otp: "123456"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("No verification code found");
  });

  test("2. Should successfully send registration OTP", async () => {
    const res = await request(app)
      .post("/api/auth/send-register-otp")
      .send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const otpDoc = await Otp.findOne({ email: testUser.email, type: "register" });
    expect(otpDoc).not.toBeNull();
    expect(otpDoc.otp).toHaveLength(6);
  });

  test("3. Should reject incorrect OTP", async () => {
    const res = await request(app)
      .post("/api/auth/verify-register-otp")
      .send({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        otp: "000000"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid verification code");
  });

  test("4. Should successfully verify correct OTP and create user", async () => {
    const otpDoc = await Otp.findOne({ email: testUser.email, type: "register" });
    expect(otpDoc).not.toBeNull();

    const res = await request(app)
      .post("/api/auth/verify-register-otp")
      .send({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        otp: otpDoc.otp
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);

    // Verify OTP was deleted
    const deletedOtp = await Otp.findOne({ email: testUser.email, type: "register" });
    expect(deletedOtp).toBeNull();
  });

  test("5. Should handle forgot-password flow", async () => {
    // Request reset OTP
    const forgotRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testUser.email });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);

    const forgotOtpDoc = await Otp.findOne({ email: testUser.email, type: "forgot_password" });
    expect(forgotOtpDoc).not.toBeNull();

    // Reset password with valid OTP
    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: testUser.email,
        otp: forgotOtpDoc.otp,
        newPassword: "NewSecretPassword123"
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "NewSecretPassword123"
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
