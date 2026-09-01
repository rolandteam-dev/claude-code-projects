import type { Metadata } from "next";
import { AffordabilityCalculator } from "@/components/calculators/AffordabilityCalculator";
import { CalculatorLayout } from "@/components/calculators/CalculatorLayout";
import { getCalculator } from "@/content/calculators";

const calc = getCalculator("home-affordability")!;

export const metadata: Metadata = {
  title: "Home Affordability Calculator | Las Vegas Home Buyers",
  description:
    "How much home can you afford in Las Vegas? Estimate your price range from your income, debts, and down payment — then get pre-approved with The Roland Team.",
  alternates: { canonical: `/calculators/${calc.slug}` },
};

const faqs = [
  {
    q: "How much home can I afford on my salary?",
    a: "Lenders generally want your total housing payment to stay near 28% of your gross monthly income and your total debts under about 43%. This calculator applies both rules to estimate a price range. The exact number depends on your credit, loan program, and cash reserves — a pre-approval confirms it.",
  },
  {
    q: "What counts as monthly debt?",
    a: "Recurring obligations that show on your credit — car loans, student loans, minimum credit-card payments, personal loans, and child support or alimony. Utilities, groceries, and other everyday spending are not counted in the debt-to-income ratio.",
  },
  {
    q: "How much should I put down on a home in Las Vegas?",
    a: "Twenty percent avoids private mortgage insurance, but many buyers put down far less — Nevada offers conventional loans as low as 3% down, FHA at 3.5%, and 0% down for eligible VA and USDA buyers. A larger down payment raises the price you can afford and lowers your payment.",
  },
  {
    q: "Does this include property taxes and insurance?",
    a: "Yes. The estimated payment includes principal, interest, an approximate Nevada property-tax figure (about 0.6% of value per year), and homeowner's insurance. It does not include HOA dues, which vary by community — add those when you compare specific homes.",
  },
];

export default function Page() {
  return (
    <CalculatorLayout
      calc={calc}
      intro="Estimate the price range you can comfortably shop in, based on your income, monthly debts, and down payment — using the same qualifying ratios lenders use."
      faqs={faqs}
      cta={{
        heading: "Ready to confirm your real budget?",
        body: "A quick, no-obligation pre-approval turns this estimate into a number sellers trust. We'll connect you with a trusted local lender.",
        primaryLabel: "Get Pre-Approved",
        primaryHref: "/mortgage-pre-approval",
      }}
    >
      <AffordabilityCalculator />
    </CalculatorLayout>
  );
}
