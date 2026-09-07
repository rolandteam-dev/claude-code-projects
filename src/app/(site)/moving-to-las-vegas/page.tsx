import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { HeroBg } from "@/components/HeroBg";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { areas } from "@/content/areas";
import { heroImages } from "@/lib/heroImages";
import { site, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Moving to Las Vegas: The Complete Relocation Guide",
  description:
    "Thinking of moving to Las Vegas? The complete relocation guide — no state income tax, cost of living, the best areas to live, schools, and weather, from The Roland Team.",
  alternates: { canonical: "/moving-to-las-vegas" },
};

const resources = [
  { title: "Relocating to Las Vegas", desc: "The newcomer's overview of the valley.", href: "/guides/relocating-to-las-vegas" },
  { title: "Cost of Living in Las Vegas", desc: "Taxes, housing, and everyday costs.", href: "/guides/cost-of-living-las-vegas" },
  { title: "Schools in Las Vegas & Henderson", desc: "How schools and zoning work.", href: "/guides/schools-las-vegas-henderson" },
  { title: "Las Vegas vs. Henderson", desc: "Where should you buy?", href: "/guides/las-vegas-vs-henderson" },
  { title: "Buying a Home in Las Vegas", desc: "The step-by-step buyer guide.", href: "/guides/buying-a-home-in-las-vegas" },
  { title: "Market Report", desc: "Where the market stands this month.", href: "/market-report" },
];

const faqs = [
  {
    q: "Is Las Vegas a good place to live?",
    a: "Many people find Las Vegas an appealing place to live for its lack of a state income tax, relatively favorable cost of living compared to coastal metros, abundant sunshine, and quick access to outdoor recreation like Red Rock Canyon and Lake Mead — plus master-planned communities in Henderson and Summerlin beyond the entertainment the city is known for.",
  },
  {
    q: "Does Nevada have a state income tax?",
    a: "No. Nevada has no state income tax, which is one of the most common financial reasons people relocate to Las Vegas from higher-tax states.",
  },
  {
    q: "What are the best areas to live in Las Vegas?",
    a: "Popular choices include Henderson and Summerlin for master-planned living, Lake Las Vegas for waterfront resort living, and southwest communities like Southern Highlands for newer construction and golf. The right fit depends on your commute, budget, and lifestyle.",
  },
  {
    q: "How much does it cost to live in Las Vegas?",
    a: "Las Vegas generally offers a more favorable cost of living than many coastal metros, helped by no state income tax. Housing is the largest variable and ranges widely by community, from approachable master plans to multimillion-dollar guard-gated estates.",
  },
  {
    q: "What should I know before moving to Las Vegas?",
    a: "Confirm current school attendance zones for any home, budget for summer cooling costs (energy-efficient homes help), factor in HOA dues common in master-planned communities, and get pre-approved before you shop. A local team can help you choose the right area and navigate the move.",
  },
];

export default function MovingPillar() {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Moving to Las Vegas: The Complete Relocation Guide",
    about: "Relocating to Las Vegas and Henderson, Nevada",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/moving-to-las-vegas"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Moving to Las Vegas", path: "/moving-to-las-vegas" },
          ]),
          article,
          faqSchema(faqs),
        ]}
      />

      <header className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.henderson} priority />
        <Container size="wide" className="relative z-10 py-20 md:py-28">
          <div className="max-w-[680px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Relocation · Southern Nevada
            </div>
            <h1 className="mt-4 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[3.9rem]">
              Moving to Las Vegas
            </h1>
            <p className="mt-5 max-w-[580px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              Everything a newcomer needs — no state income tax, cost of living, the best areas to live, schools,
              and how to make the move with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#areas" className="btn">Explore Areas</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to a Local Expert
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-14">
        <p className="text-[1.2rem] leading-relaxed">
          Las Vegas has become one of the country&apos;s most popular relocation destinations — and for good
          reason. Beyond the entertainment the city is famous for, Southern Nevada offers no state income tax, a
          favorable cost of living compared to many coastal metros, sunshine most of the year, and master-planned
          communities in Henderson and Summerlin that rank among the most livable in the nation.
        </p>

        <h2 className="mt-11 text-[1.6rem]">Why people move to Las Vegas</h2>
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>No state income tax</strong> — a major draw for relocating households.</li>
          <li><strong>Favorable cost of living</strong> — more home for the money than many coastal cities.</li>
          <li><strong>Climate &amp; recreation</strong> — sunshine, Red Rock Canyon, and Lake Mead nearby.</li>
          <li><strong>Master-planned living</strong> — Henderson and Summerlin lead the way.</li>
        </ul>
      </Container>

      <Container size="wide" className="py-8">
        <div id="areas" className="scroll-mt-24">
          <div className="eyebrow">Where to Live</div>
          <h2 className="mt-2 text-[1.9rem]">Choose your area</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {areas.map((a) => (
              <Link
                key={a.slug}
                href={`/areas/${a.slug}`}
                className="block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
              >
                <div className="flex h-24 items-end bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-4">
                  <span className="font-sans text-[1.15rem] font-semibold text-white">{a.name}</span>
                </div>
                <p className="p-4 text-[0.88rem] text-[var(--color-ink-soft)]">{a.intro}</p>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      <Container size="wide" className="py-10">
        <h2 className="text-[1.7rem]">Relocation resources</h2>
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
                Read →
              </span>
            </Link>
          ))}
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
          <h2 className="text-[1.7rem] text-white">Planning your move to Las Vegas?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            The Roland Team helps relocating buyers find the right area and home across the valley.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
