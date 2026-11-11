import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const BUCKET_POLICIES: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 attempts per minute
  adminAuth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 attempts per minute
  totp: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 minutes
  checkout: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 checkouts per minute
  upload: { maxRequests: 15, windowMs: 5 * 60 * 1000 }, // 15 uploads per 5 minutes
  visualSearch: { maxRequests: 25, windowMs: 5 * 60 * 1000 }, // 25 searches per 5 minutes
  api: { maxRequests: 120, windowMs: 60 * 1000 }, // 120 general requests per minute
};

// In-memory sliding window store: bucket -> key -> timestamp array
const rateLimitStore = new Map<string, Map<string, number[]>>();

/**
 * Extracts client IP from incoming Next.js Request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Checks whether an incoming request exceeds the configured rate limit
 */
export function checkRateLimit(
  bucketName: keyof typeof BUCKET_POLICIES | string,
  key: string,
  customPolicy?: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const policy = customPolicy || BUCKET_POLICIES[bucketName] || BUCKET_POLICIES.api;
  const now = Date.now();

  if (!rateLimitStore.has(bucketName)) {
    rateLimitStore.set(bucketName, new Map());
  }

  const bucket = rateLimitStore.get(bucketName)!;
  const timestamps = bucket.get(key) || [];

  // Evict timestamps outside current window
  const validTimestamps = timestamps.filter((t) => now - t < policy.windowMs);

  if (validTimestamps.length >= policy.maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfterSec = Math.ceil(
      (oldestTimestamp + policy.windowMs - now) / 1000
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  validTimestamps.push(now);
  bucket.set(key, validTimestamps);

  return {
    allowed: true,
    remaining: policy.maxRequests - validTimestamps.length,
    retryAfterSec: 0,
  };
}

/**
 * Convenience helper to enforce rate limit on an API route.
 * Returns null if allowed, or a 429 NextResponse if throttled.
 */
export function enforceRateLimit(
  req: Request,
  bucketName: string,
  customKey?: string,
  customPolicy?: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(req);
  const key = customKey ? `${ip}:${customKey}` : ip;
  const result = checkRateLimit(bucketName, key, customPolicy);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many requests. Please wait ${result.retryAfterSec} seconds before trying again.`,
        retryAfter: result.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
