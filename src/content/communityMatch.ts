/**
 * Neighborhood Finder — matching data + logic.
 *
 * A lightweight, self-contained attribute table for every community (kept out
 * of the heavy communities.ts so the client quiz bundle stays small). Each
 * entry carries the facets the quiz scores against: area, budget tiers it
 * realistically spans, and lifestyle tags. matchCommunities() scores every
 * community against a buyer's answers and returns the best fits with a
 * human-readable explanation of *why* each matched.
 */

export type Area = "henderson" | "summerlin" | "sw-lv" | "nw-lv" | "w-lv" | "n-lv" | "boulder-city";
export type BudgetTier = "value" | "mid" | "luxury" | "ultra";
export type Lifestyle =
  | "guardGated"
  | "golf"
  | "active55"
  | "family"
  | "newBuild"
  | "waterfront"
  | "luxury"
  | "space";

export type CommunityAttr = {
  slug: string;
  name: string;
  city: string;
  /** short descriptor for the result card (from the page eyebrow) */
  note: string;
  area: Area;
  tiers: BudgetTier[];
  tags: Lifestyle[];
};

/* ---- Quiz question options (labels shown to the buyer) ---- */

export const AREA_OPTIONS: { value: Area | "any"; label: string; sub: string }[] = [
  { value: "henderson", label: "Henderson", sub: "Master plans, luxury & 55+" },
  { value: "summerlin", label: "Summerlin", sub: "West-side villages & luxury" },
  { value: "sw-lv", label: "Southwest LV", sub: "Newer master plans & golf" },
  { value: "nw-lv", label: "Northwest LV", sub: "Newer communities & space" },
  { value: "w-lv", label: "West LV", sub: "Established & guard-gated" },
  { value: "n-lv", label: "North LV", sub: "Value & active adult" },
  { value: "boulder-city", label: "Boulder City", sub: "Historic small-town" },
  { value: "any", label: "No preference", sub: "Show me the best fits anywhere" },
];

export const BUDGET_OPTIONS: { value: BudgetTier | "any"; label: string; sub: string }[] = [
  { value: "value", label: "Under $500K", sub: "Entry & value" },
  { value: "mid", label: "$500K – $1M", sub: "Move-up" },
  { value: "luxury", label: "$1M – $3M", sub: "Luxury" },
  { value: "ultra", label: "$3M+", sub: "Ultra-luxury" },
  { value: "any", label: "Not sure yet", sub: "Show a range" },
];

export const LIFESTYLE_OPTIONS: { value: Lifestyle; label: string; icon: string }[] = [
  { value: "guardGated", label: "Guard-gated privacy", icon: "🛡️" },
  { value: "golf", label: "Golf course living", icon: "⛳" },
  { value: "active55", label: "55+ active adult", icon: "🌤️" },
  { value: "newBuild", label: "New construction", icon: "🏗️" },
  { value: "family", label: "Family & master-planned", icon: "🏡" },
  { value: "waterfront", label: "Lake / waterfront", icon: "🌊" },
  { value: "space", label: "Space & larger lots", icon: "🌵" },
  { value: "luxury", label: "Luxury & views", icon: "✨" },
];

const AREA_LABEL: Record<Area, string> = {
  henderson: "Henderson",
  summerlin: "Summerlin",
  "sw-lv": "Southwest LV",
  "nw-lv": "Northwest LV",
  "w-lv": "West LV",
  "n-lv": "North LV",
  "boulder-city": "Boulder City",
};

const LIFESTYLE_LABEL: Record<Lifestyle, string> = {
  guardGated: "Guard-gated",
  golf: "Golf",
  active55: "55+ active adult",
  family: "Family-friendly",
  newBuild: "New construction",
  waterfront: "Waterfront",
  luxury: "Luxury",
  space: "Larger lots",
};

const BUDGET_LABEL: Record<BudgetTier, string> = {
  value: "Under $500K",
  mid: "$500K–$1M",
  luxury: "$1M–$3M",
  ultra: "$3M+",
};

const TIER_ORDER: BudgetTier[] = ["value", "mid", "luxury", "ultra"];

/* ---- Attribute table (all 42 communities) ---- */

export const communityAttrs: CommunityAttr[] = [
  { slug: "ascaya", name: "Ascaya", city: "Henderson", note: "Guard-gated ultra-luxury", area: "henderson", tiers: ["ultra"], tags: ["guardGated", "luxury"] },
  { slug: "macdonald-highlands", name: "MacDonald Highlands", city: "Henderson", note: "Guard-gated golf luxury", area: "henderson", tiers: ["luxury", "ultra"], tags: ["guardGated", "golf", "luxury"] },
  { slug: "seven-hills", name: "Seven Hills", city: "Henderson", note: "Hillside master-planned", area: "henderson", tiers: ["mid", "luxury"], tags: ["family", "luxury"] },
  { slug: "the-ridges-summerlin", name: "The Ridges", city: "Las Vegas", note: "Summerlin guard-gated luxury", area: "summerlin", tiers: ["ultra"], tags: ["guardGated", "luxury"] },
  { slug: "lake-las-vegas", name: "Lake Las Vegas", city: "Henderson", note: "Waterfront resort living", area: "henderson", tiers: ["mid", "luxury", "ultra"], tags: ["waterfront", "luxury", "golf"] },
  { slug: "summerlin", name: "Summerlin", city: "Las Vegas", note: "Flagship master plan", area: "summerlin", tiers: ["mid", "luxury"], tags: ["family", "newBuild"] },
  { slug: "anthem", name: "Anthem", city: "Henderson", note: "Hillside master-planned", area: "henderson", tiers: ["value", "mid"], tags: ["family"] },
  { slug: "southern-highlands", name: "Southern Highlands", city: "Las Vegas", note: "Master-planned golf", area: "sw-lv", tiers: ["mid", "luxury"], tags: ["golf", "family"] },
  { slug: "inspirada", name: "Inspirada", city: "Henderson", note: "Newer master-planned", area: "henderson", tiers: ["mid"], tags: ["family", "newBuild"] },
  { slug: "green-valley", name: "Green Valley", city: "Henderson", note: "Established master plan", area: "henderson", tiers: ["value", "mid"], tags: ["family"] },
  { slug: "boulder-city", name: "Boulder City", city: "Boulder City", note: "Historic small-town", area: "boulder-city", tiers: ["value", "mid"], tags: ["family", "space"] },
  { slug: "the-summit-club", name: "The Summit Club", city: "Las Vegas", note: "Private club, ultra-luxury", area: "summerlin", tiers: ["ultra"], tags: ["guardGated", "golf", "luxury"] },
  { slug: "red-rock-country-club", name: "Red Rock Country Club", city: "Las Vegas", note: "Guard-gated golf", area: "summerlin", tiers: ["luxury", "ultra"], tags: ["guardGated", "golf", "luxury"] },
  { slug: "sun-city-summerlin", name: "Sun City Summerlin", city: "Las Vegas", note: "55+ active adult", area: "summerlin", tiers: ["value", "mid"], tags: ["active55"] },
  { slug: "mountains-edge", name: "Mountain's Edge", city: "Las Vegas", note: "Southwest master plan", area: "sw-lv", tiers: ["value", "mid"], tags: ["family", "newBuild"] },
  { slug: "skye-canyon", name: "Skye Canyon", city: "Las Vegas", note: "Newer outdoorsy master plan", area: "nw-lv", tiers: ["value", "mid"], tags: ["family", "newBuild"] },
  { slug: "cadence", name: "Cadence", city: "Henderson", note: "Newer master-planned", area: "henderson", tiers: ["value", "mid"], tags: ["family", "newBuild"] },
  { slug: "rhodes-ranch", name: "Rhodes Ranch", city: "Las Vegas", note: "Guard-gated golf", area: "sw-lv", tiers: ["mid", "luxury"], tags: ["guardGated", "golf", "family"] },
  { slug: "providence", name: "Providence", city: "Las Vegas", note: "Northwest master plan", area: "nw-lv", tiers: ["value", "mid"], tags: ["family", "newBuild"] },
  { slug: "centennial-hills", name: "Centennial Hills", city: "Las Vegas", note: "Established northwest", area: "nw-lv", tiers: ["value", "mid"], tags: ["family"] },
  { slug: "aliante", name: "Aliante", city: "North Las Vegas", note: "Master-planned value", area: "n-lv", tiers: ["value", "mid"], tags: ["family"] },
  { slug: "tuscany", name: "Tuscany", city: "Henderson", note: "Guard-gated community", area: "henderson", tiers: ["mid", "luxury"], tags: ["guardGated", "family"] },
  { slug: "silverado-ranch", name: "Silverado Ranch", city: "Las Vegas", note: "Established value", area: "sw-lv", tiers: ["value", "mid"], tags: ["family"] },
  { slug: "spring-valley", name: "Spring Valley", city: "Las Vegas", note: "Central-west established", area: "w-lv", tiers: ["value", "mid"], tags: ["family"] },
  { slug: "solera-at-anthem", name: "Solera at Anthem", city: "Henderson", note: "Guard-gated 55+", area: "henderson", tiers: ["mid"], tags: ["active55", "guardGated"] },
  { slug: "sun-city-aliante", name: "Sun City Aliante", city: "North Las Vegas", note: "55+ active adult", area: "n-lv", tiers: ["value", "mid"], tags: ["active55"] },
  { slug: "queensridge", name: "Queensridge", city: "Las Vegas", note: "Guard-gated luxury", area: "w-lv", tiers: ["luxury", "ultra"], tags: ["guardGated", "luxury"] },
  { slug: "the-lakes", name: "The Lakes", city: "Las Vegas", note: "Waterfront community", area: "w-lv", tiers: ["mid", "luxury"], tags: ["waterfront", "family"] },
  { slug: "roma-hills", name: "Roma Hills", city: "Henderson", note: "Guard-gated hillside", area: "henderson", tiers: ["luxury"], tags: ["guardGated", "luxury"] },
  { slug: "peccole-ranch", name: "Peccole Ranch", city: "Las Vegas", note: "Established master plan", area: "w-lv", tiers: ["mid"], tags: ["family"] },
  { slug: "spanish-trail", name: "Spanish Trail", city: "Las Vegas", note: "Guard-gated country club", area: "w-lv", tiers: ["mid", "luxury"], tags: ["guardGated", "golf", "luxury"] },
  { slug: "spanish-hills", name: "Spanish Hills", city: "Las Vegas", note: "Guard-gated luxury", area: "sw-lv", tiers: ["luxury", "ultra"], tags: ["guardGated", "luxury"] },
  { slug: "reverence", name: "Reverence", city: "Las Vegas", note: "Summerlin guard-gated, newer", area: "summerlin", tiers: ["luxury"], tags: ["guardGated", "newBuild", "luxury"] },
  { slug: "tournament-hills", name: "Tournament Hills", city: "Las Vegas", note: "Summerlin guard-gated luxury", area: "summerlin", tiers: ["luxury", "ultra"], tags: ["guardGated", "luxury", "golf"] },
  { slug: "sun-city-anthem", name: "Sun City Anthem", city: "Henderson", note: "55+ active adult", area: "henderson", tiers: ["value", "mid"], tags: ["active55"] },
  { slug: "anthem-country-club", name: "Anthem Country Club", city: "Henderson", note: "Guard-gated golf", area: "henderson", tiers: ["mid", "luxury", "ultra"], tags: ["guardGated", "golf", "luxury"] },
  { slug: "green-valley-ranch", name: "Green Valley Ranch", city: "Henderson", note: "Master-planned, The District", area: "henderson", tiers: ["mid", "luxury"], tags: ["family"] },
  { slug: "whitney-ranch", name: "Whitney Ranch", city: "Henderson", note: "Established value", area: "henderson", tiers: ["value"], tags: ["family"] },
  { slug: "the-cliffs", name: "The Cliffs", city: "Las Vegas", note: "Modern desert village", area: "summerlin", tiers: ["mid", "luxury"], tags: ["newBuild", "luxury"] },
  { slug: "stonebridge", name: "Stonebridge", city: "Las Vegas", note: "Newer Summerlin village", area: "summerlin", tiers: ["mid", "luxury"], tags: ["newBuild", "family"] },
  { slug: "lone-mountain", name: "Lone Mountain", city: "Las Vegas", note: "Larger lots & custom homes", area: "nw-lv", tiers: ["mid", "luxury"], tags: ["space"] },
  { slug: "the-willows", name: "The Willows", city: "Las Vegas", note: "Established Summerlin village", area: "summerlin", tiers: ["mid", "luxury"], tags: ["family"] },
];

export type MatchAnswers = {
  area: Area | "any";
  budget: BudgetTier | "any";
  priorities: Lifestyle[];
};

export type MatchResult = {
  slug: string;
  name: string;
  city: string;
  note: string;
  score: number;
  /** human-readable reasons this community matched */
  reasons: string[];
};

/**
 * Score every community against the buyer's answers and return the best fits,
 * highest score first. Area is weighted most, then budget fit, then each
 * lifestyle priority; adjacent budget tiers earn partial credit so a buyer is
 * never shown nothing.
 */
export function matchCommunities(answers: MatchAnswers, limit = 4): MatchResult[] {
  const scored = communityAttrs.map((c) => {
    let score = 0;
    const reasons: string[] = [];

    if (answers.area !== "any") {
      if (c.area === answers.area) {
        score += 6;
        reasons.push(AREA_LABEL[c.area]);
      }
    } else {
      reasons.push(AREA_LABEL[c.area]);
    }

    if (answers.budget !== "any") {
      if (c.tiers.includes(answers.budget)) {
        score += 4;
        reasons.push(BUDGET_LABEL[answers.budget]);
      } else {
        const want = TIER_ORDER.indexOf(answers.budget);
        const nearest = Math.min(...c.tiers.map((t) => Math.abs(TIER_ORDER.indexOf(t) - want)));
        if (nearest === 1) score += 1;
      }
    }

    for (const p of answers.priorities) {
      if (c.tags.includes(p)) {
        score += 3;
        reasons.push(LIFESTYLE_LABEL[p]);
      }
    }

    return { slug: c.slug, name: c.name, city: c.city, note: c.note, score, reasons };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}
