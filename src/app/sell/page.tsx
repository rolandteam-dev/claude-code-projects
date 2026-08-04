import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell a Home in Las Vegas & Henderson",
  description:
    "Sell your Las Vegas or Henderson home for more, with less stress. Get a free home valuation, luxury marketing, and expert negotiation from The Roland Team.",
  alternates: { canonical: "/sell" },
};

const points = [
  { h: "Precision pricing", p: "We price to the current market using real comparable sales — not guesswork — so your home attracts serious buyers fast." },
  { h: "Luxury marketing", p: "Professional photography, video, and targeted digital campaigns put your home in front of the right audience." },
  { h: "Expert negotiation", p: "We protect your equity and your timeline, negotiating terms that work for you from offer to close." },
];

const resources = [
  { title: "What's My Home Worth?", desc: "Get a free, precise home valuation from real local experts.", href: "/home-value" },
  { title: "Preparing Your Home to Sell", desc: "Where to focus before you list for the strongest offers.", href: "/blog/preparing-your-las-vegas-home-to-sell" },
  { title: "Seller Net Proceeds", desc: "Understand what you'll actually take home from your sale.", href: "/blog/las-vegas-luxury-seller-net-proceeds" },
  { title: "Selling Guide", desc: "The full step-by-step guide to selling in Las Vegas.", href: "/guides/selling-your-home-in-las-vegas" },
  { title: "Market Report", desc: "See where prices, pace, and inventory stand this month.", href: "/market-report" },
];

export default function SellHub() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Sell a Home", path: "/sell" },
        ])}
      />

      <section className="bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="wide" className="py-16 md:py-20">
          <div className="max-w-[620px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Sellers
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.6rem]">
              Sell for more, with less stress
            </h1>
            <p className="mt-5 max-w-[560px] text-[1.12rem] text-[#d9dbe0]">
              Las Vegas luxury marketing and local expertise that gets your home sold — on your terms.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/home-value" className="btn">What&apos;s My Home Worth?</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to an Expert
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {points.map((pt) => (
            <div key={pt.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7">
              <h2 className="text-[1.25rem]">{pt.h}</h2>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{pt.p}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-[1.7rem]">Seller resources</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="block rounded-[12px] border border-[var(--color-line)] bg-white p-7 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <h3 className="text-[1.15rem]">{r.title}</h3>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{r.desc}</p>
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
