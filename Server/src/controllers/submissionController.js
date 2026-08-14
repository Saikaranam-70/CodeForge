const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const User = require("../models/User");
const redis = require("../config/redis");
const { runTestCase } = require("../services/runnerService");

/**
 * Helper function to calculate yesterday's date string in YYYY-MM-DD format
 */
const getYesterdayStr = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
};

/**
 * Submit solution code for evaluation against all test cases
 * POST /api/problems/:id/submit
 */
const submitSolution = async (req, res) => {
  try {
    const userId = req.user.userId;
    const problemId = req.params.id;
    const { code, language } = req.body;

    // Step 1: Validate input fields
    if (!code || !language) {
      return res.status(400).json({ message: "Code and language are required" });
    }

    // Step 2: Fetch target problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Step 3: Initialize submission document with 'Pending' status
    const submission = new Submission({
      userId,
      problemId,
      code,
      language,
      status: "Pending"
    });
    await submission.save();

    const timeLimit = problem.timeLimit || 2000;
    const memoryLimit = problem.memoryLimit || 64;

    // Step 4: Aggregate all test cases (both sample and hidden)
    const allTestCases = [];
    if (problem.sampleTestCases && problem.sampleTestCases.length > 0) {
      allTestCases.push(...problem.sampleTestCases);
    }
    if (problem.hiddenTestCases && problem.hiddenTestCases.length > 0) {
      allTestCases.push(...problem.hiddenTestCases);
    }

    // If no test cases exist, default to Accepted
    if (allTestCases.length === 0) {
      submission.status = "Accepted";
      submission.executionTime = 0;
      submission.memoryUsed = "0";
      await submission.save();
      return res.status(200).json({ verdict: "Accepted", submission });
    }

    let overallVerdict = "Accepted";
    let maxTime = 0;
    let maxMemory = 0;
    let errorOutput = "";
    let passedCount = 0;
    let failingTestCase = null;

    // Step 5: Execute each test case sequentially
    for (let i = 0; i < allTestCases.length; i++) {
      const testCase = allTestCases[i];
      const result = await runTestCase({
        code,
        language,
        input: testCase.input || "",
        expectedOutput: testCase.output || "",
        timeLimit,
        memoryLimit
      });

      if (result.executionTime > maxTime) {
        maxTime = result.executionTime;
      }
      if (result.memoryUsed > maxMemory) {
        maxMemory = result.memoryUsed;
      }

      // If any test case fails, stop early with that verdict
      if (result.status !== "Accepted") {
        overallVerdict = result.status;
        errorOutput = result.errorOutput || "";
        failingTestCase = {
          testCaseNumber: i + 1,
          input: testCase.input || "",
          expected: testCase.output || "",
          actual: result.actualOutput || ""
        };
        break;
      } else {
        passedCount++;
      }
    }

    // Step 6: Save final submission details in database
    submission.status = overallVerdict;
    submission.executionTime = maxTime;
    submission.memoryUsed = maxMemory.toString();
    submission.errorOutput = errorOutput;
    await submission.save();

    const responseData = {
      verdict: overallVerdict,
      submissionId: submission._id,
      executionTime: maxTime,
      memoryUsed: maxMemory.toString(),
      testCasesPassed: passedCount,
      totalTestCases: allTestCases.length,
      failingTestCase,
      errorOutput
    };


    // Step 7: On success, update user streak, activity log, and problem solve count
    if (overallVerdict === "Accepted") {
      const user = await User.findById(userId);
      if (user) {
        const todayStr = new Date().toISOString().split("T")[0];

        // 7a. Update daily activity count
        let activityLogEntry = user.activityLog.find((log) => log.date === todayStr);
        if (activityLogEntry) {
          activityLogEntry.count += 1;
        } else {
          user.activityLog.push({ date: todayStr, count: 1 });
        }

        // 7b. Add problem to solved list if not already solved
        const hasSolved = user.solvedProblems.some(
          (id) => id.toString() === problemId.toString()
        );
        if (!hasSolved) {
          user.solvedProblems.push(problem._id);
        }

        // Dynamically compute solved stats breakdown from solved problems
        const solvedProbs = await Problem.find({ _id: { $in: user.solvedProblems } }).select("difficulty");
        const easyCount = solvedProbs.filter((p) => p.difficulty === "Easy").length;
        const mediumCount = solvedProbs.filter((p) => p.difficulty === "Medium").length;
        const hardCount = solvedProbs.filter((p) => p.difficulty === "Hard").length;

        user.solvedStats = {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        };

        // 7c. Update daily streak calculation
        const lastActive = user.lastActiveDate;
        if (!lastActive) {
          user.streakCount = 1;
        } else if (lastActive === todayStr) {
          // Already active today, streak unchanged
        } else {
          const yesterdayStr = getYesterdayStr();
          if (lastActive === yesterdayStr) {
            user.streakCount += 1;
          } else {
            user.streakCount = 1;
          }
        }

        if (user.streakCount > user.longestStreak) {
          user.longestStreak = user.streakCount;
        }
        user.lastActiveDate = todayStr;

        await user.save();

        // 7d. Invalidate caches in Redis (user, profile, and leaderboards)
        if (redis.status === "ready") {
          try {
            const leadKeys = await redis.keys("leaderboard:*");
            const keysToDel = [`user:${userId}`, `profile:${user.username}`, ...leadKeys];
            await redis.del(keysToDel);
          } catch (redisError) {
            console.warn("Failed to clear caches in Redis:", redisError.message);
          }
        }

        responseData.userStats = {
          streakCount: user.streakCount,
          longestStreak: user.longestStreak,
          solvedStats: user.solvedStats
        };
      }
    }


    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Submission Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  submitSolution
};