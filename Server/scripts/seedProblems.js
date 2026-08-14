require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("../src/models/Problem");
const redis = require("../src/config/redis");

const problems = [
  {
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`
Input: target = 9, nums = [2,7,11,15]
Output: 0 1
Explanation: Because nums[0] + nums[1] == 9, we return 0 1.
\`\`\`

### Example 2:
\`\`\`
Input: target = 6, nums = [3,2,4]
Output: 1 2
\`\`\``,
    difficulty: "Easy",
    constraints: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
    inputFormat: "Line 1: An integer target\nLine 2: Space-separated integers representing nums",
    outputFormat: "Two space-separated indices (0-indexed)",
    sampleTestCases: [
      {
        input: "9\n2 7 11 15",
        output: "0 1",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9"
      },
      {
        input: "6\n3 2 4",
        output: "1 2",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6"
      }
    ],
    hiddenTestCases: [
      {
        input: "6\n3 3",
        output: "0 1"
      },
      {
        input: "0\n-3 4 3 90",
        output: "0 2"
      },
      {
        input: "100\n5 25 15 85 45",
        output: "2 3"
      },
      {
        input: "50\n1 2 3 4 5 45",
        output: "4 5"
      },
      {
        input: "8\n1 7",
        output: "0 1"
      }
    ],

    timeLimit: 2000,
    memoryLimit: 64
  },
  {
    title: "Valid Palindrome",
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

### Example 1:
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

### Example 2:
\`\`\`
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\``,
    difficulty: "Easy",
    constraints: `1 <= s.length <= 2 * 10^5
s consists only of printable ASCII characters.`,
    inputFormat: "Single line containing string s",
    outputFormat: "Print 'true' if palindrome, else 'false'",
    sampleTestCases: [
      {
        input: "A man, a plan, a canal: Panama",
        output: "true",
        explanation: "'amanaplanacanalpanama' reads the same forwards and backwards."
      },
      {
        input: "race a car",
        output: "false",
        explanation: "'raceacar' is not a palindrome."
      }
    ],
    hiddenTestCases: [
      {
        input: " ",
        output: "true"
      },
      {
        input: "0P",
        output: "false"
      },
      {
        input: "ab_a",
        output: "true"
      },
      {
        input: "Was it a car or a cat I saw?",
        output: "true"
      },
      {
        input: "No lemon, no melon",
        output: "true"
      }
    ],
    timeLimit: 2000,
    memoryLimit: 64
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
\`\`\`

### Example 3:
\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
\`\`\``,
    difficulty: "Medium",
    constraints: `0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.`,
    inputFormat: "A single line containing the string s",
    outputFormat: "A single integer representing the length of the longest substring without repeating characters",
    sampleTestCases: [
      {
        input: "abcabcbb",
        output: "3",
        explanation: "The longest unique substring is 'abc' of length 3."
      },
      {
        input: "bbbbb",
        output: "1",
        explanation: "The longest unique substring is 'b' of length 1."
      },
      {
        input: "pwwkew",
        output: "3",
        explanation: "The longest unique substring is 'wke' of length 3."
      }
    ],
    hiddenTestCases: [
      {
        input: "dvdf",
        output: "3"
      },
      {
        input: "anviaj",
        output: "5"
      },
      {
        input: "tmmzuxt",
        output: "5"
      },
      {
        input: "abcdefghijklmnopqrstuvwxyz",
        output: "26"
      }
    ],
    timeLimit: 2000,
    memoryLimit: 64
  },
  {
    title: "Climbing Stairs",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Example 1:
\`\`\`
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top:
1. 1 step + 1 step
2. 2 steps
\`\`\`

### Example 2:
\`\`\`
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top:
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
\`\`\``,
    difficulty: "Easy",
    constraints: `1 <= n <= 45`,
    inputFormat: "A single integer n",
    outputFormat: "A single integer representing the total distinct ways",
    sampleTestCases: [
      {
        input: "2",
        output: "2",
        explanation: "1+1, or 2"
      },
      {
        input: "3",
        output: "3",
        explanation: "1+1+1, 1+2, 2+1"
      }
    ],
    hiddenTestCases: [
      {
        input: "1",
        output: "1"
      },
      {
        input: "4",
        output: "5"
      },
      {
        input: "5",
        output: "8"
      },
      {
        input: "10",
        output: "89"
      },
      {
        input: "20",
        output: "10946"
      }
    ],
    timeLimit: 2000,
    memoryLimit: 64
  },
  {
    title: "Trapping Rain Water",
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example 1:
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.
\`\`\`

### Example 2:
\`\`\`
Input: height = [4,2,0,3,2,5]
Output: 9
\`\`\``,
    difficulty: "Hard",
    constraints: `n == height.length
1 <= n <= 2 * 10^4
0 <= height[i] <= 10^5`,
    inputFormat: "Space-separated non-negative integers representing elevation map",
    outputFormat: "A single integer representing total trapped water units",
    sampleTestCases: [
      {
        input: "0 1 0 2 1 0 1 3 2 1 2 1",
        output: "6",
        explanation: "6 total units of water trapped."
      },
      {
        input: "4 2 0 3 2 5",
        output: "9",
        explanation: "9 total units of water trapped."
      }
    ],
    hiddenTestCases: [
      {
        input: "1",
        output: "0"
      },
      {
        input: "2 0 2",
        output: "2"
      },
      {
        input: "3 0 0 2 0 4",
        output: "10"
      },
      {
        input: "5 4 1 2",
        output: "1"
      }
    ],
    timeLimit: 2000,
    memoryLimit: 128
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not configured in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected.");

    for (const prob of problems) {
      const existing = await Problem.findOne({ title: prob.title });
      if (existing) {
        await Problem.findByIdAndUpdate(existing._id, prob);
        console.log(`Updated existing problem: "${prob.title}" (${prob.difficulty})`);
      } else {
        const newProb = new Problem(prob);
        await newProb.save();
        console.log(`Inserted new problem: "${prob.title}" (${prob.difficulty})`);
      }
    }

    // Clear Redis cache for problems
    if (redis.status === "ready") {
      try {
        const keys = await redis.keys("problems_list:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        console.log("Cleared Redis problem cache.");
      } catch (err) {
        console.warn("Redis key clear warning:", err.message);
      }
    }

    console.log("Seeding complete! 5 algorithmic challenges ready.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error.message);
    process.exit(1);
  }
};

seedDatabase();
