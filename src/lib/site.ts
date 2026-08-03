/**
 * Central site configuration. Every SEO surface (metadata, sitemap,
 * JSON-LD, nav) reads from here so the site stays consistent as it grows.
 */

export const site = {
  name: "The Roland Team",
  legalName: "The Roland Team | LPT Realty",
  tagline: "Luxury Las Vegas & Henderson Real Estate",
  // Update to the production domain before launch (currently a placeholder).
  url: "https://www.therolandteam.com",
  locale: "en_US",
  // Contact — replace with real values before launch.
  phone: "+1-702-555-0100",
  email: "info@therolandteam.com",
  areaServed: ["Las Vegas", "Henderson", "Summerlin", "Boulder City", "Clark County"],
  sameAs: [
    "https://www.facebook.com/therolandteam",
    "https://www.instagram.com/therolandteam",
    "https://www.youtube.com/@therolandteam",
    "https://www.linkedin.com/company/therolandteam",
  ],
  nav: [
    { label: "Communities", href: "/communities" },
    { label: "Buyer Guides", href: "/guides" },
    { label: "Sell", href: "/sell" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
  ],
  cta: { label: "Contact The Team", href: "/contact" },
} as const;

export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${clean === "/" ? "" : clean}`;
}
