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

      {/* Hero */}
      <header className="mt-4 bg-gradient-to-b from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="narrow" className="py-16 text-center md:py-20">
          <div className="font-sans text-[0.78rem] uppercase tracking-[0.22em] text-[var(--color-gold-2)]">
            {c.eyebrow}
          </div>
          <h1 className="mx-auto mt-4 max-w-[720px] text-[2.3rem] font-semibold leading-[1.15] text-white md:text-[2.7rem]">
            {c.h1}
          </h1>
          <p className="mx-auto mt-4 max-w-[600px] text-[1.1rem] text-[#d9dbe0]">{c.intro}</p>
        </Container>
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
