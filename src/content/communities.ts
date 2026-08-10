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
        a: "Ascaya homes and homesites for sale generally range from about $5 million to more than $12 million, depending on lot size, elevation, square footage, and custom finishes. Contact Roland Luxury for current availability and pricing.",
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
        a: "Prices generally range from approximately $1.5 million to more than $10 million depending on home size, elevation, and custom finishes. Contact Roland Luxury for current listings and pricing.",
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
        a: "Prices generally range from around $600,000 to more than $4 million depending on the enclave, home size, and finishes. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from approximately $2 million to more than $15 million depending on size, enclave, and finish level. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from about $400,000 for condominiums to more than $10 million for waterfront custom estates. Contact Roland Luxury for current availability.",
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
        a: "Prices range from around $400,000 for condos and townhomes to more than $10 million for luxury estates in enclaves like The Ridges and The Summit. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to more than $3 million depending on the neighborhood, elevation, and whether the home is in the guard-gated country club. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $450,000 to more than $8 million depending on the neighborhood and whether the home is in a guard-gated enclave. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to about $1.2 million depending on the home size, builder, and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $400,000 to more than $3 million depending on the neighborhood and whether the home is in a guard-gated enclave. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to more than $2 million depending on location, age, and size. Because growth is limited, inventory can be scarce. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from approximately $4 million to more than $20 million for custom estates. Contact Roland Luxury for current availability and membership details.",
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
        a: "Prices generally range from around $600,000 to more than $6 million depending on the home and its views. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $350,000 to more than $1.2 million depending on floor plan, location, and condition. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $400,000 to about $900,000 depending on size, location, and updates. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to more than $1 million depending on the builder, floor plan, and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $400,000 to about $900,000 depending on the builder, floor plan, and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $400,000 to more than $1 million depending on size, lot, and golf-course frontage. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to about $900,000 depending on the home's size and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $400,000 to more than $1 million depending on size, lot, and location. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $350,000 to about $800,000 depending on size and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $350,000 to about $900,000 depending on size and location. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to about $800,000 depending on size and location. Contact Roland Luxury for current availability.",
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
        a: "Prices range widely — from around $350,000 for condos and townhomes to more than $1 million for larger or gated homes. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $400,000 to about $900,000 depending on floor plan and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $350,000 to about $700,000 depending on floor plan and location. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $700,000 to more than $5 million depending on whether it's an estate or a luxury condominium, plus size and views. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $450,000 to more than $2 million depending on the home and whether it has lake frontage. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $700,000 to more than $3 million depending on size and finish. Because the community is small, inventory can be limited. Contact Roland Luxury for current listings.",
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
        a: "Prices generally range from around $450,000 to more than $1 million depending on size, location, and whether the home is in a gated pocket. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $500,000 for condominiums and townhomes to more than $4 million for custom golf-course estates. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from approximately $1.5 million to more than $10 million depending on lot size, square footage, and custom finishes. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from around $900,000 to more than $4 million depending on the collection, homesite, and views. Contact Roland Luxury for current availability.",
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
        a: "Prices generally range from approximately $1.2 million to more than $6 million depending on lot size, square footage, and finishes. Contact Roland Luxury for current availability.",
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
