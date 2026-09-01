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
  title: "55+ & Active Adult Communities in Las Vegas & Henderson",
  description:
    "The guide to 55+ and active-adult communities in Las Vegas and Henderson — Sun City Summerlin, Sun City Aliante, Solera at Anthem, and more, with Roland Luxury.",
  alternates: { canonical: "/active-adult-communities-las-vegas" },
};

const ACTIVE_ADULT_SLUGS = ["sun-city-summerlin", "solera-at-anthem", "sun-city-aliante", "anthem"];

const faqs = [
  {
    q: "What are the best 55+ communities in Las Vegas?",
    a: "Popular 55+ active-adult communities in the Las Vegas Valley include Sun City Summerlin, Sun City Aliante in North Las Vegas, and Solera at Anthem and Sun City Anthem in Henderson. Each offers recreation centers, clubs, and low-maintenance homes designed for active adults.",
  },
  {
    q: "What does an age-qualified (55+) community mean?",
    a: "An age-qualified or age-restricted community generally requires that at least one resident of each household meet a minimum age (commonly 55), with limits on younger permanent residents. These communities are designed around active-adult amenities and lifestyle.",
  },
  {
    q: "What amenities do active-adult communities offer?",
    a: "Most 55+ communities feature recreation centers with fitness and pools, walking trails, and an extensive calendar of clubs, classes, and social activities. Several are built around golf, and some are guard-gated for added privacy.",
  },
  {
    q: "How much do homes in Las Vegas 55+ communities cost?",
    a: "Prices vary by community and floor plan but generally range from the mid-$300,000s to around $1 million or more for larger or premium homes. Contact Roland Luxury for current availability in any specific community.",
  },
];

export default function ActiveAdultPillar() {
  const aaCommunities = ACTIVE_ADULT_SLUGS.map((s) => communities.find((c) => c.slug === s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "55+ & Active Adult Communities in Las Vegas & Henderson",
    about: "Age-qualified 55+ active-adult communities in Las Vegas and Henderson, Nevada",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/active-adult-communities-las-vegas"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "55+ Communities", path: "/active-adult-communities-las-vegas" },
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
              Las Vegas &amp; Henderson · Active Adult
            </div>
            <h1 className="mt-4 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[3.9rem]">
              55+ &amp; Active Adult Communities
            </h1>
            <p className="mt-5 max-w-[580px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              Low-maintenance living, resort-style amenities, and vibrant social calendars — a guide to the
              valley&apos;s best 55+ communities.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#communities" className="btn">Explore 55+ Communities</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to a Specialist
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-14">
        <p className="text-[1.2rem] leading-relaxed">
          The Las Vegas Valley is one of the country&apos;s most popular destinations for active adults — and it
          shows in the quality of its 55+ communities. With no state income tax, abundant sunshine, and
          resort-style amenities, communities like Sun City Summerlin, Sun City Aliante, and Solera at Anthem
          offer low-maintenance homes, recreation centers, and a full social calendar for residents 55 and
          better.
        </p>

        <h2 className="mt-11 text-[1.6rem]">What to expect in a 55+ community</h2>
        <ul className="ml-5 list-disc space-y-2">
          <li><strong>Recreation centers</strong> — fitness, pools, and gathering spaces.</li>
          <li><strong>Clubs &amp; activities</strong> — dozens of interest groups and social events.</li>
          <li><strong>Low-maintenance homes</strong> — lock-and-leave living, often single-story.</li>
          <li><strong>Golf &amp; gated options</strong> — several are built around golf or guard-gated.</li>
        </ul>
      </Container>

      <Container size="wide" className="py-8">
        <div id="communities" className="scroll-mt-24">
          <div className="eyebrow">Featured</div>
          <h2 className="mt-2 text-[1.9rem]">55+ communities in the valley</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {aaCommunities.map((c) => (
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
          <h2 className="text-[1.7rem] text-white">Find your active-adult community</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Roland Luxury can help you compare the valley&apos;s 55+ communities and find the right fit.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
