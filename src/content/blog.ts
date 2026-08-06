/**
 * Blog engine. Categories mirror the site's content pillars:
 * New Construction, Market Updates, Buying Guides, Selling Guides.
 * The daily blog-draft automation can append new posts to this array.
 */
import type { Section } from "./communities";

export const BLOG_CATEGORIES = [
  "New Construction",
  "Market Updates",
  "Buying Guides",
  "Selling Guides",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPost = {
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  /** ISO date string, e.g. "2026-08-01" */
  date: string;
  author: string;
  readMinutes: number;
  seoTitle: string;
  seoDescription: string;
  sections: Section[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "las-vegas-new-construction-communities-2026",
    title: "New Construction in Las Vegas: Builder Communities to Watch in 2026",
    category: "New Construction",
    excerpt:
      "Southern Nevada is one of the nation's most active new-home markets. Here are the growing communities where builders are most active right now — and what to know before you buy new.",
    date: "2026-08-01",
    author: "Roland Luxury",
    readMinutes: 7,
    seoTitle: "New Construction Las Vegas 2026: Builder Communities to Watch",
    seoDescription:
      "The Las Vegas communities with the most new construction in 2026 — Skye Canyon, Cadence, Inspirada, Summerlin — plus tips for buying a new-build home.",
    sections: [
      {
        heading: "Where the builders are active",
        body: [
          "New construction remains a major part of the Las Vegas Valley market. The most active builder communities right now stretch across the northwest, southeast, and west sides of the valley — each with its own character and price point.",
        ],
        bullets: [
          "Skye Canyon (northwest) — outdoor-focused, higher elevation, ongoing new phases.",
          "Cadence (Henderson) — a large newer master plan around a central park.",
          "Inspirada (Henderson) — parks-and-trails living with multiple builders.",
          "Summerlin's newer villages (west) — from move-up homes to luxury.",
        ],
      },
      {
        heading: "Buying new? Bring your own agent",
        body: [
          "The single most important tip for new-construction buyers: register with your own agent on your first visit to the builder. The on-site representative works for the builder. Your agent works for you — comparing incentives, reviewing the contract, and guiding upgrade decisions, usually at no cost to you.",
        ],
      },
    ],
  },
  {
    slug: "las-vegas-market-update-summer-2026",
    title: "Las Vegas Market Update: What Buyers and Sellers Should Know",
    category: "Market Updates",
    excerpt:
      "A quick read on where the Las Vegas Valley market stands — prices, pace, and inventory — and what it means whether you're buying or selling.",
    date: "2026-07-30",
    author: "Roland Luxury",
    readMinutes: 6,
    seoTitle: "Las Vegas Housing Market Update — Summer 2026",
    seoDescription:
      "The latest Las Vegas market update: median prices, days on market, and inventory trends, plus what they mean for buyers and sellers.",
    sections: [
      {
        heading: "The big picture",
        body: [
          "The valley continues to show steady, moderate price growth rather than dramatic swings — a healthier, more sustainable market. Homes that are priced right and well presented are still selling in well under two months on average.",
          "For the full breakdown with area-by-area numbers, see our monthly market report.",
        ],
      },
      {
        heading: "What it means for you",
        body: [
          "Sellers still hold an advantage in most price bands because inventory remains below what signals a balanced market. Buyers benefit from more selection than in the frenzied years, and from being able to negotiate on well-chosen homes. Luxury and guard-gated segments move on their own timeline, where strategy matters more than valley-wide averages.",
        ],
      },
    ],
  },
  {
    slug: "how-much-home-can-you-afford-las-vegas",
    title: "How Much Home Can You Afford in Las Vegas?",
    category: "Buying Guides",
    excerpt:
      "Before you shop, know your number. Here's how lenders think about affordability in Las Vegas — including the local costs buyers often forget.",
    date: "2026-07-27",
    author: "Roland Luxury",
    readMinutes: 6,
    seoTitle: "How Much Home Can You Afford in Las Vegas? A Buyer's Guide",
    seoDescription:
      "Understand home affordability in Las Vegas — income, debt, down payment, and the HOA and tax costs that shape your real budget.",
    sections: [
      {
        heading: "Start with pre-approval",
        body: [
          "Affordability isn't just the sticker price — it's the monthly payment, and that includes principal, interest, property taxes, insurance, and any HOA dues. A lender's pre-approval turns those pieces into a real number and shows sellers you're serious.",
        ],
      },
      {
        heading: "Don't forget Las Vegas HOA dues",
        body: [
          "Many of the valley's most desirable communities are master-planned or guard-gated, which means HOA fees. They fund the amenities that make these neighborhoods special, but they're a real part of your monthly budget — always factor them in when comparing homes.",
        ],
      },
    ],
  },
  {
    slug: "preparing-your-las-vegas-home-to-sell",
    title: "Preparing Your Las Vegas Home to Sell for Top Dollar",
    category: "Selling Guides",
    excerpt:
      "The work you do before listing has an outsized effect on your final price. Here's where to focus when preparing a Las Vegas home to sell.",
    date: "2026-07-24",
    author: "Roland Luxury",
    readMinutes: 6,
    seoTitle: "Preparing Your Las Vegas Home to Sell for Top Dollar",
    seoDescription:
      "How to prepare your Las Vegas home to sell — pricing, decluttering, repairs, staging, and professional marketing that drives stronger offers.",
    sections: [
      {
        heading: "Price and presentation win",
        body: [
          "Two things drive your result more than anything: pricing to the current market from day one, and presenting the home well. Overpricing leads to stale listings and price cuts; sharp pricing attracts more buyers and often multiple offers.",
        ],
      },
      {
        heading: "Where to spend your effort",
        body: [
          "Declutter, handle obvious maintenance, and consider light staging so buyers can picture themselves living there. In a market where nearly every buyer starts online, professional photography — and video for larger or view homes — is essential, not optional.",
        ],
      },
    ],
  },
  {
    slug: "las-vegas-luxury-seller-net-proceeds",
    title: "Understanding Seller Net Proceeds on a Las Vegas Home",
    category: "Selling Guides",
    excerpt:
      "Your list price isn't your take-home. Here's how to think about net proceeds when selling a home in Las Vegas.",
    date: "2026-07-20",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Seller Net Proceeds on a Las Vegas Home: What to Expect",
    seoDescription:
      "Understand seller net proceeds in Las Vegas — the costs between list price and your check, and how to estimate your take-home before you list.",
    sections: [
      {
        heading: "From list price to your check",
        body: [
          "Net proceeds are what you actually walk away with after the costs of the sale. Typical line items include the real estate commission, title and escrow fees, any remaining mortgage payoff, and negotiated concessions or repairs.",
        ],
      },
      {
        heading: "Get an estimate before you list",
        body: [
          "A good agent will prepare an estimated net-proceeds sheet up front, so you know your likely take-home across a range of sale prices before you ever go on the market. Ask for one — it turns an abstract list price into a real decision.",
        ],
      },
    ],
  },

  {
    slug: "is-now-a-good-time-to-buy-las-vegas",
    title: "Is Now a Good Time to Buy in Las Vegas?",
    category: "Market Updates",
    excerpt:
      "The honest answer to the question every buyer asks — and the factors that actually matter more than trying to time the market.",
    date: "2026-07-18",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Is Now a Good Time to Buy a Home in Las Vegas?",
    seoDescription:
      "Should you buy a home in Las Vegas now? An honest look at timing, rates, inventory, and the factors that matter more than trying to time the market.",
    sections: [
      {
        heading: "Timing the market rarely works",
        body: [
          "Everyone wants to buy at the bottom, but waiting for a perfect moment usually costs more than it saves — in rent paid, equity missed, and stress. The better question isn't \"is the market perfect?\" but \"is this the right home and the right payment for my situation?\"",
        ],
      },
      {
        heading: "What actually matters",
        body: [
          "Focus on the things within your control: your budget and pre-approval, how long you plan to stay, and finding a home you'll be happy in. In a steady market like Las Vegas, buyers who purchase a home they can comfortably afford and hold tend to do well regardless of short-term swings.",
        ],
      },
    ],
  },

  {
    slug: "guard-gated-vs-master-planned-las-vegas",
    title: "Guard-Gated vs. Master-Planned: What's the Difference?",
    category: "Buying Guides",
    excerpt:
      "Two terms you'll hear constantly in Las Vegas real estate — here's what they actually mean and how to choose.",
    date: "2026-07-15",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Guard-Gated vs. Master-Planned Communities in Las Vegas",
    seoDescription:
      "Understand the difference between guard-gated and master-planned communities in Las Vegas — security, amenities, privacy, and how to choose the right fit.",
    sections: [
      {
        heading: "Master-planned communities",
        body: [
          "A master-planned community is a large, thoughtfully designed development with its own parks, trails, amenities, and often schools and retail. Summerlin and Green Valley are classic examples. The appeal is lifestyle and cohesion — everything is planned to work together.",
        ],
      },
      {
        heading: "Guard-gated communities",
        body: [
          "Guard-gated means controlled access with staffed entry, offering an added layer of privacy and security. Some guard-gated enclaves sit within larger master plans; others, like Ascaya, are standalone luxury communities. The trade-off is typically higher HOA dues for that exclusivity.",
        ],
      },
      {
        heading: "Which is right for you?",
        body: [
          "It comes down to what you value — amenities and community feel, maximum privacy and security, or both. We can help you weigh the options and find the community that fits your lifestyle and budget.",
        ],
      },
    ],
  },

  {
    slug: "buying-new-construction-what-to-know-las-vegas",
    title: "Buying New Construction in Las Vegas: What to Know",
    category: "New Construction",
    excerpt:
      "New builds are a big part of the Las Vegas market. Here's how the process differs from buying resale — and how to protect yourself.",
    date: "2026-07-12",
    author: "Roland Luxury",
    readMinutes: 6,
    seoTitle: "Buying New Construction in Las Vegas: What Buyers Should Know",
    seoDescription:
      "A guide to buying new construction in Las Vegas — builder incentives, timelines, upgrades, and why you should bring your own agent to the builder.",
    sections: [
      {
        heading: "The builder's rep works for the builder",
        body: [
          "The friendly agent in the model home represents the builder's interests, not yours. Register your own agent on your first visit and you get an advocate who compares incentives, reviews the contract, and helps you make smart upgrade decisions — usually at no cost to you.",
        ],
      },
      {
        heading: "Incentives over price cuts",
        body: [
          "Builders often prefer to offer incentives — upgrades, closing-cost credits, or rate buydowns — rather than cut the base price, which protects the community's comparable sales. Knowing how to negotiate these can add real value.",
        ],
      },
    ],
  },

  {
    slug: "las-vegas-luxury-market-what-makes-it-unique",
    title: "The Las Vegas Luxury Market: What Makes It Unique",
    category: "Market Updates",
    excerpt:
      "Southern Nevada's luxury tier plays by its own rules. Here's what sets the Las Vegas high-end market apart from the rest of the valley.",
    date: "2026-07-10",
    author: "Roland Luxury",
    readMinutes: 6,
    seoTitle: "The Las Vegas Luxury Real Estate Market: What Makes It Unique",
    seoDescription:
      "What makes the Las Vegas luxury real estate market unique — guard-gated exclusivity, custom estates, no state income tax, and its own pricing dynamics.",
    sections: [
      {
        heading: "A market within a market",
        body: [
          "The luxury tier moves on a different timeline than the broader valley. With a thin set of true comparable sales, unique custom estates, and a global buyer pool, valley-wide averages tell you very little about what a specific guard-gated home is worth. Pricing and marketing strategy matter far more here than in the mainstream market.",
          "For a deeper look at the communities and price tiers, see our Las Vegas luxury real estate guide.",
        ],
      },
      {
        heading: "Why buyers choose Las Vegas luxury",
        body: [
          "No state income tax, dramatic desert-contemporary architecture, elevated Strip and mountain views, and world-class amenities minutes from the door — all combine to draw high-end buyers from higher-tax, higher-density markets. Communities like Ascaya, MacDonald Highlands, The Ridges, and The Summit Club anchor the top of the market.",
        ],
      },
    ],
  },

  {
    slug: "off-market-luxury-homes-las-vegas",
    title: "Off-Market Luxury Homes in Las Vegas: How to Find Them",
    category: "Buying Guides",
    excerpt:
      "Some of the best luxury homes never hit the public market. Here's how off-market and coming-soon opportunities work — and how to access them.",
    date: "2026-07-08",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Off-Market Luxury Homes in Las Vegas: How to Find Them",
    seoDescription:
      "How off-market and coming-soon luxury homes work in Las Vegas — why sellers use them, and how buyers access these private opportunities.",
    sections: [
      {
        heading: "Why luxury sellers go off-market",
        body: [
          "At the top of the market, discretion is often worth more than maximum exposure. Some owners prefer to sell privately — to protect their privacy, test pricing quietly, or avoid days-on-market showing publicly. That means a meaningful share of luxury inventory is never listed on the public sites.",
        ],
      },
      {
        heading: "How buyers get access",
        body: [
          "Off-market and coming-soon opportunities move through relationships, not portals. A well-connected local specialist hears about these homes through their network of agents and past clients — which is why working with a team embedded in the valley's luxury communities is the single best way to see what the public never will.",
        ],
      },
    ],
  },

  {
    slug: "are-guard-gated-communities-worth-it-las-vegas",
    title: "Are Guard-Gated Communities Worth It in Las Vegas?",
    category: "Buying Guides",
    excerpt:
      "Guard-gated living comes with real perks and real costs. Here's an honest look at whether it's worth it in Las Vegas and Henderson.",
    date: "2026-07-05",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Are Guard-Gated Communities Worth It in Las Vegas?",
    seoDescription:
      "Are guard-gated communities worth it in Las Vegas? An honest look at the privacy, security, amenities, and HOA costs of gated living in Southern Nevada.",
    sections: [
      {
        heading: "What you get",
        body: [
          "Guard-gated communities offer staffed 24-hour entry, added privacy, exclusivity, and often extensive private amenities — clubs, golf, pools, and clubhouses. For many buyers, that peace of mind and lifestyle is the whole point, and guard-gated addresses tend to hold their appeal well over time.",
        ],
      },
      {
        heading: "What it costs",
        body: [
          "The trade-off is higher HOA dues to fund the security staffing and amenities. Whether it's worth it comes down to your priorities and budget. Explore the valley's options on our guard-gated communities guide, and review any community's HOA documents carefully before you buy.",
        ],
      },
    ],
  },

  {
    slug: "las-vegas-property-taxes-explained",
    title: "Las Vegas Property Taxes Explained",
    category: "Buying Guides",
    excerpt:
      "Nevada's property taxes are a pleasant surprise for many buyers. Here's how they work in Las Vegas and Henderson.",
    date: "2026-07-03",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Las Vegas Property Taxes Explained: A Buyer's Guide",
    seoDescription:
      "How property taxes work in Las Vegas and Henderson — Nevada's moderate rates, how assessments work, and why the tax picture attracts relocating buyers.",
    sections: [
      {
        heading: "A moderate tax picture",
        body: [
          "Combined with no state income tax, Nevada's relatively moderate property taxes are a major reason buyers relocate to Las Vegas from higher-tax states. Property tax is based on the assessed value of your home and the local rates for your area, and Nevada has provisions that can limit large year-over-year increases on owner-occupied homes.",
        ],
      },
      {
        heading: "Estimating your taxes",
        body: [
          "Because rates and assessments vary by location, the best way to know your likely property tax is to estimate it for the specific home you're considering. We're glad to help you estimate taxes and total monthly costs for any property.",
        ],
      },
    ],
  },

  {
    slug: "best-time-to-buy-or-sell-las-vegas",
    title: "The Best Time to Buy or Sell a Home in Las Vegas",
    category: "Market Updates",
    excerpt:
      "Is there a best season to buy or sell in Las Vegas? Here's how seasonality really works in the valley — and why your situation matters more.",
    date: "2026-07-01",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "The Best Time to Buy or Sell a Home in Las Vegas",
    seoDescription:
      "When is the best time to buy or sell a home in Las Vegas? How seasonality affects the market — and why your personal timeline usually matters more.",
    sections: [
      {
        heading: "Seasonality in the valley",
        body: [
          "Las Vegas sees more activity in spring and early summer, when inventory and buyer demand both rise, and a quieter pace in the hottest months and around the holidays. Sellers often see more traffic in spring; buyers sometimes find less competition in the slower months.",
        ],
      },
      {
        heading: "Your timeline matters more than the calendar",
        body: [
          "In practice, the 'best time' is when it's right for you. A well-priced, well-presented home sells in any season, and a buyer who finds the right home at the right payment does well regardless of the month. Trying to perfectly time the market rarely beats acting when you're ready.",
        ],
      },
    ],
  },

  {
    slug: "understanding-escrow-closing-nevada",
    title: "Understanding Escrow and Closing in Nevada",
    category: "Buying Guides",
    excerpt:
      "Nevada uses escrow and title companies to close real estate deals. Here's what happens between accepted offer and keys in hand.",
    date: "2026-06-28",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Understanding Escrow and Closing in Nevada",
    seoDescription:
      "How escrow and closing work in Nevada real estate — the role of escrow and title companies, timelines, and what buyers and sellers can expect.",
    sections: [
      {
        heading: "The role of escrow",
        body: [
          "In Nevada, a neutral escrow (and title) company manages the closing — holding funds and documents, coordinating between the parties and lender, and ensuring clear title before the transaction records. It's a safeguard that protects both buyer and seller.",
        ],
      },
      {
        heading: "The typical timeline",
        body: [
          "Once an offer is accepted, buyers complete inspections and the lender's appraisal during the escrow period. Most financed purchases close in about 30 days; cash deals can be faster. Your agent guides you through deadlines, contingencies, and the final walkthrough and signing.",
        ],
      },
    ],
  },

  {
    slug: "pool-homes-in-las-vegas-what-to-know",
    title: "Pool Homes in Las Vegas: What to Know",
    category: "Buying Guides",
    excerpt:
      "In the desert, a backyard pool is a lifestyle. Here's what to consider when buying a pool home in Las Vegas.",
    date: "2026-06-25",
    author: "Roland Luxury",
    readMinutes: 5,
    seoTitle: "Buying a Pool Home in Las Vegas: What to Know",
    seoDescription:
      "What to know before buying a pool home in Las Vegas — desert lifestyle appeal, maintenance and cost considerations, and inspection tips.",
    sections: [
      {
        heading: "Why pool homes are popular here",
        body: [
          "With long, hot summers, a private pool is one of the most sought-after features in Las Vegas. Pool homes offer a real lifestyle upgrade and can broaden a home's appeal at resale, particularly in family and luxury segments.",
        ],
      },
      {
        heading: "What to consider",
        body: [
          "Factor in maintenance, energy, and insurance costs, and be sure the pool and equipment are inspected as part of your due diligence. In luxury and guard-gated communities, resort-style pools are common — we can help you weigh the options and costs for any home.",
        ],
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function postsByCategory(category?: string): BlogPost[] {
  const sorted = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!category) return sorted;
  return sorted.filter((p) => p.category === category);
}
