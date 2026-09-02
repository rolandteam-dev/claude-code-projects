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
  founderPhoto: site.founderPhoto,
  phone: site.phone,
  email: site.email,
  brokerage: site.brokerage,
  /**
   * Public origin these pages are served from. Set HOMEOWNER_BASE_URL in the
   * environment to the therolandteam.com subdomain once DNS points at this app
   * (e.g. https://home.therolandteam.com); used to build absolute links in
   * emails. Falls back to a relative path on-page where the origin isn't known.
   */
  baseUrl: process.env.HOMEOWNER_BASE_URL || "https://home.therolandteam.com",
} as const;

export function dashboardUrl(token: string): string {
  return `${homeownerBrand.baseUrl.replace(/\/$/, "")}/dashboard/${token}`;
}
