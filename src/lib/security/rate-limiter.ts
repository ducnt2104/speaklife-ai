/**
 * SpeakLife AI — Sliding Window In-Memory Rate Limiter
 * Enforces per-endpoint limits on Render Free tier without external Redis dependency.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private storage: Map<string, RateLimitRecord> = new Map();

  /**
   * Checks whether a given identifier has exceeded maxRequests in windowSeconds.
   * @param key unique identifier (e.g., IP + endpoint)
   * @param maxRequests maximum allowed hits
   * @param windowSeconds time window in seconds
   * @returns { allowed: boolean; remaining: number; resetSec: number }
   */
  public check(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): { allowed: boolean; remaining: number; resetSec: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let record = this.storage.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.storage.set(key, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetSec = Math.ceil((oldest + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetSec };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      resetSec: windowSeconds,
    };
  }

  /**
   * Periodic garbage collection to prevent memory bloat on Render.
   */
  public cleanup(maxAgeMs: number = 3600000) {
    const now = Date.now();
    for (const [key, record] of this.storage.entries()) {
      if (record.timestamps.length === 0 || record.timestamps[record.timestamps.length - 1] < now - maxAgeMs) {
        this.storage.delete(key);
      }
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter();

// Scheduled cleanup every 15 minutes with unref() to prevent keeping Node event loop alive during build
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => rateLimiter.cleanup(), 15 * 60 * 1000);
  if (typeof (cleanupTimer as any).unref === "function") {
    (cleanupTimer as any).unref();
  }
}

