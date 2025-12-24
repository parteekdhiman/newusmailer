import { enableCORS } from './cors.js';

export default function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    message: '🚀 Welcome to Newus API',
    endpoints: {
      health: '/api/health',
      lead: '/api/lead',
      newsletter: '/api/newsletter',
      courseInquiry: '/api/course-inquiry',
    },
    status: 'OK'
  });
}