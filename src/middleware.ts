import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based product routing.
 *
 * One deployment serves three products. Which one a request may reach is
 * decided by the Host header, not by the path:
 *
 *   app host        → the client product (hub + the tools it links to)
 *   marketing hosts → the marketing site; the client product is not reachable
 *   homeowner host  → untouched, exactly as today
 *
 * Hostnames come from the environment so they can differ per deployment:
 *
 *   APP_HOST         e.g. app.therolandteam.com
 *   MARKETING_HOSTS  comma-separated, e.g. rolandluxury.com,www.rolandluxury.com
 *   HOMEOWNER_HOST   e.g. home.therolandteam.com
 *
 * FAIL-OPEN BY DESIGN: an unrecognised host — a preview deployment, localhost,
 * or any hostname not named in those variables — gets the whole app, exactly as
 * it behaves today. With none of the variables set, this middleware is a no-op.
 * That keeps previews working and makes a bad env value degrade to "everything
 * is reachable" rather than "the site 404s".
 */

/** The client product itself. */
const PRODUCT_ROOT = "/portal";

/**
 * Marketing routes the client product genuinely needs: every outbound link the
 * hub and its journey steps still point at. Keep this in step with the hrefs in
 * src/content/portal.ts and src/components/portal/ — a link to a route missing
 * here 404s on the app host.
 */
const PRODUCT_TOOLS = [
  "/listings",
  "/home-value",
  "/mortgage-pre-approval",
  "/down-payment-assistance",
  "/contact",
];

/** Internal + per-recipient routes: reachable on every host, unchanged. */
const ALWAYS_ALLOWED = ["/admin", "/dashboard"];

function hostsFrom(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function startsWithPath(pathname: string, base: string): boolean {
  // "/listings" matches "/listings" and "/listings/123", not "/listings-foo".
  return pathname === base || pathname.startsWith(`${base}/`);
}

function notFound(req: NextRequest): NextResponse {
  // Rewrite rather than redirect: the URL stays put and the app's own 404 page
  // renders, so a blocked route is indistinguishable from one that never existed.
  return NextResponse.rewrite(new URL("/_not-found", req.url), { status: 404 });
}

export function middleware(req: NextRequest) {
  const appHost = (process.env.APP_HOST ?? "").trim().toLowerCase();
  const marketingHosts = hostsFrom(process.env.MARKETING_HOSTS);
  const homeownerHost = (process.env.HOMEOWNER_HOST ?? "").trim().toLowerCase();

  // Strip any port so localhost:3000 and a bare hostname compare equal.
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;

  // The homeowner host keeps today's behaviour exactly.
  if (homeownerHost && host === homeownerHost) return NextResponse.next();

  if (ALWAYS_ALLOWED.some((base) => startsWithPath(pathname, base))) {
    return NextResponse.next();
  }

  if (appHost && host === appHost) {
    // The product owns the root of its own hostname.
    if (pathname === "/") {
      return NextResponse.rewrite(new URL(PRODUCT_ROOT, req.url));
    }
    const allowed =
      startsWithPath(pathname, PRODUCT_ROOT) ||
      PRODUCT_TOOLS.some((base) => startsWithPath(pathname, base));
    return allowed ? NextResponse.next() : notFound(req);
  }

  if (marketingHosts.includes(host)) {
    // The client product is not reachable from the marketing site at all.
    return startsWithPath(pathname, PRODUCT_ROOT) ? notFound(req) : NextResponse.next();
  }

  // Unknown host (preview, localhost, anything unconfigured): serve everything.
  return NextResponse.next();
}

export const config = {
  /**
   * Everything except API routes, Next's build output, and files with an
   * extension (favicon, images, robots.txt, sitemap.xml). Those pass through
   * untouched on every hostname.
   */
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
