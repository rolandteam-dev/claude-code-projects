/**
 * Buyer / seller / relocation guides — long-form, keyword-rich content
 * that captures top-of-funnel organic search and AI citations.
 * Rendered at /guides/<slug>.
 */

import type { Faq, Section } from "./communities";

export type Guide = {
  slug: string;
  title: string;
  category: "Buying" | "Selling" | "Relocation" | "Market";
  seoTitle: string;
  seoDescription: string;
  h1: string;
  eyebrow: string;
  intro: string;
  readMinutes: number;
  sections: Section[];
  faqs: Faq[];
  featured?: boolean;
};

export const guides: Guide[] = [
  {
    slug: "buying-a-home-in-las-vegas",
    title: "Buying a Home in Las Vegas: The Complete 2026 Guide",
    category: "Buying",
    featured: true,
    seoTitle: "Buying a Home in Las Vegas: Complete 2026 Buyer Guide",
    seoDescription:
      "A step-by-step guide to buying a home in Las Vegas & Henderson — from getting pre-approved and choosing a neighborhood to making an offer and closing.",
    h1: "Buying a Home in Las Vegas: The Complete Guide",
    eyebrow: "Buyer Guide",
    intro:
      "Everything you need to buy a home in the Las Vegas Valley with confidence — the process, the neighborhoods, the numbers, and the local details that matter.",
    readMinutes: 9,
    sections: [
      {
        heading: "1. Get Pre-Approved Before You Shop",
        body: [
          "Before touring a single home, talk to a lender and get pre-approved. In a competitive market like Las Vegas, a pre-approval letter tells sellers you're serious and defines your realistic budget. It also surfaces any credit or documentation issues early, when there's still time to fix them.",
          "Ask your lender to break down your estimated monthly payment including property taxes, insurance, and any HOA dues — Las Vegas has many master-planned and gated communities where HOA fees are a real part of the budget.",
        ],
      },
      {
        heading: "2. Choose the Right Area",
        body: [
          "The valley is a patchwork of distinct communities, each with its own character and price point. Summerlin and Henderson anchor the luxury and family markets, while areas closer to the Strip and Downtown appeal to buyers who want walkability and nightlife.",
        ],
        bullets: [
          "Henderson — family-friendly master plans, top schools, and guard-gated luxury like Ascaya and MacDonald Highlands.",
          "Summerlin — a large master-planned community on the west side with parks, trails, and The Ridges at its luxury tier.",
          "Southwest & Mountain's Edge — newer construction and strong value for move-up buyers.",
          "Lake Las Vegas — resort-style living around the water in eastern Henderson.",
        ],
      },
      {
        heading: "3. Make a Competitive Offer",
        body: [
          "Once you find the right home, your agent will help you structure an offer that's strong but protects your interests. That means the right price based on recent comparable sales, sensible contingencies for inspection and appraisal, and terms that appeal to the seller's timeline.",
        ],
      },
      {
        heading: "4. Inspect, Appraise, and Close",
        body: [
          "After your offer is accepted, you'll move into the due-diligence period: a home inspection, the lender's appraisal, and a title review. Nevada typically uses an escrow and title company to manage the closing. Most transactions close in about 30 days when financing is involved.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do I need for a down payment in Las Vegas?",
        a: "It depends on your loan program. Conventional loans often start around 3–5% down, FHA around 3.5%, and VA loans can be zero down for eligible buyers. Luxury and jumbo purchases typically require more. A local lender can outline your options.",
      },
      {
        q: "How long does it take to buy a home in Las Vegas?",
        a: "From accepted offer to closing, most financed purchases take about 30 days. Cash purchases can close faster. The search itself varies widely depending on inventory and how specific your criteria are.",
      },
      {
        q: "Are property taxes high in Nevada?",
        a: "Nevada has no state income tax and relatively moderate property taxes compared to many states, which is a major draw for buyers relocating from higher-tax states.",
      },
    ],
  },

  {
    slug: "selling-your-home-in-las-vegas",
    title: "Selling Your Home in Las Vegas: A Step-by-Step Guide",
    category: "Selling",
    featured: true,
    seoTitle: "Selling Your Home in Las Vegas: Step-by-Step Seller Guide",
    seoDescription:
      "How to sell your Las Vegas or Henderson home for top dollar — pricing, prep, marketing, negotiation, and closing, explained step by step by The Roland Team.",
    h1: "Selling Your Home in Las Vegas",
    eyebrow: "Seller Guide",
    intro:
      "A clear, step-by-step roadmap to selling your Las Vegas Valley home for the best price and terms — with the local details that actually move the needle.",
    readMinutes: 8,
    sections: [
      {
        heading: "1. Price It Right From Day One",
        body: [
          "The most important decision you'll make is your list price. Overpricing leads to stale listings and price cuts; pricing to the market attracts more buyers and often multiple offers. Your agent should build a pricing strategy from recent comparable sales in your specific neighborhood — not valley-wide averages, which can be misleading in a market as varied as Las Vegas.",
        ],
      },
      {
        heading: "2. Prepare and Stage",
        body: [
          "First impressions drive offers. Declutter, handle deferred maintenance, and consider light staging to help buyers picture themselves in the home. Professional photography — and increasingly video and drone for larger or view properties — is essential in a market where most buyers start online.",
        ],
      },
      {
        heading: "3. Market to the Right Buyers",
        body: [
          "A strong plan combines MLS syndication, targeted digital advertising, and your agent's local network. For luxury and guard-gated homes, reaching the right buyer pool matters as much as broad exposure — a specialist who knows the community's buyers has a real edge.",
        ],
      },
      {
        heading: "4. Negotiate and Close",
        body: [
          "Once offers arrive, your agent helps you weigh price against terms — financing type, contingencies, close date, and buyer strength. In Nevada, escrow and title companies manage the closing, which typically takes about 30 days for financed buyers.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does it take to sell a home in Las Vegas?",
        a: "It depends on pricing, condition, and market conditions, but well-priced, well-presented homes often go under contract within a few weeks, followed by roughly a 30-day close for financed buyers.",
      },
      {
        q: "What does it cost to sell a home in Nevada?",
        a: "Typical seller costs include the real estate commission, title and escrow fees, and any negotiated concessions or repairs. Your agent can provide an estimated net-proceeds sheet before you list.",
      },
      {
        q: "Should I make repairs before selling?",
        a: "Addressing obvious maintenance and cosmetic issues usually pays off by attracting more buyers and stronger offers. Your agent can advise which improvements are worth it in your price range.",
      },
    ],
  },

  {
    slug: "relocating-to-las-vegas",
    title: "Relocating to Las Vegas: A Newcomer's Guide",
    category: "Relocation",
    featured: false,
    seoTitle: "Relocating to Las Vegas: Complete Newcomer's Moving Guide",
    seoDescription:
      "Moving to Las Vegas? Learn about the best areas, cost of living, no state income tax, schools, weather, and what to know before relocating to Southern Nevada.",
    h1: "Relocating to Las Vegas",
    eyebrow: "Relocation Guide",
    intro:
      "Everything a newcomer should know before moving to the Las Vegas Valley — the areas, the numbers, and the lifestyle beyond the Strip.",
    readMinutes: 8,
    sections: [
      {
        heading: "Why People Move to Las Vegas",
        body: [
          "Beyond the entertainment the city is famous for, the Las Vegas Valley draws newcomers with Nevada's lack of a state income tax, a relatively favorable cost of living compared to coastal metros, abundant sunshine, and quick access to outdoor recreation like Red Rock Canyon and Lake Mead.",
        ],
      },
      {
        heading: "Where to Live",
        body: [
          "The valley is a collection of distinct areas. Henderson and Summerlin are the anchors for master-planned and luxury living, while newer southwest communities offer modern construction and value. Consider commute, amenities, and the character of each community.",
        ],
        bullets: [
          "Henderson — master-planned communities, established amenities, and guard-gated luxury like Ascaya and MacDonald Highlands.",
          "Summerlin — west-side master plan with parks, trails, and Downtown Summerlin.",
          "Lake Las Vegas — waterfront resort living in eastern Henderson.",
          "Southwest & Southern Highlands — newer construction and golf-community options.",
        ],
      },
      {
        heading: "Practical Details",
        body: [
          "Nevada has no state income tax, which is a significant draw for many relocating households. Summers are hot and dry, and winters are mild. Public and private school options vary by area, so confirm current attendance zones as part of your home search.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does Nevada have a state income tax?",
        a: "No. Nevada has no state income tax, which is one of the most common reasons people relocate to Las Vegas from higher-tax states.",
      },
      {
        q: "What are the best areas to live in Las Vegas?",
        a: "Popular choices include Henderson and Summerlin for master-planned living, Lake Las Vegas for waterfront resort living, and southwest communities like Southern Highlands for newer construction and golf. The right fit depends on your commute, budget, and lifestyle.",
      },
      {
        q: "What is the cost of living in Las Vegas?",
        a: "Las Vegas generally offers a more favorable cost of living than many coastal metros, helped by no state income tax. Housing costs vary widely by community and home type.",
      },
    ],
  },

  {
    slug: "las-vegas-vs-henderson",
    title: "Las Vegas vs. Henderson: Where Should You Buy?",
    category: "Buying",
    featured: false,
    seoTitle: "Las Vegas vs. Henderson: Where Should You Buy a Home?",
    seoDescription:
      "Comparing Las Vegas and Henderson for homebuyers — communities, amenities, commute, and lifestyle — to help you decide where to buy in Southern Nevada.",
    h1: "Las Vegas vs. Henderson: Where Should You Buy?",
    eyebrow: "Buyer Guide",
    intro:
      "Two of Southern Nevada's most popular places to buy, side by side — so you can decide which fits your life and budget.",
    readMinutes: 6,
    sections: [
      {
        heading: "The Quick Answer",
        body: [
          "Both Las Vegas and Henderson are part of the same metro valley and share Nevada's tax advantages and climate. Henderson, a separate incorporated city to the southeast, is known for its master-planned communities and amenities, while Las Vegas proper offers everything from urban living near the Strip to the western master plan of Summerlin.",
        ],
      },
      {
        heading: "Consider Henderson If…",
        body: [
          "You want established master-planned communities, a wide range of amenities, and access to guard-gated luxury like Ascaya, MacDonald Highlands, and Lake Las Vegas. Henderson is frequently recognized for its parks, trails, and community planning.",
        ],
      },
      {
        heading: "Consider Las Vegas If…",
        body: [
          "You want the breadth of the city — from Summerlin's west-side master plan and Red Rock access to homes closer to the Strip, Downtown, and entertainment. Las Vegas offers the widest overall range of neighborhoods and price points.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Henderson part of Las Vegas?",
        a: "Henderson is a separate incorporated city within the greater Las Vegas Valley metro area, located southeast of Las Vegas. The two share the same region, climate, and Nevada tax advantages.",
      },
      {
        q: "Is it cheaper to live in Las Vegas or Henderson?",
        a: "Prices in both cities vary widely by community and home type, and they overlap significantly. The better value depends on the specific neighborhood and property rather than the city as a whole.",
      },
      {
        q: "Which is better for families, Las Vegas or Henderson?",
        a: "Both offer master-planned communities, parks, and schools. The right choice depends on objective factors like commute, home size, amenities, and the specific neighborhood — we're happy to help you compare options.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export const featuredGuides = guides.filter((g) => g.featured);
