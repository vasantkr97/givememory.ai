import type { Request, RequestHandler } from "express";

type RateLimitOptions = {
  keyPrefix: string;
  windowMs: number;
  max: number;
  keyGenerator?: (request: Request) => string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (request, response, next) => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${options.keyGenerator?.(request) ?? defaultKey(request)}`;
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);
    cleanupExpiredBuckets(buckets, now);

    const remaining = Math.max(0, options.max - bucket.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    response.setHeader("RateLimit-Limit", String(options.max));
    response.setHeader("RateLimit-Remaining", String(remaining));
    response.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > options.max) {
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({
        error: "RateLimitExceeded",
        message: "Too many requests. Please try again later."
      });
      return;
    }

    next();
  };
}

function defaultKey(request: Request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function cleanupExpiredBuckets(buckets: Map<string, Bucket>, now: number) {
  if (buckets.size < 10_000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
