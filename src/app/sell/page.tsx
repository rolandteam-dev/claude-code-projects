import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell Your Las Vegas Home",
  description:
    "Thinking of selling your Las Vegas or Henderson home? The Roland Team delivers luxury marketing, sharp pricing, and expert negotiation to maximize your sale.",
  alternates: { canonical: "/sell" },
};

const points = [
  { h: "Precision pricing", p: "We price to the current market using real comparable sales — not guesswork — so your home attracts serious buyers fast." },
  { h: "Luxury marketing", p: "Professional photography, video, and targeted digital campaigns put your home in front of the right audience." },
  { h: "Expert negotiation", p: "We protect your equity and your timeline, negotiating terms that work for you from offer to close." },
];

export default function SellPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="narrow" className="py-20 text-center">
          <div className="eyebrow" style={{ color: "var(--color-gold-2)" }}>Sellers</div>
          <h1 className="mx-auto mt-3 max-w-[640px] text-[2.5rem] font-semibold leading-[1.15] text-white">
            Sell for more, with less stress
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[1.1rem] text-[#d9dbe0]">
            Las Vegas luxury marketing and local expertise that gets your home sold — on your terms.
          </p>
          <Link href={site.cta.href} className="btn mt-8">Request a Home Valuation</Link>
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
      </Container>
    </>
  );
}
