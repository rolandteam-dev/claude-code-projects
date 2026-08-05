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
  title: "Golf Communities in Las Vegas & Henderson",
  description:
    "The guide to golf communities in Las Vegas and Henderson — guard-gated country clubs and golf-course homes, from MacDonald Highlands to Red Rock Country Club, with The Roland Team.",
  alternates: { canonical: "/golf-communities-las-vegas" },
};

const GOLF_SLUGS = [
  "macdonald-highlands",
  "the-summit-club",
  "red-rock-country-club",
  "southern-highlands",
  "anthem",
  "tuscany",
  "rhodes-ranch",
  "aliante",
];

const faqs = [
  {
    q: "What are the best golf communities in Las Vegas?",
    a: "Top golf communities in the Las Vegas Valley include MacDonald Highlands (DragonRidge Country Club) and Southern Highlands and Anthem Country Club, along with Red Rock Country Club and The Summit Club in the Summerlin area. Options range from private country clubs to public-course communities like Rhodes Ranch, Tuscany, and Aliante.",
  },
  {
    q: "Do you have to be a golfer to live in a golf community?",
    a: "No. Many buyers choose golf communities for the views, open space, prestige, and amenities rather than the golf itself. Club membership is typically separate from home ownership, so you can enjoy the setting whether or not you play.",
  },
  {
    q: "Are Las Vegas golf communities guard-gated?",
    a: "Many are. Communities like MacDonald Highlands, Red Rock Country Club, Southern Highlands, and Anthem Country Club combine golf with guard-gated privacy, while others are gated with public courses. We can help you find the right combination.",
  },
  {
    q: "How much do golf-course homes cost in Las Vegas?",
    a: "Pricing varies widely — from around $400,000 in public-course communities to well over $10 million for custom estates in private country clubs. Golf-course frontage and views typically command a premium. Contact The Roland Team for current availability.",
  },
];

export default function GolfPillar() {
  const golfCommunities = GOLF_SLUGS.map((s) => communities.find((c) => c.slug === s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Golf Communities in Las Vegas & Henderson",
    about: "Golf communities in Las Vegas and Henderson, Nevada",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/golf-communities-las-vegas"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Golf Communities", path: "/golf-communities-las-vegas" },
          ]),
          article,
          faqSchema(faqs),
        ]}
      />

      <header className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.golf} priority />
        <Container size="wide" className="relative z-10 py-20 md:py-28">
          <div className="max-w-[680px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Las Vegas &amp; Henderson · Golf Living
            </div>
            <h1 className="mt-4 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[3.9rem]">
              Golf Communities in Las Vegas
            </h1>
            <p className="mt-5 max-w-[580px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              Private country clubs and golf-course homes across the valley — from guard-gated luxury to
              approachable public-course living.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#communities" className="btn">Explore Golf Communities</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to a Specialist
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-14">
        <p className="text-[1.2rem] leading-relaxed">
          With sunshine most of the year and dramatic desert scenery, the Las Vegas Valley is a golfer&apos;s
          paradise — and its golf communities are among the most desirable places to live in Southern Nevada.
          From guard-gated private country clubs like DragonRidge at MacDonald Highlands to public-course
          communities with approachable pricing, there&apos;s a golf lifestyle for nearly every buyer.
        </p>

        <h2 className="mt-11 text-[1.6rem]">Why buyers choose golf communities</h2>
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>Views &amp; open space</strong> — fairway and mountain vistas, less density.</li>
          <li><strong>Amenities</strong> — clubhouses, dining, fitness, and social calendars.</li>
          <li><strong>Prestige &amp; privacy</strong> — many are guard-gated country clubs.</li>
          <li><strong>Lifestyle</strong> — you don&apos;t have to golf to love the setting.</li>
        </ul>
      </Container>

      <Container size="wide" className="py-8">
        <div id="communities" className="scroll-mt-24">
          <div className="eyebrow">Featured</div>
          <h2 className="mt-2 text-[1.9rem]">Golf communities in the valley</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {golfCommunities.map((c) => (
              <CommunityCard key={c.slug} c={c} />
            ))}
          </div>
        </div>
      </Container>

      <Container size="narrow" className="prose-body py-6">
        <h2 className="mt-4 text-[1.6rem]">Frequently asked questions</h2>
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
          <h2 className="text-[1.7rem] text-white">Find your golf-course home</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            The Roland Team can help you find the right golf community and home across Las Vegas and Henderson.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
