import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Best-effort caller IP for rate limiting. Vercel sets x-forwarded-for on
// every request; this is not spoof-proof against a determined attacker
// behind the same edge, but it's enough to blunt casual scripted abuse.
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Lightweight in-memory rate limiter, keyed per serverless instance. This is
 * intentionally simple — not a substitute for a distributed limiter like
 * Upstash — but it raises the bar against scripted abuse of public,
 * unauthenticated notify- and send-welcome-email endpoints without adding a new
 * infra dependency. It complements (doesn't replace) the DB-level per-user
 * rate-limit trigger on prayer_requests/testimonies/praise_reports, which
 * catches authenticated abuse even across serverless instances.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  if (buckets.size > 5000) prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}
