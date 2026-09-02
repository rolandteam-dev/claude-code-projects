/**
 * Branding for the homeowner experience (dashboards + value emails). This is
 * the main Roland Team brand, distinct from the Roland Luxury marketing site —
 * the homeowner engine is aimed at the full database, not just luxury buyers.
 * Contact details are shared with the marketing site config; the name,
 * positioning, and public base URL differ.
 */
import { site } from "@/lib/site";

export const homeownerBrand = {
  name: "The Roland Team",
  legalName: "The Roland Team | LPT Realty",
  founder: site.founder,
  phone: site.phone,
  email: site.email,
  brokerage: site.brokerage,
  /**
   * Public origin these pages are served from — used to build absolute links in
   * emails. Defaults to the main site origin (dashboards already live at
   * /dashboard/<token> there), so no subdomain is required. Set
   * HOMEOWNER_BASE_URL to a dedicated subdomain (e.g. https://home.therolandteam.com)
   * later if desired — no code change needed.
   */
  baseUrl: process.env.HOMEOWNER_BASE_URL || site.url,
} as const;

export function dashboardUrl(token: string): string {
  return `${homeownerBrand.baseUrl.replace(/\/$/, "")}/dashboard/${token}`;
}
