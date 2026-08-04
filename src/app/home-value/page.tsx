import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "What's My Home Worth? Free Las Vegas Home Valuation",
  description:
    "Get a free, no-obligation home valuation for your Las Vegas or Henderson home. The Roland Team delivers a precise, local market analysis — not an automated guess.",
  alternates: { canonical: "/home-value" },
};

export default function HomeValuePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Home Valuation", path: "/home-value" },
        ])}
      />

      <section className="bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="wide" className="grid gap-10 py-16 md:grid-cols-2 md:py-20">
          <div className="max-w-[520px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Sellers
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.4rem]">
              What&apos;s your home worth?
            </h1>
            <p className="mt-5 text-[1.12rem] text-[#d9dbe0]">
              Skip the automated estimates. Get a precise, human home valuation from a team that actually knows
              your neighborhood — based on real comparable sales, current demand, and your home&apos;s specifics.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[#d9dbe0]">
              <li>✓ Local expertise, not a generic algorithm</li>
              <li>✓ No obligation, no pressure</li>
              <li>✓ A real strategy to maximize your sale</li>
            </ul>
          </div>

          {/* Valuation request form → Follow Up Boss */}
          <div className="rounded-[14px] bg-white p-7 text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
            <div className="mb-5 font-sans text-[1.1rem] font-semibold">Request your free valuation</div>
            <LeadForm
              type="Seller Inquiry"
              tag="Home Valuation"
              source="Home Valuation Page"
              showAddress
              submitLabel="Get My Home Value"
            />
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { h: "We analyze real comps", p: "Recent, truly comparable sales in your specific community — not valley-wide averages that miss the mark." },
            { h: "We factor in your home", p: "Upgrades, condition, lot, and views all move the number. A human sees what an algorithm can't." },
            { h: "We build a strategy", p: "A valuation is step one. We pair it with a pricing and marketing plan to maximize your result." },
          ].map((c) => (
            <div key={c.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
              <h2 className="text-[1.2rem]">{c.h}</h2>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{c.p}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/market-report" className="font-sans text-[0.9rem] font-semibold text-[var(--color-gold)] no-underline hover:underline">
            See the current Las Vegas market report →
          </Link>
        </div>
      </Container>
    </>
  );
}
