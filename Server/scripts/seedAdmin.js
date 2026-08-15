require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);

    const adminEmail = "saimanikantakaranam682@gmail.com";
    const hashedPassword = await bcrypt.hash("Sai@7065", 10);

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      existing.role = "admin";
      existing.isVerified = true;
      existing.password = hashedPassword;
      await existing.save();
      console.log(`Admin account updated: ${adminEmail} (role: admin)`);
    } else {
      const newAdmin = new User({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        streakCount: 5,
        longestStreak: 12
      });
      await newAdmin.save();
      console.log(`Admin account created: ${adminEmail} (role: admin)`);
    }

    // Also if saikaranam70 exists, we can ensure its stats are accurately synced
    const userToSync = await User.findOne({ username: "saikaranam70" });
    if (userToSync) {
      console.log(`Found saikaranam70, solved problems count: ${userToSync.solvedProblems.length}`);
    }

    console.log("Admin seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seed Admin Error:", err.message);
    process.exit(1);
  }
};

seedAdmin();
