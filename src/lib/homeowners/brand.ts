/**
 * Branding for the homeowner experience (dashboards + value emails). This is
 * the Roland Team brand, shared with the marketing site —
 * the homeowner engine is aimed at the full database, not just luxury buyers.
 * Contact details are shared with the marketing site config; the name,
 * positioning, and public base URL differ.
 */
import { site } from "@/lib/site";

/**
 * Resolve the public origin for homeowner links. Uses HOMEOWNER_BASE_URL when
 * it's set to a real https origin, otherwise the main site origin. Defensive on
 * purpose: a blank/whitespace value, or one that isn't a valid absolute URL,
 * falls back to site.url so links can never point at a dead host.
 */
function resolveBaseUrl(): string {
  const raw = (process.env.HOMEOWNER_BASE_URL ?? "").trim();
  if (!raw) return site.url;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return site.url;
    return u.origin;
  } catch {
    return site.url;
  }
}

export const homeownerBrand = {
  name: "The Roland Team",
  legalName: "The Roland Team | LPT Realty",
  founder: site.founder,
  founderPhoto: site.founderPhoto,
  /**
   * The Roland Team's main line. NOT site.phone — that is the rolandluxury.com
   * tracking number and must stay on the luxury site. Every homeowner email,
   * dashboard, unsubscribe page and client-portal card reads this.
   * HOMEOWNER_PHONE overrides it (e.g. a dedicated call-tracking number for the
   * email channel) without a code change.
   */
  phone: (process.env.HOMEOWNER_PHONE ?? "").trim() || "(702) 830-9366",
  email: site.email,
  brokerage: site.brokerage,
  /**
   * Public origin these pages are served from — used to build absolute links in
   * dashboards and emails. Defaults to the main site origin (dashboards already
   * live at /dashboard/<token> there and it always resolves).
   *
   * To move dashboards to a dedicated subdomain (e.g. home.therolandteam.com):
   * add that domain in Vercel + a CNAME in DNS, confirm it loads, and ONLY THEN
   * set HOMEOWNER_BASE_URL to it. The env var is read here via resolveBaseUrl()
   * — so the switch happens the moment the domain is live, with no code change,
   * and an unset/blank value can never point links at a dead host.
   */
  baseUrl: resolveBaseUrl(),
  /**
   * Physical postal address printed in every homeowner email footer. CAN-SPAM
   * requires a valid physical postal address in each commercial email; a brand
   * name alone ("The Roland Team | LPT Realty") does not satisfy it.
   * HOMEOWNER_POSTAL_ADDRESS overrides the default without a code change.
   */
  postalAddress:
    (process.env.HOMEOWNER_POSTAL_ADDRESS ?? "").trim() ||
    `${site.address.streetAddress}, Unit 300, ${site.address.addressLocality}, ${site.address.addressRegion} ${site.address.postalCode}`,
} as const;

export function dashboardUrl(token: string): string {
  return `${homeownerBrand.baseUrl.replace(/\/$/, "")}/dashboard/${token}`;
}
