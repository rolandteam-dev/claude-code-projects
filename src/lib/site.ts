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
  // Contact
  phone: "(702) 793-2158",
  email: "mike@therolandteam.com",
  founder: "Mike Roland",
  brokerage: "LPT Realty",
  // City-level location (accurate). Add the real office street address in
  // `address.streetAddress` once confirmed — needed for strongest local SEO.
  address: {
    streetAddress: "", // TODO: add real office street address
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    postalCode: "",
    addressCountry: "US",
  },
  areaServed: ["Las Vegas", "Henderson", "Summerlin", "North Las Vegas", "Boulder City", "Clark County"],
  // Entity topics — reinforces what the brand is known for (for AI + Google).
  knowsAbout: [
    "Las Vegas luxury real estate",
    "Henderson guard-gated communities",
    "Summerlin homes for sale",
    "Ascaya and MacDonald Highlands luxury estates",
    "new construction homes in Las Vegas",
    "selling a home in Las Vegas",
    "relocating to Las Vegas",
    "home valuation",
  ],
  // Add your real profile URLs — these are prime AI/Google trust signals.
  sameAs: [
    "https://www.facebook.com/therolandteam",
    "https://www.instagram.com/therolandteam",
    "https://www.youtube.com/@therolandteam",
    "https://www.linkedin.com/company/therolandteam",
    // TODO: add real profile URLs when available:
    // Google Business Profile, Zillow, Realtor.com, Homes.com, Yelp
  ],
  nav: [
    {
      label: "Buy a Home",
      href: "/buy",
      children: [
        { label: "Search Homes for Sale", href: "/listings" },
        { label: "Luxury Real Estate", href: "/las-vegas-luxury-real-estate" },
        { label: "Communities", href: "/communities" },
        { label: "Areas We Serve", href: "/areas" },
        { label: "Buyer Guides", href: "/guides" },
        { label: "First-Time Buyers", href: "/guides/first-time-home-buyer-las-vegas" },
        { label: "Market Report", href: "/market-report" },
      ],
    },
    {
      label: "Sell a Home",
      href: "/sell",
      children: [
        { label: "What's My Home Worth?", href: "/home-value" },
        { label: "Selling Guide", href: "/guides/selling-your-home-in-las-vegas" },
        { label: "Seller Net Proceeds", href: "/blog/las-vegas-luxury-seller-net-proceeds" },
        { label: "Market Report", href: "/market-report" },
      ],
    },
    { label: "New Construction", href: "/new-construction" },
    {
      label: "Communities",
      href: "/communities",
      children: [
        { label: "All Communities", href: "/communities" },
        { label: "Luxury Real Estate", href: "/las-vegas-luxury-real-estate" },
        { label: "Guard-Gated Communities", href: "/guard-gated-communities-las-vegas" },
        { label: "Henderson", href: "/areas/henderson" },
        { label: "Las Vegas", href: "/areas/las-vegas" },
        { label: "Boulder City", href: "/areas/boulder-city" },
      ],
    },
    {
      label: "About Us",
      href: "/about",
      children: [
        { label: "About The Team", href: "/about" },
        { label: "Testimonials", href: "/testimonials" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      label: "Blog",
      href: "/blog",
      children: [
        { label: "All Posts", href: "/blog" },
        { label: "New Construction", href: "/blog?category=New+Construction" },
        { label: "Market Updates", href: "/blog?category=Market+Updates" },
        { label: "Buying Guides", href: "/blog?category=Buying+Guides" },
        { label: "Selling Guides", href: "/blog?category=Selling+Guides" },
      ],
    },
  ],
  cta: { label: "Contact The Team", href: "/contact" },
} as const;

export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${clean === "/" ? "" : clean}`;
}
