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
];

export function getCommunity(slug: string): Community | undefined {
  return communities.find((c) => c.slug === slug);
}

export const featuredCommunities = communities.filter((c) => c.featured);
