/**
 * Area / city hub pages — capture high-volume head-term searches
 * ("Henderson homes for sale", "Las Vegas real estate") and organize the
 * community pages beneath them. Communities are matched by their `city`
 * field, so hubs stay in sync automatically as communities are added.
 */
import { communities } from "./communities";

export type Area = {
  slug: string;
  /** the city value in communities.ts to match against */
  city: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  eyebrow: string;
  intro: string;
  lead: string;
  highlights: string[];
};

export const areas: Area[] = [
  {
    slug: "henderson",
    city: "Henderson",
    name: "Henderson",
    seoTitle: "Henderson, NV Homes for Sale | Communities & Real Estate",
    seoDescription:
      "Explore Henderson, NV real estate — luxury and guard-gated communities, master plans, and homes for sale, with local expertise from Roland Luxury.",
    h1: "Henderson, NV Homes for Sale & Communities",
    eyebrow: "Southern Nevada · City Guide",
    intro:
      "One of America's most livable cities — master-planned communities, guard-gated luxury, and amenities minutes from the Strip.",
    lead:
      "Henderson consistently ranks among the best places to live in the country, and it's easy to see why: beautifully planned communities, extensive parks and trails, strong amenities, and a range of homes from approachable master plans to ultra-luxury guard-gated estates like Ascaya and MacDonald Highlands. Just southeast of Las Vegas, Henderson offers the best of Southern Nevada living.",
    highlights: [
      "Home to ultra-luxury guard-gated communities including Ascaya and MacDonald Highlands",
      "Established master plans like Green Valley, Seven Hills, and Anthem",
      "Newer communities such as Inspirada and Cadence with modern construction",
      "Waterfront resort living at Lake Las Vegas",
      "Extensive parks, trails, shopping, and dining across the city",
    ],
  },
  {
    slug: "las-vegas",
    city: "Las Vegas",
    name: "Las Vegas",
    seoTitle: "Las Vegas Homes for Sale | Communities & Real Estate",
    seoDescription:
      "Explore Las Vegas real estate — from Summerlin master plans to guard-gated luxury and southwest-valley communities — with Roland Luxury.",
    h1: "Las Vegas Homes for Sale & Communities",
    eyebrow: "Southern Nevada · City Guide",
    intro:
      "From Summerlin's master plans to guard-gated luxury and southwest-valley growth — the full range of Las Vegas living.",
    lead:
      "Las Vegas is far more than the Strip. The city spans the celebrated master-planned community of Summerlin on the west side, ultra-exclusive enclaves like The Summit Club and The Ridges, established golf communities, and fast-growing southwest and northwest neighborhoods. Whatever your price point or lifestyle, Las Vegas offers the widest range of communities in the valley.",
    highlights: [
      "Summerlin — one of the nation's top-selling master-planned communities",
      "Ultra-luxury enclaves including The Summit Club and The Ridges",
      "Golf communities like Red Rock Country Club, Southern Highlands, and Rhodes Ranch",
      "Growing areas such as Skye Canyon and Mountain's Edge with new construction",
      "Quick access to Red Rock Canyon, Downtown Summerlin, and the Strip",
    ],
  },
  {
    slug: "boulder-city",
    city: "Boulder City",
    name: "Boulder City",
    seoTitle: "Boulder City, NV Homes for Sale | Real Estate & Community",
    seoDescription:
      "Explore Boulder City, NV real estate — a historic small town near Lake Mead with controlled growth and distinctive character, with Roland Luxury.",
    h1: "Boulder City, NV Homes for Sale",
    eyebrow: "Southern Nevada · City Guide",
    intro:
      "Historic small-town charm, controlled growth, and Lake Mead recreation just outside Las Vegas.",
    lead:
      "Boulder City offers a lifestyle unlike anywhere else in Southern Nevada — a historic town built for the Hoover Dam, with a walkable downtown, deliberately limited growth, and Lake Mead at its doorstep. For buyers who want character, quiet, and recreation within a half-hour of Las Vegas, Boulder City is one of a kind.",
    highlights: [
      "Historic downtown with shops, restaurants, and galleries",
      "Growth-controlled — inventory is limited and character is preserved",
      "Gateway to Lake Mead and Hoover Dam recreation",
      "One of only two Nevada cities without casino gaming",
    ],
  },
  {
    slug: "north-las-vegas",
    city: "North Las Vegas",
    name: "North Las Vegas",
    seoTitle: "North Las Vegas Homes for Sale | Communities & Real Estate",
    seoDescription:
      "Explore North Las Vegas real estate — master-planned communities like Aliante, newer construction, and strong value, with Roland Luxury.",
    h1: "North Las Vegas Homes for Sale & Communities",
    eyebrow: "Southern Nevada · City Guide",
    intro:
      "Value, new construction, and master-planned amenities on the fast-growing north side of the valley.",
    lead:
      "North Las Vegas has grown into one of the valley's best areas for value and new construction, anchored by master-planned communities like Aliante with its golf course, parks, and resort. With approachable pricing, ongoing development, and convenient freeway access, North Las Vegas real estate appeals to first-time buyers, families, and investors alike.",
    highlights: [
      "Master-planned living at Aliante — golf, parks, and a casino resort",
      "Strong value and a high share of newer construction",
      "Convenient access via the 215 Beltway and I-15",
      "One of the valley's fastest-growing areas",
    ],
  },
];

export function getArea(slug: string): Area | undefined {
  return areas.find((a) => a.slug === slug);
}

export function communitiesInArea(city: string) {
  return communities.filter((c) => c.city === city);
}
