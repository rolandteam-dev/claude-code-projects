import type { NextConfig } from "next";

/**
 * The marketing site moved from rolandluxury.com to www.therolandteam.com.
 * These hosts 308 to the new origin, keeping the path and query string.
 */
const LEGACY_MARKETING_HOSTS = ["rolandluxury.com", "www.rolandluxury.com"];
const MARKETING_ORIGIN = "https://www.therolandteam.com";

/**
 * Paths the host redirect must NOT touch. `redirects` in next.config.ts runs
 * BEFORE src/middleware.ts, so a blanket rule would pre-empt it:
 *
 *   /dashboard, /embed, /admin → middleware already 308s these to the homeowner
 *                                host when MARKETING_HOSTS is set. Redirecting
 *                                them here would land homeowners on the
 *                                marketing site instead.
 *   /api                       → crons, webhooks and the estimator. Senders do
 *                                not reliably follow redirects (POST webhooks),
 *                                and middleware never redirects API routes.
 *
 * Each entry matches the segment itself or anything beneath it, not look-alikes
 * such as /administrators.
 */
const EXEMPT_PATHS = ["api", "dashboard", "embed", "admin"];
const NOT_EXEMPT = EXEMPT_PATHS.map((p) => `${p}(?:/|$)`).join("|");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
      { protocol: "https", hostname: "cdn.repliers.io" },
    ],
  },
  async redirects() {
    return LEGACY_MARKETING_HOSTS.map((host) => ({
      // Matches "/" and every other path except the exempt ones above.
      source: `/:path((?!${NOT_EXEMPT}).*)`,
      has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
      destination: `${MARKETING_ORIGIN}/:path`,
      permanent: true,
    }));
  },
};

export default nextConfig;
