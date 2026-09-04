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
  title: "Guard-Gated Communities in Las Vegas & Henderson",
  description:
    "The complete guide to guard-gated communities in Las Vegas and Henderson — the valley's most private, secure neighborhoods, from Ascaya to The Summit Club, with The Roland Team.",
  alternates: { canonical: "/guard-gated-communities-las-vegas" },
};

const GATED_SLUGS = [
  "ascaya",
  "the-summit-club",
  "macdonald-highlands",
  "the-ridges-summerlin",
  "red-rock-country-club",
  "southern-highlands",
  "tuscany",
  "rhodes-ranch",
];

const faqs = [
  {
    q: "What guard-gated communities are in Las Vegas and Henderson?",
    a: "The valley's guard-gated communities include Ascaya, MacDonald Highlands, and Tuscany in Henderson, and The Ridges, The Summit Club, Red Rock Country Club, Southern Highlands, and Rhodes Ranch in the Las Vegas area — ranging from ultra-luxury custom-estate enclaves to gated golf communities at more accessible price points.",
  },
  {
    q: "What is the difference between guard-gated and gated?",
    a: "A gated community has controlled access, often via a resident gate code or remote. A guard-gated community adds a staffed entry — typically 24-hour security personnel who screen visitors — providing a higher level of privacy and security. Guard-gated communities usually carry higher HOA dues to fund that staffing.",
  },
  {
    q: "Are guard-gated communities worth it?",
    a: "For buyers who prioritize privacy, security, and exclusivity, guard-gated living is a major draw, and these homes often hold their appeal well. The trade-off is higher HOA dues. Whether it's worth it depends on your priorities and budget — a local specialist can help you weigh the options.",
  },
  {
    q: "How much are HOA dues in guard-gated communities?",
    a: "Guard-gated HOA dues are typically higher than in non-gated neighborhoods because they fund staffed security and often extensive amenities. They vary widely by community — always confirm the current dues for any specific home, and review the governing documents during escrow.",
  },
  {
    q: "What is the most exclusive guard-gated community in Las Vegas?",
    a: "Ascaya in Henderson and The Summit Club and The Ridges in Summerlin are among the most exclusive guard-gated communities in the Las Vegas Valley, featuring ultra-luxury custom estates, dramatic elevation, and resort-caliber private amenities.",
  },
];

export default function GuardGatedPillar() {
  const gatedCommunities = GATED_SLUGS.map((s) => communities.find((c) => c.slug === s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Guard-Gated Communities in Las Vegas & Henderson",
    about: "Guard-gated communities in Las Vegas and Henderson, Nevada",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/guard-gated-communities-las-vegas"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Guard-Gated Communities", path: "/guard-gated-communities-las-vegas" },
          ]),
          article,
          faqSchema(faqs),
        ]}
      />

      <header className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.home} priority />
        <Container size="wide" className="relative z-10 py-20 md:py-28">
          <div className="max-w-[680px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Las Vegas &amp; Henderson · Private &amp; Secure
            </div>
            <h1 className="mt-4 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[3.9rem]">
              Guard-Gated Communities in Las Vegas
            </h1>
            <p className="mt-5 max-w-[580px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              The valley&apos;s most private, secure neighborhoods — from ultra-luxury custom-estate enclaves to
              gated golf communities — and how to find the right one.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#communities" className="btn">Explore Guard-Gated Communities</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to a Specialist
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-14">
        <p className="text-[1.2rem] leading-relaxed">
          Guard-gated communities are among the most sought-after addresses in the Las Vegas Valley. With
          staffed 24-hour entry, controlled access, and often extensive private amenities, they offer a level of
          privacy and security that draws executives, celebrities, and discerning buyers to Las Vegas and
          Henderson. From Ascaya&apos;s hillside estates to gated golf communities, Southern Nevada&apos;s
          guard-gated options span a wide range of lifestyles and price points.
        </p>

        <h2 className="mt-11 text-[1.6rem]">Why buyers choose guard-gated living</h2>
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>Privacy &amp; security</strong> — staffed, 24-hour controlled entry.</li>
          <li><strong>Exclusivity</strong> — limited access preserves a quiet, private atmosphere.</li>
          <li><strong>Amenities</strong> — many include private clubs, golf, pools, and clubhouses.</li>
          <li><strong>Prestige &amp; value</strong> — guard-gated addresses hold strong, lasting appeal.</li>
        </ul>

        <h2 className="mt-11 text-[1.6rem]">Guard-gated vs. gated: what&apos;s the difference?</h2>
        <p>
          A gated community uses controlled access — often a code or remote — while a guard-gated community adds
          staffed security that screens every visitor. The guard-gated tier offers more privacy and typically
          carries higher HOA dues to fund it. For a fuller comparison, see our guide to{" "}
          <Link href="/blog/guard-gated-vs-master-planned-las-vegas" className="font-semibold text-[var(--color-gold)]">
            guard-gated vs. master-planned communities
          </Link>{" "}
          and{" "}
          <Link href="/guides/understanding-hoas-las-vegas" className="font-semibold text-[var(--color-gold)]">
            understanding HOAs
          </Link>
          .
        </p>
      </Container>

      <Container size="wide" className="py-8">
        <div id="communities" className="scroll-mt-24">
          <div className="eyebrow">Featured</div>
          <h2 className="mt-2 text-[1.9rem]">Guard-gated communities in the valley</h2>
          <p className="mt-3 max-w-[660px] text-[var(--color-ink-soft)]">
            Explore the valley&apos;s premier guard-gated neighborhoods, from ultra-luxury to gated golf.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {gatedCommunities.map((c) => (
              <CommunityCard key={c.slug} c={c} />
            ))}
          </div>
        </div>
      </Container>

      <Container size="narrow" className="prose-body py-10">
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
          <h2 className="text-[1.7rem] text-white">Find your guard-gated home</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            The Roland Team knows every gate on the hill. Let&apos;s find the right community for you.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
