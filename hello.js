// Simple serverless hello function - CommonJS
module.exports = (req, res) => {
  res.json({
    message: "Hello from Vercel Serverless Function!",
    timestamp: new Date().toISOString(),
  });
};
