/**
 * Hero background imagery (AI-generated, luxury desert real estate).
 * Served via next/image optimization from the Higgsfield CDN.
 * NOTE: these are aspirational backgrounds — NOT photos of specific real
 * listings or the exact named communities. Swap for real photography when
 * available. Heroes keep a graphite fallback so they look right even if an
 * image fails to load.
 */
const BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_3H5zrMXWk643Nzx2pR0XgLxvYxu";
const img = (file: string) => `${BASE}/${file}`;

/**
 * Shared generic backgrounds used by the home page, section/landing pages,
 * and the area/city hubs (see areaHeroMap below). Community pages do NOT use
 * these — every community has its own dedicated image in communityImages.
 */
export const heroImages = {
  home: img("hf_20260804_181905_9dfefe13-3c28-434e-8ee3-7ebe33637c2c.png"),
  luxuryEstate: img("hf_20260804_181905_97f8f2b0-5e12-4c47-a905-e5e07bfd211f.png"),
  redRock: img("hf_20260804_181905_9b9d36b0-253d-48eb-9790-6541fb265fb1.png"),
  henderson: img("hf_20260804_181905_9267fd92-1824-47a8-af6a-54c9f532a21c.png"),
  lake: img("hf_20260804_181905_bc502e1a-49a4-45a7-b690-45cd5e078e68.png"),
  newConstruction: img("hf_20260804_181905_3b7cc967-b1f6-409d-a327-06b85f8c7220.png"),
  golf: img("hf_20260804_181905_d5d25cbc-7000-40f3-8d9f-46c85907a6cf.png"),
  estate: img("hf_20260804_181905_62683b9d-ddbc-4606-a8aa-e0ac75caeb58.png"),
} as const;

/**
 * One dedicated, thematically-matched hero image per community — so no two
 * community pages/cards ever share a photo. Add a matching entry here whenever
 * a new community is added to src/content/communities.ts.
 */
const communityImages: Record<string, string> = {
  // Featured luxury communities
  ascaya: img("hf_20260808_200423_2ca9b205-ba2b-4135-9520-a82c12920795.png"),
  "macdonald-highlands": img("hf_20260808_200423_de28cf76-9da0-4022-95d6-b743d1a25cd3.png"),
  "seven-hills": img("hf_20260808_201950_b4173b97-dc61-4461-98fa-d2f3445377d9.png"),
  "the-ridges-summerlin": img("hf_20260808_200423_7883cf96-2eaf-44d2-969b-3e60f1728bb7.png"),
  "lake-las-vegas": img("hf_20260808_200423_4259d639-3596-4760-91cb-a98c8ab2f4b9.png"),
  summerlin: img("hf_20260808_200423_173498a1-059c-490f-853b-664cbb94c3be.png"),
  "the-summit-club": img("hf_20260808_200423_b07fa267-f262-44ef-a11c-75f77c18ebfb.png"),
  anthem: img("hf_20260808_200423_4ee7169b-4ba4-4bc9-b208-44ea2a7a025d.png"),
  // Established / master-planned / active-adult communities
  inspirada: img("hf_20260808_200423_17e7307e-35a8-4d88-b660-0c4cd6370e42.png"),
  "green-valley": img("hf_20260808_200423_14a597af-b3a7-4547-b81c-f4f9cbbc8600.png"),
  "southern-highlands": img("hf_20260810_144732_e23a176b-234f-449b-aa30-41af302560ad.png"),
  "boulder-city": img("hf_20260810_144732_a496327d-98b8-444a-a350-618037b55698.png"),
  "red-rock-country-club": img("hf_20260810_144732_8dbfa020-894a-4199-bc36-0ec618ca44eb.png"),
  "sun-city-summerlin": img("hf_20260810_144732_ae8d503c-2c22-443e-bc35-d2ac34800642.png"),
  "mountains-edge": img("hf_20260810_144732_2256bd4b-c137-4682-b29e-e1073a5e9a06.png"),
  "skye-canyon": img("hf_20260810_144732_9a18b740-a815-49c1-a676-fcf9649a01d1.png"),
  cadence: img("hf_20260810_144732_ce5fb7f3-ef36-48e4-b89f-e9448d9d828c.png"),
  "rhodes-ranch": img("hf_20260810_144732_9338df33-427a-4bf3-8da7-10330b8d30d8.png"),
  "centennial-hills": img("hf_20260810_144732_53385e08-5560-40aa-a0fa-e9d8b44aad07.png"),
  aliante: img("hf_20260810_144732_be347512-1f7e-4fc7-aa52-1ae6ad81c22c.png"),
  tuscany: img("hf_20260810_144732_14caed5a-a486-4212-ae2a-5afabef0e888.png"),
  providence: img("hf_20260810_145032_9330d963-efe9-4db1-b4f3-8175f90e8205.png"),
  "silverado-ranch": img("hf_20260810_145032_ef5b5ad5-6a07-4586-a375-91ab040ea414.png"),
  "spring-valley": img("hf_20260810_145032_65ba650d-04aa-4b85-9cfd-eeaee0e88fd9.png"),
  "solera-at-anthem": img("hf_20260810_145032_7447f4c5-9c39-43fe-8278-77c90aabd0b1.png"),
  "sun-city-aliante": img("hf_20260810_145032_689bceae-e0f1-4e57-b59b-02d94fe157ac.png"),
  queensridge: img("hf_20260810_145032_8c0a90e9-3ad2-4c46-af16-c7b8173944db.png"),
  "the-lakes": img("hf_20260810_145032_21bedf28-5edc-45ee-a35b-07979bb7b48f.png"),
  "roma-hills": img("hf_20260810_145032_3a779b2e-5710-4c26-bd5b-b82427a3e008.png"),
  "peccole-ranch": img("hf_20260810_145032_ca6f04bc-d0a1-41fa-8fd2-6d551e35e0f9.png"),
  // New signature luxury communities
  "spanish-trail": img("hf_20260810_145032_6438b67b-9329-4099-8d1d-8d3fcb458c9e.png"),
  "spanish-hills": img("hf_20260810_145032_ec190858-f199-4cac-90d1-04873d899770.png"),
  reverence: img("hf_20260810_145547_2f13d62b-2e36-47ce-8fbe-a5c6295f081f.png"),
  "tournament-hills": img("hf_20260810_145547_393809bb-024e-409b-85c8-9c5069879275.png"),
};

export function communityHero(slug: string): string {
  return communityImages[slug] ?? heroImages.luxuryEstate;
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
