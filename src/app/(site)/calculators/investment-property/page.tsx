import type { Metadata } from "next";
import { InvestmentPropertyCalculator } from "@/components/calculators/InvestmentPropertyCalculator";
import { CalculatorLayout } from "@/components/calculators/CalculatorLayout";
import { getCalculator } from "@/content/calculators";

const calc = getCalculator("investment-property")!;

export const metadata: Metadata = {
  title: "Investment Property Calculator | Las Vegas Rentals",
  description:
    "Analyze a Las Vegas rental before you buy: cap rate, cash-on-cash return, NOI, and monthly cash flow — accounting for financing, vacancy, and expenses.",
  alternates: { canonical: `/calculators/${calc.slug}` },
};

const faqs = [
  {
    q: "What is a good cap rate for a rental property?",
    a: "Cap rate is net operating income divided by purchase price — the unleveraged yield of the property. In Las Vegas, many single-family rentals trade in the 4% to 6% range; investors chasing cash flow look higher, while those betting on appreciation accept lower. Compare cap rates between similar properties rather than to a fixed target.",
  },
  {
    q: "What's the difference between cap rate and cash-on-cash return?",
    a: "Cap rate ignores your loan — it's the return as if you paid all cash. Cash-on-cash return measures the annual cash flow against the actual cash you invested (down payment plus closing costs), so it reflects the effect of financing. A property can have a modest cap rate but a strong cash-on-cash return with the right leverage.",
  },
  {
    q: "What expenses should I budget for on a rental?",
    a: "Beyond the mortgage: property taxes, insurance, any HOA dues, plus reserves for vacancy, maintenance and repairs, and property management. This calculator lets you set vacancy, maintenance, and management as percentages so your numbers reflect real operating costs, not just the mortgage.",
  },
  {
    q: "Is Las Vegas a good market for rental property?",
    a: "Las Vegas draws steady in-migration and job growth, and Nevada has no state income tax — factors that support rental demand. As with any market, returns depend on the specific home, price, and financing. We help investors identify properties that pencil out; reach out to review your criteria.",
  },
];

export default function Page() {
  return (
    <CalculatorLayout
      calc={calc}
      intro="Run the numbers before you buy. Enter a property's price, rent, and expenses to see its cap rate, cash-on-cash return, and monthly cash flow at a glance."
      faqs={faqs}
      cta={{
        heading: "Looking for a rental that cash flows?",
        body: "We help investors find and analyze Las Vegas rental properties that fit their return targets. Tell us your criteria and we'll send opportunities.",
        primaryLabel: "Talk With Our Team",
        primaryHref: "/contact",
      }}
    >
      <InvestmentPropertyCalculator />
    </CalculatorLayout>
  );
}
