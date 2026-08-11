import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { BLOG_CATEGORIES, postsByCategory } from "@/content/blog";

export const metadata: Metadata = {
  title: "Las Vegas Real Estate Blog",
  description:
    "Market updates, new construction, and buyer & seller guides for Las Vegas and Henderson real estate from Roland Luxury.",
  alternates: { canonical: "/blog" },
};

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = BLOG_CATEGORIES.find((c) => c === category);
  const posts = postsByCategory(active);

  const chip = "font-sans text-[0.82rem] rounded-full px-4 py-1.5 no-underline transition-colors";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-14">
          <div className="eyebrow">Blog</div>
          <h1 className="mt-2 font-serif text-[2.6rem] font-semibold">Las Vegas Real Estate Insights</h1>
          <p className="mt-3 max-w-[640px] text-[var(--color-ink-soft)]">
            Market updates, new construction, and practical guidance for buyers and sellers across the valley.
          </p>

          {/* Category filter */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/blog" className={`${chip} ${!active ? "bg-[var(--color-gold)] text-white" : "bg-white text-[var(--color-ink-soft)] hover:bg-white/70"}`}>
              All
            </Link>
            {BLOG_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/blog?category=${encodeURIComponent(c)}`}
                className={`${chip} ${active === c ? "bg-[var(--color-gold)] text-white" : "bg-white text-[var(--color-ink-soft)] hover:bg-white/70"}`}
              >
                {c}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-14">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <div
                className="relative flex h-44 flex-col justify-between bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] bg-cover bg-center p-5"
                style={p.coverImage ? { backgroundImage: `url(${p.coverImage})` } : undefined}
              >
                {!p.coverImage && (
                  <>
                    <div className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-white/60">Roland Luxury</div>
                    <div className="font-serif text-[1.3rem] italic leading-tight text-[var(--color-gold-2)]">
                      {p.category}
                    </div>
                  </>
                )}
              </div>
              <div className="p-6">
                <div className="font-sans text-[0.68rem] uppercase tracking-[0.14em] text-[var(--color-gold)]">
                  {p.category}
                </div>
                <h2 className="mt-2 text-[1.2rem] leading-snug">{p.title}</h2>
                <p className="mt-2 text-[0.92rem] text-[var(--color-ink-soft)]">{p.excerpt}</p>
                <div className="mt-4 font-sans text-[0.75rem] text-[var(--color-muted)]">
                  By {p.author} · {fmtDate(p.date)} · {p.readMinutes} min read
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
