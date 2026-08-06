import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CommunityCard } from "@/components/CommunityCard";
import { HeroBg } from "@/components/HeroBg";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { communities } from "@/content/communities";
import { heroImages } from "@/lib/heroImages";
import { site, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Las Vegas Luxury Real Estate | Guard-Gated Homes & Estates",
  description:
    "The complete guide to Las Vegas luxury real estate — the valley's most exclusive guard-gated communities, custom estates, price tiers, and how to buy or sell luxury with Roland Luxury.",
  alternates: { canonical: "/las-vegas-luxury-real-estate" },
};

const LUXURY_SLUGS = [
  "ascaya",
  "the-summit-club",
  "macdonald-highlands",
  "the-ridges-summerlin",
  "red-rock-country-club",
  "southern-highlands",
  "lake-las-vegas",
  "seven-hills",
];

const faqs = [
  {
    q: "What are the most exclusive communities in Las Vegas?",
    a: "The most exclusive communities in the Las Vegas Valley include Ascaya and MacDonald Highlands in Henderson, and The Summit Club and The Ridges in Summerlin. These are guard-gated communities of custom estates, often with dramatic elevation, Strip and mountain views, and resort-caliber private amenities.",
  },
  {
    q: "How much do luxury homes in Las Vegas cost?",
    a: "Luxury generally begins around $1 million, with most guard-gated luxury homes ranging from roughly $1.5 million to $5 million. Ultra-luxury custom estates in communities like Ascaya and The Summit Club frequently exceed $5 million and can reach well into eight figures, depending on lot, elevation, size, and finish.",
  },
  {
    q: "What is the most expensive area in Las Vegas for real estate?",
    a: "Summerlin's The Summit Club and The Ridges, along with Henderson's Ascaya, are consistently among the most expensive addresses in the Las Vegas Valley, with custom estates reaching the highest price points in Southern Nevada.",
  },
  {
    q: "Are there guard-gated communities in Las Vegas and Henderson?",
    a: "Yes. The valley has many guard-gated communities offering 24-hour security and privacy, including Ascaya, MacDonald Highlands, The Ridges, The Summit Club, Red Rock Country Club, and Southern Highlands, among others.",
  },
  {
    q: "Who specializes in Las Vegas luxury real estate?",
    a: `Roland Luxury, led by ${site.founder} with ${site.brokerage}, specializes in luxury and guard-gated communities across Las Vegas and Henderson — representing buyers and sellers of custom estates, homesites, and luxury residences throughout Southern Nevada.`,
  },
];

export default function LuxuryPillar() {
  const luxuryCommunities = LUXURY_SLUGS.map((s) => communities.find((c) => c.slug === s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Las Vegas Luxury Real Estate",
    about: "Luxury and guard-gated real estate in Las Vegas and Henderson, Nevada",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/las-vegas-luxury-real-estate"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Las Vegas Luxury Real Estate", path: "/las-vegas-luxury-real-estate" },
          ]),
          article,
          faqSchema(faqs),
        ]}
      />

      {/* Hero */}
      <header className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.luxuryEstate} priority />
        <Container size="wide" className="relative z-10 py-20 md:py-28">
          <div className="max-w-[680px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Las Vegas &amp; Henderson · Luxury
            </div>
            <h1 className="mt-4 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[4rem]">
              Las Vegas Luxury Real Estate
            </h1>
            <p className="mt-5 max-w-[580px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              A guide to Southern Nevada&apos;s most exclusive addresses — guard-gated communities, custom
              estates, and the specialists who know every gate on the hill.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#communities" className="btn">Explore Luxury Communities</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to a Specialist
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-14">
        <p className="text-[1.2rem] leading-relaxed">
          Las Vegas luxury real estate is defined by dramatic desert-contemporary architecture, elevated
          homesites with unobstructed Strip and mountain views, and guard-gated privacy just minutes from
          world-class dining, golf, and entertainment. From ultra-exclusive custom-estate enclaves to
          amenity-rich master plans, Southern Nevada offers some of the most distinctive luxury homes in the
          country — with no state income tax as an added draw for buyers.
        </p>

        <h2 className="mt-11 text-[1.6rem]">What defines luxury in the Las Vegas Valley</h2>
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>Guard-gated privacy &amp; security</strong> — 24-hour staffed entry and exclusivity.</li>
          <li><strong>Elevated, view-oriented homesites</strong> — Strip, valley, and mountain vistas.</li>
          <li><strong>Custom, architect-designed estates</strong> — walls of glass, indoor-outdoor living.</li>
          <li><strong>Resort-caliber amenities</strong> — private clubs, golf, spas, and clubhouses.</li>
          <li><strong>Proximity</strong> — minutes from the Strip, the airport, and Henderson&apos;s best.</li>
        </ul>

        <h2 className="mt-11 text-[1.6rem]">Luxury home prices in Las Vegas</h2>
        <p>
          Luxury generally begins around <strong>$1 million</strong>. Most guard-gated luxury homes fall between
          roughly <strong>$1.5 million and $5 million</strong>, while ultra-luxury custom estates in communities
          like Ascaya and The Summit Club regularly exceed <strong>$5 million</strong> and can climb well into
          eight figures. Pricing varies widely with elevation, lot size, square footage, and level of custom
          finish — always confirm current availability, since the finest homes and homesites are limited.
        </p>
      </Container>

      {/* Luxury communities */}
      <Container size="wide" className="py-8" >
        <div id="communities" className="scroll-mt-24">
          <div className="eyebrow">Featured</div>
          <h2 className="mt-2 text-[1.9rem]">The valley&apos;s premier luxury communities</h2>
          <p className="mt-3 max-w-[660px] text-[var(--color-ink-soft)]">
            The guard-gated and custom-estate communities that define Las Vegas and Henderson luxury.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {luxuryCommunities.map((c) => (
              <CommunityCard key={c.slug} c={c} />
            ))}
          </div>
        </div>
      </Container>

      <Container size="narrow" className="prose-body py-10">
        <h2 className="mt-4 text-[1.6rem]">Buying a luxury home in Las Vegas</h2>
        <p>
          Luxury purchases reward discretion and local relationships. A specialist can surface off-market and
          coming-soon opportunities, navigate club memberships and custom builds, and represent your interests
          on complex, high-value transactions. Whether you&apos;re relocating, buying a second home, or building
          a bespoke estate, the right guidance protects both your investment and your privacy.
        </p>

        <h2 className="mt-11 text-[1.6rem]">Selling a luxury home in Las Vegas</h2>
        <p>
          Selling at the top of the market takes more than a listing — it takes precise pricing against a thin
          set of true comparables, cinematic photography and video, and targeted marketing that reaches
          qualified luxury buyers rather than broad, unqualified traffic. Positioning and strategy matter far
          more than valley-wide averages in the luxury tier.
        </p>

        <h2 className="mt-11 text-[1.6rem]">Why work with a Las Vegas luxury specialist</h2>
        <p>
          Roland Luxury, led by {site.founder} with {site.brokerage}, focuses on Las Vegas and Henderson&apos;s
          luxury and guard-gated communities — from Ascaya and MacDonald Highlands to The Ridges and The Summit
          Club. We pair deep, gate-by-gate local knowledge with a client-first, discreet approach to help you
          buy or sell at the highest level.
        </p>

        <h2 className="mt-12 text-[1.6rem]">Frequently asked questions</h2>
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

        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Explore Las Vegas luxury real estate</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Ready to buy or sell at the top of the market? Roland Luxury specializes in the valley&apos;s finest
            communities.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
