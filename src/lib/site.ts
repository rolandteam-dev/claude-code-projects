/**
 * Central site configuration. Every SEO surface (metadata, sitemap,
 * JSON-LD, nav) reads from here so the site stays consistent as it grows.
 */

export const site = {
  name: "Roland Luxury",
  legalName: "Roland Luxury | LPT Realty",
  // Positioning line: the luxury division of the established Roland Team brand.
  parentBrand: "The Roland Team",
  tagline: "The Luxury Division of The Roland Team",
  url: "https://www.rolandluxury.com",
  locale: "en_US",
  // Contact
  phone: "(702) 793-2158",
  email: "mike@therolandteam.com",
  founder: "Mike Roland",
  brokerage: "LPT Realty",
  // Office NAP. Confirm the ZIP matches your Google Business Profile exactly.
  address: {
    streetAddress: "5860 S Pecos Rd",
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    postalCode: "89120",
    addressCountry: "US",
  },
  // Verifiable credibility stats (from The Roland Team's published profiles).
  stats: [
    { value: "Top 1%", label: "Las Vegas real estate team" },
    { value: "1,000+", label: "homes sold" },
    { value: "800+", label: "5-star reviews" },
    { value: "5.0★", label: "rating on Zillow" },
  ],
  foundedYear: 2015,
  teamSize: "22",
  aggregateRating: { ratingValue: 5, reviewCount: 800 },
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
  // Verified profile URLs — prime AI/Google trust signals.
  sameAs: [
    "https://www.zillow.com/profile/MikeSRoland",
    "https://www.yelp.com/biz/the-roland-team-lpt-realty-las-vegas",
    "https://www.instagram.com/therolandteam/",
    // Add your Google Business Profile + Realtor.com/Homes.com URLs when handy.
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
        { label: "Moving to Las Vegas", href: "/moving-to-las-vegas" },
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
        { label: "55+ / Active Adult", href: "/active-adult-communities-las-vegas" },
        { label: "Golf Communities", href: "/golf-communities-las-vegas" },
        { label: "Henderson", href: "/areas/henderson" },
        { label: "Las Vegas", href: "/areas/las-vegas" },
        { label: "North Las Vegas", href: "/areas/north-las-vegas" },
        { label: "Boulder City", href: "/areas/boulder-city" },
      ],
    },
    {
      label: "About Us",
      href: "/about",
      children: [
        { label: "About The Team", href: "/about" },
        { label: "Why Roland Luxury", href: "/why-the-roland-team" },
        { label: "Reviews", href: "/testimonials" },
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
