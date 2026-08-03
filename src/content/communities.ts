/**
 * Community / neighborhood pages — the primary organic-traffic engine.
 * Each entry renders a full SEO-optimized page at /communities/<slug>
 * with metadata, breadcrumb + FAQ structured data, and internal links.
 *
 * Keep facts general and verifiable; pricing is approximate — always
 * point buyers to "contact for current availability."
 */

export type QuickFact = { label: string; value: string };
export type Faq = { q: string; a: string };
export type Section = { heading: string; body: string[]; bullets?: string[] };

export type Community = {
  slug: string;
  name: string;
  city: string;
  zip?: string;
  /** <title> — keep under ~60 chars where possible */
  seoTitle: string;
  /** meta description — <= 155 chars */
  seoDescription: string;
  /** H1 */
  h1: string;
  /** hero eyebrow */
  eyebrow: string;
  /** hero subhead */
  intro: string;
  /** opening lead paragraph (rich, keyword-aware) */
  lead: string;
  quickFacts: QuickFact[];
  sections: Section[];
  faqs: Faq[];
  /** priority for sitemap + homepage ordering */
  featured?: boolean;
};

export const communities: Community[] = [
  {
    slug: "ascaya",
    name: "Ascaya",
    city: "Henderson",
    zip: "89012",
    featured: true,
    seoTitle: "Ascaya Homes for Sale | Luxury Henderson, NV Real Estate",
    seoDescription:
      "Explore Ascaya homes for sale in Henderson, NV — an ultra-luxury, guard-gated community of just 313 custom estates on Black Mountain with Las Vegas Strip views.",
    h1: "Ascaya Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Guard-Gated Luxury",
    intro:
      "Ultra-luxury custom estates carved into Black Mountain — where world-class architecture meets panoramic views of the Las Vegas Strip.",
    lead:
      "Carved dramatically into the slopes of Black Mountain, Ascaya is Southern Nevada's most exclusive ultra-luxury custom home community — a breathtaking hillside sanctuary where world-class architecture meets the raw beauty of the desert. Limited to just 313 residences terraced into the McCullough Range foothills, Ascaya real estate in Henderson, NV is often described as a living architectural gallery, with each home integrated into the landscape to frame unobstructed views of the Las Vegas Strip, valley, and surrounding mountains.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89012" },
      { label: "Community Type", value: "Guard-gated, all ages" },
      { label: "Total Residences", value: "Limited to 313" },
      { label: "Setting", value: "Black Mountain / McCullough foothills" },
      { label: "Homesite Sizes", value: "~0.4 to 3.35 acres" },
      { label: "Price Range", value: "Approx. $5M – $12M+" },
      { label: "Distance to Strip", value: "~9 miles / 15 minutes" },
      { label: "Signature Amenity", value: "$25M private clubhouse" },
    ],
    sections: [
      {
        heading: "About the Ascaya Community",
        body: [
          "Developed as one of the most ambitious luxury projects in the American Southwest, Ascaya required blasting and terracing homesites directly into the face of Black Mountain — creating a series of elevated pads that give nearly every residence a commanding, unobstructed view of the Las Vegas Valley below.",
          "With only 313 homesites in total, Ascaya offers a level of exclusivity and privacy that is exceptionally rare in Southern Nevada. Homes are designed to honor the natural terrain, emphasizing clean lines, walls of glass, indoor-outdoor living, and materials that echo the surrounding desert.",
        ],
      },
      {
        heading: "Ascaya Homes for Sale & Real Estate",
        body: [
          "Homes and homesites for sale in Ascaya typically range from approximately $5 million to more than $12 million, depending on elevation, lot size, square footage, and level of custom finish. Because inventory is capped at 313 residences and the community is still building out, available homes and lots are limited.",
          "Buyers can choose from three distinct opportunities:",
        ],
        bullets: [
          "Custom Estate & Cloud Rock Homesites — premium lots ranging from roughly 0.4 to 3.35 acres, ready for a fully bespoke, ground-up build.",
          "Desert Design Study Homes — completed, architect-designed custom residences showcasing striking modern desert design.",
          "Canyon Residences — beautifully appointed three- to four-bedroom luxury condominiums for a lower-maintenance lifestyle within the gates.",
        ],
      },
      {
        heading: "Luxury Amenities & The Ascaya Clubhouse",
        body: [
          "At the heart of the community sits a stunning $25 million private clubhouse reserved exclusively for residents. This world-class amenity center rivals a five-star resort and includes:",
        ],
        bullets: [
          "Resort-style, lap, and hot-tub pools",
          "A full-service spa and treatment rooms",
          "A state-of-the-art fitness center",
          "Tennis courts and recreation areas",
          "Indoor play areas, hobby rooms, and elegant social spaces",
        ],
      },
      {
        heading: "Location & Nearby Attractions",
        body: [
          "Ascaya is ideally located in Henderson's southwest foothills, just about nine miles — roughly 15 minutes — from the Las Vegas Strip and Harry Reid International Airport. Despite its serene, elevated setting, residents are minutes from Henderson's premier shopping and dining at The District at Green Valley Ranch, downtown Water Street, championship golf, and quick access to Lake Mead and the M Resort.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Ascaya located?",
        a: "Ascaya is located in Henderson, Nevada (ZIP 89012), built into the McCullough Range foothills of Black Mountain, approximately nine miles from the Las Vegas Strip.",
      },
      {
        q: "How much do homes in Ascaya cost?",
        a: "Ascaya homes and homesites for sale generally range from about $5 million to more than $12 million, depending on lot size, elevation, square footage, and custom finishes. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "Is Ascaya a guard-gated community?",
        a: "Yes. Ascaya is a fully guard-gated, ultra-luxury community with 24-hour security, offering residents exceptional privacy and exclusivity.",
      },
      {
        q: "How many homes are in Ascaya?",
        a: "Ascaya is limited to just 313 residences, making it one of the most exclusive luxury communities in the entire Las Vegas Valley.",
      },
      {
        q: "Can I build a custom home in Ascaya?",
        a: "Absolutely. Ascaya offers custom estate and Cloud Rock homesites ranging from roughly 0.4 to 3.35 acres, ideal for a fully bespoke, architect-designed build. Move-in-ready custom homes and condominium residences are also available.",
      },
    ],
  },

  {
    slug: "macdonald-highlands",
    name: "MacDonald Highlands",
    city: "Henderson",
    zip: "89012",
    featured: true,
    seoTitle: "MacDonald Highlands Homes for Sale | Henderson, NV Luxury",
    seoDescription:
      "MacDonald Highlands homes for sale in Henderson, NV — a guard-gated luxury community with the private DragonRidge Country Club and sweeping Strip and valley views.",
    h1: "MacDonald Highlands Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Guard-Gated Golf Community",
    intro:
      "Elevated custom estates and modern desert architecture surrounding the private DragonRidge Country Club.",
    lead:
      "MacDonald Highlands is one of Henderson's premier guard-gated luxury communities, set into the foothills above the Las Vegas Valley with dramatic elevation, custom estates, and the private DragonRidge Country Club at its center. Known for its striking contemporary architecture and expansive Strip and mountain views, MacDonald Highlands real estate appeals to buyers seeking privacy, prestige, and a golf-and-club lifestyle just minutes from the amenities of Henderson.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89012" },
      { label: "Community Type", value: "Guard-gated, custom & luxury" },
      { label: "Signature Amenity", value: "DragonRidge Country Club" },
      { label: "Home Types", value: "Custom estates & luxury homes" },
      { label: "Price Range", value: "Approx. $1.5M – $10M+" },
      { label: "Distance to Strip", value: "~12 miles / 18 minutes" },
    ],
    sections: [
      {
        heading: "About MacDonald Highlands",
        body: [
          "Perched on the western slopes of the McCullough Range, MacDonald Highlands offers some of the most elevated homesites in the Las Vegas Valley — a setting that delivers panoramic views of the Strip, the valley floor, and the surrounding mountains. The community blends custom estates, luxury production homes, and premium homesites for those who want to build.",
          "At its heart is DragonRidge Country Club, a private club featuring a championship golf course, a modern clubhouse, dining, tennis, and fitness — the social and recreational anchor of the neighborhood.",
        ],
      },
      {
        heading: "Homes & Homesites for Sale",
        body: [
          "MacDonald Highlands real estate spans a wide range, from luxury single-family homes to sprawling custom estates and vacant homesites. Pricing generally starts in the seven figures and climbs well into eight figures for the largest custom estates. Because homesites and finished homes vary widely in elevation, size, and finish, working with a local specialist is the best way to match the right property to your goals.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is MacDonald Highlands located?",
        a: "MacDonald Highlands is a guard-gated luxury community in Henderson, Nevada (ZIP 89012), set in the McCullough Range foothills about 12 miles from the Las Vegas Strip.",
      },
      {
        q: "Does MacDonald Highlands have a golf course?",
        a: "Yes. The community is anchored by the private DragonRidge Country Club, which features a championship golf course, clubhouse, dining, tennis, and fitness facilities.",
      },
      {
        q: "How much do homes in MacDonald Highlands cost?",
        a: "Prices generally range from approximately $1.5 million to more than $10 million depending on home size, elevation, and custom finishes. Contact The Roland Team for current listings and pricing.",
      },
    ],
  },

  {
    slug: "seven-hills",
    name: "Seven Hills",
    city: "Henderson",
    zip: "89052",
    featured: true,
    seoTitle: "Seven Hills Homes for Sale | Henderson, NV Real Estate",
    seoDescription:
      "Seven Hills homes for sale in Henderson, NV — an established master-planned community with guard-gated enclaves, golf, parks, and top-rated schools.",
    h1: "Seven Hills Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Master-Planned Community",
    intro:
      "An established, amenity-rich master plan with gated enclaves, golf, and highly rated schools.",
    lead:
      "Seven Hills is one of Henderson's most sought-after master-planned communities, offering a mix of gated enclaves, custom estates, and move-up family homes across a beautifully landscaped hillside setting. With Rio Secco Golf Club nearby, extensive parks and trails, and access to highly rated schools, Seven Hills real estate is popular with families and professionals who want established value and lifestyle in one of the valley's most desirable ZIP codes.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89052" },
      { label: "Community Type", value: "Master-planned, guard-gated enclaves" },
      { label: "Home Types", value: "Family homes to custom estates" },
      { label: "Nearby Golf", value: "Rio Secco Golf Club" },
      { label: "Price Range", value: "Approx. $600K – $4M+" },
      { label: "Distance to Strip", value: "~14 miles / 20 minutes" },
    ],
    sections: [
      {
        heading: "About Seven Hills",
        body: [
          "Seven Hills is a large, established master plan in southern Henderson known for its manicured landscaping, parks, and gently rising topography that gives many homes elevated valley views. The community includes several guard-gated enclaves alongside more accessible neighborhoods, making it one of the most versatile luxury-leaning areas in Henderson.",
        ],
      },
      {
        heading: "Homes for Sale in Seven Hills",
        body: [
          "The community offers everything from well-appointed family homes to gated custom estates, so pricing spans a broad range. Buyers are drawn to the combination of established value, strong schools, golf, and quick access to the 215 Beltway and Henderson's shopping and dining.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Seven Hills located?",
        a: "Seven Hills is a master-planned community in Henderson, Nevada (ZIP 89052), about 14 miles from the Las Vegas Strip.",
      },
      {
        q: "Is Seven Hills a gated community?",
        a: "Seven Hills includes several guard-gated enclaves as well as non-gated neighborhoods, giving buyers a range of options and price points.",
      },
      {
        q: "How much do homes in Seven Hills cost?",
        a: "Prices generally range from around $600,000 to more than $4 million depending on the enclave, home size, and finishes. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "the-ridges-summerlin",
    name: "The Ridges",
    city: "Las Vegas",
    zip: "89135",
    featured: true,
    seoTitle: "The Ridges Summerlin Homes for Sale | Las Vegas Luxury",
    seoDescription:
      "The Ridges homes for sale in Summerlin, Las Vegas — a guard-gated luxury community with the private Bear's Best golf course and stunning contemporary estates.",
    h1: "The Ridges Homes for Sale in Summerlin, Las Vegas",
    eyebrow: "Summerlin, Las Vegas · Guard-Gated Luxury",
    intro:
      "Contemporary luxury estates in the elevated western reaches of Summerlin, anchored by Bear's Best golf.",
    lead:
      "The Ridges is Summerlin's flagship luxury community — a collection of guard-gated enclaves set against the Spring Mountains and Red Rock Canyon on the far western edge of the Las Vegas Valley. Renowned for its modern architecture, custom estates, and the private Bear's Best Las Vegas golf course, The Ridges real estate represents some of the most prestigious addresses in all of Summerlin.",
    quickFacts: [
      { label: "Location", value: "Summerlin, Las Vegas, NV 89135" },
      { label: "Community Type", value: "Guard-gated luxury enclaves" },
      { label: "Signature Amenity", value: "Bear's Best golf & Club Ridges" },
      { label: "Home Types", value: "Custom & contemporary estates" },
      { label: "Price Range", value: "Approx. $2M – $15M+" },
      { label: "Nearby", value: "Red Rock Canyon, Downtown Summerlin" },
    ],
    sections: [
      {
        heading: "About The Ridges",
        body: [
          "The Ridges sits at the highest, westernmost point of Summerlin, offering elevation, privacy, and proximity to Red Rock Canyon National Conservation Area. Its enclaves are known for sleek desert-contemporary architecture, and the community centers on Club Ridges and the Bear's Best Las Vegas golf course.",
        ],
      },
      {
        heading: "Luxury Homes for Sale in The Ridges",
        body: [
          "Homes in The Ridges range from luxury single-family residences to expansive custom estates, with pricing that reflects its status as one of the valley's premier addresses. Buyers value the blend of natural beauty, architectural pedigree, and easy access to Downtown Summerlin's shopping, dining, and entertainment.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is The Ridges located?",
        a: "The Ridges is a guard-gated luxury community in the Summerlin area of Las Vegas, Nevada (ZIP 89135), near Red Rock Canyon on the western edge of the valley.",
      },
      {
        q: "Does The Ridges have a golf course?",
        a: "Yes. The community is home to the private Bear's Best Las Vegas golf course and Club Ridges, a members' amenity center.",
      },
      {
        q: "How much do homes in The Ridges cost?",
        a: "Prices generally range from approximately $2 million to more than $15 million depending on size, enclave, and finish level. Contact The Roland Team for current listings.",
      },
    ],
  },
];

export function getCommunity(slug: string): Community | undefined {
  return communities.find((c) => c.slug === slug);
}

export const featuredCommunities = communities.filter((c) => c.featured);
