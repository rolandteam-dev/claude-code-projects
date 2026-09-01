import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { guides, getGuide } from "@/content/guides";
import { site } from "@/lib/site";
import { ProseText } from "@/lib/prose";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.seoTitle,
    description: g.seoDescription,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
      title: g.seoTitle,
      description: g.seoDescription,
      url: `/guides/${g.slug}`,
      type: "article",
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: g.title, path: `/guides/${g.slug}` },
          ]),
          faqSchema(g.faqs),
        ]}
      />

      <Container size="narrow" className="pt-5">
        <nav className="font-sans text-[0.78rem] text-[var(--color-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="no-underline hover:text-[var(--color-gold)]">Home</Link>
          {" › "}
          <Link href="/guides" className="no-underline hover:text-[var(--color-gold)]">Guides</Link>
          {" › "}
          <span className="text-[var(--color-ink-soft)]">{g.title}</span>
        </nav>
      </Container>

      <Container size="narrow" className="prose-body py-10">
        <div className="eyebrow">{g.eyebrow} · {g.readMinutes} min read</div>
        <h1 className="mt-3 text-[2.3rem] leading-[1.15]">{g.h1}</h1>
        <p className="mt-4 text-[1.2rem] leading-relaxed text-[var(--color-ink-soft)]">{g.intro}</p>

        {g.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mt-11 text-[1.5rem]">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i}><ProseText text={p} /></p>
            ))}
            {s.bullets && (
              <ul className="ml-5 list-disc space-y-2">
                {s.bullets.map((b, i) => (
                  <li key={i}><ProseText text={b} /></li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <h2 className="mt-12 text-[1.5rem]">Frequently Asked Questions</h2>
        <div className="mt-2">
          {g.faqs.map((f) => (
            <details key={f.q} className="border-b border-[var(--color-line)] py-4">
              <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-3"><ProseText text={f.a} /></p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Have questions about your move?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Roland Luxury is here to guide you through every step. Reach out for personalized advice.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
