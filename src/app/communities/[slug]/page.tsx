import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { communities, getCommunity } from "@/content/communities";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return communities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCommunity(slug);
  if (!c) return {};
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `/communities/${c.slug}` },
    openGraph: {
      title: c.seoTitle,
      description: c.seoDescription,
      url: `/communities/${c.slug}`,
      type: "article",
    },
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCommunity(slug);
  if (!c) notFound();

  const updated = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Communities", path: "/communities" },
            { name: c.name, path: `/communities/${c.slug}` },
          ]),
          faqSchema(c.faqs),
        ]}
      />

      {/* Breadcrumb */}
      <Container size="narrow" className="pt-5">
        <nav className="font-sans text-[0.78rem] text-[var(--color-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="no-underline hover:text-[var(--color-gold)]">Home</Link>
          {" › "}
          <Link href="/communities" className="no-underline hover:text-[var(--color-gold)]">Communities</Link>
          {" › "}
          <span className="text-[var(--color-ink-soft)]">{c.name}</span>
        </nav>
      </Container>

      {/* Hero — editorial, left-aligned */}
      <header className="mt-3 bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="wide" className="py-16 md:py-24">
          <div className="max-w-[660px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              {c.eyebrow}
            </div>
            <h1 className="mt-4">
              <span className="block font-serif text-[3rem] font-semibold leading-[1.02] text-white md:text-[4.25rem]">
                {c.name}
              </span>
              <span className="mt-1 block font-serif text-[1.5rem] italic text-[var(--color-gold-2)] md:text-[1.9rem]">
                Homes for Sale in {c.city}, NV
              </span>
            </h1>
            <div className="mt-5 font-sans text-[0.74rem] uppercase tracking-[0.12em] text-white/55">
              Updated {updated} · By The Roland Team
            </div>
            <p className="mt-5 max-w-[560px] text-[1.12rem] leading-relaxed text-[#d9dbe0]">{c.intro}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={`/listings?city=${encodeURIComponent(c.city)}`} className="btn">
                Browse {c.name} Homes
              </Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to an Expert
              </Link>
            </div>
          </div>
        </Container>

        {/* Stat band */}
        <div className="border-t border-white/10 bg-black/25">
          <Container size="wide" className="grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
            {c.quickFacts.slice(0, 4).map((f) => (
              <div key={f.label}>
                <div className="font-sans text-[0.62rem] uppercase tracking-[0.12em] text-[var(--color-gold-2)]">
                  {f.label}
                </div>
                <div className="mt-1 font-sans text-[1.05rem] font-semibold text-white">{f.value}</div>
              </div>
            ))}
          </Container>
        </div>
      </header>

      <Container size="narrow" className="prose-body py-12">
        <p className="text-[1.2rem] leading-relaxed">{c.lead}</p>

        {/* Quick facts */}
        <div className="my-9 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-7">
          <h2 className="mt-0 text-[1.2rem]">{c.name} at a Glance</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 font-sans text-[0.95rem] sm:grid-cols-2">
            {c.quickFacts.map((f) => (
              <div key={f.label}>
                <dt className="text-[0.72rem] uppercase tracking-[0.05em] text-[var(--color-muted)]">{f.label}</dt>
                <dd className="m-0 font-semibold text-[var(--color-ink)]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Sections */}
        {c.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mt-11 text-[1.6rem]">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.bullets && (
              <ul className="ml-5 list-disc space-y-2">
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* FAQ */}
        <h2 className="mt-12 text-[1.6rem]">Frequently Asked Questions About {c.name}</h2>
        <div className="mt-2">
          {c.faqs.map((f) => (
            <details key={f.q} className="border-b border-[var(--color-line)] py-4">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-3">{f.a}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Explore {c.name} Homes for Sale</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Ready to see current {c.name} listings and homesites? The Roland Team specializes in {c.city}&apos;s
            luxury and guard-gated communities.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
