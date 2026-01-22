# Newus API - Vercel Serverless Functions

This directory contains the Vercel-compatible serverless functions for the Newus application. The Express backend has been converted to work with Vercel's serverless architecture.

## Folder Structure

```
/newus
├── api/                  # Serverless functions directory
│   ├── index.js          # Main API entry point (Express app)
│   ├── hello.js          # Example API route
│   ├── package.json      # API dependencies
│   └── README.md         # This file
├── new/                  # Frontend application
├── server/               # Original Express server (for reference)
└── vercel.json           # Vercel deployment configuration
```

## How It Works

1. **Express App Export**: Instead of calling `app.listen()`, the Express app is exported as a module in `index.js`.

2. **Middleware Configuration**: Middleware like `cors` and `express.json()` is configured in the main `index.js` file.

3. **API Routes**: All routes are prefixed with `/api/` and return JSON responses.

4. **Vercel Configuration**: The `vercel.json` file is configured to route API requests to the serverless functions.

## Development

To develop locally:

```bash
# Install dependencies
cd api
npm install

# Run development server
npm run dev
```

## Deployment

To deploy to Vercel:

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

Before deploying or running locally, copy the environment variables:

```bash
# Copy environment file
cp .env.example .env
```

Edit the `.env` file with your configuration values. Required variables include:
- `EMAIL_USER` and `EMAIL_PASS` for email functionality
- `ADMIN_EMAIL` for notifications
- `FRONTEND_URL` for CORS configuration

See `.env.example` for all available options and detailed documentation.

For Vercel deployment, set these same variables in your Vercel project settings.