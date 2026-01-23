import OpenAI from "openai";
import { coursesList } from "../shared/coursesList.js";
import { enableCORS } from './cors.js';

// ✅ CACHE COURSE DATA (PERFORMANCE BOOST)
const COURSE_CONTEXT = JSON.stringify(
  coursesList.map((course) => ({
    name: course.name,
    description: course.description,
    duration: course.duration,
    placement: course.placement,
    type: course.type,
    coursetype: course.coursetype,
  }))
);

// Limit history sent to AI
const MAX_HISTORY = 10;

export default async function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    // console.log(apiKey);
    
    const ai = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
        })
      : null;

    if (!ai) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY not configured",
      });
    }

    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ TRIM HISTORY
    const trimmedHistory = conversationHistory
      .slice(-MAX_HISTORY)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    const messages = [
      {
        role: "system",
        content: `You are NEWUS Learner Hub course assistant.
Answer ONLY using this data:
${COURSE_CONTEXT}`,
      },
      ...trimmedHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await ai.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages,
      temperature: 0.6,
      max_tokens: 700,
    });

    res.status(200).json({
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString(),
    });
    console.log(completion.choices[0].message.content)
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}
