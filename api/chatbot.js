import OpenAI from "openai";
import { coursesList } from "../shared/coursesList.js";
import { enableCORS } from './cors.js';
import { rateLimitMiddleware } from '../shared/rateLimiter.js';

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

  // SECURITY: Rate limit by IP (prevent abuse)
  if (rateLimitMiddleware(req, res, 'ip', 20, 60 * 1000)) return;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({
        error: "Service unavailable. API not configured.",
      });
    }

    const ai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      timeout: 25000, // 25 second timeout (Vercel limit is 30s)
    });

    const { message, conversationHistory = [] } = req.body;

    // SECURITY: Validate message format
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    // SECURITY: Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0 || trimmedMessage.length > 2000) {
      return res.status(400).json({ error: "Message must be between 1 and 2000 characters" });
    }

    // SECURITY: Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: "Invalid conversation history format" });
    }

    // ✅ TRIM HISTORY and validate each entry
    const trimmedHistory = conversationHistory
      .slice(-MAX_HISTORY)
      .filter((m) => m && typeof m.sender === 'string' && typeof m.text === 'string')
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: String(m.text).trim().slice(0, 1000), // Cap message size
      }))
      .filter((m) => m.content.length > 0);

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
        content: trimmedMessage,
      },
    ];

    try {
      const completion = await ai.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages,
        temperature: 0.6,
        max_tokens: 700,
      });

      const responseText = completion.choices[0]?.message?.content || 'Unable to generate response. Please try again.';

      res.status(200).json({
        response: responseText,
        timestamp: new Date().toISOString(),
      });
    } catch (apiError) {
      // Handle specific API errors
      if (apiError.status === 429) {
        console.warn("OpenRouter rate limited");
        return res.status(429).json({
          error: "Service is temporarily busy. Please try again in a moment.",
        });
      }

      if (apiError.code === 'ETIMEDOUT' || apiError.message?.includes('timeout')) {
        console.warn("OpenRouter timeout");
        return res.status(504).json({
          error: "Request timeout. Please try again.",
        });
      }

      throw apiError;
    }
  } catch (error) {
    // SECURITY: Log error but don't expose details to client
    console.error("Chatbot error:", {
      message: error.message || 'Unknown error',
      code: error.code,
      status: error.status,
    });
    
    res.status(500).json({
      error: "Service error. Please try again later.",
    });
  }
}
