import OpenAI from 'openai';
import { coursesList } from "../shared/coursesList.js";

const apiKey = "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";
const ai = apiKey ? new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" }) : null;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'AI service not configured. Please check OPENROUTER_API_KEY environment variable.'
      });
    }

    // Sanitize course list to remove JSX elements which cause circular reference issues
    const sanitizedCourses = coursesList.map(course => ({
      name: course.name,
      description: course.description,
      outcome: course.outcome,
      duration: course.duration,
      tools: course.tools.map(t => t.type),
      content: course.content,
      placement: course.placement,
      type: course.type,
      coursetype: course.coursetype
    }));

    // Prepare messages for AI
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant for NEWUS Learner Hub. Use the following course data to answer user questions. If the answer is not found in the data, state that you do not have that information. Format your responses using Markdown for better readability (use bold for key terms, lists for features, etc). Keep responses concise but informative. Data: ${JSON.stringify(sanitizedCourses)}`
      },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: "user",
        content: message
      }
    ];

    // Get AI response
    const completion = await ai.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}