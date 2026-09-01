import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { NeighborhoodFinder } from "@/components/NeighborhoodFinder";
import { communityAttrs } from "@/content/communityMatch";

export const metadata: Metadata = {
  title: "Neighborhood Finder | Best Las Vegas Communities for You",
  description:
    "Answer 3 quick questions and discover the Las Vegas & Henderson neighborhoods that fit your budget, area, and lifestyle. Free personalized matches from The Roland Team.",
  alternates: { canonical: "/neighborhood-finder" },
};

const faqs = [
  {
    q: "How does the Neighborhood Finder work?",
    a: "You answer three quick questions — preferred area, budget, and what matters most to you (like guard-gated privacy, golf, 55+ living, or new construction). The tool then scores every Las Vegas and Henderson community we cover and shows the ones that best fit, each linking to a full neighborhood page.",
  },
  {
    q: "Is the Neighborhood Finder free?",
    a: "Yes, completely free and with no obligation. It's a fast way to narrow the valley's many communities down to a short list that actually fits your budget and lifestyle before you start touring homes.",
  },
  {
    q: "How many neighborhoods does it compare?",
    a: `It matches you against ${communityAttrs.length} Las Vegas and Henderson communities — from value-priced master plans to ultra-luxury guard-gated enclaves — across Henderson, Summerlin, the southwest and northwest valley, North Las Vegas, and Boulder City.`,
  },
  {
    q: "What happens after I get my matches?",
    a: "You can explore each matched community's page right away. If you'd like, share your contact and we'll send current pricing, availability, and homes for sale in your matched communities — including off-market options — with no pressure to commit.",
  },
];

export default function NeighborhoodFinderPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Neighborhood Finder", path: "/neighborhood-finder" },
          ]),
          faqSchema(faqs),
        ]}
      />

      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.luxuryEstate} priority />
        <Container size="wide" className="relative z-10 py-14 md:py-16">
          <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
            Buyer Tool
          </div>
          <h1 className="mt-3 max-w-[720px] font-serif text-[2.6rem] font-semibold leading-[1.05] text-white md:text-[3.3rem]">
            Find Your Las Vegas Neighborhood
          </h1>
          <p className="mt-4 max-w-[600px] text-[1.1rem] text-[#d9dbe0]">
            The valley has dozens of distinct communities. Answer three quick questions and we&apos;ll match you
            with the ones that fit your budget, area, and lifestyle — in under a minute.
          </p>
        </Container>
      </section>

      <Container size="default" className="py-12 md:py-16">
        <div className="rounded-[18px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-9">
          <NeighborhoodFinder />
        </div>

        <p className="mt-5 text-center font-sans text-[0.78rem] text-[var(--color-muted)]">
          Matches are a starting point based on your answers — your agent&apos;s local knowledge does the rest.
        </p>
      </Container>

      <Container size="narrow" className="prose-body pb-16">
        <h2 className="text-[1.6rem]">Frequently asked questions</h2>
        <div className="mt-2">
          {faqs.map((f) => (
            <details key={f.q} className="border-b border-[var(--color-line)] py-4">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
