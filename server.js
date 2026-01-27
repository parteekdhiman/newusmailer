// Local development server for testing Vercel API routes
dotenv.config();
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables

const app = express();

// Enable CORS
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// Import the API route functions directly
import healthHandler from './api/health.js';
import leadHandler from './api/lead.js';
import newsletterHandler from './api/newsletter.js';
import courseInquiryHandler from './api/course-inquiry.js';
import chatbotHandler from './api/chatbot.js';
import interviewerHandler from './api/interviewer.js';
import indexHandler from './api/index.js';

// Define routes that match Vercel API routes
app.get('/api/health', healthHandler);
app.post('/api/lead', leadHandler);
app.post('/api/newsletter', newsletterHandler);
app.post('/api/course-inquiry', courseInquiryHandler);
app.post('/api/chatbot', chatbotHandler);
app.post('/api/interviewer', interviewerHandler);
app.get('/', indexHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});