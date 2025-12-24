import { enableCORS } from './cors.js';

export default function handler(req, res) {
  // Enable CORS
  if (enableCORS(req, res)) return;

  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Newus API</title>
    </head>
    <body>
      <h1>🚀 Welcome to Newus API</h1>
      <p>Endpoints:</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/lead">/api/lead</a></li>
        <li><a href="/api/newsletter">/api/newsletter</a></li>
        <li><a href="/api/course-inquiry">/api/course-inquiry</a></li>
      </ul>
    </body>
    </html>
  `);
}