const { generateAICompletion } = require("../services/aiService");
const Problem = require("../models/Problem");

const reviewCode = async (req, res) => {
  try {
    const { code, language, problemId, problemTitle, problemDescription } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required for AI review" });
    }

    let title = problemTitle || "Custom Problem";
    let description = problemDescription || "";

    if (problemId && (!problemTitle || !problemDescription)) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        title = problem.title;
        description = problem.description;
      }
    }

    const systemPrompt = `You are a Principal Software Engineer and Staff Algorithmic Interviewer at a top tech company.
Analyze the user's code solution for the given problem.
You MUST output ONLY valid JSON matching this exact structure without markdown backticks:
{
  "timeComplexity": "e.g. O(N log N)",
  "spaceComplexity": "e.g. O(1)",
  "complexityAnalysis": "Detailed, easy-to-understand explanation of the Big-O time and space complexity",
  "score": 8,
  "strengths": ["Clear variable naming", "Handles base cases well"],
  "bottlenecks": ["Nested loop causes O(N^2) in worst case", "Potential integer overflow"],
  "edgeCasesToWatch": ["Empty array input", "Single element array"],
  "cleanCodeSuggestions": "Specific tips to write cleaner, fresher-friendly code",
  "optimizedCode": "Optimized code string in the same programming language (or empty string if already optimal)",
  "summary": "Concise 2-sentence summary verdict"
}`;

    const userPrompt = `Problem Title: ${title}
Problem Description: ${description}
Programming Language: ${language || "javascript"}

User Code:
${code}`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResult.content);
    } catch (parseErr) {
      const cleanJson = aiResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      cached: aiResult.cached,
      review: parsedResponse
    });
  } catch (error) {
    console.error("AI Review Controller Error:", error.message);
    return res.status(500).json({ message: "Failed to generate AI code review", error: error.message });
  }
};

const getHint = async (req, res) => {
  try {
    const { code, language, problemId, problemTitle, problemDescription, hintLevel = 1 } = req.body;

    let title = problemTitle || "Algorithmic Problem";
    let description = problemDescription || "";

    if (problemId && (!problemTitle || !problemDescription)) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        title = problem.title;
        description = problem.description;
      }
    }

    const systemPrompt = `You are a Socratic Algorithmic Tutor at CodeForge.
Your goal is to guide students to understand the solution on their own.
NEVER write or reveal the complete working solution code.

Guidelines based on Hint Level:
- Level 1 (Intuition): Explain the core idea, problem-solving intuition, and mental model without naming specific algorithms.
- Level 2 (Algorithm & Data Structure): Recommend the best data structure or algorithmic technique (e.g. Two Pointers, Monotonic Stack, BFS/DFS, DP) and why it fits.
- Level 3 (Edge Cases & Step-by-Step Pseudocode): Provide high-level pseudocode steps and key edge cases to watch out for.

Output ONLY valid JSON with this structure:
{
  "hintLevel": ${hintLevel},
  "title": "Hint Title",
  "hint": "Clear, friendly, Socratic hint text",
  "guidingQuestion": "A thought-provoking question to prompt the student to find the answer themselves",
  "nextStep": "What they should try next in their code"
}`;

    const userPrompt = `Problem Title: ${title}
Problem Description: ${description}
Requested Hint Level: ${hintLevel} (1=Intuition, 2=Data Structure/Pattern, 3=Step-by-Step Pseudocode)
User's Current Code:
${code || "(No code written yet)"}`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      jsonMode: true
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResult.content);
    } catch (parseErr) {
      const cleanJson = aiResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      cached: aiResult.cached,
      hint: parsedResponse
    });
  } catch (error) {
    console.error("AI Hint Controller Error:", error.message);
    return res.status(500).json({ message: "Failed to generate AI hint", error: error.message });
  }
};

const debugCode = async (req, res) => {
  try {
    const { code, language, problemId, errorOutput, verdict, failingInput, expectedOutput, actualOutput } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required for debugging" });
    }

    let title = "Algorithmic Problem";
    let description = "";

    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        title = problem.title;
        description = problem.description;
      }
    }

    const systemPrompt = `You are a Senior Debugging Assistant and Automated Test Case Generator at CodeForge.
Analyze why the user's code failed (Wrong Answer, Time Limit Exceeded, or RunTime Error).
Find the exact logical bug and generate a minimal counterexample test case that exposes the bug.

Output ONLY valid JSON with this structure:
{
  "bugLocation": "Where in the code the flaw occurs",
  "bugExplanation": "Clear, beginner-friendly explanation of why this bug happens",
  "counterExample": {
    "input": "Minimal input that fails",
    "expectedOutput": "What the algorithm should return",
    "actualUserOutput": "What user's current code returns (or error)"
  },
  "howToFix": "Clear step-by-step guidance to fix the logic"
}`;

    const userPrompt = `Problem: ${title}
Description: ${description}
Verdict: ${verdict || "Error"}
Error Output / Trace: ${errorOutput || "None"}
Failing Input (if known): ${failingInput || "Not specified"}
Expected: ${expectedOutput || "Not specified"}
Actual: ${actualOutput || "Not specified"}

User's Code:
${code}`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResult.content);
    } catch (parseErr) {
      const cleanJson = aiResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      cached: aiResult.cached,
      debug: parsedResponse
    });
  } catch (error) {
    console.error("AI Debug Controller Error:", error.message);
    return res.status(500).json({ message: "Failed to debug code", error: error.message });
  }
};

const generateProblem = async (req, res) => {
  try {
    const { topic = "Arrays", difficulty = "Medium", theme = "General" } = req.body;

    const systemPrompt = `You are a Lead Problem Setter for LeetCode and CodeForge.
Create a brand new, highly creative algorithmic problem for coding practice.
You MUST output ONLY valid JSON matching the exact Mongoose Problem Schema structure:
{
  "title": "Problem Title",
  "description": "Full Markdown problem description with examples and story",
  "difficulty": "${difficulty}",
  "constraints": "1 <= N <= 10^5, -10^9 <= nums[i] <= 10^9",
  "inputFormat": "First line contains N, second line contains space-separated integers",
  "outputFormat": "Single integer representing the result",
  "sampleTestCases": [
    {
      "input": "5\\n1 2 3 4 5",
      "output": "15",
      "explanation": "Sum of all elements is 15"
    }
  ],
  "hiddenTestCases": [
    {
      "input": "1\\n100",
      "output": "100"
    },
    {
      "input": "4\\n-1 -2 -3 -4",
      "output": "-10"
    }
  ],
  "timeLimit": 2000,
  "memoryLimit": 64
}`;

    const userPrompt = `Topic: ${topic}
Difficulty: ${difficulty}
Theme: ${theme}`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      jsonMode: true
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResult.content);
    } catch (parseErr) {
      const cleanJson = aiResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      problem: parsedResponse
    });
  } catch (error) {
    console.error("AI Problem Generation Error:", error.message);
    return res.status(500).json({ message: "Failed to generate problem", error: error.message });
  }
};


const generateTestCases = async (req, res) => {
  try {

    const { title, description, difficulty = "Medium", constraints = "" } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required to generate test cases" });
    }

    const systemPrompt = `You are a Senior Test Engineer and Problem Setter at LeetCode.
Given the problem title and description, generate a complete, rigorous test suite with 100% accurate verified expected outputs.
Ensure that:
1. Every test case has strictly one unambiguous valid output.
2. Hidden test cases thoroughly cover edge cases (empty/minimal inputs, boundary values, negative numbers, large inputs, duplicates).

Output ONLY valid JSON matching this exact structure:
{
  "constraints": "Formal constraints string (e.g. 1 <= N <= 10^5)",
  "inputFormat": "Clear description of input format",
  "outputFormat": "Clear description of output format",
  "sampleTestCases": [
    {
      "input": "Sample input string (newlines as \\n)",
      "output": "Expected sample output string",
      "explanation": "Clear explanation of how output is derived"
    }
  ],
  "hiddenTestCases": [
    {
      "input": "Edge case input string",
      "output": "Exact verified expected output string"
    }
  ]
}`;

    const userPrompt = `Problem Title: ${title}
Difficulty: ${difficulty}
Description:
${description}
User-provided Constraints (if any): ${constraints || "None provided"}`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResult.content);
    } catch (parseErr) {
      const cleanJson = aiResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      testCases: parsedResponse
    });
  } catch (error) {
    console.error("AI Testcase Generation Error:", error.message);
    return res.status(500).json({ message: "Failed to generate test cases", error: error.message });
  }
};

const importLeetCodeProblem = async (req, res) => {
  try {

    const { urlOrTitle } = req.body;

    if (!urlOrTitle || urlOrTitle.trim().length === 0) {
      return res.status(400).json({ message: "LeetCode URL or problem name is required" });
    }

    let query = urlOrTitle.trim();
    // If URL passed like https://leetcode.com/problems/container-with-most-water/
    const urlMatch = query.match(/leetcode\.com\/problems\/([^/]+)/i);
    if (urlMatch && urlMatch[1]) {
      query = urlMatch[1].replace(/-/g, " ");
    }

    const systemPrompt = `You are a Principal Data Structures & Algorithms Curator.
Given a LeetCode problem name or slug, return the complete, official problem specifications, full problem story, exact official constraints, input and output formats, official public sample test cases with step-by-step explanations, and 6+ comprehensive hidden test cases covering all edge cases (minimal size, negative values, duplicates, max constraints) with 100% verified correct outputs.

You MUST output ONLY valid JSON matching this exact structure:
{
  "title": "Official LeetCode Problem Title",
  "difficulty": "Easy" | "Medium" | "Hard",
  "description": "Complete problem statement with examples formatted in clear Markdown",
  "constraints": "Official constraints string (e.g. 2 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9)",
  "inputFormat": "Exact input format specification",
  "outputFormat": "Exact output format specification",
  "timeLimit": 2000,
  "memoryLimit": 64,
  "sampleTestCases": [
    {
      "input": "Sample input formatted with \\n for line breaks",
      "output": "Exact expected output",
      "explanation": "Detailed step-by-step explanation"
    }
  ],
  "hiddenTestCases": [
    {
      "input": "Edge case input string",
      "output": "Verified correct expected output string"
    }
  ]
}`;

    const userPrompt = `Target LeetCode Problem: "${query}"`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResult.content);
    } catch (parseErr) {
      const cleanJson = aiResult.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      problem: parsedResponse
    });
  } catch (error) {
    console.error("Import LeetCode Problem Error:", error.message);
    return res.status(500).json({ message: "Failed to import LeetCode problem", error: error.message });
  }
};

const conductMockInterview = async (req, res) => {
  try {
    const { messages = [], code = "", problemTitle = "", problemDescription = "", action = "chat" } = req.body;

    let systemPrompt = "";
    if (action === "evaluate") {
      systemPrompt = `You are a Principal Software Engineer and Bar Raiser Interviewer at FAANG (Google/Meta/Apple).
Evaluate the candidate's performance across the entire coding interview.
Output ONLY valid JSON matching this exact structure:
{
  "hiringRecommendation": "Strong Hire",
  "overallScore": 8.5,
  "scores": {
    "problemSolving": 9,
    "codeQuality": 8,
    "communication": 9,
    "edgeCases": 8
  },
  "feedbackSummary": "Concise 3-4 sentence comprehensive assessment of the candidate's strengths and areas for growth",
  "keyStrengths": ["Clear explanation before coding", "Optimal time complexity"],
  "areasForImprovement": ["Could have written modular helper functions", "Test empty input upfront"]
}`;
    } else {
      systemPrompt = `You are a friendly, highly experienced Staff Software Engineer conducting a live technical coding interview at a top tech company for "${problemTitle}".
Your goal:
1. Greet the candidate and ask them to explain their initial thoughts/intuition before jumping into coding.
2. Ask insightful questions about Big-O time/space tradeoffs, data structures, and edge cases.
3. Keep responses conversational, concise, professional, and encouraging (1-3 paragraphs max).
4. Never give the answer away immediately; guide the candidate to discover optimizations themselves.`;
    }

    const conversationHistory = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join("\n");
    const userPrompt = `Problem: ${problemTitle}
Problem Description:
${problemDescription}

Candidate's Current Code:
${code || "(No code written yet)"}

Conversation History:
${conversationHistory || "Candidate just started the interview."}

${action === "evaluate" ? "Provide the official FAANG SDE Interview Scorecard & Decision JSON:" : "Your response as the Staff Interviewer:"}`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: action === "evaluate" ? 0.2 : 0.6,
      jsonMode: action === "evaluate"
    });

    let content = aiResult.content;
    let evaluation = null;

    if (action === "evaluate") {
      try {
        evaluation = JSON.parse(content);
      } catch (e) {
        const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
        evaluation = JSON.parse(cleanJson);
      }
    }

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      message: content,
      evaluation
    });
  } catch (error) {
    console.error("Mock Interview Error:", error.message);
    return res.status(500).json({ message: "Failed to process interview message", error: error.message });
  }
};

const convertLanguage = async (req, res) => {
  try {
    const { code, fromLanguage, toLanguage, problemTitle = "" } = req.body;

    if (!code || !toLanguage) {
      return res.status(400).json({ message: "Code and target language are required" });
    }

    const systemPrompt = `You are a Polyglot Systems Engineer and Competitive Programmer.
Translate the user's algorithmic solution from ${fromLanguage || "Source Language"} to ${toLanguage}.
Rules:
1. Maintain idiomatic coding style in ${toLanguage} (e.g. use vector/unordered_map in C++, dict/list in Python, HashMap in Java, etc.).
2. Maintain standard LeetCode class/function signatures matching ${toLanguage}.
3. Return ONLY the translated code string without any markdown explanations.`;

    const userPrompt = `Problem: ${problemTitle}
Original Code (${fromLanguage}):
${code}

Translate to pure ${toLanguage} code:`;

    const aiResult = await generateAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      jsonMode: false
    });

    let translatedCode = aiResult.content.replace(/```[a-z]*\n?/gi, "").trim();

    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      translatedCode
    });
  } catch (error) {
    console.error("Code Convert Error:", error.message);
    return res.status(500).json({ message: "Failed to convert code", error: error.message });
  }
};

module.exports = {
  reviewCode,
  getHint,
  debugCode,
  generateProblem,
  generateTestCases,
  importLeetCodeProblem,
  conductMockInterview,
  convertLanguage
};



