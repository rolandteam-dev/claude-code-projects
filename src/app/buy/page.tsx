import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Buy a Home in Las Vegas & Henderson",
  description:
    "Everything you need to buy a home in Las Vegas and Henderson — search listings, explore communities, and get expert buyer guidance from Roland Luxury.",
  alternates: { canonical: "/buy" },
};

const cards = [
  { title: "Search Homes for Sale", desc: "Browse available homes across the valley's top communities.", href: "/listings" },
  { title: "Explore Communities", desc: "18 luxury, guard-gated, and master-planned communities.", href: "/communities" },
  { title: "Areas We Serve", desc: "Henderson, Las Vegas, Boulder City, and beyond.", href: "/areas" },
  { title: "Buyer Guides", desc: "Step-by-step guides for every kind of buyer.", href: "/guides" },
  { title: "First-Time Buyer Guide", desc: "Down payment help, loans, and the process explained.", href: "/guides/first-time-home-buyer-las-vegas" },
  { title: "VA Loans in Nevada", desc: "Zero-down financing for veterans and military buyers.", href: "/guides/va-loans-nevada" },
  { title: "New Construction", desc: "Brand-new homes and builder communities.", href: "/new-construction" },
  { title: "Market Report", desc: "See where prices and inventory stand this month.", href: "/market-report" },
];

export default function BuyHub() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Buy a Home", path: "/buy" },
        ])}
      />

      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.home} priority />
        <Container size="wide" className="relative z-10 py-16 md:py-20">
          <div className="max-w-[640px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Buyers
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.6rem]">
              Buy a Home in Las Vegas
            </h1>
            <p className="mt-5 max-w-[560px] text-[1.12rem] text-[#d9dbe0]">
              From your first home to your forever estate — search listings, explore the valley&apos;s best
              communities, and get honest, local guidance every step of the way.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/listings" className="btn">Search Homes</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to an Expert
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block rounded-[12px] border border-[var(--color-line)] bg-white p-7 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <h2 className="text-[1.25rem]">{c.title}</h2>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{c.desc}</p>
              <span className="mt-3 inline-block font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-gold)]">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
