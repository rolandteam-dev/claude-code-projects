/**
 * Hero background imagery (AI-generated, luxury desert real estate).
 * Served via next/image optimization from the Higgsfield CDN.
 * NOTE: these are aspirational backgrounds — NOT photos of specific real
 * listings or the exact named communities. Swap for real photography when
 * available. Heroes keep a graphite fallback so they look right even if an
 * image fails to load.
 */
const BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_3H5zrMXWk643Nzx2pR0XgLxvYxu";
const P = "hf_20260804_181905_";

export const heroImages = {
  home: `${BASE}/${P}9dfefe13-3c28-434e-8ee3-7ebe33637c2c.png`,
  luxuryEstate: `${BASE}/${P}97f8f2b0-5e12-4c47-a905-e5e07bfd211f.png`,
  redRock: `${BASE}/${P}9b9d36b0-253d-48eb-9790-6541fb265fb1.png`,
  henderson: `${BASE}/${P}9267fd92-1824-47a8-af6a-54c9f532a21c.png`,
  lake: `${BASE}/${P}bc502e1a-49a4-45a7-b690-45cd5e078e68.png`,
  newConstruction: `${BASE}/${P}3b7cc967-b1f6-409d-a327-06b85f8c7220.png`,
  golf: `${BASE}/${P}d5d25cbc-7000-40f3-8d9f-46c85907a6cf.png`,
  estate: `${BASE}/${P}62683b9d-ddbc-4606-a8aa-e0ac75caeb58.png`,
} as const;

const communityHeroMap: Record<string, keyof typeof heroImages> = {
  "lake-las-vegas": "lake",
  "the-ridges-summerlin": "redRock",
  summerlin: "redRock",
  "sun-city-summerlin": "redRock",
  "red-rock-country-club": "golf",
  "southern-highlands": "golf",
  "rhodes-ranch": "golf",
  anthem: "golf",
  "skye-canyon": "newConstruction",
  cadence: "newConstruction",
  inspirada: "newConstruction",
  "mountains-edge": "newConstruction",
  providence: "newConstruction",
  "centennial-hills": "henderson",
  aliante: "golf",
  tuscany: "golf",
  "silverado-ranch": "estate",
  "spring-valley": "home",
};

export function communityHero(slug: string): string {
  return heroImages[communityHeroMap[slug] ?? "luxuryEstate"];
}

const areaHeroMap: Record<string, keyof typeof heroImages> = {
  henderson: "henderson",
  "las-vegas": "redRock",
  "boulder-city": "estate",
};

export function areaHero(slug: string): string {
  return heroImages[areaHeroMap[slug] ?? "home"];
}
