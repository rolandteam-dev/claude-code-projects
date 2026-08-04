import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { blogPosts, getPost } from "@/content/blog";
import { site, absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: p.seoTitle,
    description: p.seoDescription,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.seoTitle, description: p.seoDescription, url: `/blog/${p.slug}`, type: "article" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    datePublished: p.date,
    author: { "@type": "Organization", name: p.author },
    publisher: { "@type": "Organization", name: site.name },
    url: absoluteUrl(`/blog/${p.slug}`),
    articleSection: p.category,
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: p.title, path: `/blog/${p.slug}` },
          ]),
          article,
        ]}
      />

      <header className="bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="narrow" className="py-14 md:py-20">
          <Link
            href={`/blog?category=${encodeURIComponent(p.category)}`}
            className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-[var(--color-gold-2)] no-underline"
          >
            {p.category}
          </Link>
          <h1 className="mt-3 font-serif text-[2.3rem] font-semibold leading-[1.1] text-white md:text-[3rem]">
            {p.title}
          </h1>
          <div className="mt-4 font-sans text-[0.8rem] uppercase tracking-[0.1em] text-white/60">
            By {p.author} · {fmtDate(p.date)} · {p.readMinutes} min read
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-12">
        <p className="text-[1.2rem] leading-relaxed text-[var(--color-ink-soft)]">{p.excerpt}</p>

        {p.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mt-10 text-[1.5rem]">{s.heading}</h2>
            {s.body.map((para, i) => (
              <p key={i}>{para}</p>
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

        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-10 text-center text-white">
          <h2 className="text-[1.5rem] text-white">Have a question about your move?</h2>
          <p className="mx-auto mt-2 max-w-[500px] text-[#cfd3da]">
            The Roland Team is here to help you buy or sell with confidence in Las Vegas and Henderson.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
