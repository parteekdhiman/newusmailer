/**
 * CORS Middleware for Vercel API routes
 * Handles CORS headers for cross-origin requests
 */

export const enableCORS = (req, res) => {
  const allowedOrigins = [
    // prefer explicit env override when set
    process.env.FRONTEND_URL || 'http://localhost:8080',
    // Staging / production frontends
    'https://testsite-snowy-gamma.vercel.app',
    'https://newus.in',
    // other known origins
    'https://newusmailer.vercel.app',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
};
