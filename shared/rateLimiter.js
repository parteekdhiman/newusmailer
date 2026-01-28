/**
 * Simple in-memory rate limiter with TTL
 * Safe for Vercel serverless (resets on cold start)
 * For production with multiple instances, use Redis instead
 */

class SimpleRateLimiter {
  constructor() {
    // Map: key -> { count, resetTime }
    this.buckets = new Map();
    // Cleanup interval: remove expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * Returns { allowed: boolean, remaining: number, resetTime: Date }
   */
  isAllowed(key, limit = 10, windowMs = 60 * 1000) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetTime) {
      // New bucket
      this.buckets.set(key, { count: 1, resetTime: now + windowMs });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: new Date(now + windowMs),
      };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(bucket.resetTime),
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetTime: new Date(bucket.resetTime),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetTime) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Get current bucket state (for debugging)
   */
  getBucket(key) {
    return this.buckets.get(key);
  }

  /**
   * Destroy limiter and clear interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// Global instance (note: resets on Vercel cold start)
let globalLimiter = null;

export const getGlobalRateLimiter = () => {
  if (!globalLimiter) {
    globalLimiter = new SimpleRateLimiter();
  }
  return globalLimiter;
};

/**
 * Middleware to apply rate limiting to endpoint
 * Usage: if (rateLimitMiddleware(req, res, 'ip', 10, 60000)) return;
 * Returns true if limit exceeded (middleware handled response), false if allowed
 */
export const rateLimitMiddleware = (req, res, keyType = 'ip', limit = 10, windowMs = 60 * 1000) => {
  const limiter = getGlobalRateLimiter();

  // Extract key based on type
  let key;
  if (keyType === 'ip') {
    key = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  } else if (keyType === 'email') {
    key = req.body?.email || 'unknown';
  } else {
    key = keyType;
  }

  const result = limiter.isAllowed(key, limit, windowMs);

  // Set rate limit headers (RFC 6585)
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
  res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      ok: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: retryAfter,
    });
    return true; // Indicate middleware handled response
  }

  return false; // Request allowed
};
