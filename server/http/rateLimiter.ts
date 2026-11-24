export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  maxTrackedKeys?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Lightweight, memory-bounded sliding-window rate limiter.
 * Evicts expired buckets and caps map cardinality to prevent memory exhaustion.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests, maxTrackedKeys = 1000 } = options;
  const buckets = new Map<string, number[]>();

  function pruneStale(now: number): void {
    const cutoff = now - windowMs;
    for (const [key, timestamps] of buckets) {
      const fresh = timestamps.filter((ts) => ts > cutoff);
      if (fresh.length === 0) {
        buckets.delete(key);
      } else {
        buckets.set(key, fresh);
      }
    }
  }

  return function checkLimit(key: string, now = Date.now()): RateLimitResult {
    const safeKey = key || 'unknown';
    const cutoff = now - windowMs;
    const current = (buckets.get(safeKey) ?? []).filter((ts) => ts > cutoff);

    if (current.length >= maxRequests) {
      const oldest = current[0] ?? now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      buckets.set(safeKey, current);
      return { allowed: false, retryAfterSeconds };
    }

    if (!buckets.has(safeKey) && buckets.size >= maxTrackedKeys) {
      pruneStale(now);
      if (buckets.size >= maxTrackedKeys) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) buckets.delete(oldestKey);
      }
    }

    current.push(now);
    buckets.set(safeKey, current);
    return { allowed: true, retryAfterSeconds: 0 };
  };
}
