const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const redis = require("../config/redis");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let geminiClient = null;
if (GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
}

let groqClient = null;
if (GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: GROQ_API_KEY });
}

const computeHash = (content) => {
  return crypto.createHash("md5").update(content).digest("hex");
};

const callGemini = async ({ systemPrompt, userPrompt, temperature = 0.4, jsonMode = false }) => {
  if (!geminiClient) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const modelCandidates = ["gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
  let lastErr = null;

  for (const modelName of modelCandidates) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        },
        systemInstruction: systemPrompt || undefined
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("All Gemini models failed");
};


const callGroq = async ({ systemPrompt, userPrompt, temperature = 0.4, jsonMode = false }) => {
  if (!groqClient) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userPrompt });

  const completionParams = {
    model: "llama-3.3-70b-versatile",
    messages,
    temperature
  };

  if (jsonMode) {
    completionParams.response_format = { type: "json_object" };
  }

  const response = await groqClient.chat.completions.create(completionParams);
  return response.choices[0]?.message?.content || "";
};

const generateAICompletion = async ({ systemPrompt = "", userPrompt = "", temperature = 0.4, jsonMode = false }) => {
  const cachePayload = `${systemPrompt}:::${userPrompt}:::${jsonMode}`;
  const cacheKey = `ai:completion:${computeHash(cachePayload)}`;

  if (redis.status === "ready") {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return {
          content: cached,
          provider: "cache",
          cached: true
        };
      }
    } catch (err) {
      console.warn("Redis AI cache GET warning:", err.message);
    }
  }

  let text = null;
  let usedProvider = null;

  try {
    text = await callGemini({ systemPrompt, userPrompt, temperature, jsonMode });
    usedProvider = "gemini";
  } catch (geminiError) {
    console.warn("⚠️ Gemini API failed, failing over to Groq:", geminiError.message);

    try {
      text = await callGroq({ systemPrompt, userPrompt, temperature, jsonMode });
      usedProvider = "groq";
    } catch (groqError) {
      console.error("❌ Both Gemini and Groq AI providers failed:", groqError.message);
      throw new Error(`AI generation failed on both providers. (Gemini: ${geminiError.message} | Groq: ${groqError.message})`);
    }
  }

  if (text && redis.status === "ready") {
    try {
      await redis.setex(cacheKey, 7200, text);
    } catch (err) {
      console.warn("Redis AI cache SET warning:", err.message);
    }
  }

  return {
    content: text,
    provider: usedProvider,
    cached: false
  };
};

module.exports = {
  generateAICompletion
};
