import type { Metadata } from "next";
import { RentVsBuyCalculator } from "@/components/calculators/RentVsBuyCalculator";
import { CalculatorLayout } from "@/components/calculators/CalculatorLayout";
import { getCalculator } from "@/content/calculators";

const calc = getCalculator("rent-vs-buy")!;

export const metadata: Metadata = {
  title: "Rent vs. Buy Calculator | Las Vegas Real Estate",
  description:
    "Should you rent or buy in Las Vegas? Compare the true long-term cost of each and find your break-even year with this free calculator from The Roland Team.",
  alternates: { canonical: `/calculators/${calc.slug}` },
};

const faqs = [
  {
    q: "Is it better to rent or buy in Las Vegas?",
    a: "It depends mostly on how long you'll stay. Buying carries upfront costs, but each year you build equity and — in an appreciating market like Las Vegas — gain value, while rent tends to rise every year. This calculator finds the break-even year where buying becomes the cheaper choice for your numbers.",
  },
  {
    q: "What is the break-even point?",
    a: "It's the number of years you'd need to own before buying costs less than renting, once you count the equity and appreciation you keep when you eventually sell. Stay past the break-even year and buying usually wins; sell before it and renting may have been cheaper.",
  },
  {
    q: "Why does the calculator credit renters with investment growth?",
    a: "To keep the comparison fair. A renter doesn't tie up cash in a down payment, so they could invest it instead. The tool assumes that un-spent cash earns about 5% a year and subtracts that gain from renting's cost — otherwise buying would look artificially better.",
  },
  {
    q: "Does it account for tax benefits of owning?",
    a: "Not directly — mortgage-interest and property-tax deductions depend on your personal situation and whether you itemize. Treat the result as a pre-tax comparison, and talk with a tax professional about deductions that may make owning even more favorable.",
  },
];

export default function Page() {
  return (
    <CalculatorLayout
      calc={calc}
      intro="Renting isn't throwing money away — and buying isn't always the smart move. Compare the true cost of each over the years you plan to stay, and see your break-even year."
      faqs={faqs}
      cta={{
        heading: "Thinking about making the move?",
        body: "We'll help you weigh renting against buying for your exact situation and neighborhood — and show you what's available now.",
        primaryLabel: "Talk With Our Team",
        primaryHref: "/contact",
      }}
    >
      <RentVsBuyCalculator />
    </CalculatorLayout>
  );
}
