import type { Metadata } from "next";
import { SellerNetProceeds } from "@/components/calculators/SellerNetProceeds";
import { CalculatorLayout } from "@/components/calculators/CalculatorLayout";
import { getCalculator } from "@/content/calculators";

const calc = getCalculator("seller-net-proceeds")!;

export const metadata: Metadata = {
  title: "Seller Net Proceeds Calculator | Las Vegas Home Sellers",
  description:
    "How much will you walk away with? Estimate your net proceeds from selling a Las Vegas home after commission, closing costs, and mortgage payoff.",
  alternates: { canonical: `/calculators/${calc.slug}` },
};

const faqs = [
  {
    q: "How do I calculate my net proceeds from selling a home?",
    a: "Start with your expected sale price, then subtract the agent commission, closing costs (title, escrow, transfer fees, and prorations), your remaining mortgage balance, and any concessions or repairs you agree to. What's left is your net proceeds — the cash you take home.",
  },
  {
    q: "What are typical closing costs for a seller in Nevada?",
    a: "Beyond commission, sellers in Nevada usually pay roughly 1% to 2% of the sale price in title insurance, escrow fees, the real property transfer tax, and prorated taxes or HOA dues. The exact figure depends on your price, timing, and any negotiated credits.",
  },
  {
    q: "Is the real estate commission negotiable?",
    a: "Yes. Commission is always negotiable and is set in your listing agreement, not fixed by law. This calculator defaults to a common total rate so you can see the impact, but your actual rate and how it's split are agreed up front with your agent.",
  },
  {
    q: "How can I get a precise net-proceeds figure?",
    a: "The most accurate number comes from a seller net sheet prepared alongside a comparative market analysis of your specific home. The Roland Team provides both at no cost — request a valuation and we'll build your personalized estimate.",
  },
];

export default function Page() {
  return (
    <CalculatorLayout
      calc={calc}
      intro="Before you list, know your bottom line. Estimate the cash you'll walk away with after commission, closing costs, and paying off your mortgage."
      faqs={faqs}
      cta={{
        heading: "Want an exact number for your home?",
        body: "We'll prepare a precise seller net sheet alongside a free market analysis of your home — so there are no surprises at closing.",
        primaryLabel: "Get My Home Value",
        primaryHref: "/home-value",
      }}
    >
      <SellerNetProceeds />
    </CalculatorLayout>
  );
}
