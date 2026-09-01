/**
 * Calculator suite metadata. Powers the /calculators hub, the individual tool
 * pages' breadcrumbs, the sitemap, and footer/nav links — so adding a
 * calculator here wires it everywhere.
 */
import type { heroImages } from "@/lib/heroImages";

export type CalculatorMeta = {
  slug: string;
  /** Full page/nav name */
  name: string;
  /** Short question-style label for cards */
  question: string;
  /** One-line description (hub card + meta) */
  blurb: string;
  hero: keyof typeof heroImages;
  audience: "Buyers" | "Sellers" | "Investors";
};

export const calculators: CalculatorMeta[] = [
  {
    slug: "home-affordability",
    name: "Home Affordability Calculator",
    question: "How much home can I afford?",
    blurb:
      "Estimate the Las Vegas home price you qualify for based on your income, debts, and down payment.",
    hero: "newConstruction",
    audience: "Buyers",
  },
  {
    slug: "rent-vs-buy",
    name: "Rent vs. Buy Calculator",
    question: "Is it smarter to rent or buy?",
    blurb:
      "Compare the true cost of renting against buying a Las Vegas home over the years you plan to stay.",
    hero: "henderson",
    audience: "Buyers",
  },
  {
    slug: "seller-net-proceeds",
    name: "Seller Net Proceeds Calculator",
    question: "What will I net from my sale?",
    blurb:
      "Estimate your take-home proceeds after commission, closing costs, and your remaining mortgage payoff.",
    hero: "estate",
    audience: "Sellers",
  },
  {
    slug: "investment-property",
    name: "Investment Property Calculator",
    question: "Will this rental cash flow?",
    blurb:
      "Run cap rate, cash-on-cash return, and monthly cash flow on a Las Vegas rental before you buy.",
    hero: "golf",
    audience: "Investors",
  },
];

export function getCalculator(slug: string): CalculatorMeta | undefined {
  return calculators.find((c) => c.slug === slug);
}
