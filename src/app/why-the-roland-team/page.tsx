import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { HeroBg } from "@/components/HeroBg";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { heroImages } from "@/lib/heroImages";
import { site, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Why Roland Luxury | Top 1% Las Vegas Real Estate Team",
  description:
    "Why work with Roland Luxury — a Top 1% Las Vegas real estate team with 1,000+ homes sold, 800+ five-star reviews, and dedicated buyer and seller specialists.",
  alternates: { canonical: "/why-the-roland-team" },
};

const reasons = [
  {
    h: "A proven track record",
    p: "Roland Luxury is the luxury division of The Roland Team | LPT Realty — a Top 1% Las Vegas real estate team with 1,000+ homes sold. Experience across every price point and community in the valley, from first homes to guard-gated estates.",
  },
  {
    h: "800+ five-star reviews",
    p: "A 5.0★ rating on Zillow and hundreds of five-star reviews across Zillow, Google, and Yelp. Our clients' results speak for themselves.",
  },
  {
    h: "Specialists, not generalists",
    p: "A 22-agent team with dedicated buyer and seller specialists, so you always work with someone focused on exactly what you need.",
  },
  {
    h: "Deep local expertise",
    p: "We know every gate on the hill — luxury, guard-gated, master-planned, golf, and active-adult communities across Las Vegas and Henderson.",
  },
  {
    h: "Sharp negotiation",
    p: "Clients consistently praise our team for going to bat for them and protecting their interests through every negotiation.",
  },
  {
    h: "A trusted local voice",
    p: "Founder Mike Roland has been featured in the Las Vegas Review-Journal on the forces shaping the local housing market.",
  },
];

export default function WhyPage() {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Why Roland Luxury",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl("/why-the-roland-team"),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Why Roland Luxury", path: "/why-the-roland-team" },
          ]),
          article,
        ]}
      />

      <header className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.luxuryEstate} priority />
        <Container size="wide" className="relative z-10 py-20 md:py-28">
          <div className="max-w-[680px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              Why Choose Us
            </div>
            <h1 className="mt-4 font-serif text-[2.8rem] font-semibold leading-[1.04] text-white md:text-[3.9rem]">
              Why Roland Luxury
            </h1>
            <p className="mt-5 max-w-[560px] text-[1.15rem] leading-relaxed text-[#d9dbe0]">
              A Top 1% Las Vegas real estate team with 1,000+ homes sold and 800+ five-star reviews — and the
              local expertise to match.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={site.cta.href} className="btn">Work With Us</Link>
              <Link href="/testimonials" className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Read Reviews
              </Link>
            </div>
          </div>
        </Container>

        {/* Stats band */}
        <div className="relative z-10 border-t border-white/10 bg-black/35 backdrop-blur-sm">
          <Container size="wide" className="grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
            {site.stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-sans text-[1.6rem] font-semibold text-[var(--color-gold-2)]">{s.value}</div>
                <div className="mt-1 font-sans text-[0.68rem] uppercase tracking-[0.1em] text-white/70">{s.label}</div>
              </div>
            ))}
          </Container>
        </div>
      </header>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.h} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)]">
              <h2 className="text-[1.2rem]">{r.h}</h2>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{r.p}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.8rem] text-white">Ready to work with a team that delivers?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Whether you&apos;re buying or selling in Las Vegas or Henderson, Roland Luxury is ready to help.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
