/**
 * Request deduplication utility to prevent duplicate submissions
 * Uses in-memory cache with TTL for Vercel serverless
 * For distributed systems, use Redis instead
 */

class RequestDeduplicator {
  constructor() {
    // Map: deduplicationKey -> { timestamp, response }
    this.cache = new Map();
    // Cleanup interval: remove expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate deduplication key from request properties
   * Example: email + endpoint + timestamp (bucketed by minute)
   */
  generateKey(type, identifier) {
    if (!type || !identifier) return null;
    const bucket = Math.floor(Date.now() / 60000); // 1-minute buckets
    return `${type}:${identifier}:${bucket}`;
  }

  /**
   * Check if request is a duplicate and return cached response if available
   * Returns { isDuplicate: boolean, response?: any, key: string }
   */
  checkDuplicate(type, identifier, ttlMs = 60000) {
    const key = this.generateKey(type, identifier);
    if (!key) return { isDuplicate: false, key: 'unknown' };

    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now < cached.expiryTime) {
      return { isDuplicate: true, response: cached.response, key };
    }

    if (cached) {
      this.cache.delete(key);
    }

    return { isDuplicate: false, key };
  }

  /**
   * Store response for deduplication
   */
  storeResponse(key, response, ttlMs = 60000) {
    this.cache.set(key, {
      response,
      expiryTime: Date.now() + ttlMs,
    });
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiryTime) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy deduplicator and clear interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Global instance
let globalDeduplicator = null;

export const getGlobalDeduplicator = () => {
  if (!globalDeduplicator) {
    globalDeduplicator = new RequestDeduplicator();
  }
  return globalDeduplicator;
};

/**
 * Middleware to prevent duplicate submissions
 * Usage: const dedup = checkDuplicateRequest(req, 'newsletter', req.body.email);
 *        if (dedup.isDuplicate) return res.status(200).json(dedup.response);
 */
export const checkDuplicateRequest = (req, requestType, identifier, ttlMs = 60000) => {
  const deduplicator = getGlobalDeduplicator();
  return deduplicator.checkDuplicate(requestType, identifier, ttlMs);
};

/**
 * Store response for future deduplication
 * Usage: storeDuplicateResponse(dedup.key, { ok: true, message: 'Success' });
 */
export const storeDuplicateResponse = (key, response, ttlMs = 60000) => {
  const deduplicator = getGlobalDeduplicator();
  deduplicator.storeResponse(key, response, ttlMs);
};
