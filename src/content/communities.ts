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

  {
    slug: "lake-las-vegas",
    name: "Lake Las Vegas",
    city: "Henderson",
    zip: "89011",
    featured: true,
    seoTitle: "Lake Las Vegas Homes for Sale | Henderson, NV Waterfront",
    seoDescription:
      "Lake Las Vegas homes for sale in Henderson, NV — a Mediterranean-inspired resort community around a 320-acre lake with golf, waterfront dining, and gated enclaves.",
    h1: "Lake Las Vegas Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Waterfront Resort Living",
    intro:
      "Mediterranean-inspired waterfront living around a 320-acre lake — resort amenities, golf, and gated enclaves minutes from the Strip.",
    lead:
      "Lake Las Vegas is one of Southern Nevada's most distinctive communities — a Mediterranean-inspired resort destination built around a 320-acre man-made lake in eastern Henderson. With waterfront dining and shops at the Village, two Jack Nicklaus-designed golf courses, luxury resorts, and a mix of condominiums, townhomes, and custom estates across gated enclaves, Lake Las Vegas real estate offers a lifestyle unlike anywhere else in the valley.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89011" },
      { label: "Community Type", value: "Master-planned resort, gated enclaves" },
      { label: "Signature Feature", value: "320-acre private lake" },
      { label: "Golf", value: "Reflection Bay & SouthShore (Nicklaus)" },
      { label: "Home Types", value: "Condos, townhomes, custom estates" },
      { label: "Price Range", value: "Approx. $400K – $10M+" },
      { label: "Distance to Strip", value: "~17 miles / 25 minutes" },
    ],
    sections: [
      {
        heading: "About Lake Las Vegas",
        body: [
          "Set against the desert foothills of eastern Henderson, Lake Las Vegas centers on a sparkling 320-acre lake ringed by Mediterranean and Tuscan-inspired architecture. The community includes the walkable Village at Lake Las Vegas — a waterfront district of restaurants, shops, and events — plus resort hotels, marinas, and miles of trails.",
          "Residents enjoy watersports, paddleboarding, and lakeside living rarely found in the desert, all within a short drive of Henderson's shopping and the Las Vegas Strip.",
        ],
      },
      {
        heading: "Homes for Sale in Lake Las Vegas",
        body: [
          "Lake Las Vegas real estate spans a wide spectrum — from lock-and-leave condominiums and townhomes to guard-gated custom estates with private lake frontage. Communities such as SouthShore and other gated enclaves offer golf, privacy, and premium waterfront homesites, so pricing ranges broadly depending on location, view, and finish.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Lake Las Vegas located?",
        a: "Lake Las Vegas is a resort community in eastern Henderson, Nevada (ZIP 89011), about 17 miles from the Las Vegas Strip.",
      },
      {
        q: "Is Lake Las Vegas a real lake?",
        a: "Yes. Lake Las Vegas is built around a 320-acre man-made lake that supports boating, paddleboarding, and other watersports, with waterfront homes, resorts, and dining along its shores.",
      },
      {
        q: "How much do homes in Lake Las Vegas cost?",
        a: "Prices generally range from about $400,000 for condominiums to more than $10 million for waterfront custom estates. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "summerlin",
    name: "Summerlin",
    city: "Las Vegas",
    zip: "89135",
    featured: true,
    seoTitle: "Summerlin Homes for Sale | Las Vegas Master-Planned Living",
    seoDescription:
      "Summerlin homes for sale in Las Vegas — a premier master-planned community with parks, trails, Downtown Summerlin, top schools, and luxury villages near Red Rock.",
    h1: "Summerlin Homes for Sale in Las Vegas, NV",
    eyebrow: "Las Vegas, Nevada · Master-Planned Community",
    intro:
      "One of the nation's top-selling master plans — parks, trails, Downtown Summerlin, and luxury villages against the backdrop of Red Rock Canyon.",
    lead:
      "Summerlin is one of the most celebrated master-planned communities in the country, spanning the western edge of the Las Vegas Valley along Red Rock Canyon. With more than a dozen villages, an extensive trail and park system, Downtown Summerlin's shopping and entertainment, the Las Vegas Ballpark, and highly regarded schools, Summerlin real estate ranges from approachable move-up homes to the ultra-luxury estates of The Ridges and The Summit.",
    quickFacts: [
      { label: "Location", value: "Las Vegas, NV (89135, 89138, 89144)" },
      { label: "Community Type", value: "Large master-planned community" },
      { label: "Developer", value: "The Howard Hughes Corporation" },
      { label: "Highlights", value: "Downtown Summerlin, parks & trails" },
      { label: "Home Types", value: "Condos to ultra-luxury estates" },
      { label: "Price Range", value: "Approx. $400K – $10M+" },
      { label: "Nearby", value: "Red Rock Canyon" },
    ],
    sections: [
      {
        heading: "About Summerlin",
        body: [
          "Developed by The Howard Hughes Corporation, Summerlin covers thousands of acres of planned villages on the valley's west side. It's known for its greenbelts, more than 150 parks, an extensive trail network, and Downtown Summerlin — a walkable district of shopping, dining, offices, the Las Vegas Ballpark, and City National Arena.",
          "Its location along Red Rock Canyon gives residents quick access to hiking and dramatic scenery, while established schools and amenities anchor day-to-day life.",
        ],
      },
      {
        heading: "Homes for Sale in Summerlin",
        body: [
          "Because Summerlin is so large, its real estate covers nearly every price point — from condominiums and townhomes to single-family homes and the guard-gated luxury enclaves of The Ridges and The Summit Club. Newer villages like Summerlin West and The Cliffs continue to add modern construction, giving buyers a wide range of options.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Summerlin located?",
        a: "Summerlin is a master-planned community on the western edge of Las Vegas, Nevada, bordering Red Rock Canyon, with ZIP codes including 89135, 89138, and 89144.",
      },
      {
        q: "What is there to do in Summerlin?",
        a: "Summerlin offers Downtown Summerlin (shopping, dining, and the Las Vegas Ballpark), more than 150 parks, an extensive trail system, golf, and quick access to Red Rock Canyon.",
      },
      {
        q: "How much do homes in Summerlin cost?",
        a: "Prices range from around $400,000 for condos and townhomes to more than $10 million for luxury estates in enclaves like The Ridges and The Summit. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "anthem",
    name: "Anthem",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Anthem Homes for Sale | Henderson, NV Master-Planned",
    seoDescription:
      "Anthem homes for sale in Henderson, NV — an elevated master-planned community with the guard-gated Anthem Country Club, Sun City Anthem, and mountain views.",
    h1: "Anthem Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Master-Planned Community",
    intro:
      "Elevated hillside living with guard-gated golf, an active-adult village, and sweeping valley views in southern Henderson.",
    lead:
      "Anthem is a master-planned community set into the elevated foothills of southern Henderson, known for its panoramic valley views, well-planned neighborhoods, and range of lifestyle options. It includes the guard-gated Anthem Country Club, the age-qualified Sun City Anthem active-adult village, and additional residential neighborhoods — making Anthem real estate appealing to a wide range of buyers.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89052" },
      { label: "Community Type", value: "Master-planned; includes gated & 55+" },
      { label: "Signature Amenity", value: "Anthem Country Club (private golf)" },
      { label: "Active Adult", value: "Sun City Anthem (age-qualified 55+)" },
      { label: "Home Types", value: "Single-family to custom estates" },
      { label: "Price Range", value: "Approx. $400K – $3M+" },
    ],
    sections: [
      {
        heading: "About Anthem",
        body: [
          "Rising into the McCullough foothills, Anthem is prized for its elevation and views across the Las Vegas Valley. The community is organized into distinct areas, including the guard-gated Anthem Country Club — with its private championship golf course and clubhouse — and Sun City Anthem, an age-qualified active-adult community with extensive recreation centers.",
        ],
      },
      {
        heading: "Homes for Sale in Anthem",
        body: [
          "Anthem offers everything from well-appointed single-family homes to gated custom estates on elevated homesites. Pricing varies by neighborhood and view, with the country-club enclave commanding a premium. Its location near the 215 Beltway keeps residents connected to Henderson's shopping, dining, and the wider valley.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Anthem located?",
        a: "Anthem is a master-planned community in southern Henderson, Nevada (ZIP 89052), set in the McCullough foothills with elevated valley views.",
      },
      {
        q: "Is Sun City Anthem an age-restricted community?",
        a: "Yes. Sun City Anthem is an age-qualified (55+) active-adult community within Anthem, offering recreation centers, clubs, and amenities designed for active adults.",
      },
      {
        q: "How much do homes in Anthem cost?",
        a: "Prices generally range from around $400,000 to more than $3 million depending on the neighborhood, elevation, and whether the home is in the guard-gated country club. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "southern-highlands",
    name: "Southern Highlands",
    city: "Las Vegas",
    zip: "89141",
    seoTitle: "Southern Highlands Homes for Sale | Las Vegas Golf Community",
    seoDescription:
      "Southern Highlands homes for sale in Las Vegas — a master-planned community with the private Southern Highlands Golf Club, guard-gated estates, and family neighborhoods.",
    h1: "Southern Highlands Homes for Sale in Las Vegas, NV",
    eyebrow: "Las Vegas, Nevada · Master-Planned Golf Community",
    intro:
      "A prestigious southwest-valley master plan anchored by a private championship golf club and guard-gated luxury estates.",
    lead:
      "Southern Highlands is a master-planned community in the southwest Las Vegas Valley, best known for the private Southern Highlands Golf Club and its guard-gated luxury enclaves. Combining custom estates, gated neighborhoods, and more accessible homes with strong amenities and easy freeway access, Southern Highlands real estate has become one of the area's most desirable addresses.",
    quickFacts: [
      { label: "Location", value: "Las Vegas, NV 89141" },
      { label: "Community Type", value: "Master-planned; guard-gated enclaves" },
      { label: "Signature Amenity", value: "Southern Highlands Golf Club (private)" },
      { label: "Home Types", value: "Family homes to custom estates" },
      { label: "Price Range", value: "Approx. $450K – $8M+" },
      { label: "Access", value: "Minutes from I-15" },
    ],
    sections: [
      {
        heading: "About Southern Highlands",
        body: [
          "Located in the southwest valley near the I-15 corridor, Southern Highlands blends resort-style amenities with a range of neighborhoods. At its center is the private Southern Highlands Golf Club, an acclaimed championship course, surrounded by guard-gated enclaves of custom estates alongside more approachable residential areas.",
        ],
      },
      {
        heading: "Homes for Sale in Southern Highlands",
        body: [
          "The community offers a broad selection — from single-family homes to expansive gated custom estates with golf-course and mountain views. Pricing spans widely, with the guard-gated luxury sections commanding a premium. Convenient access to the freeway makes commuting to the Strip and beyond straightforward.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Southern Highlands located?",
        a: "Southern Highlands is a master-planned community in the southwest Las Vegas Valley (ZIP 89141), just off the I-15 freeway.",
      },
      {
        q: "Does Southern Highlands have a golf course?",
        a: "Yes. The community is anchored by the private Southern Highlands Golf Club, a championship course within a guard-gated setting.",
      },
      {
        q: "How much do homes in Southern Highlands cost?",
        a: "Prices generally range from around $450,000 to more than $8 million depending on the neighborhood and whether the home is in a guard-gated enclave. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "inspirada",
    name: "Inspirada",
    city: "Henderson",
    zip: "89044",
    seoTitle: "Inspirada Homes for Sale | Henderson, NV Master-Planned",
    seoDescription:
      "Inspirada homes for sale in Henderson, NV — a newer master-planned community with extensive parks, trails, sports fields, and modern single-family homes.",
    h1: "Inspirada Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Master-Planned Community",
    intro:
      "A newer southern-Henderson master plan built around parks, trails, and modern construction with mountain views.",
    lead:
      "Inspirada is one of Henderson's newer master-planned communities, designed around an extensive network of parks, sports fields, and walking trails in the southern reaches of the valley. With modern single-family homes from a range of builders, connected green spaces, and mountain-view homesites, Inspirada real estate appeals to buyers looking for newer construction and an amenity-rich, walkable neighborhood.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89044" },
      { label: "Community Type", value: "Newer master-planned community" },
      { label: "Highlights", value: "Parks, trails, sports fields" },
      { label: "Home Types", value: "Modern single-family homes" },
      { label: "Price Range", value: "Approx. $400K – $1.2M+" },
      { label: "Nearby", value: "Exploration Peak Park" },
    ],
    sections: [
      {
        heading: "About Inspirada",
        body: [
          "Inspirada was planned around connectivity — a system of parks, paseos, and trails links its neighborhoods to shared amenities and open space. The community features multiple parks with sports courts and fields, a central hub, and ongoing construction from a variety of homebuilders, giving buyers access to modern floor plans and energy-efficient homes.",
        ],
      },
      {
        heading: "Homes for Sale in Inspirada",
        body: [
          "Homes in Inspirada are predominantly newer single-family residences across a range of sizes and price points, making it one of southern Henderson's most active new-home markets. Its elevated southern location offers mountain and valley views, with quick access to the 215 Beltway.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Inspirada located?",
        a: "Inspirada is a master-planned community in southern Henderson, Nevada (ZIP 89044), near Exploration Peak Park.",
      },
      {
        q: "Is Inspirada a newer community?",
        a: "Yes. Inspirada is one of Henderson's newer master plans, with modern homes from multiple builders and an extensive network of parks and trails.",
      },
      {
        q: "How much do homes in Inspirada cost?",
        a: "Prices generally range from around $400,000 to about $1.2 million depending on the home size, builder, and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "green-valley",
    name: "Green Valley",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Green Valley Homes for Sale | Henderson, NV Real Estate",
    seoDescription:
      "Green Valley homes for sale in Henderson, NV — an established master-planned area with The District at Green Valley Ranch, parks, and guard-gated luxury enclaves.",
    h1: "Green Valley Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Established Master Plan",
    intro:
      "Henderson's original master-planned community — mature, amenity-rich, and home to The District at Green Valley Ranch.",
    lead:
      "Green Valley is the community that helped put Henderson on the map — one of the valley's original master-planned areas, now mature and highly established. Encompassing both Green Valley and the upscale Green Valley Ranch, it offers tree-lined neighborhoods, extensive parks, top amenities including The District at Green Valley Ranch, and guard-gated luxury enclaves, making Green Valley real estate a perennial favorite for buyers who want established value and convenience.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV (89052, 89012, 89014)" },
      { label: "Community Type", value: "Established master plan; gated enclaves" },
      { label: "Highlights", value: "The District at Green Valley Ranch" },
      { label: "Home Types", value: "Condos to guard-gated estates" },
      { label: "Price Range", value: "Approx. $400K – $3M+" },
      { label: "Distance to Strip", value: "~11 miles / 18 minutes" },
    ],
    sections: [
      {
        heading: "About Green Valley",
        body: [
          "Green Valley set the template for Henderson's master-planned growth, and decades later it remains one of the most established and convenient places to live in the valley. The area offers mature landscaping, extensive parks and trails, and standout amenities — most notably The District at Green Valley Ranch, an open-air shopping and dining destination beside the Green Valley Ranch Resort.",
          "Green Valley Ranch, the upscale successor plan, adds guard-gated enclaves and custom estates for buyers seeking a more luxury-oriented setting.",
        ],
      },
      {
        heading: "Homes for Sale in Green Valley",
        body: [
          "Green Valley real estate ranges from condominiums and townhomes to established single-family homes and guard-gated custom estates. Because the area is fully built out and mature, it offers a stability and convenience that newer communities can't yet match, with pricing that varies by neighborhood and gating.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Green Valley located?",
        a: "Green Valley is an established master-planned area in Henderson, Nevada, spanning ZIP codes including 89052, 89012, and 89014, about 11 miles from the Las Vegas Strip.",
      },
      {
        q: "What is The District at Green Valley Ranch?",
        a: "The District is an open-air shopping, dining, and entertainment destination within Green Valley Ranch, adjacent to the Green Valley Ranch Resort — a signature amenity of the community.",
      },
      {
        q: "How much do homes in Green Valley cost?",
        a: "Prices generally range from around $400,000 to more than $3 million depending on the neighborhood and whether the home is in a guard-gated enclave. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "boulder-city",
    name: "Boulder City",
    city: "Boulder City",
    zip: "89005",
    seoTitle: "Boulder City Homes for Sale | Boulder City, NV Real Estate",
    seoDescription:
      "Boulder City homes for sale in Boulder City, NV — a historic small town near Lake Mead with controlled growth, a charming downtown, and no casino gaming.",
    h1: "Boulder City Homes for Sale in Boulder City, NV",
    eyebrow: "Boulder City, Nevada · Historic Small Town",
    intro:
      "Small-town charm, controlled growth, and Lake Mead at your doorstep — a distinctive alternative just outside Las Vegas.",
    lead:
      "Boulder City is unlike anywhere else in Southern Nevada — a historic town originally built to house Hoover Dam workers, and one of only two Nevada cities that prohibit casino gaming. Known for its walkable historic downtown, deliberately controlled growth, and proximity to Lake Mead National Recreation Area, Boulder City real estate offers a quieter, small-town lifestyle within about a half-hour of Las Vegas.",
    quickFacts: [
      { label: "Location", value: "Boulder City, NV 89005" },
      { label: "Community Type", value: "Historic incorporated city" },
      { label: "Notable", value: "One of two NV cities with no gaming" },
      { label: "Nearby", value: "Lake Mead & Hoover Dam" },
      { label: "Home Types", value: "Historic homes to newer builds" },
      { label: "Price Range", value: "Approx. $400K – $2M+" },
      { label: "Distance to Las Vegas", value: "~26 miles / 30 minutes" },
    ],
    sections: [
      {
        heading: "About Boulder City",
        body: [
          "Built in the early 1930s for the workers who constructed Hoover Dam, Boulder City has preserved its history and small-town character through a long-standing growth-control ordinance that limits new development. The result is a walkable historic downtown lined with shops, restaurants, and galleries, plus a strong sense of community and open space.",
          "Its location at the gateway to Lake Mead makes boating, hiking, and outdoor recreation part of everyday life.",
        ],
      },
      {
        heading: "Homes for Sale in Boulder City",
        body: [
          "Because growth is intentionally limited, Boulder City real estate is comparatively scarce and ranges from charming historic homes near downtown to custom properties and newer construction on the outskirts. Buyers are drawn to the town's character, recreation access, and distinctive lifestyle, so well-located homes can be highly sought after.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Boulder City located?",
        a: "Boulder City is an incorporated city in Nevada (ZIP 89005), about 26 miles southeast of Las Vegas, at the gateway to Lake Mead and Hoover Dam.",
      },
      {
        q: "Why doesn't Boulder City have casinos?",
        a: "Boulder City is one of only two cities in Nevada that prohibit casino gaming, part of the town's long-standing effort to preserve its small-town character.",
      },
      {
        q: "How much do homes in Boulder City cost?",
        a: "Prices generally range from around $400,000 to more than $2 million depending on location, age, and size. Because growth is limited, inventory can be scarce. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "the-summit-club",
    name: "The Summit Club",
    city: "Las Vegas",
    zip: "89135",
    featured: true,
    seoTitle: "The Summit Club Homes for Sale | Summerlin Ultra-Luxury",
    seoDescription:
      "The Summit Club homes for sale in Summerlin, Las Vegas — an ultra-exclusive private club community with a Tom Fazio golf course and custom estates against Red Rock.",
    h1: "The Summit Club Homes for Sale in Summerlin, Las Vegas",
    eyebrow: "Summerlin, Las Vegas · Private Club Community",
    intro:
      "One of the most exclusive private-club communities in the country — custom estates and a Tom Fazio course set against Red Rock Canyon.",
    lead:
      "The Summit Club is among the most exclusive addresses in the United States — a private, guard-gated club community developed within Summerlin against the dramatic backdrop of Red Rock Canyon. Home to a Tom Fazio-designed golf course and an ultra-luxury membership lifestyle, The Summit Club real estate consists of bespoke custom estates for buyers seeking the pinnacle of privacy, design, and service in Las Vegas.",
    quickFacts: [
      { label: "Location", value: "Summerlin, Las Vegas, NV 89135" },
      { label: "Community Type", value: "Private, guard-gated club community" },
      { label: "Signature Amenity", value: "Tom Fazio golf course" },
      { label: "Home Types", value: "Ultra-luxury custom estates" },
      { label: "Price Range", value: "Approx. $4M – $20M+" },
      { label: "Setting", value: "Adjacent to Red Rock Canyon" },
    ],
    sections: [
      {
        heading: "About The Summit Club",
        body: [
          "Developed as a private club community within Summerlin, The Summit Club pairs a championship Tom Fazio golf course with a members-only lifestyle and an emphasis on architecture that responds to its extraordinary desert-and-mountain setting. Membership and privacy are central to the experience, making it one of the valley's most rarefied enclaves.",
        ],
      },
      {
        heading: "Homes for Sale in The Summit Club",
        body: [
          "Residences are custom estates, and availability is limited by design. Pricing reflects the community's exclusivity, generally ranging from several million dollars into the double digits for the largest custom homes. Buyers work with a specialist to navigate the membership and purchase process.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is The Summit Club located?",
        a: "The Summit Club is a private, guard-gated club community within Summerlin in Las Vegas, Nevada (ZIP 89135), adjacent to Red Rock Canyon on the western edge of the valley.",
      },
      {
        q: "Is The Summit Club a private community?",
        a: "Yes. The Summit Club is an ultra-exclusive, membership-based private club community with a guard-gated setting and a Tom Fazio golf course.",
      },
      {
        q: "How much do homes in The Summit Club cost?",
        a: "Prices generally range from approximately $4 million to more than $20 million for custom estates. Contact The Roland Team for current availability and membership details.",
      },
    ],
  },

  {
    slug: "red-rock-country-club",
    name: "Red Rock Country Club",
    city: "Las Vegas",
    zip: "89135",
    seoTitle: "Red Rock Country Club Homes for Sale | Summerlin Golf",
    seoDescription:
      "Red Rock Country Club homes for sale in Summerlin, Las Vegas — a guard-gated golf community with two Arnold Palmer courses, custom estates, and resort amenities.",
    h1: "Red Rock Country Club Homes for Sale in Summerlin",
    eyebrow: "Summerlin, Las Vegas · Guard-Gated Golf",
    intro:
      "A guard-gated Summerlin golf community with two Arnold Palmer Signature courses and a full-service private club.",
    lead:
      "Red Rock Country Club is a guard-gated golf community within Summerlin, built around two Arnold Palmer Signature championship courses and a full-service country club. Offering everything from luxury single-family homes to custom estates with golf and mountain views, Red Rock Country Club real estate is a favorite for buyers who want a private, amenity-rich lifestyle on the valley's scenic west side.",
    quickFacts: [
      { label: "Location", value: "Summerlin, Las Vegas, NV 89135" },
      { label: "Community Type", value: "Guard-gated golf community" },
      { label: "Signature Amenity", value: "Two Arnold Palmer Signature courses" },
      { label: "Home Types", value: "Luxury homes to custom estates" },
      { label: "Price Range", value: "Approx. $600K – $6M+" },
      { label: "Nearby", value: "Red Rock Canyon, Downtown Summerlin" },
    ],
    sections: [
      {
        heading: "About Red Rock Country Club",
        body: [
          "Set within Summerlin, Red Rock Country Club combines guard-gated privacy with a resort-style club experience — two Arnold Palmer Signature golf courses, a clubhouse, dining, fitness, tennis, and pools. Its west-side location places residents near Red Rock Canyon and the shopping and entertainment of Downtown Summerlin.",
        ],
      },
      {
        heading: "Homes for Sale in Red Rock Country Club",
        body: [
          "The community offers a mix of luxury single-family homes and larger custom estates, many with golf-course or mountain views. Pricing varies by location and finish, with premier estate homes commanding the top of the range.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Red Rock Country Club located?",
        a: "Red Rock Country Club is a guard-gated golf community within Summerlin in Las Vegas, Nevada (ZIP 89135), on the western side of the valley near Red Rock Canyon.",
      },
      {
        q: "Does Red Rock Country Club have golf?",
        a: "Yes. The community features two Arnold Palmer Signature championship golf courses along with a full-service private country club.",
      },
      {
        q: "How much do homes in Red Rock Country Club cost?",
        a: "Prices generally range from around $600,000 to more than $6 million depending on the home and its views. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "sun-city-summerlin",
    name: "Sun City Summerlin",
    city: "Las Vegas",
    zip: "89134",
    seoTitle: "Sun City Summerlin Homes for Sale | 55+ Las Vegas Community",
    seoDescription:
      "Sun City Summerlin homes for sale — a premier 55+ active-adult community in Las Vegas with three golf courses, recreation centers, and abundant amenities.",
    h1: "Sun City Summerlin Homes for Sale in Las Vegas, NV",
    eyebrow: "Summerlin, Las Vegas · Active Adult (55+)",
    intro:
      "A premier 55+ active-adult community with three golf courses, multiple recreation centers, and a full calendar of clubs and activities.",
    lead:
      "Sun City Summerlin is one of the Las Vegas Valley's premier age-qualified (55+) active-adult communities, originally developed by Del Webb within Summerlin. With three golf courses, several recreation centers, and an extensive roster of clubs, classes, and activities, Sun City Summerlin real estate is designed for active adults seeking an amenity-rich, low-maintenance lifestyle on the valley's west side.",
    quickFacts: [
      { label: "Location", value: "Summerlin, Las Vegas, NV 89134" },
      { label: "Community Type", value: "Age-qualified 55+ active adult" },
      { label: "Golf", value: "Three community golf courses" },
      { label: "Amenities", value: "Multiple recreation centers" },
      { label: "Home Types", value: "Single-family & attached homes" },
      { label: "Price Range", value: "Approx. $350K – $1.2M+" },
    ],
    sections: [
      {
        heading: "About Sun City Summerlin",
        body: [
          "Built as a Del Webb active-adult community, Sun City Summerlin offers residents 55 and older a lifestyle centered on recreation and connection. Amenities include three golf courses, multiple community centers with fitness facilities and pools, and dozens of clubs and interest groups — all within the established, west-side setting of Summerlin.",
        ],
      },
      {
        heading: "Homes for Sale in Sun City Summerlin",
        body: [
          "The community features a range of single-family and attached homes across many floor plans, offering approachable entry points into the Summerlin area. Elevated sections provide valley and mountain views, and pricing varies by size, location, and updates.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Sun City Summerlin an age-restricted community?",
        a: "Yes. Sun City Summerlin is an age-qualified (55+) active-adult community, meaning at least one resident of each household must generally meet the minimum age requirement.",
      },
      {
        q: "What amenities does Sun City Summerlin offer?",
        a: "Residents have access to three golf courses, multiple recreation centers with fitness and pools, and a wide variety of clubs, classes, and social activities.",
      },
      {
        q: "How much do homes in Sun City Summerlin cost?",
        a: "Prices generally range from around $350,000 to more than $1.2 million depending on floor plan, location, and condition. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "mountains-edge",
    name: "Mountain's Edge",
    city: "Las Vegas",
    zip: "89178",
    seoTitle: "Mountain's Edge Homes for Sale | Southwest Las Vegas",
    seoDescription:
      "Mountain's Edge homes for sale in southwest Las Vegas — a large master-planned community with regional parks, trails, and a wide range of single-family homes.",
    h1: "Mountain's Edge Homes for Sale in Las Vegas, NV",
    eyebrow: "Southwest Las Vegas · Master-Planned Community",
    intro:
      "A large, amenity-rich southwest-valley master plan with regional parks, trails, and elevated mountain views.",
    lead:
      "Mountain's Edge is one of the largest master-planned communities in the southwest Las Vegas Valley, known for its regional parks, extensive trail system, and a broad selection of single-family homes. With its elevated setting against the southern mountains and convenient access to the 215 Beltway, Mountain's Edge real estate offers strong value and amenities for a wide range of buyers.",
    quickFacts: [
      { label: "Location", value: "Southwest Las Vegas, NV 89178" },
      { label: "Community Type", value: "Large master-planned community" },
      { label: "Highlights", value: "Exploration Peak & regional parks, trails" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $400K – $900K+" },
      { label: "Access", value: "Near the 215 Beltway" },
    ],
    sections: [
      {
        heading: "About Mountain's Edge",
        body: [
          "Mountain's Edge is anchored by two large regional parks — including Exploration Peak Park and Mountain's Edge Regional Park — connected by paseos and trails that thread through the community. Its elevated, southern location provides mountain and valley views, and its size means a wide variety of neighborhoods and home styles.",
        ],
      },
      {
        heading: "Homes for Sale in Mountain's Edge",
        body: [
          "The community is composed primarily of single-family homes across many builders and floor plans, offering approachable pricing relative to the valley's luxury enclaves. It's a practical choice for buyers who want space, parks, and convenient freeway access.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Mountain's Edge located?",
        a: "Mountain's Edge is a master-planned community in the southwest Las Vegas Valley (ZIP 89178), near the 215 Beltway and the southern mountains.",
      },
      {
        q: "What parks are in Mountain's Edge?",
        a: "The community features large regional parks including Exploration Peak Park and Mountain's Edge Regional Park, connected by an extensive trail and paseo system.",
      },
      {
        q: "How much do homes in Mountain's Edge cost?",
        a: "Prices generally range from around $400,000 to about $900,000 depending on size, location, and updates. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "skye-canyon",
    name: "Skye Canyon",
    city: "Las Vegas",
    zip: "89166",
    seoTitle: "Skye Canyon Homes for Sale | Northwest Las Vegas",
    seoDescription:
      "Skye Canyon homes for sale in northwest Las Vegas — a newer master-planned community with an outdoor-focused lifestyle, parks, a fitness center, and new construction.",
    h1: "Skye Canyon Homes for Sale in Las Vegas, NV",
    eyebrow: "Northwest Las Vegas · Master-Planned Community",
    intro:
      "A newer, outdoor-focused master plan at higher elevation in the northwest valley — parks, fitness, and modern new construction.",
    lead:
      "Skye Canyon is a newer master-planned community in the northwest Las Vegas Valley, built around an active, outdoor-oriented lifestyle. At a higher elevation near the Sheep Mountains, it offers a signature community park, a fitness and event center, and ongoing new construction from a range of builders — making Skye Canyon real estate popular with buyers who want modern homes and recreation close to home.",
    quickFacts: [
      { label: "Location", value: "Northwest Las Vegas, NV 89166" },
      { label: "Community Type", value: "Newer master-planned community" },
      { label: "Highlights", value: "Skye Canyon Park, fitness & event center" },
      { label: "Home Types", value: "Modern new-construction homes" },
      { label: "Price Range", value: "Approx. $400K – $1M+" },
      { label: "Setting", value: "Higher elevation near Sheep Mountains" },
    ],
    sections: [
      {
        heading: "About Skye Canyon",
        body: [
          "Skye Canyon leans into the outdoors: its central park hosts events and recreation, a community center offers fitness and gathering space, and nearby public lands provide hiking and trail access. Its northwest, higher-elevation location gives it a slightly cooler feel and open mountain views.",
        ],
      },
      {
        heading: "Homes for Sale in Skye Canyon",
        body: [
          "The community continues to grow with new construction from multiple homebuilders, offering modern floor plans and energy-efficient designs across a range of price points. It's one of the northwest valley's most active new-home markets.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Skye Canyon located?",
        a: "Skye Canyon is a master-planned community in the northwest Las Vegas Valley (ZIP 89166), at a higher elevation near the Sheep Mountains.",
      },
      {
        q: "Is Skye Canyon a new community?",
        a: "Yes. Skye Canyon is one of the valley's newer master plans, with ongoing new construction and an outdoor-focused amenity package.",
      },
      {
        q: "How much do homes in Skye Canyon cost?",
        a: "Prices generally range from around $400,000 to more than $1 million depending on the builder, floor plan, and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "cadence",
    name: "Cadence",
    city: "Henderson",
    zip: "89011",
    seoTitle: "Cadence Homes for Sale | Henderson, NV Master-Planned",
    seoDescription:
      "Cadence homes for sale in Henderson, NV — a newer master-planned community with a large central park, trails, events, and modern new-construction homes.",
    h1: "Cadence Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Master-Planned Community",
    intro:
      "A newer Henderson master plan built around a central park and connected trails, with modern new construction and a full events calendar.",
    lead:
      "Cadence is one of Henderson's fastest-growing newer master-planned communities, designed around a large central park, connected trails, and an active community-events program. With modern homes from a range of builders and a location in eastern Henderson near the 215 Beltway, Cadence real estate offers new construction, amenities, and value in a fresh, well-planned setting.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89011" },
      { label: "Community Type", value: "Newer master-planned community" },
      { label: "Highlights", value: "Central Park, trails, community events" },
      { label: "Home Types", value: "Modern new-construction homes" },
      { label: "Price Range", value: "Approx. $400K – $900K+" },
      { label: "Access", value: "Near the 215 Beltway" },
    ],
    sections: [
      {
        heading: "About Cadence",
        body: [
          "Cadence is organized around Cadence Central Park and a network of trails and paseos that connect its neighborhoods. The community is known for its active events calendar and amenities, and it continues to expand with new construction across a variety of home styles and price points in eastern Henderson.",
        ],
      },
      {
        heading: "Homes for Sale in Cadence",
        body: [
          "Homes in Cadence are predominantly newer single-family residences from multiple builders, giving buyers access to modern layouts and efficient designs. Its convenient location and amenity focus make it one of Henderson's most popular newer communities.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Cadence located?",
        a: "Cadence is a master-planned community in eastern Henderson, Nevada (ZIP 89011), near the 215 Beltway.",
      },
      {
        q: "Is Cadence a newer community?",
        a: "Yes. Cadence is one of Henderson's newer, still-growing master plans, with ongoing new construction and a large central park.",
      },
      {
        q: "How much do homes in Cadence cost?",
        a: "Prices generally range from around $400,000 to about $900,000 depending on the builder, floor plan, and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "rhodes-ranch",
    name: "Rhodes Ranch",
    city: "Las Vegas",
    zip: "89148",
    seoTitle: "Rhodes Ranch Homes for Sale | Southwest Las Vegas Golf",
    seoDescription:
      "Rhodes Ranch homes for sale in southwest Las Vegas — a guard-gated master-planned golf community with a public course, clubhouse, parks, and family homes.",
    h1: "Rhodes Ranch Homes for Sale in Las Vegas, NV",
    eyebrow: "Southwest Las Vegas · Guard-Gated Golf",
    intro:
      "A guard-gated southwest-valley golf community with a public course, resort-style amenities, and a range of single-family homes.",
    lead:
      "Rhodes Ranch is a guard-gated master-planned golf community in the southwest Las Vegas Valley, built around the Rhodes Ranch Golf Club and a resort-style amenity center. With controlled-access security, parks, and a variety of single-family homes, Rhodes Ranch real estate offers a gated lifestyle and golf-community setting at an accessible price point.",
    quickFacts: [
      { label: "Location", value: "Southwest Las Vegas, NV 89148" },
      { label: "Community Type", value: "Guard-gated master-planned golf" },
      { label: "Signature Amenity", value: "Rhodes Ranch Golf Club" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $400K – $1M+" },
      { label: "Access", value: "Near the 215 Beltway" },
    ],
    sections: [
      {
        heading: "About Rhodes Ranch",
        body: [
          "Rhodes Ranch pairs guard-gated security with a golf-community lifestyle in the southwest valley. Residents enjoy the Rhodes Ranch Golf Club, a clubhouse, a community amenity center with pools and recreation, and parks — all within a controlled-access setting convenient to the 215 Beltway.",
        ],
      },
      {
        heading: "Homes for Sale in Rhodes Ranch",
        body: [
          "The community consists mainly of single-family homes across a range of sizes and floor plans, offering gated living at approachable prices. Golf-course frontage and larger lots command a premium within the community.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Rhodes Ranch located?",
        a: "Rhodes Ranch is a guard-gated master-planned community in the southwest Las Vegas Valley (ZIP 89148), near the 215 Beltway.",
      },
      {
        q: "Is Rhodes Ranch a gated community?",
        a: "Yes. Rhodes Ranch is a guard-gated community with controlled access, built around the Rhodes Ranch Golf Club and resort-style amenities.",
      },
      {
        q: "How much do homes in Rhodes Ranch cost?",
        a: "Prices generally range from around $400,000 to more than $1 million depending on size, lot, and golf-course frontage. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "providence",
    name: "Providence",
    city: "Las Vegas",
    zip: "89166",
    seoTitle: "Providence Homes for Sale | Northwest Las Vegas",
    seoDescription:
      "Providence homes for sale in northwest Las Vegas — a master-planned community with parks, trails, community centers, and modern homes near Skye Canyon.",
    h1: "Providence Homes for Sale in Las Vegas, NV",
    eyebrow: "Northwest Las Vegas · Master-Planned Community",
    intro:
      "An amenity-rich northwest-valley master plan with parks, trails, and community centers at higher elevation.",
    lead:
      "Providence is a popular master-planned community in the northwest Las Vegas Valley, known for its parks, trail system, and community centers. Set at a slightly higher elevation with mountain views, Providence offers a mix of established and newer homes and a well-planned, connected feel that draws buyers to this growing side of the valley.",
    quickFacts: [
      { label: "Location", value: "Northwest Las Vegas, NV 89166" },
      { label: "Community Type", value: "Master-planned community" },
      { label: "Highlights", value: "Parks, trails, community centers" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $400K – $900K+" },
      { label: "Nearby", value: "Skye Canyon, the 215 Beltway" },
    ],
    sections: [
      {
        heading: "About Providence",
        body: [
          "Providence combines connected parks and paseos with two community centers and an active events calendar. Its northwest location offers elevation and open mountain views while staying convenient to shopping, dining, and the 215 Beltway.",
        ],
      },
      {
        heading: "Homes for Sale in Providence",
        body: [
          "The community offers a range of single-family homes across many floor plans, from approachable move-up homes to larger residences. It's a practical, amenity-focused choice for buyers who want value and lifestyle on the northwest side.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Providence located?",
        a: "Providence is a master-planned community in the northwest Las Vegas Valley (ZIP 89166), near Skye Canyon and the 215 Beltway.",
      },
      {
        q: "What amenities does Providence offer?",
        a: "Providence features parks, an extensive trail system, and community centers with recreation and an active events calendar.",
      },
      {
        q: "How much do homes in Providence cost?",
        a: "Prices generally range from around $400,000 to about $900,000 depending on the home's size and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "centennial-hills",
    name: "Centennial Hills",
    city: "Las Vegas",
    zip: "89149",
    seoTitle: "Centennial Hills Homes for Sale | Northwest Las Vegas",
    seoDescription:
      "Centennial Hills homes for sale in northwest Las Vegas — an established, amenity-rich area with parks, shopping, and a range of single-family homes.",
    h1: "Centennial Hills Homes for Sale in Las Vegas, NV",
    eyebrow: "Northwest Las Vegas · Established Community",
    intro:
      "A convenient, established northwest-valley area with parks, shopping, and a broad range of homes.",
    lead:
      "Centennial Hills is one of the northwest Las Vegas Valley's most established and convenient communities, offering parks, shopping, and a wide selection of single-family homes. With quick access to the 215 Beltway and US-95 and a range of price points, Centennial Hills real estate appeals to buyers who want space and amenities without a luxury-only price tag.",
    quickFacts: [
      { label: "Location", value: "Northwest Las Vegas, NV 89149 / 89131" },
      { label: "Community Type", value: "Established master-planned area" },
      { label: "Highlights", value: "Parks, shopping, easy freeway access" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $400K – $1M+" },
      { label: "Nearby", value: "TPC Las Vegas, the 215 Beltway" },
    ],
    sections: [
      {
        heading: "About Centennial Hills",
        body: [
          "Centennial Hills has grown into a well-rounded northwest community with parks, retail centers, and a hospital campus, all connected by convenient freeway access. Its established neighborhoods and range of home styles make it one of the more versatile areas on the valley's northwest side.",
        ],
      },
      {
        heading: "Homes for Sale in Centennial Hills",
        body: [
          "Buyers will find everything from approachable family homes to larger residences on generous lots. The combination of amenities, value, and location keeps Centennial Hills consistently popular.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Centennial Hills located?",
        a: "Centennial Hills is an established community in the northwest Las Vegas Valley, spanning ZIP codes including 89149 and 89131, near the 215 Beltway and US-95.",
      },
      {
        q: "How much do homes in Centennial Hills cost?",
        a: "Prices generally range from around $400,000 to more than $1 million depending on size, lot, and location. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "aliante",
    name: "Aliante",
    city: "North Las Vegas",
    zip: "89084",
    seoTitle: "Aliante Homes for Sale | North Las Vegas Master-Planned",
    seoDescription:
      "Aliante homes for sale in North Las Vegas — a master-planned community with a golf course, parks, casino resort, and a wide range of family homes.",
    h1: "Aliante Homes for Sale in North Las Vegas, NV",
    eyebrow: "North Las Vegas · Master-Planned Community",
    intro:
      "A well-amenitized North Las Vegas master plan with golf, parks, and a resort at its center.",
    lead:
      "Aliante is a master-planned community in North Las Vegas built around the Aliante Golf Club, extensive parks, and the Aliante Casino + Hotel. With a nature discovery park, trails, and a broad range of single-family homes at approachable prices, Aliante real estate offers strong value and amenities on the valley's north side.",
    quickFacts: [
      { label: "Location", value: "North Las Vegas, NV 89084" },
      { label: "Community Type", value: "Master-planned community" },
      { label: "Signature Amenity", value: "Aliante Golf Club" },
      { label: "Highlights", value: "Parks, trails, casino resort" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $350K – $800K+" },
    ],
    sections: [
      {
        heading: "About Aliante",
        body: [
          "Aliante is anchored by its golf course and a well-planned network of parks and trails, including a nature discovery park. The Aliante Casino + Hotel adds dining and entertainment right within the community, and freeway access via the 215 keeps the rest of the valley close.",
        ],
      },
      {
        heading: "Homes for Sale in Aliante",
        body: [
          "The community offers a wide range of single-family homes at accessible price points, making it a popular choice for buyers seeking amenities and value in North Las Vegas.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Aliante located?",
        a: "Aliante is a master-planned community in North Las Vegas, Nevada (ZIP 89084), near the 215 Beltway.",
      },
      {
        q: "Does Aliante have a golf course?",
        a: "Yes. Aliante is built around the Aliante Golf Club and also features extensive parks, trails, and the Aliante Casino + Hotel.",
      },
      {
        q: "How much do homes in Aliante cost?",
        a: "Prices generally range from around $350,000 to about $800,000 depending on size and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "tuscany",
    name: "Tuscany",
    city: "Henderson",
    zip: "89044",
    seoTitle: "Tuscany Homes for Sale | Henderson, NV Guard-Gated Golf",
    seoDescription:
      "Tuscany Village homes for sale in Henderson, NV — a guard-gated, Mediterranean-inspired master-planned community with a golf course and resort amenities.",
    h1: "Tuscany Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Guard-Gated Community",
    intro:
      "A guard-gated, Mediterranean-inspired Henderson community with a golf course and resort-style amenities.",
    lead:
      "Tuscany Village is a guard-gated, Mediterranean-inspired master-planned community in Henderson, built around the Tuscany Golf Club and a resort-style clubhouse. With tile-roof architecture, parks, and a range of single-family homes, Tuscany real estate offers gated living and golf-community amenities at an accessible price point.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89044" },
      { label: "Community Type", value: "Guard-gated master-planned" },
      { label: "Signature Amenity", value: "Tuscany Golf Club" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $350K – $900K+" },
      { label: "Style", value: "Mediterranean / Tuscan-inspired" },
    ],
    sections: [
      {
        heading: "About Tuscany",
        body: [
          "Tuscany blends guard-gated security with a resort feel — a golf course, a clubhouse with dining, pools, and parks, all wrapped in Mediterranean-inspired architecture. Its Henderson location keeps residents close to shopping, dining, and the 215 Beltway.",
        ],
      },
      {
        heading: "Homes for Sale in Tuscany",
        body: [
          "The community offers single-family homes across a range of sizes and floor plans, giving buyers gated, amenity-rich living at approachable prices.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Tuscany located?",
        a: "Tuscany (Tuscany Village) is a guard-gated master-planned community in Henderson, Nevada (ZIP 89044), near the 215 Beltway.",
      },
      {
        q: "Is Tuscany a gated community?",
        a: "Yes. Tuscany is guard-gated with controlled access, and it's built around the Tuscany Golf Club and a resort-style clubhouse.",
      },
      {
        q: "How much do homes in Tuscany cost?",
        a: "Prices generally range from around $350,000 to about $900,000 depending on size and location. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "silverado-ranch",
    name: "Silverado Ranch",
    city: "Las Vegas",
    zip: "89183",
    seoTitle: "Silverado Ranch Homes for Sale | Southeast Las Vegas",
    seoDescription:
      "Silverado Ranch homes for sale in southeast Las Vegas — an established, convenient area with parks, shopping, and a range of single-family homes.",
    h1: "Silverado Ranch Homes for Sale in Las Vegas, NV",
    eyebrow: "Southeast Las Vegas · Established Community",
    intro:
      "An established, convenient southeast-valley area with parks, shopping, and easy access to the Strip and airport.",
    lead:
      "Silverado Ranch is an established community in the southeast Las Vegas Valley, valued for its convenience — quick access to the 215 Beltway, the Strip, and Harry Reid International Airport — along with parks, shopping, and a range of single-family homes. It's a practical, well-located choice for buyers who want established value close to everything.",
    quickFacts: [
      { label: "Location", value: "Southeast Las Vegas, NV 89183 / 89123" },
      { label: "Community Type", value: "Established residential area" },
      { label: "Highlights", value: "Parks, shopping, freeway access" },
      { label: "Home Types", value: "Single-family homes" },
      { label: "Price Range", value: "Approx. $400K – $800K+" },
      { label: "Distance to Strip", value: "~10 miles / 15 minutes" },
    ],
    sections: [
      {
        heading: "About Silverado Ranch",
        body: [
          "Silverado Ranch offers established neighborhoods, parks, and convenient retail, all within a short drive of the Strip, the airport, and major freeways. Its central-southeast location is a big part of its appeal.",
        ],
      },
      {
        heading: "Homes for Sale in Silverado Ranch",
        body: [
          "The area features a range of single-family homes at accessible prices, making it popular with buyers who prioritize location and value.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Silverado Ranch located?",
        a: "Silverado Ranch is an established community in the southeast Las Vegas Valley, spanning ZIP codes including 89183 and 89123, about 10 miles from the Strip.",
      },
      {
        q: "How much do homes in Silverado Ranch cost?",
        a: "Prices generally range from around $400,000 to about $800,000 depending on size and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "spring-valley",
    name: "Spring Valley",
    city: "Las Vegas",
    zip: "89147",
    seoTitle: "Spring Valley Homes for Sale | Central-West Las Vegas",
    seoDescription:
      "Spring Valley homes for sale in Las Vegas — a centrally located, established area with diverse housing, shopping, and quick access to Summerlin and the Strip.",
    h1: "Spring Valley Homes for Sale in Las Vegas, NV",
    eyebrow: "Central-West Las Vegas · Established Community",
    intro:
      "A centrally located, established area with diverse housing and quick access to Summerlin and the Strip.",
    lead:
      "Spring Valley is a large, established community on the central-west side of the Las Vegas Valley, prized for its central location and diverse housing. From condos and townhomes to single-family homes and gated pockets, Spring Valley real estate offers something for nearly every buyer, with quick access to Summerlin, Chinatown, the Strip, and major freeways.",
    quickFacts: [
      { label: "Location", value: "Central-West Las Vegas, NV 89147 / 89117" },
      { label: "Community Type", value: "Established residential area" },
      { label: "Home Types", value: "Condos to single-family homes" },
      { label: "Highlights", value: "Central location, diverse housing" },
      { label: "Price Range", value: "Approx. $350K – $1M+" },
      { label: "Nearby", value: "Summerlin, the Strip, Chinatown" },
    ],
    sections: [
      {
        heading: "About Spring Valley",
        body: [
          "Spring Valley's biggest draw is location — central to the entire valley, minutes from Summerlin, the Strip, and the dining of Las Vegas's Chinatown corridor. Its size and variety mean a wide range of neighborhoods and price points.",
        ],
      },
      {
        heading: "Homes for Sale in Spring Valley",
        body: [
          "Buyers will find everything from affordable condos and townhomes to established single-family homes and gated communities, making Spring Valley one of the most flexible areas in the valley for matching budget and lifestyle.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Spring Valley located?",
        a: "Spring Valley is an established community on the central-west side of the Las Vegas Valley, spanning ZIP codes including 89147 and 89117, near Summerlin and the Strip.",
      },
      {
        q: "How much do homes in Spring Valley cost?",
        a: "Prices range widely — from around $350,000 for condos and townhomes to more than $1 million for larger or gated homes. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "solera-at-anthem",
    name: "Solera at Anthem",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Solera at Anthem Homes for Sale | 55+ Henderson Community",
    seoDescription:
      "Solera at Anthem homes for sale — a guard-gated 55+ active-adult community in Henderson with a recreation center, clubs, and low-maintenance living.",
    h1: "Solera at Anthem Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Active Adult (55+)",
    intro:
      "A guard-gated 55+ active-adult community in Henderson with a recreation center and an active lifestyle.",
    lead:
      "Solera at Anthem is a guard-gated, age-qualified (55+) active-adult community in Henderson, built by Del Webb within the Anthem area. With a private recreation center, pools, fitness, and a full calendar of clubs and activities, Solera offers low-maintenance living and elevated valley views for active adults seeking community and convenience.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89052" },
      { label: "Community Type", value: "Guard-gated 55+ active adult" },
      { label: "Amenities", value: "Recreation center, pools, fitness" },
      { label: "Home Types", value: "Single-family & attached homes" },
      { label: "Price Range", value: "Approx. $400K – $900K+" },
      { label: "Setting", value: "Elevated, near the Anthem area" },
    ],
    sections: [
      {
        heading: "About Solera at Anthem",
        body: [
          "Solera pairs guard-gated security with a resort-style, age-qualified lifestyle. Residents enjoy a private recreation center with pools and fitness, plus dozens of clubs and social activities — all in an elevated Henderson setting with valley views and low-maintenance homes.",
        ],
      },
      {
        heading: "Homes for Sale in Solera at Anthem",
        body: [
          "The community offers single-family and attached homes across a range of floor plans designed for active-adult living, giving buyers approachable, lock-and-leave options within a gated setting.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Solera at Anthem an age-restricted community?",
        a: "Yes. Solera at Anthem is a guard-gated, age-qualified (55+) active-adult community in Henderson, meaning at least one resident of each household must generally meet the minimum age requirement.",
      },
      {
        q: "What amenities does Solera at Anthem offer?",
        a: "Residents have access to a private recreation center with pools and fitness facilities, plus a wide range of clubs, classes, and social activities.",
      },
      {
        q: "How much do homes in Solera at Anthem cost?",
        a: "Prices generally range from around $400,000 to about $900,000 depending on floor plan and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "sun-city-aliante",
    name: "Sun City Aliante",
    city: "North Las Vegas",
    zip: "89031",
    seoTitle: "Sun City Aliante Homes for Sale | 55+ North Las Vegas",
    seoDescription:
      "Sun City Aliante homes for sale — a 55+ active-adult community in North Las Vegas with a recreation center, golf nearby, and low-maintenance living.",
    h1: "Sun City Aliante Homes for Sale in North Las Vegas, NV",
    eyebrow: "North Las Vegas · Active Adult (55+)",
    intro:
      "A 55+ active-adult community in North Las Vegas with a recreation center and an easygoing lifestyle.",
    lead:
      "Sun City Aliante is an age-qualified (55+) active-adult community in North Las Vegas, built by Del Webb. With a private recreation center, pools, fitness, and abundant clubs and activities — plus golf and the amenities of the Aliante area nearby — Sun City Aliante offers approachable, low-maintenance living for active adults.",
    quickFacts: [
      { label: "Location", value: "North Las Vegas, NV 89031" },
      { label: "Community Type", value: "Age-qualified 55+ active adult" },
      { label: "Amenities", value: "Recreation center, pools, fitness" },
      { label: "Nearby", value: "Aliante Golf Club & casino" },
      { label: "Home Types", value: "Single-family & attached homes" },
      { label: "Price Range", value: "Approx. $350K – $700K+" },
    ],
    sections: [
      {
        heading: "About Sun City Aliante",
        body: [
          "Sun City Aliante offers residents 55 and older a lifestyle centered on recreation and connection — a private community center with fitness and pools, plus dozens of clubs and interest groups. Its North Las Vegas location keeps golf, dining, and everyday conveniences close.",
        ],
      },
      {
        heading: "Homes for Sale in Sun City Aliante",
        body: [
          "The community features single-family and attached homes across many floor plans, offering approachable entry points into age-qualified living on the valley's north side.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Sun City Aliante age-restricted?",
        a: "Yes. Sun City Aliante is an age-qualified (55+) active-adult community in North Las Vegas, meaning at least one resident of each household must generally meet the minimum age requirement.",
      },
      {
        q: "How much do homes in Sun City Aliante cost?",
        a: "Prices generally range from around $350,000 to about $700,000 depending on floor plan and location. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "queensridge",
    name: "Queensridge",
    city: "Las Vegas",
    zip: "89145",
    featured: false,
    seoTitle: "Queensridge Homes for Sale | West Las Vegas Luxury",
    seoDescription:
      "Queensridge homes for sale in west Las Vegas — an upscale, European-inspired guard-gated community and home to the One Queensridge Place luxury towers.",
    h1: "Queensridge Homes for Sale in Las Vegas, NV",
    eyebrow: "West Las Vegas · Guard-Gated Luxury",
    intro:
      "European-inspired luxury on the west side — elegant estates and the landmark One Queensridge Place towers.",
    lead:
      "Queensridge is an upscale, European-inspired community on the west side of the Las Vegas Valley, known for its elegant architecture, mature landscaping, and guard-gated enclaves. It's also home to One Queensridge Place, a pair of landmark luxury high-rise towers offering full-service condominium living. Queensridge real estate appeals to buyers seeking refined luxury close to Summerlin and Downtown Summerlin.",
    quickFacts: [
      { label: "Location", value: "West Las Vegas, NV 89145" },
      { label: "Community Type", value: "Guard-gated luxury; luxury high-rise" },
      { label: "Landmark", value: "One Queensridge Place towers" },
      { label: "Home Types", value: "Estates & luxury condominiums" },
      { label: "Price Range", value: "Approx. $700K – $5M+" },
      { label: "Nearby", value: "Summerlin, Downtown Summerlin" },
    ],
    sections: [
      {
        heading: "About Queensridge",
        body: [
          "Queensridge stands out for its European-inspired design, lush landscaping, and mix of guard-gated estate enclaves and full-service luxury condominium living at One Queensridge Place. Its west-side location keeps residents close to Summerlin's shopping, dining, and entertainment.",
        ],
      },
      {
        heading: "Homes for Sale in Queensridge",
        body: [
          "Buyers can choose from elegant single-family estates to luxury high-rise residences with concierge services. Pricing spans a wide range depending on home type, size, and view.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Queensridge located?",
        a: "Queensridge is an upscale community on the west side of Las Vegas, Nevada (ZIP 89145), near Summerlin and Downtown Summerlin.",
      },
      {
        q: "What is One Queensridge Place?",
        a: "One Queensridge Place is a landmark pair of luxury high-rise towers within Queensridge, offering full-service, concierge condominium living.",
      },
      {
        q: "How much do homes in Queensridge cost?",
        a: "Prices generally range from around $700,000 to more than $5 million depending on whether it's an estate or a luxury condominium, plus size and views. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "the-lakes",
    name: "The Lakes",
    city: "Las Vegas",
    zip: "89117",
    seoTitle: "The Lakes Homes for Sale | West Las Vegas Waterfront",
    seoDescription:
      "The Lakes homes for sale in west Las Vegas — an established master-planned community built around a man-made lake, with waterfront homes and central convenience.",
    h1: "The Lakes Homes for Sale in Las Vegas, NV",
    eyebrow: "West Las Vegas · Waterfront Community",
    intro:
      "An established west-valley community built around a man-made lake, with rare waterfront homes.",
    lead:
      "The Lakes is an established master-planned community on the west side of Las Vegas, built around a man-made lake that gives the neighborhood its name and a handful of rare waterfront homes. Centrally located and mature, The Lakes offers a distinctive setting with quick access to Summerlin, the 215 Beltway, and the rest of the valley.",
    quickFacts: [
      { label: "Location", value: "West Las Vegas, NV 89117" },
      { label: "Community Type", value: "Established master-planned community" },
      { label: "Signature Feature", value: "Man-made lake & waterfront homes" },
      { label: "Home Types", value: "Single-family homes & condos" },
      { label: "Price Range", value: "Approx. $450K – $2M+" },
      { label: "Nearby", value: "Summerlin, the 215 Beltway" },
    ],
    sections: [
      {
        heading: "About The Lakes",
        body: [
          "The Lakes is centered on its namesake lake, with lakeside streets and a limited number of sought-after waterfront homes. As one of the west valley's established communities, it combines mature landscaping and a central location with a setting that's rare in the desert.",
        ],
      },
      {
        heading: "Homes for Sale in The Lakes",
        body: [
          "The community offers single-family homes and condominiums across a range of price points, with waterfront and lake-view homes commanding a premium. Its convenience and character keep it consistently in demand.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is The Lakes located?",
        a: "The Lakes is an established master-planned community in west Las Vegas, Nevada (ZIP 89117), near Summerlin and the 215 Beltway.",
      },
      {
        q: "Does The Lakes have waterfront homes?",
        a: "Yes. The Lakes is built around a man-made lake and includes a limited number of sought-after waterfront and lake-view homes.",
      },
      {
        q: "How much do homes in The Lakes cost?",
        a: "Prices generally range from around $450,000 to more than $2 million depending on the home and whether it has lake frontage. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "roma-hills",
    name: "Roma Hills",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Roma Hills Homes for Sale | Henderson, NV Guard-Gated",
    seoDescription:
      "Roma Hills homes for sale in Henderson, NV — an intimate guard-gated community of custom and semi-custom homes set in the foothills with valley views.",
    h1: "Roma Hills Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Guard-Gated Community",
    intro:
      "An intimate guard-gated community of custom and semi-custom homes in the Henderson foothills.",
    lead:
      "Roma Hills is a smaller guard-gated community in the Henderson foothills, offering custom and semi-custom homes with elevated valley views and a private, exclusive feel. For buyers seeking guard-gated privacy in an intimate setting close to Henderson's amenities, Roma Hills real estate is a distinctive option.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV 89052" },
      { label: "Community Type", value: "Guard-gated, custom & semi-custom" },
      { label: "Setting", value: "Elevated foothills with valley views" },
      { label: "Home Types", value: "Custom & semi-custom homes" },
      { label: "Price Range", value: "Approx. $700K – $3M+" },
    ],
    sections: [
      {
        heading: "About Roma Hills",
        body: [
          "Roma Hills offers guard-gated privacy in an intimate, elevated setting. Its custom and semi-custom homes enjoy valley views and a quiet, exclusive atmosphere, all within easy reach of Henderson's shopping, dining, and freeways.",
        ],
      },
      {
        heading: "Homes for Sale in Roma Hills",
        body: [
          "The community's limited size means inventory is scarce, and its custom homes vary in size and finish. Buyers value the combination of privacy, views, and Henderson convenience.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Roma Hills located?",
        a: "Roma Hills is a guard-gated community in the Henderson foothills (ZIP 89052), with elevated valley views.",
      },
      {
        q: "Is Roma Hills a gated community?",
        a: "Yes. Roma Hills is a guard-gated community of custom and semi-custom homes with a private, intimate feel.",
      },
      {
        q: "How much do homes in Roma Hills cost?",
        a: "Prices generally range from around $700,000 to more than $3 million depending on size and finish. Because the community is small, inventory can be limited. Contact The Roland Team for current listings.",
      },
    ],
  },

  {
    slug: "peccole-ranch",
    name: "Peccole Ranch",
    city: "Las Vegas",
    zip: "89117",
    seoTitle: "Peccole Ranch Homes for Sale | West Las Vegas",
    seoDescription:
      "Peccole Ranch homes for sale in west Las Vegas — an established master-planned community with parks, trails, and convenient access near Summerlin.",
    h1: "Peccole Ranch Homes for Sale in Las Vegas, NV",
    eyebrow: "West Las Vegas · Master-Planned Community",
    intro:
      "An established west-valley master plan with parks, trails, and convenience next to Summerlin.",
    lead:
      "Peccole Ranch is an established master-planned community on the west side of Las Vegas, known for its parks, trails, and mature, tree-lined neighborhoods. Bordering Summerlin and centrally located, Peccole Ranch real estate offers established value and a convenient lifestyle for a wide range of buyers.",
    quickFacts: [
      { label: "Location", value: "West Las Vegas, NV 89117 / 89147" },
      { label: "Community Type", value: "Established master-planned community" },
      { label: "Highlights", value: "Parks, trails, mature landscaping" },
      { label: "Home Types", value: "Single-family homes & condos" },
      { label: "Price Range", value: "Approx. $450K – $1M+" },
      { label: "Nearby", value: "Summerlin, Downtown Summerlin" },
    ],
    sections: [
      {
        heading: "About Peccole Ranch",
        body: [
          "Peccole Ranch offers a well-established, connected community with parks, paseos, and trails, bordering Summerlin on the valley's west side. Its mature landscaping and central location make it a practical, desirable choice.",
        ],
      },
      {
        heading: "Homes for Sale in Peccole Ranch",
        body: [
          "The community includes single-family homes and condominiums, including some gated pockets, across a range of price points — offering established value near Summerlin's amenities.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Peccole Ranch located?",
        a: "Peccole Ranch is an established master-planned community in west Las Vegas (ZIP 89117 / 89147), bordering Summerlin.",
      },
      {
        q: "How much do homes in Peccole Ranch cost?",
        a: "Prices generally range from around $450,000 to more than $1 million depending on size, location, and whether the home is in a gated pocket. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "spanish-trail",
    name: "Spanish Trail",
    city: "Las Vegas",
    zip: "89147",
    featured: true,
    seoTitle: "Spanish Trail Homes for Sale | West Las Vegas Country Club",
    seoDescription:
      "Spanish Trail homes for sale in west Las Vegas — an established guard-gated country-club community with golf, tennis, lakes, and mature luxury estates.",
    h1: "Spanish Trail Homes for Sale in Las Vegas, NV",
    eyebrow: "West Las Vegas · Guard-Gated Country Club",
    intro:
      "One of Las Vegas's original guard-gated country-club communities — mature, elegant, and centrally located minutes from the Strip.",
    lead:
      "Spanish Trail is one of the Las Vegas Valley's original guard-gated country-club communities, a mature and prestigious enclave on the west side built around the private Spanish Trail Country Club. Known for its lush landscaping, tree-lined streets, lakes, and Mediterranean architecture, Spanish Trail real estate ranges from luxury condominiums and townhomes to custom estates, all behind 24-hour guard gates just minutes from the Strip and Chinatown.",
    quickFacts: [
      { label: "Location", value: "West Las Vegas, NV 89147" },
      { label: "Community Type", value: "Guard-gated country club" },
      { label: "Signature Amenity", value: "Spanish Trail Country Club (private golf & tennis)" },
      { label: "Home Types", value: "Condos, townhomes & custom estates" },
      { label: "Price Range", value: "Approx. $500K – $4M+" },
      { label: "Distance to Strip", value: "~7 miles / 12 minutes" },
    ],
    sections: [
      {
        heading: "About Spanish Trail",
        body: [
          "Established as a pioneering guard-gated golf community, Spanish Trail has matured into one of the most established and centrally located luxury addresses in the valley. Its 27-hole private country club, lakes, tennis, and mature landscaping give the community a settled, resort-like feel that newer developments can't yet match.",
          "Behind its guarded gates, Spanish Trail offers a range of neighborhoods — from lock-and-leave condominiums and townhomes to larger custom estates on the golf course — making it versatile for buyers seeking gated privacy close to the center of the valley.",
        ],
      },
      {
        heading: "Homes for Sale in Spanish Trail",
        body: [
          "Spanish Trail real estate spans a broad range of prices and home types, with golf-course and lakefront properties commanding a premium. Its combination of guard-gated security, private club amenities, and a central west-side location keeps it consistently in demand.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Spanish Trail located?",
        a: "Spanish Trail is a guard-gated country-club community in west Las Vegas, Nevada (ZIP 89147), about seven miles from the Strip.",
      },
      {
        q: "Is Spanish Trail a gated community?",
        a: "Yes. Spanish Trail is a 24-hour guard-gated community built around the private Spanish Trail Country Club, with golf, tennis, and lakes.",
      },
      {
        q: "How much do homes in Spanish Trail cost?",
        a: "Prices generally range from around $500,000 for condominiums and townhomes to more than $4 million for custom golf-course estates. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "spanish-hills",
    name: "Spanish Hills",
    city: "Las Vegas",
    zip: "89148",
    featured: true,
    seoTitle: "Spanish Hills Homes for Sale | Las Vegas Luxury Estates",
    seoDescription:
      "Spanish Hills homes for sale in Las Vegas — an exclusive guard-gated community of custom luxury estates on large lots with sweeping Strip and valley views.",
    h1: "Spanish Hills Homes for Sale in Las Vegas, NV",
    eyebrow: "Southwest Las Vegas · Guard-Gated Luxury",
    intro:
      "An exclusive guard-gated enclave of grand custom estates on oversized lots with commanding valley and Strip views.",
    lead:
      "Spanish Hills is one of the southwest valley's most prestigious guard-gated communities — an exclusive enclave of grand custom estates set on unusually large lots, many with sweeping views of the Las Vegas Strip and surrounding mountains. Known for its stately Mediterranean and modern architecture, privacy, and space, Spanish Hills real estate appeals to luxury buyers seeking an established estate address close to the 215 Beltway and Summerlin.",
    quickFacts: [
      { label: "Location", value: "Southwest Las Vegas, NV 89148" },
      { label: "Community Type", value: "Guard-gated custom estates" },
      { label: "Homesites", value: "Oversized lots (often 0.5–1+ acre)" },
      { label: "Home Types", value: "Grand custom luxury estates" },
      { label: "Price Range", value: "Approx. $1.5M – $10M+" },
      { label: "Views", value: "Strip, valley & mountain views" },
    ],
    sections: [
      {
        heading: "About Spanish Hills",
        body: [
          "Spanish Hills stands apart for the scale of its homesites and homes — grand custom estates on large, private lots, many elevated to capture Strip and valley views. The guard-gated community has long been favored by luxury buyers, executives, and public figures seeking privacy and space within easy reach of the freeway and Summerlin.",
        ],
      },
      {
        heading: "Homes for Sale in Spanish Hills",
        body: [
          "Inventory in Spanish Hills is limited and estate-focused, with pricing that reflects the community's exclusivity, lot sizes, and custom finishes. Because homes rarely come available, working with a local luxury specialist is the best way to access opportunities here.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Spanish Hills located?",
        a: "Spanish Hills is a guard-gated luxury community in the southwest Las Vegas Valley (ZIP 89148), near the 215 Beltway.",
      },
      {
        q: "What kind of homes are in Spanish Hills?",
        a: "Spanish Hills is composed of grand custom estates on oversized lots, many with elevated Strip and valley views, behind a 24-hour guard gate.",
      },
      {
        q: "How much do homes in Spanish Hills cost?",
        a: "Prices generally range from approximately $1.5 million to more than $10 million depending on lot size, square footage, and custom finishes. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "reverence",
    name: "Reverence",
    city: "Las Vegas",
    zip: "89138",
    featured: true,
    seoTitle: "Reverence Homes for Sale | Summerlin West Guard-Gated Luxury",
    seoDescription:
      "Reverence homes for sale in Summerlin West, Las Vegas — a guard-gated Toll Brothers community of luxury hillside homes with panoramic valley and Strip views.",
    h1: "Reverence Homes for Sale in Summerlin West, Las Vegas",
    eyebrow: "Summerlin West, Las Vegas · Guard-Gated Luxury",
    intro:
      "A guard-gated Summerlin West community of contemporary luxury homes perched on the valley's western hillsides.",
    lead:
      "Reverence is a guard-gated luxury community by Toll Brothers in Summerlin West, set dramatically into the elevated western edge of the Las Vegas Valley near Red Rock Canyon. With contemporary architecture, hillside homesites, and panoramic views of the valley and Strip, Reverence real estate offers newer luxury construction and a private, amenity-rich lifestyle within the acclaimed Summerlin master plan.",
    quickFacts: [
      { label: "Location", value: "Summerlin West, Las Vegas, NV 89138" },
      { label: "Community Type", value: "Guard-gated luxury (Toll Brothers)" },
      { label: "Setting", value: "Elevated hillsides near Red Rock Canyon" },
      { label: "Home Types", value: "Contemporary luxury single-family homes" },
      { label: "Price Range", value: "Approx. $900K – $4M+" },
      { label: "Amenities", value: "Private clubhouse, pools & trails" },
    ],
    sections: [
      {
        heading: "About Reverence",
        body: [
          "Reverence is one of Summerlin West's premier guard-gated communities, built into the valley's western hillsides for elevation, privacy, and views. Residents enjoy a private amenity center with pools, fitness, and gathering spaces, plus quick access to Red Rock Canyon's trails and the shopping and dining of Downtown Summerlin.",
        ],
      },
      {
        heading: "Homes for Sale in Reverence",
        body: [
          "Homes in Reverence are contemporary luxury residences from a range of collections, many on elevated or view homesites. Pricing reflects the community's newer construction, gated exclusivity, and Summerlin West location, with view lots commanding a premium.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Reverence located?",
        a: "Reverence is a guard-gated luxury community in Summerlin West, Las Vegas, Nevada (ZIP 89138), on the elevated western edge of the valley near Red Rock Canyon.",
      },
      {
        q: "Who built Reverence?",
        a: "Reverence is a Toll Brothers guard-gated community within the Summerlin West master plan, featuring contemporary luxury homes and a private amenity center.",
      },
      {
        q: "How much do homes in Reverence cost?",
        a: "Prices generally range from around $900,000 to more than $4 million depending on the collection, homesite, and views. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "tournament-hills",
    name: "Tournament Hills",
    city: "Las Vegas",
    zip: "89144",
    featured: true,
    seoTitle: "Tournament Hills Homes for Sale | Summerlin Guard-Gated Luxury",
    seoDescription:
      "Tournament Hills homes for sale in Summerlin, Las Vegas — an established guard-gated luxury enclave of custom estates near TPC Summerlin with mountain views.",
    h1: "Tournament Hills Homes for Sale in Summerlin, Las Vegas",
    eyebrow: "Summerlin, Las Vegas · Guard-Gated Luxury",
    intro:
      "An established guard-gated enclave of custom luxury estates in the heart of Summerlin near TPC Summerlin.",
    lead:
      "Tournament Hills is a prestigious guard-gated luxury enclave in the established heart of Summerlin, known for its custom estates, mature landscaping, and proximity to the private TPC Summerlin golf course. With larger lots, refined architecture, and a central Summerlin location, Tournament Hills real estate appeals to luxury buyers who want an established, guard-gated address close to Downtown Summerlin and top schools.",
    quickFacts: [
      { label: "Location", value: "Summerlin, Las Vegas, NV 89144" },
      { label: "Community Type", value: "Guard-gated custom estates" },
      { label: "Nearby Golf", value: "TPC Summerlin (private)" },
      { label: "Home Types", value: "Custom luxury estates" },
      { label: "Price Range", value: "Approx. $1.2M – $6M+" },
      { label: "Setting", value: "Established central Summerlin" },
    ],
    sections: [
      {
        heading: "About Tournament Hills",
        body: [
          "Tournament Hills is one of Summerlin's established guard-gated luxury communities, prized for its custom estates, mature streetscapes, and location beside the private TPC Summerlin course. Its central Summerlin position puts residents minutes from Downtown Summerlin, parks and trails, and highly regarded schools.",
        ],
      },
      {
        heading: "Homes for Sale in Tournament Hills",
        body: [
          "Homes in Tournament Hills are predominantly custom luxury estates on generous lots, with pricing that reflects the community's gated exclusivity and prime Summerlin setting. Availability is limited, so a local specialist is the best way to find opportunities.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Tournament Hills located?",
        a: "Tournament Hills is a guard-gated luxury community in the established heart of Summerlin, Las Vegas, Nevada (ZIP 89144), near TPC Summerlin.",
      },
      {
        q: "Is Tournament Hills a gated community?",
        a: "Yes. Tournament Hills is a guard-gated enclave of custom luxury estates within Summerlin.",
      },
      {
        q: "How much do homes in Tournament Hills cost?",
        a: "Prices generally range from approximately $1.2 million to more than $6 million depending on lot size, square footage, and finishes. Contact The Roland Team for current availability.",
      },
    ],
  },

  {
    slug: "sun-city-anthem",
    name: "Sun City Anthem",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Sun City Anthem Homes for Sale in Henderson, NV",
    seoDescription: "Explore Sun City Anthem homes for sale in Henderson, NV — a 55+ active-adult Del Webb community with resort-style amenities and mountain views.",
    h1: "Sun City Anthem Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · 55+ Active Adult",
    intro: "A landmark Del Webb active-adult community set in the Anthem foothills of south Henderson, offering resort-style recreation and single-story living.",
    lead: "Sun City Anthem is one of the Las Vegas Valley's largest and most established age-restricted 55+ communities, occupying an elevated pocket of Anthem in south Henderson with sweeping mountain and valley views. Built by Del Webb, the community is known for its multiple resident recreation centers, resort-style and indoor pools, fitness facilities, and a packed calendar of clubs and social activities. Homes are predominantly single-story, ranging from cozy attached villas to spacious detached floor plans on larger homesites. For buyers comparing options among [active-adult communities in Las Vegas](/active-adult-communities-las-vegas), Sun City Anthem stands out for its scale, amenity depth, and convenient access to shopping, dining, and the M Resort. Contact The Roland Team to tour available homes and discuss current pricing and availability.",
    quickFacts: [
      { label: "Location", value: "Anthem, Henderson, NV 89052" },
      { label: "Community Type", value: "Age-restricted 55+ active adult" },
      { label: "Setting", value: "Elevated south Henderson foothills with mountain and valley views" },
      { label: "Home Style", value: "Predominantly single-story homes" },
      { label: "Approx. Price Range", value: "Approx. $350,000–$700,000+" },
      { label: "Signature Amenity", value: "Multiple resident recreation centers with resort-style and indoor pools" },
      { label: "Distance to the Strip", value: "Approx. 20–25 minutes" },
    ],
    sections: [
      {
        heading: "About Sun City Anthem",
        body: [
          "Developed by Del Webb, Sun City Anthem is a large, well-known 55+ active-adult community occupying an elevated portion of the Anthem master plan in south Henderson. Its hillside setting gives many streets and backyards views of the surrounding mountains and the valley below, a feature that has long made it a sought-after option among Henderson's [age-restricted communities](/active-adult-communities-las-vegas).",
          "The community is age-restricted to residents 55 and older but is not guard-gated, keeping access straightforward for residents, family, and guests while still maintaining the community's active-adult character.",
        ],
      },
      {
        heading: "Homes & Real Estate",
        body: [
          "Sun City Anthem's housing stock spans a wide range of single-story floor plans, from efficient attached villas to larger detached homes with three-car garages and expansive great rooms. Because the community was built out over several phases, floor plans, lot sizes, and finish levels vary meaningfully from one neighborhood to the next.",
          "Pricing is approximate and shifts with inventory, lot premiums, and level of updating — Approx. $350,000 to $700,000 or more for larger, view-oriented homes. Buyers weighing budget against space and finishes may find it useful to run numbers through an [affordability calculator](/calculators/home-affordability) before touring, and to check [current listings](/listings) for up-to-date availability. Contact The Roland Team for current availability and pricing.",
        ],
      },
      {
        heading: "Amenities & Active-Adult Lifestyle",
        body: [
          "Sun City Anthem is built around several resident recreation centers, each offering a different mix of fitness, social, and recreational space. Amenities across the community include resort-style outdoor pools, an indoor pool, fully equipped fitness centers, and dedicated spaces for classes, cards, and hobby groups.",
          "Outdoor recreation includes pickleball and tennis courts, walking and biking trails, and a full calendar of clubs and organized activities that residents can join year-round.",
        ],
        bullets: [
          "Multiple resident recreation centers",
          "Resort-style outdoor pools and an indoor pool",
          "Fitness centers and group exercise classes",
          "Pickleball and tennis courts",
          "Walking trails and an active social/clubs calendar",
        ],
      },
      {
        heading: "Location & Nearby",
        body: [
          "Sun City Anthem sits just off Anthem Parkway with convenient access to I-15 and US-95, putting the Las Vegas Strip within an easy drive. The community is close to the M Resort and other Henderson dining, shopping, and entertainment options.",
          "Buyers exploring the broader area can browse more of [Henderson](/areas/henderson) or compare Sun City Anthem with sister communities like [Solera at Anthem](/communities/solera-at-anthem) and [Sun City Summerlin](/communities/sun-city-summerlin) on the opposite side of the valley.",
        ],
      },
      {
        heading: "Who Sun City Anthem Suits",
        body: [
          "Sun City Anthem is best suited to buyers 55 and older who want an amenity-rich, low-maintenance single-story home within a large, established active-adult community. Its scale and amenity variety appeal to residents who value an active social calendar as much as the home itself.",
          "It also draws relocating retirees and downsizers who want elevated views and quick freeway access without sacrificing community connection. To see what's currently available, [browse all communities](/communities) or reach out directly.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Sun City Anthem located?",
        a: "Sun City Anthem is located in the Anthem area of south Henderson, Nevada, in the approximately 89052 ZIP code, with elevated streets offering mountain and valley views and easy access to I-15 and US-95.",
      },
      {
        q: "What is the price range for homes in Sun City Anthem?",
        a: "Homes in Sun City Anthem generally range from approximately $350,000 to $700,000 or more, depending on floor plan, lot, view, and updates. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "Is Sun City Anthem age-restricted?",
        a: "Yes, Sun City Anthem is an age-restricted 55+ active-adult community. It is not guard-gated, though access and community rules still reflect its active-adult focus.",
      },
      {
        q: "What types of homes are available in Sun City Anthem?",
        a: "Sun City Anthem offers predominantly single-story homes, including attached villas and larger detached floor plans with two- and three-car garages. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "What amenities does Sun City Anthem offer?",
        a: "Residents have access to multiple recreation centers, resort-style and indoor pools, fitness centers, pickleball and tennis courts, walking trails, and an active calendar of clubs and social events.",
      },
    ],
  },

  {
    slug: "anthem-country-club",
    name: "Anthem Country Club",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Anthem Country Club Homes for Sale in Henderson, NV",
    seoDescription: "Explore Anthem Country Club homes for sale in Henderson, NV — a guard-gated private golf community with mountain and Strip views. Contact The Roland Team.",
    h1: "Anthem Country Club Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Guard-Gated Golf",
    intro: "Custom and semi-custom luxury homes wrapped around a private championship golf course in the guard-gated hills of Anthem.",
    lead: "Anthem Country Club sits within the master-planned community of Anthem in Henderson, Nevada, offering a guard-gated, membership-based lifestyle built around a private championship golf course. The elevated terrain here gives many home sites sweeping views of the surrounding mountains and the Las Vegas Strip skyline in the distance. Residences range from spacious semi-custom estates to fully custom luxury homes, many finished with courtyard entries, resort-style pools, and multi-car garages. A full-service clubhouse anchors the community with dining, fitness, tennis, and social programming for members. For buyers seeking privacy, architectural variety, and an established golf-club setting close to the Las Vegas Strip, Anthem Country Club remains one of Henderson's most recognized addresses.",
    quickFacts: [
      { label: "Location", value: "Anthem, Henderson, NV 89052" },
      { label: "Community Type", value: "Guard-gated golf community" },
      { label: "Setting", value: "Elevated hillside with mountain & Strip views" },
      { label: "Approx. Price Range", value: "Approx. $900K – $3M+" },
      { label: "Distance to Strip", value: "Approx. 20–25 minutes" },
      { label: "Signature Amenity", value: "Private championship golf course" },
      { label: "Home Style", value: "Custom & semi-custom luxury estates" },
      { label: "Club Access", value: "Membership-based private club" },
    ],
    sections: [
      {
        heading: "About Anthem Country Club",
        body: [
          "Anthem Country Club is a guard-gated enclave within the broader Anthem community in Henderson, developed around a private championship golf course. The neighborhood's elevated position in the foothills gives it a distinct sense of separation from the valley floor below, with many streets offering long sightlines toward the mountains and, on clear days, the Strip.",
          "The community was designed with curb appeal and architectural consistency in mind, blending Mediterranean, Tuscan, and contemporary desert influences across its custom and semi-custom home sections.",
        ],
      },
      {
        heading: "Homes & Real Estate in Anthem Country Club",
        body: [
          "Home sizes and finishes vary widely across Anthem Country Club's guard-gated neighborhoods, from semi-custom production estates to one-off custom builds on larger lots. Pricing is approximate and shifts with inventory and finish level, so buyers should [contact The Roland Team for current availability and pricing](/contact) or explore [current listings](/listings) for up-to-date options.",
        ],
        bullets: [
          "Semi-custom and fully custom single-story and two-story floor plans",
          "Golf course, mountain, and city-light view lots in select sections",
          "Private pools, casitas, and multi-car garages common in larger estates",
          "Gated sub-neighborhoods within the broader guard-gated perimeter",
        ],
      },
      {
        heading: "Golf & Club Amenities",
        body: [
          "At the center of the community is a private championship golf course, accessible through club membership rather than public play. The clubhouse complements the course with dining venues, a fitness center, and tennis facilities, giving residents a full country-club experience without leaving the neighborhood.",
          "Buyers interested in a golf-centric lifestyle may also want to compare Anthem Country Club with other private layouts on our [golf communities in Las Vegas](/golf-communities-las-vegas) page.",
        ],
      },
      {
        heading: "Location & Nearby Conveniences",
        body: [
          "Anthem Country Club sits in Henderson's Anthem district, within easy reach of shopping, dining, and everyday services along the Eastern Avenue and St. Rose Parkway corridors. The location offers a quieter, elevated setting while remaining a manageable drive to the Las Vegas Strip and McCarran-area employment centers.",
          "For a broader look at homes and neighborhoods throughout the city, visit our [Henderson area guide](/areas/henderson) or browse [all communities](/communities).",
        ],
      },
      {
        heading: "Who Anthem Country Club Suits",
        body: [
          "Anthem Country Club tends to appeal to buyers who want a private, guard-gated setting paired with an active golf and club lifestyle, along with move-up buyers and relocating professionals drawn to its elevated views and architectural variety.",
          "Comparable guard-gated golf options in the valley include [Seven Hills](/communities/seven-hills) and [Red Rock Country Club](/communities/red-rock-country-club); browse [guard-gated communities in Las Vegas](/guard-gated-communities-las-vegas) for a fuller comparison, or get a free [home value estimate](/home-value) if you're considering selling here.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is Anthem Country Club located?",
        a: "Anthem Country Club is located within the Anthem master-planned community in Henderson, Nevada, ZIP code approximately 89052, in the hills above the valley floor.",
      },
      {
        q: "What is the price range for homes in Anthem Country Club?",
        a: "Home prices in Anthem Country Club vary by size, lot, and finish level, generally ranging from the high $900,000s to $3 million or more. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "Is Anthem Country Club guard-gated?",
        a: "Yes, Anthem Country Club is a guard-gated community with controlled access, offering an added layer of privacy and security for residents.",
      },
      {
        q: "Is the golf course at Anthem Country Club private?",
        a: "Yes, the championship golf course at Anthem Country Club is private and operates on a membership basis rather than public or resort play.",
      },
      {
        q: "What types of homes are available in Anthem Country Club?",
        a: "Anthem Country Club offers both semi-custom and fully custom single- and two-story luxury homes, including options with golf course, mountain, or city-light views. Contact The Roland Team for current availability and pricing.",
      },
    ],
  },

  {
    slug: "green-valley-ranch",
    name: "Green Valley Ranch",
    city: "Henderson",
    zip: "89052",
    seoTitle: "Green Valley Ranch Homes for Sale | Henderson, NV",
    seoDescription: "See homes for sale in Green Valley Ranch, Henderson, NV — tree-lined streets, The District shops and dining, parks, trails, and 215 Beltway access.",
    h1: "Green Valley Ranch Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Master-Planned",
    intro: "Green Valley Ranch is one of Henderson's most established master-planned communities, known for its tree-lined streets, walkable open-air retail, and easy freeway access.",
    lead: "Developed over several decades, Green Valley Ranch has grown into one of the Las Vegas Valley's most recognizable master-planned communities. Its layout favors mature landscaping, curving tree-lined streets, and a network of parks and trails that give the area a settled, walkable feel uncommon in newer Henderson developments. Homes range from traditional single-family layouts to select gated enclaves, offering options for a wide range of buyers and price points. At the community's core sits The District at Green Valley Ranch, an open-air shopping and dining destination, along with the Green Valley Ranch Resort & Spa. For buyers weighing several Henderson neighborhoods, our [Henderson area guide](/areas/henderson) is a useful starting point.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV (ZIP 89052)" },
      { label: "Community Type", value: "Master-planned" },
      { label: "Setting", value: "Tree-lined streets, parks, and trails" },
      { label: "Approx. Price Range", value: "Approx. $450K–$1.5M+" },
      { label: "Distance to the Strip", value: "Approx. 15–20 minutes" },
      { label: "Signature Amenity", value: "The District at Green Valley Ranch" },
      { label: "Home Styles", value: "Single-family homes, some gated enclaves" },
    ],
    sections: [
      {
        heading: "About Green Valley Ranch",
        body: [
          "Green Valley Ranch was among the earlier large-scale master-planned communities to take shape in Henderson, and its maturity shows — established trees, developed landscaping, and a layout built around walkable pockets of retail rather than isolated subdivisions. The community blends into the surrounding Green Valley area while retaining its own distinct identity anchored by The District.",
          "The result is a neighborhood that feels settled rather than newly built, appealing to buyers who prefer established infrastructure, mature streetscapes, and proximity to daily conveniences over a brand-new build site.",
        ],
      },
      {
        heading: "Homes & Real Estate",
        body: [
          "Housing stock in Green Valley Ranch is varied, spanning single-family homes on traditional lots as well as a number of smaller gated enclaves offering additional privacy. Architectural styles reflect the community's build-out over multiple phases, giving buyers a range of floor plans, lot sizes, and price points to choose from.",
          "Because inventory and pricing shift regularly, the most accurate way to see what's currently available is to browse [current listings](/listings) or reach out directly for a tailored search.",
        ],
        bullets: [
          "Single-family homes on a range of lot sizes",
          "Select gated enclaves within the larger community",
          "Mix of resale and periodically updated properties",
          "Options spanning starter to move-up and luxury price points",
        ],
      },
      {
        heading: "Amenities & Lifestyle",
        body: [
          "Daily life in Green Valley Ranch centers on walkability and green space. Parks and multi-use trails connect residential pockets throughout the community, while The District at Green Valley Ranch provides open-air shopping, restaurants, and a movie theater within easy reach of most homes.",
          "The Green Valley Ranch Resort & Spa adds a resort-style anchor to the area, with dining, a spa, and event space that give the community a hospitality feel beyond a typical suburban development.",
        ],
      },
      {
        heading: "Location & Nearby",
        body: [
          "Green Valley Ranch sits in central Henderson with convenient access to the 215 Beltway, making commutes to the Las Vegas Strip, McCarran-area employment, and neighboring Henderson communities straightforward. The District at Green Valley Ranch and the Green Valley Ranch Resort & Spa are both within the community, reducing the need to leave the neighborhood for everyday errands or a night out.",
          "Buyers comparing options nearby often also look at Green Valley or Seven Hills; you can review all of Henderson's neighborhoods on our [communities](/communities) page or dig deeper into the broader [Henderson area guide](/areas/henderson).",
        ],
      },
      {
        heading: "Who It Suits",
        body: [
          "Green Valley Ranch tends to appeal to buyers who value an established, tree-lined setting with walkable retail and dining, without sacrificing quick access to major roadways. Its mix of home types also makes it flexible for buyers moving between price points within the same community.",
          "If you're weighing Green Valley Ranch against other Henderson neighborhoods, our team can walk through the tradeoffs — [contact us](/contact) to get started.",
        ],
      },
    ],
    faqs: [
      {
        q: "What ZIP code is Green Valley Ranch in?",
        a: "Green Valley Ranch is primarily located in the 89052 ZIP code in Henderson, NV.",
      },
      {
        q: "Is Green Valley Ranch a gated community?",
        a: "The community overall is not fully gated, though it includes several smaller gated enclaves within its boundaries offering additional privacy.",
      },
      {
        q: "What is The District at Green Valley Ranch?",
        a: "The District is an open-air shopping and dining center within the community, featuring restaurants, retail shops, and a movie theater.",
      },
      {
        q: "How far is Green Valley Ranch from the Las Vegas Strip?",
        a: "Green Valley Ranch is approximately 15–20 minutes from the Las Vegas Strip via the 215 Beltway, depending on traffic.",
      },
      {
        q: "What is the price range for homes in Green Valley Ranch?",
        a: "Home prices in Green Valley Ranch generally range from the mid $400,000s to well over $1.5 million depending on size, lot, and location within the community. Contact The Roland Team for current availability and pricing.",
      },
    ],
  },

  {
    slug: "whitney-ranch",
    name: "Whitney Ranch",
    city: "Henderson",
    zip: "89014",
    seoTitle: "Whitney Ranch Homes for Sale | Henderson, NV",
    seoDescription: "Explore Whitney Ranch in Henderson, NV — an established master-planned community with a recreation center, parks, and strong value near Galleria at Sunset.",
    h1: "Whitney Ranch Homes for Sale in Henderson, NV",
    eyebrow: "Henderson, Nevada · Established Value",
    intro: "Whitney Ranch is an established master-planned community in Henderson offering solid value, everyday convenience, and a well-used recreation center for residents of all ages.",
    lead: "Tucked into central Henderson, Whitney Ranch has long been a favorite for buyers who want a settled, tree-lined neighborhood without a new-construction price tag. The community mixes single-family homes and townhomes across a range of layouts, most built with mature landscaping already in place. A central recreation center anchors the community with parks and shared green space nearby. Its location near the Galleria at Sunset mall and quick freeway access make daily errands, commuting, and dining simple. For buyers comparing established Henderson neighborhoods, Whitney Ranch consistently stands out on price relative to location.",
    quickFacts: [
      { label: "Location", value: "Henderson, NV · ZIP 89014" },
      { label: "Community Type", value: "Established master-planned" },
      { label: "Setting", value: "Central Henderson, near shopping and freeways" },
      { label: "Approx. Price Range", value: "Approx. $350,000–$500,000" },
      { label: "Distance to the Strip", value: "Approx. 15–20 minutes" },
      { label: "Signature Amenity", value: "Community recreation center & parks" },
      { label: "Home Styles", value: "Single-family homes & townhomes" },
      { label: "Typical Buyer", value: "First-time & move-up buyers" },
    ],
    sections: [
      {
        heading: "About Whitney Ranch",
        body: [
          "Whitney Ranch is one of Henderson's established master-planned communities, developed with a mix of housing types designed to serve a broad range of budgets and lifestyles. Mature trees, consistent landscaping, and a network of parks give the community a settled, walkable feel that newer subdivisions often take years to achieve.",
          "The neighborhood's central Henderson location places residents within easy reach of shopping, dining, schools, and major roadways — a big part of why it continues to attract steady buyer interest year after year.",
        ],
      },
      {
        heading: "Homes & Real Estate in Whitney Ranch",
        body: [
          "Whitney Ranch offers a mix of single-family detached homes and townhomes, with floor plans ranging from cozy starter layouts to larger family-sized homes. Because the community is well established, resale inventory varies throughout the year, and lot sizes, upgrades, and condition can differ significantly from block to block.",
          "Pricing in Whitney Ranch tends to run below many of Henderson's newer master-planned communities, making it a popular entry point for buyers who want a Henderson address without a premium price tag.",
        ],
        bullets: [
          "Single-family homes and townhome options",
          "Range of lot sizes and floor plans",
          "Many homes feature mature, established landscaping",
          "Frequent turnover keeps resale inventory active",
        ],
      },
      {
        heading: "Amenities & Recreation",
        body: [
          "The community's recreation center is the social hub of Whitney Ranch, offering residents a gathering space along with nearby parks and open green areas for walking, play, and everyday outdoor time. Sidewalks and community pathways connect much of the neighborhood, making it easy to get around on foot or by bike.",
        ],
      },
      {
        heading: "Location & Nearby Conveniences",
        body: [
          "Whitney Ranch's central Henderson location is one of its biggest draws. The Galleria at Sunset mall is just minutes away, offering shopping, dining, and entertainment options without a long drive. Quick access to US-95, I-515, and the 215 Beltway makes commuting to the Las Vegas Strip, Henderson Executive Airport area, or other parts of the valley straightforward.",
          "Buyers who want to compare nearby options often look at [Green Valley](/communities/green-valley) or browse the broader [Henderson area guide](/areas/henderson) for additional context on schools, commute times, and neighborhood character.",
        ],
      },
      {
        heading: "Who Whitney Ranch Suits",
        body: [
          "Whitney Ranch is especially well suited to first-time buyers looking for an affordable entry point into Henderson, as well as move-up buyers who want more space or an upgraded home without leaving the area. Its blend of value pricing and established infrastructure makes it a practical choice for buyers prioritizing location and budget together.",
          "If you're planning your next steps, try the [home affordability calculator](/calculators/home-affordability) or start the [mortgage pre-approval](/mortgage-pre-approval) process to understand your buying power in Whitney Ranch.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Whitney Ranch a good area for first-time homebuyers?",
        a: "Yes. Whitney Ranch is known as one of Henderson's more accessible established communities, offering a mix of home sizes and price points that tend to appeal to first-time and move-up buyers alike.",
      },
      {
        q: "What amenities does Whitney Ranch offer?",
        a: "The community features a central recreation center along with parks and shared green space, giving residents convenient options for recreation close to home.",
      },
      {
        q: "How far is Whitney Ranch from the Las Vegas Strip?",
        a: "Whitney Ranch is roughly 15–20 minutes from the Las Vegas Strip, depending on traffic, with quick access to US-95, I-515, and the 215 Beltway for commuting around the valley.",
      },
      {
        q: "What types of homes are available in Whitney Ranch?",
        a: "Whitney Ranch offers a mix of single-family homes and townhomes with a range of floor plans and lot sizes. You can browse current [listings](/listings) to see what's actively available.",
      },
      {
        q: "What is the price range for homes in Whitney Ranch?",
        a: "Home prices in Whitney Ranch generally run lower than many newer Henderson communities, offering strong relative value. Contact The Roland Team for current availability and pricing.",
      },
    ],
  },

  {
    slug: "the-cliffs",
    name: "The Cliffs",
    city: "Las Vegas",
    zip: "89135",
    seoTitle: "The Cliffs at Summerlin Homes for Sale | Las Vegas",
    seoDescription: "Explore The Cliffs, a contemporary desert-modern village in Summerlin near Red Rock Canyon. Newer construction, trails, and mountain views in Las Vegas.",
    h1: "The Cliffs at Summerlin Homes for Sale",
    eyebrow: "Summerlin, Las Vegas · Modern Desert Village",
    intro: "The Cliffs is a contemporary desert-modern village on the western edge of the Summerlin master plan, prized for newer construction and proximity to Red Rock Canyon.",
    lead: "Tucked along the western edge of [Summerlin](/communities/summerlin), The Cliffs is known for its clean-lined, contemporary desert-modern architecture and predominantly newer construction. The village sits near Exploration Peak Park and backs up toward Red Rock Canyon, giving residents an unusually direct connection to open desert and mountain scenery. An extensive trail network threads through the area, linking homes to parks, greenbelts, and the broader Summerlin trail system. Buyers considering The Cliffs are often drawn to its architecture, walkability, and setting rather than any single amenity, making it a distinct pocket within Summerlin's larger footprint.",
    quickFacts: [
      { label: "Location", value: "ZIP 89135, western Summerlin" },
      { label: "Community Type", value: "Summerlin village" },
      { label: "Setting", value: "Near Red Rock Canyon and Exploration Peak Park" },
      { label: "Approx. Price Range", value: "Approx. $700K–$2M+, varies by home and lot" },
      { label: "Distance to the Strip", value: "Approximately 20–25 minutes" },
      { label: "Signature Feature", value: "Extensive trail network and mountain-view parks" },
      { label: "Home Style", value: "Contemporary desert-modern, largely newer construction" },
      { label: "Nearby Recreation", value: "Exploration Peak Park and Red Rock Canyon trailheads" },
    ],
    sections: [
      {
        heading: "About the Village",
        body: [
          "The Cliffs is one of the newer villages within the [Summerlin](/communities/summerlin) master plan, developed with an emphasis on contemporary architecture and a strong indoor-outdoor connection to the surrounding desert landscape.",
          "Streets throughout the village are designed around walkability, with landscaped parks and trail connections woven between residential pockets rather than isolated at the edges.",
        ],
      },
      {
        heading: "Homes & Real Estate",
        body: [
          "Homes in The Cliffs tend to reflect current design trends, including clean facades, larger windows, and open layouts, with many properties built in recent years compared to older Summerlin villages.",
          "Pricing and inventory shift with the broader Las Vegas market, so buyers should treat any range as a general guide rather than a current quote.",
        ],
        bullets: [
          "Predominantly newer, contemporary desert-modern construction",
          "Mix of single-family homes across varying lot sizes",
          "Some properties offer elevated or canyon-facing views",
        ],
      },
      {
        heading: "Amenities & Summerlin Lifestyle",
        body: [
          "As part of Summerlin, residents of The Cliffs have access to the master plan's broader network of parks, trails, and community centers, in addition to amenities specific to the village itself.",
          "The area's parks and trailheads make outdoor recreation a routine part of daily life rather than an occasional destination.",
        ],
      },
      {
        heading: "Location & Nearby",
        body: [
          "The Cliffs sits near Exploration Peak Park, a popular local green space, and is close to trailheads leading toward Red Rock Canyon.",
          "Its western position within Summerlin keeps it a short drive from shopping, dining, and everyday services, while still offering a quieter, more scenic setting than communities closer to the urban core.",
        ],
      },
      {
        heading: "Who It Suits",
        body: [
          "The Cliffs tends to appeal to buyers who want modern architecture paired with easy access to trails and open desert scenery, whether they are relocating, upsizing, or looking for a newer-construction home within Summerlin.",
          "Those exploring options nearby may also want to browse current [new construction](/new-construction) or compare it with other [Las Vegas area](/areas/las-vegas) communities.",
        ],
      },
    ],
    faqs: [
      {
        q: "What kind of architecture is found in The Cliffs?",
        a: "The Cliffs is known for contemporary desert-modern architecture, with clean lines, larger windows, and design that emphasizes a connection to the surrounding desert landscape.",
      },
      {
        q: "Is The Cliffs part of Summerlin?",
        a: "Yes, The Cliffs is a village within the larger [Summerlin](/communities/summerlin) master-planned community on the western edge of Las Vegas.",
      },
      {
        q: "What outdoor recreation is near The Cliffs?",
        a: "The village is close to Exploration Peak Park and trailheads leading toward Red Rock Canyon, with an extensive local trail network connecting to the broader Summerlin trail system.",
      },
      {
        q: "How far is The Cliffs from the Las Vegas Strip?",
        a: "The Cliffs is roughly 20–25 minutes from the Strip by car, depending on traffic and exact destination.",
      },
      {
        q: "What does it cost to buy a home in The Cliffs?",
        a: "Home prices in The Cliffs vary by size, lot, and view, and shift with market conditions. You can also check your own home's estimated value using our [home value tool](/home-value) or browse current [listings](/listings). Contact The Roland Team for current availability and pricing.",
      },
    ],
  },

  {
    slug: "stonebridge",
    name: "Stonebridge",
    city: "Las Vegas",
    zip: "89138",
    seoTitle: "Stonebridge Summerlin Homes for Sale | Las Vegas, NV",
    seoDescription: "Explore Stonebridge, a newer Summerlin West village near Red Rock Canyon with modern homes, parks, and trails. See current homes for sale.",
    h1: "Stonebridge at Summerlin Homes for Sale",
    eyebrow: "Summerlin West, Las Vegas · Newer Village",
    intro: "Stonebridge is one of Summerlin West's newer villages, set along the base of Red Rock Canyon on the western edge of Las Vegas.",
    lead: "Tucked into the western reaches of Summerlin, Stonebridge pairs newer-construction homes with a setting that backs right up to the red rock foothills. The village mixes traditional single-family streets with a handful of gated enclaves, connected by the walking paths and parks that define Summerlin's master-planned design. Its western position means dramatic mountain views are common, along with quick access to hiking, biking, and open desert space. For buyers who want a contemporary home without leaving the Summerlin lifestyle behind, Stonebridge is one of the newer options worth a look — see how it compares to the rest of [Summerlin](/communities/summerlin) or browse current [listings](/listings).",
    quickFacts: [
      { label: "Location", value: "Summerlin West, ZIP 89138" },
      { label: "Community Type", value: "Newer Summerlin West village" },
      { label: "Setting", value: "Along the base of Red Rock Canyon" },
      { label: "Approx. Price Range", value: "Approx. $700,000–$1.5 million+" },
      { label: "Distance to the Strip", value: "Roughly 20–25 minutes" },
      { label: "Signature Feature", value: "Trails, parks & mountain views" },
      { label: "Home Style", value: "Newer construction, single-family homes" },
      { label: "Enclaves", value: "Some sections are gated" },
    ],
    sections: [
      {
        heading: "About the Village",
        body: [
          "Stonebridge sits among the newer villages built out on the western side of Summerlin, closer to the foothills than the community's original, more established neighborhoods. As part of the broader Summerlin master plan, it follows the same emphasis on connected trails, neighborhood parks, and thoughtful street design.",
          "Because it developed more recently, Stonebridge tends to offer more contemporary architecture and floor plans than some of Summerlin's earlier villages, while still tying into the same trail network, village parks, and nearby retail that residents across [Summerlin](/communities/summerlin) rely on.",
        ],
      },
      {
        heading: "Homes & Real Estate",
        body: [
          "Stonebridge's housing stock leans newer, with single-family homes built to more current construction standards and, in select pockets, gated enclaves that add an extra layer of privacy. Lot sizes and layouts vary by section, from smaller low-maintenance homesites to larger view lots along the western edge.",
          "Pricing spans a wide range depending on lot location, view, and how recently a given section was built. Buyers interested in brand-new product nearby can also compare [new construction](/new-construction) options, and sellers curious what a Stonebridge home is worth today can start with a [home value](/home-value) estimate.",
        ],
      },
      {
        heading: "Amenities & Lifestyle",
        body: [
          "Life in Stonebridge centers on the outdoors. Neighborhood parks, walking paths, and connections into Summerlin's larger trail system make it easy to get outside without a car, and the village's position near Red Rock Canyon puts hiking, climbing, and scenic drives within easy reach.",
        ],
        bullets: [
          "Neighborhood parks and green space",
          "Direct ties into Summerlin's trail network",
          "Close proximity to Red Rock Canyon recreation",
          "Mountain and desert views from many streets",
        ],
      },
      {
        heading: "Location & Nearby",
        body: [
          "Stonebridge's western position keeps it close to Red Rock Canyon and the trailheads along the edge of the valley, while still being a manageable drive from Summerlin's shopping, dining, and golf. Downtown Summerlin and the broader retail and freeway network sit a short drive to the east, with the Las Vegas Strip roughly 20–25 minutes away depending on traffic. For a wider view of the surrounding area, see our overview of [Las Vegas neighborhoods](/areas/las-vegas).",
        ],
      },
      {
        heading: "Who It Suits",
        body: [
          "Stonebridge tends to appeal to buyers who want the Summerlin lifestyle in a newer package — move-up buyers seeking modern floor plans, those drawn to gated privacy, and anyone who prioritizes mountain views and trail access. It's also a strong fit for buyers relocating to the west side who want newer construction over an older resale.",
          "Curious whether Stonebridge or another Summerlin village fits your search better? Browse our full list of [communities](/communities) or [contact](/contact) our team for guidance.",
        ],
      },
    ],
    faqs: [
      {
        q: "What makes Stonebridge different from older Summerlin villages?",
        a: "Stonebridge is one of the newer villages in Summerlin West, so it generally features more contemporary architecture and construction standards than some of Summerlin's earlier, more established neighborhoods, while still sharing the same trails, parks, and master-planned amenities.",
      },
      {
        q: "What types of homes are available in Stonebridge?",
        a: "The village offers primarily newer single-family homes, with some sections organized as gated enclaves. Lot sizes, views, and floor plans vary, so it's worth comparing a few sections before narrowing in.",
      },
      {
        q: "How much do homes in Stonebridge cost?",
        a: "Prices vary based on lot size, view, and how recently a section was built, and the market shifts over time. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "Is Stonebridge close to Red Rock Canyon?",
        a: "Yes. Stonebridge sits along the western edge of Summerlin near the base of Red Rock Canyon, giving residents quick access to hiking trails and scenic drives.",
      },
      {
        q: "Are there gated sections within Stonebridge?",
        a: "Some pockets of Stonebridge are gated, offering added privacy within the larger village. Availability of gated versus non-gated homes changes often, so contact The Roland Team for current availability and pricing.",
      },
    ],
  },

  {
    slug: "lone-mountain",
    name: "Lone Mountain",
    city: "Las Vegas",
    zip: "89129",
    seoTitle: "Lone Mountain Las Vegas Homes for Sale | 89129/89149",
    seoDescription: "Explore Lone Mountain in northwest Las Vegas — larger lots, custom and some equestrian properties, mountain views, and easy access to the 215 Beltway.",
    h1: "Lone Mountain Homes for Sale in Las Vegas, NV",
    eyebrow: "Northwest Las Vegas · Larger Lots & Custom Homes",
    intro: "Lone Mountain is an established northwest Las Vegas community known for larger lots, custom and semi-custom homes, and a quieter, semi-rural feel near the Lone Mountain landmark.",
    lead: "Named for the rocky landmark that rises above the northwest valley, Lone Mountain has long been a draw for buyers who want more breathing room than a typical suburban lot allows. The area's housing stock leans toward custom and semi-custom homes on larger parcels, and pockets of equestrian and horse-friendly properties remain part of its character. Despite the more open, semi-rural feel, Lone Mountain sits close to the shopping, dining, and services of [Centennial Hills](/communities/centennial-hills) and the amenities of [Providence](/communities/providence), with convenient access to the 215 Beltway for commutes across the valley. Mountain views and mature desert landscaping are common throughout the area. For buyers who want space and privacy without leaving the northwest Las Vegas corridor, Lone Mountain is worth a close look.",
    quickFacts: [
      { label: "Location", value: "ZIP 89129/89149, northwest Las Vegas valley" },
      { label: "Community Type", value: "Established, larger-lot area" },
      { label: "Setting", value: "Around the Lone Mountain landmark" },
      { label: "Approx. Price Range", value: "Approx. $500K–$1.5M+, varies by lot size and custom finishes" },
      { label: "Distance to the Strip", value: "Approx. 20–25 minutes via the 215 Beltway" },
      { label: "Signature Feature", value: "Larger lots with some equestrian/horse properties" },
      { label: "Home Style Mix", value: "Custom and semi-custom homes alongside production builds" },
      { label: "Nearby Amenities", value: "Close to Centennial Hills and Providence shopping and dining" },
    ],
    sections: [
      {
        heading: "About the Lone Mountain Area",
        body: [
          "Lone Mountain takes its name from the prominent rock outcropping that marks the northwest Las Vegas skyline. The surrounding neighborhoods developed over time with an emphasis on space, offering some of the larger residential lots available in this part of the valley.",
          "The result is a community that feels more open and established than many newer master-planned areas, with mature trees, wider setbacks, and a mix of architectural styles built up gradually rather than in a single planned phase.",
        ],
      },
      {
        heading: "Homes & Real Estate in Lone Mountain",
        body: [
          "Housing in Lone Mountain is defined by larger lot sizes relative to much of the northwest valley, drawing buyers who want extra yard space, room for a workshop or RV parking, or land for horses. Custom and semi-custom single-story and two-story homes are common, often built individually rather than as part of a single production tract.",
          "Production-built homes are also part of the mix in several pockets, giving buyers a range of price points and home styles within the same general area. Because inventory is varied — from horse properties to more conventional single-family homes — pricing and lot characteristics can shift significantly from street to street.",
        ],
        bullets: [
          "Larger-than-average residential lots for the northwest valley",
          "Custom and semi-custom home construction alongside production builds",
          "Some properties zoned for horses or other equestrian use",
          "Mix of single-story and two-story floor plans",
        ],
      },
      {
        heading: "Lifestyle & Recreation",
        body: [
          "Lone Mountain Regional Park anchors outdoor life in the area, with trails that wind around the base of the mountain and offer valley and mountain views. It's a popular spot for walking, hiking, and taking in sunset views over the northwest valley.",
          "The semi-rural feel of the neighborhood — larger lots, mature landscaping, and a slower pace — appeals to residents looking for a bit more distance between homes while still being minutes from everyday conveniences.",
        ],
      },
      {
        heading: "Location & Nearby Communities",
        body: [
          "Lone Mountain sits within easy reach of the retail, dining, and medical services concentrated in [Centennial Hills](/communities/centennial-hills), and is a short drive from the amenities of [Providence](/communities/providence). The 215 Beltway provides efficient access to other parts of the [Las Vegas area](/areas/las-vegas), making commutes to the Strip, the airport, and other employment centers manageable.",
        ],
      },
      {
        heading: "Who Lone Mountain Suits",
        body: [
          "Lone Mountain tends to appeal to buyers who want more land than a typical suburban lot provides — whether for horses, hobbies, outdoor space, or simply privacy — without giving up proximity to shopping, dining, and beltway access. It's also a fit for buyers drawn to custom-built homes rather than standardized production layouts.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is Lone Mountain known for?",
        a: "Lone Mountain is known for its larger residential lots, custom and semi-custom homes, some equestrian and horse properties, and its semi-rural feel near the Lone Mountain landmark and Lone Mountain Regional Park in the northwest Las Vegas valley.",
      },
      {
        q: "Are there horse properties in Lone Mountain?",
        a: "Yes, pockets of Lone Mountain include horse-friendly or equestrian-zoned properties, though availability varies by street and section. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "How far is Lone Mountain from the Las Vegas Strip?",
        a: "Lone Mountain is roughly 20 to 25 minutes from the Las Vegas Strip via the 215 Beltway, depending on traffic and exact destination.",
      },
      {
        q: "What is the price range for homes in Lone Mountain?",
        a: "Home prices in Lone Mountain vary widely based on lot size, custom features, and whether a property includes equestrian amenities. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "How do I find current Lone Mountain listings?",
        a: "You can browse current [listings](/listings), explore other [communities](/communities), or get a free [home value estimate](/home-value). Contact The Roland Team for current availability and pricing.",
      },
    ],
  },

  {
    slug: "the-willows",
    name: "The Willows",
    city: "Las Vegas",
    zip: "89135",
    seoTitle: "The Willows at Summerlin | Las Vegas Homes for Sale",
    seoDescription: "Discover The Willows, an established Summerlin village with parks, trails, and single-family homes near Downtown Summerlin. Contact The Roland Team.",
    h1: "The Willows at Summerlin Homes for Sale",
    eyebrow: "Summerlin, Las Vegas · Established Village",
    intro: "The Willows is an established, family-oriented village within the Summerlin master plan, known for its tree-lined streets, neighborhood parks, and walking trails.",
    lead: "Tucked into one of Summerlin's earlier-built villages, The Willows offers an established, tree-lined setting with a mix of single-family homes and easy access to neighborhood parks and walking trails. The village's mature landscaping and quiet streets give it a settled, lived-in character that appeals to buyers who prefer established neighborhoods over new construction. Residents are just minutes from Downtown Summerlin's shopping, dining, and entertainment, while still enjoying a quieter, residential feel. Because it sits within the larger Summerlin master plan, The Willows also benefits from the area's parks system, trail network, and overall community planning. For buyers exploring the Las Vegas valley, it represents a well-located option that balances convenience with a more established, residential atmosphere.",
    quickFacts: [
      { label: "Location", value: "ZIP 89135, Summerlin, Las Vegas" },
      { label: "Community Type", value: "Established Summerlin village" },
      { label: "Setting", value: "Tree-lined streets with neighborhood parks" },
      { label: "Approx. Price Range", value: "Approx. $600K–$1.2M+" },
      { label: "Distance to the Strip", value: "Approx. 20–25 minutes" },
      { label: "Signature Features", value: "Village parks and walking trails" },
      { label: "Home Style", value: "Established single-family homes" },
      { label: "Nearby Shopping & Dining", value: "Minutes to Downtown Summerlin" },
    ],
    sections: [
      {
        heading: "About The Willows",
        body: [
          "The Willows is one of the established villages that make up the broader Summerlin master plan on the western side of Las Vegas. It's characterized by mature, tree-lined streets, well-kept neighborhood parks, and a settled residential feel that comes from being built out in an earlier phase of Summerlin's development.",
          "Like other villages within [Summerlin](/communities/summerlin), The Willows benefits from the master plan's emphasis on parks, trails, and walkable neighborhood design, while offering its own distinct, established character.",
        ],
      },
      {
        heading: "Homes & Real Estate in The Willows",
        body: [
          "Homes in The Willows are primarily single-family residences reflecting the architectural styles common to Summerlin's earlier construction phases. Lot sizes, floor plans, and finishes vary from home to home, so pricing depends heavily on the specific property, its condition, and any updates.",
          "Because inventory and pricing shift regularly, buyers are encouraged to get a [current home value estimate](/home-value) or run the numbers with an [affordability calculator](/calculators/home-affordability) before starting their search.",
        ],
      },
      {
        heading: "Amenities & the Summerlin Lifestyle",
        body: [
          "Residents of The Willows have access to neighborhood parks and walking trails within the village, along with the broader trail network and recreational amenities found throughout Summerlin.",
        ],
        bullets: [
          "Neighborhood parks and green space",
          "Walking and pedestrian trails",
          "Tree-lined, established streetscapes",
          "Access to Summerlin's community amenities",
        ],
      },
      {
        heading: "Location & Nearby — Downtown Summerlin",
        body: [
          "The Willows sits just minutes from Downtown Summerlin, giving residents convenient access to shopping, dining, and entertainment without leaving the Summerlin area. Its location also provides reasonable access to other parts of the Las Vegas valley for work and errands.",
        ],
      },
      {
        heading: "Who The Willows Suits",
        body: [
          "The Willows tends to appeal to buyers who want an established, tree-lined neighborhood rather than new construction, along with easy access to parks, trails, and nearby Downtown Summerlin amenities.",
          "To see what's currently on the market or to start a conversation about the area, [contact The Roland Team](/contact) directly.",
        ],
      },
    ],
    faqs: [
      {
        q: "What ZIP code is The Willows in?",
        a: "The Willows is located in the 89135 ZIP code within the Summerlin master plan in Las Vegas.",
      },
      {
        q: "What type of homes are in The Willows?",
        a: "The Willows features an established mix of single-family homes on tree-lined streets, typically reflecting earlier phases of Summerlin's development.",
      },
      {
        q: "How much do homes in The Willows cost?",
        a: "Home prices in The Willows vary by lot, size, and condition, and shift with market conditions. Contact The Roland Team for current availability and pricing.",
      },
      {
        q: "Is The Willows close to Downtown Summerlin?",
        a: "Yes, The Willows is just minutes from Downtown Summerlin's shopping, dining, and entertainment options.",
      },
      {
        q: "How do I find current listings in The Willows?",
        a: "Availability in The Willows changes regularly. Contact The Roland Team for current availability and pricing.",
      },
    ],
  },
];

export function getCommunity(slug: string): Community | undefined {
  return communities.find((c) => c.slug === slug);
}

export const featuredCommunities = communities.filter((c) => c.featured);

/** Longest names first so "Sun City Summerlin" wins over "Summerlin". */
const communitiesByNameLength = [...communities].sort(
  (a, b) => b.name.length - a.name.length,
);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Best-effort mapping of a live MLS listing to one of our community pages so
 * IDX listings cross-link into the site's community content (the "Located in
 * …" block on the listing detail page + community-filtered browsing).
 *
 * Match the community name against STRUCTURED location fields only
 * (subdivision / neighborhood / area / street) — never the free-text public
 * remarks, which would produce false positives. Whole-token match against the
 * longest (most specific) community name wins.
 */
export function matchCommunitySlug(
  parts: Array<string | null | undefined>,
): string | undefined {
  const haystacks = parts
    .filter((p): p is string => Boolean(p))
    .map((p) => ` ${normalize(p)} `);
  if (haystacks.length === 0) return undefined;
  for (const c of communitiesByNameLength) {
    const name = normalize(c.name);
    if (name.length < 4) continue; // guard against short/ambiguous names
    if (haystacks.some((h) => h.includes(` ${name} `))) return c.slug;
  }
  return undefined;
}
