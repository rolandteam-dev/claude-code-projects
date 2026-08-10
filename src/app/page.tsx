import Link from "next/link";
import Image from "next/image";
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
    q: "Who is Roland Luxury?",
    a: "Roland Luxury is the luxury division of The Roland Team | LPT Realty, led by Mike Roland — a Top 1% Las Vegas real estate team with 1,000+ homes sold. Roland Luxury specializes in luxury and guard-gated communities across Southern Nevada — including Ascaya, MacDonald Highlands, The Ridges, and Summerlin — and helps buyers and sellers across every price point in the Las Vegas Valley.",
  },
  {
    q: "What areas does Roland Luxury serve?",
    a: "Roland Luxury serves the entire Las Vegas Valley, including Las Vegas, Henderson, Summerlin, North Las Vegas, and Boulder City, with deep expertise in the region's luxury, guard-gated, and master-planned communities.",
  },
  {
    q: "Does Roland Luxury specialize in luxury and guard-gated communities?",
    a: "Yes. The team focuses on Southern Nevada's most sought-after luxury and guard-gated communities — such as Ascaya and MacDonald Highlands in Henderson and The Ridges and The Summit Club in Summerlin — while also representing buyers and sellers of family homes and new construction throughout the valley.",
  },
  {
    q: "How do I choose the right real estate team in Las Vegas or Henderson?",
    a: "Look for genuine local expertise in the specific communities you care about, a clear marketing and negotiation strategy, responsiveness, and verifiable client reviews. Roland Luxury pairs deep neighborhood knowledge across Las Vegas and Henderson with a client-first, no-pressure approach.",
  },
  {
    q: "Can Roland Luxury help with both buying and selling?",
    a: "Yes. Roland Luxury represents buyers, sellers, new-construction clients, and relocating households, and offers free, no-obligation home valuations for sellers considering a move.",
  },
  {
    q: "How do I contact Roland Luxury?",
    a: `You can reach Roland Luxury by phone at ${site.phone} or by email at ${site.email}, or through the contact form on this website.`,
  },
];

export default function Home() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-[var(--color-graphite-3)] text-white">
        <HeroBg src={heroImages.home} priority />
        <Container size="wide" className="relative z-10 py-28 text-center">
          <div className="flex items-center justify-center gap-3 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[var(--color-gold-3)]">
            <span className="hairline" /> Las Vegas · Henderson · Summerlin <span className="hairline" />
          </div>
          <h1 className="mx-auto mt-7 max-w-[960px] font-serif text-[3rem] font-medium leading-[1.04] md:text-[4.6rem]">
            The valley&apos;s most extraordinary residences, represented with discretion.
          </h1>
          <p className="mx-auto mt-7 max-w-[640px] text-[1.2rem] leading-relaxed text-[#d6d8de]">
            Roland Luxury is the luxury division of The Roland Team — specialists in Southern Nevada&apos;s
            guard-gated communities, custom estates, and landmark properties, for buyers and sellers who expect more.
          </p>
          {/* Property search — the fastest path into live MLS inventory */}
          <form
            action="/listings"
            method="get"
            className="mx-auto mt-10 flex w-full max-w-[560px] items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm"
          >
            <input
              type="search"
              name="q"
              placeholder="Search by address, community, or MLS #"
              aria-label="Search homes by address, community, or MLS number"
              className="grow bg-transparent px-4 py-2 font-sans text-[0.95rem] text-white placeholder:text-white/60 focus:outline-none"
            />
            <button type="submit" className="btn shrink-0 !rounded-full !px-6 !py-2.5">Search</button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/listings" className="btn btn-outline">Explore Residences</Link>
            <Link href="/home-value" className="btn btn-outline">Request a Private Valuation</Link>
          </div>
          <div className="mt-8 font-sans text-[0.82rem] tracking-[0.05em] text-[#aeb2ba]">
            Private representation ·{" "}
            <a href={`tel:${site.phone}`} className="text-[var(--color-gold-3)] no-underline hover:underline">
              {site.phone}
            </a>
          </div>
        </Container>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="border-b border-[var(--color-line-dark)] bg-[var(--color-graphite)] text-white">
        <Container size="wide" className="grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-[2.3rem] font-medium leading-none text-[var(--color-gold-3)]">{s.value}</div>
              <div className="mt-2 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-[#9aa0aa]">
                {s.label}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* ============ POSITIONING STATEMENT ============ */}
      <Container size="narrow" className="py-24 text-center">
        <div className="eyebrow">The Roland Luxury Standard</div>
        <p className="mx-auto mt-6 max-w-[760px] font-serif text-[1.7rem] font-medium leading-[1.4] text-[var(--color-ink)] md:text-[2.1rem]">
          A residence at this level is never just a transaction. It is a threshold — into a community, a lifestyle,
          and a life well lived. We represent it with the discretion, market command, and quiet resolve it deserves.
        </p>
        <div className="mt-8">
          <span className="hairline !w-16" />
        </div>
      </Container>

      {/* ============ FEATURED COLLECTIONS ============ */}
      <Container size="wide" className="pb-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="eyebrow">The Collection</div>
            <h2 className="mt-3 text-[2.4rem]">Signature communities</h2>
          </div>
          <Link href="/communities" className="link-gold hidden sm:inline">
            View all communities →
          </Link>
        </div>
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCommunities.map((c) => (
            <CommunityCard key={c.slug} c={c} />
          ))}
        </div>
      </Container>

      {/* ============ BUYERS + SELLERS (dark, balanced) ============ */}
      <section className="bg-[var(--color-graphite-3)] py-24 text-white">
        <Container size="wide">
          <div className="text-center">
            <div className="eyebrow">Buyers &amp; Sellers</div>
            <h2 className="mt-3 text-[2.4rem] text-white">Two paths, one standard of representation</h2>
          </div>
          <div className="mt-12 grid gap-7 md:grid-cols-2">
            {/* Buyers */}
            <div className="group relative overflow-hidden rounded-[4px] border border-[var(--color-line-dark)]">
              <div className="img-zoom relative h-[420px]">
                <Image src={heroImages.luxuryEstate} alt="Luxury estate in Las Vegas" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,16,20,0.94)] via-[rgba(14,16,20,0.55)] to-[rgba(14,16,20,0.25)]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-8">
                <div className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-gold-3)]">For Buyers</div>
                <h3 className="mt-2 font-serif text-[2rem] font-medium text-white">Acquire a landmark residence</h3>
                <p className="mt-3 max-w-[440px] text-[1.02rem] leading-relaxed text-[#cbcfd6]">
                  Private access to guard-gated estates, off-market opportunities, and the counsel to move decisively
                  when the right home appears.
                </p>
                <Link href="/listings" className="btn btn-outline mt-6">Browse Residences</Link>
              </div>
            </div>
            {/* Sellers */}
            <div className="group relative overflow-hidden rounded-[4px] border border-[var(--color-line-dark)]">
              <div className="img-zoom relative h-[420px]">
                <Image src={heroImages.estate} alt="Selling a luxury home in Henderson" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,16,20,0.94)] via-[rgba(14,16,20,0.55)] to-[rgba(14,16,20,0.25)]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-8">
                <div className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-[var(--color-gold-3)]">For Sellers</div>
                <h3 className="mt-2 font-serif text-[2rem] font-medium text-white">Sell with reach and discretion</h3>
                <p className="mt-3 max-w-[440px] text-[1.02rem] leading-relaxed text-[#cbcfd6]">
                  Cinematic marketing, a qualified buyer network, and the negotiation of a Top 1% team — with the
                  privacy a signature sale requires.
                </p>
                <Link href="/home-value" className="btn btn-outline mt-6">What&apos;s My Home Worth?</Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============ AI CONCIERGE FEATURE ============ */}
      <Container size="wide" className="py-24">
        <div className="grid items-center gap-12 rounded-[6px] border border-[var(--color-line)] bg-[var(--color-sand)] px-8 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-14">
          <div>
            <div className="eyebrow">New · Always Available</div>
            <h2 className="mt-3 text-[2.3rem] text-[var(--color-ink)]">Meet your private AI concierge</h2>
            <p className="mt-5 max-w-[520px] text-[1.08rem] leading-relaxed text-[var(--color-ink-soft)]">
              Ask anything — about Ascaya price trends, guard-gated communities, the selling process, or which
              neighborhood fits your life. Our concierge answers instantly, day or night, and connects you with
              Mike&apos;s team the moment you&apos;re ready.
            </p>
            <ul className="mt-6 space-y-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
              <li className="flex items-start gap-2"><span className="text-[var(--color-gold)]">✦</span> Instant answers on communities, pricing &amp; process</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-gold)]">✦</span> Curated recommendations to match your brief</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-gold)]">✦</span> A direct line to private, human representation</li>
            </ul>
            <p className="mt-7 font-sans text-[0.82rem] text-[var(--color-muted)]">
              Look for the concierge at the bottom-right of your screen.
            </p>
          </div>
          <div className="relative">
            <div className="rounded-[8px] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-lift)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-gold)]" />
                <span className="font-sans text-[0.82rem] font-semibold text-[var(--color-ink)]">Roland Luxury Concierge</span>
              </div>
              <div className="mt-4 space-y-3 text-[0.95rem]">
                <div className="ml-auto max-w-[80%] rounded-[10px] rounded-br-sm bg-[var(--color-graphite)] px-4 py-2.5 font-sans text-[0.9rem] text-white">
                  What&apos;s available in MacDonald Highlands under $4M?
                </div>
                <div className="mr-auto max-w-[88%] rounded-[10px] rounded-bl-sm bg-[var(--color-sand-deep)] px-4 py-2.5 text-[var(--color-ink)]">
                  Beautiful question — the Highlands has several contemporary estates in that range with DragonRidge
                  and Strip views. Shall I have Mike&apos;s team send you the current selection?
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ============ GUIDES ============ */}
      <section className="bg-[var(--color-graphite)] py-24 text-white">
        <Container size="wide">
          <div className="eyebrow">Resources</div>
          <h2 className="mt-3 text-[2.2rem] text-white">Guidance for buyers &amp; sellers</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featuredGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="block rounded-[4px] border border-[var(--color-line-dark)] bg-[var(--color-graphite-2)] p-7 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(216,189,132,0.4)]"
              >
                <div className="font-sans text-[0.68rem] uppercase tracking-[0.2em] text-[var(--color-gold-3)]">
                  {g.category} · {g.readMinutes} min read
                </div>
                <h3 className="mt-2 font-serif text-[1.6rem] font-medium text-white">{g.title}</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-[#c2c6ce]">{g.intro}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ FAQ (entity / SEO / AI-quotable) ============ */}
      <Container size="narrow" className="py-24">
        <JsonLd data={faqSchema(homeFaqs)} />
        <div className="eyebrow">About Roland Luxury</div>
        <h2 className="mt-3 text-[2.2rem]">Las Vegas &amp; Henderson luxury, answered</h2>
        <div className="mt-8">
          {homeFaqs.map((f) => (
            <details key={f.q} className="border-b border-[var(--color-line)] py-5">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-3 text-[var(--color-ink-soft)]">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>

      {/* ============ FINAL CTA ============ */}
      <Container size="wide" className="pb-24">
        <div className="relative overflow-hidden rounded-[6px] bg-[var(--color-graphite-3)] px-8 py-20 text-center text-white">
          <HeroBg src={heroImages.redRock} />
          <div className="relative z-10">
            <div className="eyebrow">By Appointment</div>
            <h2 className="mx-auto mt-4 max-w-[640px] text-[2.4rem] text-white">
              A conversation is where every great move begins
            </h2>
            <p className="mx-auto mt-4 max-w-[540px] text-[1.08rem] text-[#cfd3da]">
              Whether you&apos;re acquiring your forever estate or preparing a signature sale, Mike Roland and the
              Roland Luxury team are ready when you are.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href={site.cta.href} className="btn">{site.cta.label}</Link>
              <a href={`tel:${site.phone}`} className="btn btn-outline">{site.phone}</a>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
