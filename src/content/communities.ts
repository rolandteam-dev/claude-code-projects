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
];

export function getCommunity(slug: string): Community | undefined {
  return communities.find((c) => c.slug === slug);
}

export const featuredCommunities = communities.filter((c) => c.featured);
