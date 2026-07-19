interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  api: { maxRequests: 60, windowMs: 60_000 } as RateLimitConfig,
  write: { maxRequests: 30, windowMs: 60_000 } as RateLimitConfig,
  export: { maxRequests: 3, windowMs: 60_000 } as RateLimitConfig,
} as const;

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfter: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfter: 0 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, retryAfter: 0 };
}

export function rateLimitHeaders(
  config: RateLimitConfig,
  remaining: number,
  retryAfter: number
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
  };
  if (retryAfter > 0) {
    headers["Retry-After"] = String(retryAfter);
  }
  return headers;
}
