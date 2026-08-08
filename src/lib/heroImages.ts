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
// Second batch — community-specific heroes generated per-neighborhood so the
// featured communities each get a distinct, thematically-matched image.
const P2 = "hf_20260808_200423_";
const P2B = "hf_20260808_201950_";

export const heroImages = {
  // Original shared backgrounds (home, section, and area pages).
  home: `${BASE}/${P}9dfefe13-3c28-434e-8ee3-7ebe33637c2c.png`,
  luxuryEstate: `${BASE}/${P}97f8f2b0-5e12-4c47-a905-e5e07bfd211f.png`,
  redRock: `${BASE}/${P}9b9d36b0-253d-48eb-9790-6541fb265fb1.png`,
  henderson: `${BASE}/${P}9267fd92-1824-47a8-af6a-54c9f532a21c.png`,
  lake: `${BASE}/${P}bc502e1a-49a4-45a7-b690-45cd5e078e68.png`,
  newConstruction: `${BASE}/${P}3b7cc967-b1f6-409d-a327-06b85f8c7220.png`,
  golf: `${BASE}/${P}d5d25cbc-7000-40f3-8d9f-46c85907a6cf.png`,
  estate: `${BASE}/${P}62683b9d-ddbc-4606-a8aa-e0ac75caeb58.png`,

  // Community-specific heroes (batch 2) — each captures a distinct setting.
  ascayaEstate: `${BASE}/${P2}2ca9b205-ba2b-4135-9520-a82c12920795.png`, // modern glass estate on Black Mountain over the Strip
  dragonridgeGolf: `${BASE}/${P2}de28cf76-9da0-4022-95d6-b743d1a25cd3.png`, // custom estate above a country-club fairway
  mediterraneanGated: `${BASE}/${P2B}b4173b97-dc61-4461-98fa-d2f3445377d9.png`, // gated Mediterranean w/ mature palms
  ridgesModern: `${BASE}/${P2}7883cf96-2eaf-44d2-969b-3e60f1728bb7.png`, // desert-contemporary against Red Rock cliffs
  lakeVilla: `${BASE}/${P2}4259d639-3596-4760-91cb-a98c8ab2f4b9.png`, // Mediterranean waterfront villa on a lake
  summerlinAerial: `${BASE}/${P2}173498a1-059c-490f-853b-664cbb94c3be.png`, // aerial master-plan, tree-lined streets, Red Rock horizon
  anthemHillside: `${BASE}/${P2}4ee7169b-4ba4-4bc9-b208-44ea2a7a025d.png`, // hillside home above a golf course, valley views
  gatedGolfEstate: `${BASE}/${P2}b07fa267-f262-44ef-a11c-75f77c18ebfb.png`, // grand guard-gated golf estate w/ porte-cochere
  modernNewBuild: `${BASE}/${P2}17e7307e-35a8-4d88-b660-0c4cd6370e42.png`, // modern new-construction neighborhood + park
  establishedSuburb: `${BASE}/${P2}14a597af-b3a7-4547-b81c-f4f9cbbc8600.png`, // established leafy suburban neighborhood
} as const;

// Each community maps to a hero image. Featured communities get a unique,
// thematically-matched image from the community-specific batch; the rest are
// distributed across the full library so no two adjacent cards on the
// /communities index collide.
const communityHeroMap: Record<string, keyof typeof heroImages> = {
  // Featured — each distinct and matched to the community's character
  ascaya: "ascayaEstate",
  "macdonald-highlands": "dragonridgeGolf",
  "seven-hills": "mediterraneanGated",
  "the-ridges-summerlin": "ridgesModern",
  "lake-las-vegas": "lakeVilla",
  summerlin: "summerlinAerial",
  "the-summit-club": "gatedGolfEstate",
  // Remaining communities — matched where natural, otherwise distributed
  anthem: "anthemHillside",
  "southern-highlands": "golf",
  inspirada: "modernNewBuild",
  "green-valley": "establishedSuburb",
  "boulder-city": "estate",
  "red-rock-country-club": "redRock",
  "sun-city-summerlin": "henderson",
  "mountains-edge": "luxuryEstate",
  "skye-canyon": "newConstruction",
  cadence: "modernNewBuild",
  "rhodes-ranch": "dragonridgeGolf",
  providence: "home",
  "centennial-hills": "establishedSuburb",
  aliante: "golf",
  tuscany: "mediterraneanGated",
  "silverado-ranch": "henderson",
  "spring-valley": "newConstruction",
  "solera-at-anthem": "anthemHillside",
  "sun-city-aliante": "estate",
  queensridge: "luxuryEstate",
  "the-lakes": "lake",
  "roma-hills": "mediterraneanGated",
  "peccole-ranch": "establishedSuburb",
};

export function communityHero(slug: string): string {
  return heroImages[communityHeroMap[slug] ?? "luxuryEstate"];
}

const areaHeroMap: Record<string, keyof typeof heroImages> = {
  henderson: "henderson",
  "las-vegas": "redRock",
  "boulder-city": "estate",
  "north-las-vegas": "golf",
};

export function areaHero(slug: string): string {
  return heroImages[areaHeroMap[slug] ?? "home"];
}
