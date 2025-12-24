// Example API route that returns a simple JSON response
// const express = require("express");
import express from ("express")
const router = express.Router();

// Simple hello endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Hello from Vercel Serverless Function!",
    timestamp: new Date().toISOString(),
  });
});

// Export the router
module.exports = router;