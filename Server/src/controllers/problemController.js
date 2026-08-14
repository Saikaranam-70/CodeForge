const Problem = require("../models/Problem");
const redis = require("../config/redis");

/**
 * Create a new problem (Admin only - published directly)
 * POST /api/problems
 */
const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      constraints,
      inputFormat,
      outputFormat,
      sampleTestCases,
      hiddenTestCases,
      timeLimit,
      memoryLimit
    } = req.body;

    // Validate required fields
    if (!title || !description || !difficulty) {
      return res.status(400).json({ message: "Title, description, and difficulty are required" });
    }

    const newProblem = new Problem({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      constraints: constraints || "",
      inputFormat: inputFormat || "",
      outputFormat: outputFormat || "",
      sampleTestCases: Array.isArray(sampleTestCases) ? sampleTestCases : [],
      hiddenTestCases: Array.isArray(hiddenTestCases) ? hiddenTestCases : [],
      timeLimit: parseInt(timeLimit) || 2000,
      memoryLimit: parseInt(memoryLimit) || 64,
      isApproved: true,
      status: "approved",
      createdBy: req.user ? req.user.userId : null
    });

    const savedProblem = await newProblem.save();

    // Invalidate problem list caches in Redis
    if (redis.status === "ready") {
      try {
        const keys = await redis.keys("problems_list:*");
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (redisError) {
        console.warn("Failed to clear list caches in Redis:", redisError.message);
      }
    }

    return res.status(201).json({
      message: "Problem created successfully",
      problemId: savedProblem._id,
      status: savedProblem.status,
      isApproved: savedProblem.isApproved
    });
  } catch (error) {
    console.error("Create Problem Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Propose a community problem (Any logged-in user)
 * POST /api/problems/propose
 */
const proposeProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      constraints,
      inputFormat,
      outputFormat,
      sampleTestCases,
      hiddenTestCases,
      timeLimit,
      memoryLimit
    } = req.body;

    if (!title || !description || !difficulty) {
      return res.status(400).json({ message: "Title, description, and difficulty are required" });
    }

    const isAdmin = req.user && req.user.role === "admin";
    const isApproved = isAdmin;
    const status = isAdmin ? "approved" : "pending";

    const newProblem = new Problem({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      constraints: constraints || "",
      inputFormat: inputFormat || "",
      outputFormat: outputFormat || "",
      sampleTestCases: Array.isArray(sampleTestCases) ? sampleTestCases : [],
      hiddenTestCases: Array.isArray(hiddenTestCases) ? hiddenTestCases : [],
      timeLimit: parseInt(timeLimit) || 2000,
      memoryLimit: parseInt(memoryLimit) || 64,
      isApproved,
      status,
      createdBy: req.user ? req.user.userId : null
    });

    const savedProblem = await newProblem.save();

    if (isApproved && redis.status === "ready") {
      try {
        const keys = await redis.keys("problems_list:*");
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (redisError) {
        console.warn("Failed to clear list caches in Redis:", redisError.message);
      }
    }

    return res.status(201).json({
      message: isAdmin 
        ? "Problem created and published to arena!" 
        : "Problem proposal submitted successfully! It will appear in the arena once approved by an Admin.",
      problemId: savedProblem._id,
      status: savedProblem.status,
      isApproved: savedProblem.isApproved
    });
  } catch (error) {
    console.error("Propose Problem Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get paginated list of approved problems
 * GET /api/problems?page=1&limit=20&difficulty=all
 */
const getAllProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const difficulty = req.query.difficulty || "all";

    const cacheKey = `problems_list:page_${page}:limit_${limit}:diff_${difficulty}`;

    if (redis.status === "ready") {
      try {
        const cachedList = await redis.get(cacheKey);
        if (cachedList) {
          return res.status(200).json(JSON.parse(cachedList));
        }
      } catch (redisError) {
        console.warn("Redis GET warning during problems list fetch:", redisError.message);
      }
    }

    const query = {
      isApproved: { $ne: false },
      status: { $ne: "pending" }
    };

    if (difficulty !== "all") {
      query.difficulty = difficulty;
    }
    const skip = (page - 1) * limit;

    const [problems, totalCount] = await Promise.all([
      Problem.find(query)
        .select("-hiddenTestCases")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Problem.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const responseData = {
      problems,
      totalPages,
      totalCount,
      currentPage: page
    };

    if (redis.status === "ready") {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(responseData));
      } catch (redisError) {
        console.warn("Redis SET warning during problems list caching:", redisError.message);
      }
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Get All Problems Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all pending community problem proposals (Admin only)
 * GET /api/problems/admin/pending
 */
const getPendingProblems = async (req, res) => {
  try {
    const pendingProblems = await Problem.find({ status: "pending" })
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pendingProblems.length,
      problems: pendingProblems
    });
  } catch (error) {
    console.error("Get Pending Problems Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Approve a problem proposal (Admin only)
 * PUT /api/problems/:id/approve
 */
const approveProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    problem.isApproved = true;
    problem.status = "approved";
    await problem.save();

    if (redis.status === "ready") {
      try {
        const keys = await redis.keys("problems_list:*");
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (err) {
        console.warn("Redis clear cache error:", err.message);
      }
    }

    return res.status(200).json({
      message: `Problem "${problem.title}" approved and published to arena!`,
      problem
    });
  } catch (error) {
    console.error("Approve Problem Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Reject a problem proposal (Admin only)
 * PUT /api/problems/:id/reject
 */
const rejectProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    problem.isApproved = false;
    problem.status = "rejected";
    await problem.save();

    return res.status(200).json({
      message: `Problem "${problem.title}" rejected.`,
      problem
    });
  } catch (error) {
    console.error("Reject Problem Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get single problem details by ID
 * GET /api/problems/:id
 */
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `problem:${id}`;
    let problem = null;

    if (redis.status === "ready") {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          problem = JSON.parse(cachedData);
        }
      } catch (redisError) {
        console.warn("Redis GET warning during problem fetch:", redisError.message);
      }
    }

    if (!problem) {
      problem = await Problem.findById(id);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      if (redis.status === "ready") {
        try {
          await redis.setex(cacheKey, 86400, JSON.stringify(problem));
        } catch (redisError) {
          console.warn("Redis SET warning during problem caching:", redisError.message);
        }
      }
    }

    const problemData = problem.toObject ? problem.toObject() : { ...problem };
    delete problemData.hiddenTestCases;

    return res.status(200).json(problemData);
  } catch (error) {
    console.error("Get Problem By ID Error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid problem ID format" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProblem,
  proposeProblem,
  getAllProblems,
  getPendingProblems,
  approveProblem,
  rejectProblem,
  getProblemById
};