import Link from "next/link";
import { Container } from "@/components/Container";
import { CommunityCard } from "@/components/CommunityCard";
import { HeroBg } from "@/components/HeroBg";
import { JsonLd } from "@/components/JsonLd";
import { faqSchema } from "@/lib/schema";
import { heroImages } from "@/lib/heroImages";
import { featuredCommunities } from "@/content/communities";
import { featuredGuides } from "@/content/guides";
import { site } from "@/lib/site";

const homeFaqs = [
  {
    q: "Who is The Roland Team?",
    a: "The Roland Team is a Las Vegas and Henderson real estate group led by Mike Roland with LPT Realty. The team specializes in luxury and guard-gated communities across Southern Nevada — including Ascaya, MacDonald Highlands, The Ridges, and Summerlin — and helps buyers and sellers across every price point in the Las Vegas Valley.",
  },
  {
    q: "What areas does The Roland Team serve?",
    a: "The Roland Team serves the entire Las Vegas Valley, including Las Vegas, Henderson, Summerlin, North Las Vegas, and Boulder City, with deep expertise in the region's luxury, guard-gated, and master-planned communities.",
  },
  {
    q: "Does The Roland Team specialize in luxury and guard-gated communities?",
    a: "Yes. The team focuses on Southern Nevada's most sought-after luxury and guard-gated communities — such as Ascaya and MacDonald Highlands in Henderson and The Ridges and The Summit Club in Summerlin — while also representing buyers and sellers of family homes and new construction throughout the valley.",
  },
  {
    q: "How do I choose the right real estate team in Las Vegas or Henderson?",
    a: "Look for genuine local expertise in the specific communities you care about, a clear marketing and negotiation strategy, responsiveness, and verifiable client reviews. The Roland Team pairs deep neighborhood knowledge across Las Vegas and Henderson with a client-first, no-pressure approach.",
  },
  {
    q: "Can The Roland Team help with both buying and selling?",
    a: "Yes. The Roland Team represents buyers, sellers, new-construction clients, and relocating households, and offers free, no-obligation home valuations for sellers considering a move.",
  },
  {
    q: "How do I contact The Roland Team?",
    a: `You can reach The Roland Team by phone at ${site.phone} or by email at ${site.email}, or through the contact form on this website.`,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.home} priority />
        <Container size="wide" className="relative z-10 py-24 text-center md:py-32">
          <div className="font-sans text-[0.8rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
            Las Vegas · Henderson · Summerlin
          </div>
          <h1 className="mx-auto mt-5 max-w-[820px] text-[2.6rem] font-semibold leading-[1.1] md:text-[3.4rem]">
            Luxury Las Vegas real estate, guided by people who know every gate on the hill.
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-[1.15rem] text-[#d9dbe0]">
            Explore Southern Nevada&apos;s most sought-after guard-gated communities, get expert buyer and seller
            guidance, and find a home that fits the life you&apos;re building.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/communities" className="btn">Explore Communities</Link>
            <Link href="/guides" className="btn btn-ghost !text-white !border-white/30 hover:!bg-white/10">
              Buyer Guides
            </Link>
          </div>
        </Container>
      </section>

      {/* Trust bar — verifiable proof points */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-sand)]">
        <Container size="wide" className="grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-sans text-[1.8rem] font-semibold text-[var(--color-gold)]">{s.value}</div>
              <div className="mt-1 font-sans text-[0.78rem] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* Featured communities */}
      <Container size="wide" className="py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Featured Communities</div>
            <h2 className="mt-2 text-[1.9rem]">Where Las Vegas lives well</h2>
          </div>
          <Link href="/communities" className="hidden font-sans text-[0.85rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-gold)] no-underline hover:underline sm:inline">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCommunities.map((c) => (
            <CommunityCard key={c.slug} c={c} />
          ))}
        </div>
      </Container>

      {/* Guides */}
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-20">
          <div className="eyebrow">Resources</div>
          <h2 className="mt-2 text-[1.9rem]">Guides for buyers &amp; sellers</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {featuredGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="block rounded-[12px] border border-[var(--color-line)] bg-white p-7 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
              >
                <div className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                  {g.category} · {g.readMinutes} min read
                </div>
                <h3 className="mt-2 text-[1.35rem]">{g.title}</h3>
                <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{g.intro}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Entity / FAQ — quotable answers for search + AI assistants */}
      <Container size="narrow" className="py-16">
        <JsonLd data={faqSchema(homeFaqs)} />
        <div className="eyebrow">About The Roland Team</div>
        <h2 className="mt-2 text-[1.9rem]">Las Vegas &amp; Henderson real estate, answered</h2>
        <div className="mt-6">
          {homeFaqs.map((f) => (
            <details key={f.q} className="border-b border-[var(--color-line)] py-4">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-3 text-[var(--color-ink-soft)]">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>

      {/* CTA */}
      <Container size="wide" className="py-20">
        <div className="rounded-[16px] bg-[var(--color-graphite)] px-8 py-16 text-center text-white">
          <h2 className="text-[2rem] text-white">Ready to make your move?</h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[#cfd3da]">
            Whether you&apos;re buying your first home or your forever estate, The Roland Team knows Las Vegas
            luxury inside and out. Let&apos;s talk.
          </p>
          <Link href={site.cta.href} className="btn mt-8">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
