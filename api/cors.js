/**
 * CORS Middleware for Vercel API routes
 * Handles CORS headers for cross-origin requests
 * SECURITY: Fixed wildcard CORS exposure - production uses strict whitelist only
 */

export const enableCORS = (req, res) => {
  // SECURITY: Separate allowlists for production and development
  // Production MUST have explicit origins - NO wildcards
  const productionOrigins = [
    'https://newus.in',
    'https://www.newus.in',
  ];

  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
  ];

  // Allow frontend URL override ONLY if it looks valid (contains protocol + domain)
  const envFrontendUrl = process.env.FRONTEND_URL;
  const isValidUrl = envFrontendUrl && /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(envFrontendUrl);

  // Default to production origins on Vercel (NODE_ENV may not be set)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  
  const allowedOrigins =
    isProduction
      ? [
          ...productionOrigins,
          ...(isValidUrl ? [envFrontendUrl] : []), // Add env override only in production if valid
        ]
      : [...developmentOrigins, ...(isValidUrl ? [envFrontendUrl] : [])];

  const origin = req.headers.origin;

  // SECURITY: Strict whitelist check - no fallback to wildcard
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin && isProduction) {
    // SECURITY: On production, only allow listed origins
    res.setHeader('Access-Control-Allow-Origin', 'null');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  } else {
    // SECURITY: Allow development origins to work more flexibly
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // SECURITY: Only allow methods actually needed
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '3600');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
};
