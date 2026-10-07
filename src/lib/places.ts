/**
 * Server-side Google Places (New) helpers. The key is read here and never sent
 * to the browser — the estimator talks to our /api/places/* proxy routes, not
 * Google directly. Reuses GOOGLE_PLACES_API_KEY (the server-side, un-referrer-
 * restricted key already used for reviews); that key must have "Places API
 * (New)" enabled for Autocomplete, in addition to the legacy "Places API".
 */

/** Server-side Places key (no referrer restriction). Falls back to the Maps key. */
export function placesKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
}

/** Bias autocomplete toward the Las Vegas valley (Clark County). */
export const CLARK_COUNTY = { latitude: 36.08, longitude: -115.17, radiusMeters: 60000 };

/** First client IP from the proxy headers (best-effort). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Minimal fixed-window per-key rate limit. In-memory, so it resets on a cold
 * start and isn't shared across instances — enough to blunt abuse of the proxy,
 * not a hard quota. Returns true when the call is allowed.
 */
const g = globalThis as unknown as { __rl?: Map<string, { count: number; resetAt: number }> };
const buckets = g.__rl ?? (g.__rl = new Map());

export function rateLimit(key: string, max = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}
