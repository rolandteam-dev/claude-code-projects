import Link from "next/link";
import { Container } from "@/components/Container";
import { CommunityCard } from "@/components/CommunityCard";
import { featuredCommunities } from "@/content/communities";
import { featuredGuides } from "@/content/guides";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="wide" className="py-24 text-center md:py-32">
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
