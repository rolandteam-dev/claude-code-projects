import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema } from "@/lib/schema";
import { calculators } from "@/content/calculators";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Real Estate Calculators | Las Vegas Buyers, Sellers & Investors",
  description:
    "Free Las Vegas real estate calculators: home affordability, rent vs. buy, seller net proceeds, and investment property cash flow — from The Roland Team.",
  alternates: { canonical: "/calculators" },
};

// A few related tools that live elsewhere on the site.
const relatedTools = [
  { name: "What's My Home Worth?", href: "/home-value", note: "Instant home value estimate" },
  { name: "Mortgage Pre-Approval", href: "/mortgage-pre-approval", note: "Know your buying power" },
  { name: "Market Report", href: "/market-report", note: "Live valley market data" },
];

export default function CalculatorsHub() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
        ])}
      />

      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.luxuryEstate} priority />
        <Container size="wide" className="relative z-10 py-16 md:py-20">
          <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
            Tools
          </div>
          <h1 className="mt-3 max-w-[720px] font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.4rem]">
            Real Estate Calculators
          </h1>
          <p className="mt-5 max-w-[620px] text-[1.12rem] text-[#d9dbe0]">
            Free tools to help you make a confident move in the Las Vegas and Henderson market — whether
            you&apos;re buying, selling, or investing.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-7 sm:grid-cols-2">
          {calculators.map((c) => (
            <Link
              key={c.slug}
              href={`/calculators/${c.slug}`}
              className="group flex flex-col rounded-[14px] border border-[var(--color-line)] bg-white p-7 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <div className="font-sans text-[0.66rem] uppercase tracking-[0.14em] text-[var(--color-gold)]">
                {c.audience}
              </div>
              <h2 className="mt-2 font-serif text-[1.5rem] leading-snug text-[var(--color-ink)]">{c.name}</h2>
              <p className="mt-1 font-sans text-[1rem] font-semibold text-[var(--color-ink-soft)]">{c.question}</p>
              <p className="mt-3 text-[0.92rem] text-[var(--color-ink-soft)]">{c.blurb}</p>
              <span className="mt-4 font-sans text-[0.85rem] font-semibold text-[var(--color-gold)]">
                Open calculator →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-14">
          <div className="eyebrow">More tools</div>
          <h2 className="mt-2 text-[1.6rem]">Related resources</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {relatedTools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-5 no-underline transition-colors hover:border-[var(--color-gold)]"
              >
                <div className="font-sans text-[1.02rem] font-semibold text-[var(--color-ink)]">{t.name}</div>
                <div className="mt-1 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">{t.note}</div>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      <Container size="narrow" className="pb-16">
        <div className="rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Have a question the calculator can&apos;t answer?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Numbers are a starting point. For guidance tailored to your home, budget, and goals, talk with The
            Roland Team.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href={site.cta.href} className="btn">
              {site.cta.label}
            </Link>
            <a href={`tel:${site.phone}`} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
              Call {site.phone}
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
