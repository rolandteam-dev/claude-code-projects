/**
 * 301-style (308) redirects from the old AgentLoft site's URLs to their
 * equivalents in this app. therolandteam.com was served by AgentLoft before the
 * move, so these paths are already indexed and linked to.
 *
 * Rules for this list:
 *  - Only map a page to a CLOSE equivalent. Google treats a redirect to an
 *    unrelated page as a soft 404, which is worse than an honest 404 that can
 *    be fixed later. Anything without a real equivalent is listed in
 *    docs/legacy-url-map.md as a gap instead of being mapped here.
 *  - Paths that already exist unchanged here (/about, /contact, /home-value,
 *    /mortgage-pre-approval, /down-payment-assistance, /communities, /blog,
 *    /why-the-roland-team, /guard-gated-communities-las-vegas,
 *    /golf-communities-las-vegas) need no entry.
 *  - This list came from the old site's navigation only. It is NOT a full
 *    sitemap export; extend it from the AgentLoft sitemap / Search Console.
 *
 * Imported by next.config.ts, so keep it dependency-free and use relative
 * imports only (no "@/" alias).
 */

export type LegacyRedirect = { source: string; destination: string };

/** Old community page slug (AgentLoft) → community slug in src/content/communities.ts. */
const COMMUNITY_PAGES: Array<[string, string]> = [
  ["summerlin-real-estate", "summerlin"],
  ["the-ridges-summerlin-real-estate", "the-ridges-summerlin"],
  ["reverence-summerlin-real-estate", "reverence"],
  ["red-rock-country-club-real-estate", "red-rock-country-club"],
  ["the-summit-club-real-estate", "the-summit-club"],
  ["sun-city-summerlin-real-estate", "sun-city-summerlin"],
  ["queensridge-real-estate", "queensridge"],
  ["skye-canyon-real-estate", "skye-canyon"],
  ["mountains-edge-real-estate", "mountains-edge"],
  ["southern-highlands-real-estate", "southern-highlands"],
  ["providence-real-estate", "providence"],
  ["rhodes-ranch-real-estate", "rhodes-ranch"],
  ["centennial-hills-real-estate", "centennial-hills"],
  ["green-valley-henderson-real-estate", "green-valley"],
  ["anthem-henderson-real-estate", "anthem"],
  ["sun-city-anthem-henderson-real-estate", "sun-city-anthem"],
  ["seven-hills-real-estate", "seven-hills"],
  ["macdonald-highlands-real-estate", "macdonald-highlands"],
  ["ascaya", "ascaya"],
  ["lake-las-vegas-real-estate", "lake-las-vegas"],
  ["cadence-henderson-real-estate", "cadence"],
  ["inspirada-real-estate", "inspirada"],
  ["aliante-real-estate", "aliante"],
  ["roma-hills-henderson-real-estate", "roma-hills"],
];

/** Everything else with a clear, close equivalent. */
const PAGES: Array<[string, string]> = [
  // City hubs → /areas
  ["/las-vegas-real-estate", "/areas/las-vegas"],
  ["/north-las-vegas-real-estate", "/areas/north-las-vegas"],
  ["/henderson-nv-real-estate", "/areas/henderson"],
  ["/boulder-city-real-estate", "/areas/boulder-city"],
  ["/cities", "/areas"],
  // Core pages
  ["/homes", "/listings"],
  ["/sell-your-home-las-vegas", "/sell"],
  ["/cash-offer-las-vegas", "/cash-offer"],
  ["/luxury-estates-las-vegas", "/las-vegas-luxury-real-estate"],
  ["/reviews", "/testimonials"],
  ["/payment-calculator", "/calculators"],
  // Buyer pages
  ["/first-time-home-buyers-las-vegas", "/guides/first-time-home-buyer-las-vegas"],
  // Judgement call: out-of-state buyers are relocation buyers.
  ["/out-of-state-buyers-las-vegas", "/moving-to-las-vegas"],
];

export const legacyRedirects: LegacyRedirect[] = [
  ...COMMUNITY_PAGES.map(([from, slug]) => ({
    source: `/${from}`,
    destination: `/communities/${slug}`,
  })),
  ...PAGES.map(([source, destination]) => ({ source, destination })),
];
