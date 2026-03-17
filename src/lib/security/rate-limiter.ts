/** In-memory rate limiter (use Redis in production for multi-instance) */
const rateMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
};

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { windowMs, maxRequests } = { ...DEFAULTS, ...config };
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/** Stricter limits for auth endpoints */
export const AUTH_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 10 };
export const API_RATE_LIMIT = { windowMs: 60 * 1000, maxRequests: 60 };
export const WEBHOOK_RATE_LIMIT = { windowMs: 60 * 1000, maxRequests: 200 };

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap.entries()) {
      if (now > entry.resetAt) rateMap.delete(key);
    }
  }, 5 * 60 * 1000);
}
