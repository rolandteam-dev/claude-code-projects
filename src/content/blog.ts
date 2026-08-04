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
    author: "The Roland Team",
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
    author: "The Roland Team",
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
    author: "The Roland Team",
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
    author: "The Roland Team",
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
    author: "The Roland Team",
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
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function postsByCategory(category?: string): BlogPost[] {
  const sorted = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!category) return sorted;
  return sorted.filter((p) => p.category === category);
}
