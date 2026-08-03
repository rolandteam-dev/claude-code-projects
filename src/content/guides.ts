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
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export const featuredGuides = guides.filter((g) => g.featured);
