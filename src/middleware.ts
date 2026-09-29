import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based product routing.
 *
 * One deployment serves three products. Which one a request may reach is
 * decided by the Host header, not by the path:
 *
 *   app host        → the client product (hub + the tools it links to)
 *   marketing hosts → the marketing site; the client product is not reachable,
 *                     and homeowner pages 308 to the homeowner host
 *   homeowner host  → untouched, exactly as today
 *   guide host      → the relocation-guide landing page only ("/" is the page)
 *   rebate host     → the new-construction rebate page only ("/" is the page)
 *
 * Hostnames come from the environment so they can differ per deployment:
 *
 *   APP_HOST         e.g. app.therolandteam.com
 *   MARKETING_HOSTS  comma-separated, e.g. rolandluxury.com,www.rolandluxury.com
 *   HOMEOWNER_HOST   e.g. home.therolandteam.com
 *   GUIDE_HOST       e.g. guide.therolandteam.com
 *   REBATE_HOST      e.g. rebate.therolandteam.com
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

/**
 * Homeowner-facing pages. On a marketing (rolandluxury.com) host these 308 to
 * the same path + query on the homeowner host, so an old or stray link can
 * never show a homeowner — or the team — a luxury-site URL for the homeowner
 * engine. API routes never reach middleware (see the matcher), so cron jobs,
 * webhooks and the estimator are never redirected.
 */
const HOMEOWNER_PAGES = ["/dashboard", "/embed", "/admin"];

/** https origin of the homeowner host: HOMEOWNER_HOST, else HOMEOWNER_BASE_URL. */
function homeownerOrigin(homeownerHost: string): string | null {
  if (homeownerHost) return `https://${homeownerHost}`;
  const raw = (process.env.HOMEOWNER_BASE_URL ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return null;
  }
}

/**
 * The relocation-guide landing page (linked from YouTube). On its own host the
 * root IS the page and nothing else is served, so the short link stays
 * guide.therolandteam.com with no path.
 */
const GUIDE_ROOT = "/guide";

/**
 * The new-construction rebate landing page (linked from the new-construction
 * video). Same idea as the guide host: "/" is the page, "/thank-you" and
 * "/terms" are its subpages, nothing else is served.
 */
const REBATE_ROOT = "/rebate";
const REBATE_SUBPAGES = ["/thank-you", "/terms"];

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
  const guideHost = (process.env.GUIDE_HOST ?? "").trim().toLowerCase();
  const rebateHost = (process.env.REBATE_HOST ?? "").trim().toLowerCase();

  // Strip any port so localhost:3000 and a bare hostname compare equal.
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;

  // The homeowner host keeps today's behaviour exactly.
  if (homeownerHost && host === homeownerHost) return NextResponse.next();

  if (guideHost && host === guideHost) {
    // "/" is the guide page and "/thank-you" its confirmation; the query
    // string (?s=, ?v=, ?first=) rides along on the rewrite.
    if (pathname === "/" || pathname === "/thank-you") {
      const url = req.nextUrl.clone();
      url.pathname = `${GUIDE_ROOT}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return startsWithPath(pathname, GUIDE_ROOT) ? NextResponse.next() : notFound(req);
  }

  if (rebateHost && host === rebateHost) {
    // "/" is the rebate page; "/thank-you" and "/terms" its subpages. The
    // query string (?s=, ?v=, ?first=) rides along on the rewrite. The long
    // "/rebate/..." paths the pages link to internally are served as-is.
    if (pathname === "/" || REBATE_SUBPAGES.includes(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = `${REBATE_ROOT}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return startsWithPath(pathname, REBATE_ROOT) ? NextResponse.next() : notFound(req);
  }

  if (marketingHosts.includes(host) && HOMEOWNER_PAGES.some((base) => startsWithPath(pathname, base))) {
    const origin = homeownerOrigin(homeownerHost);
    // Fail open: with no homeowner origin configured, serve as before.
    if (origin && new URL(origin).hostname !== host) {
      return NextResponse.redirect(new URL(`${pathname}${req.nextUrl.search}`, origin), 308);
    }
  }

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
