"use client";

/**
 * Client-side blog search + category filter. Runs entirely in the browser over
 * lightweight card metadata (see `blogListItems`), so the index page stays
 * static/SSG while giving instant, keystroke-level filtering. The category is
 * mirrored to the `?category=` query param so filtered views are shareable and
 * back/forward friendly.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { BlogCover } from "@/components/BlogCover";
import { BLOG_CATEGORIES, type BlogListItem } from "@/content/blog";

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const chip =
  "font-sans text-[0.82rem] rounded-full px-4 py-1.5 transition-colors cursor-pointer";

export function BlogSearch({
  items,
  initialCategory,
}: {
  items: BlogListItem[];
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | undefined>(
    BLOG_CATEGORIES.find((c) => c === initialCategory)
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    return items.filter((p) => {
      if (active && p.category !== active) return false;
      if (terms.length === 0) return true;
      return terms.every((t) => p.search.includes(t));
    });
  }, [items, query, active]);

  function selectCategory(c?: string) {
    setActive(c);
    // Keep the URL shareable without a full navigation/re-render.
    const url = c ? `/blog?category=${encodeURIComponent(c)}` : "/blog";
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <section className="bg-[var(--color-sand)]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-14">
          <div className="eyebrow">Blog</div>
          <h1 className="mt-2 font-serif text-[2.6rem] font-semibold">
            Las Vegas Real Estate Insights
          </h1>
          <p className="mt-3 max-w-[640px] text-[var(--color-ink-soft)]">
            Market updates, new construction, and practical guidance for buyers
            and sellers across the valley.
          </p>

          {/* Search box */}
          <div className="mt-6 max-w-[520px]">
            <label htmlFor="blog-search" className="sr-only">
              Search articles
            </label>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              >
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                id="blog-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${items.length} articles…`}
                className="w-full rounded-full border border-[var(--color-line)] bg-white py-2.5 pl-11 pr-4 font-sans text-[0.92rem] outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/20"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory(undefined)}
              className={`${chip} ${
                !active
                  ? "bg-[var(--color-gold)] text-white"
                  : "bg-white text-[var(--color-ink-soft)] hover:bg-white/70"
              }`}
            >
              All
            </button>
            {BLOG_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCategory(c)}
                className={`${chip} ${
                  active === c
                    ? "bg-[var(--color-gold)] text-white"
                    : "bg-white text-[var(--color-ink-soft)] hover:bg-white/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-6 py-14">
        <div
          className="mb-6 font-sans text-[0.8rem] text-[var(--color-muted)]"
          aria-live="polite"
        >
          {results.length} {results.length === 1 ? "article" : "articles"}
          {active ? ` in ${active}` : ""}
          {query.trim() ? ` matching “${query.trim()}”` : ""}
        </div>

        {results.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-10 text-center">
            <p className="font-serif text-[1.3rem]">No articles found</p>
            <p className="mt-2 text-[var(--color-ink-soft)]">
              Try a different search term or clear the filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                selectCategory(undefined);
              }}
              className="mt-5 inline-block rounded-full bg-[var(--color-gold)] px-5 py-2 font-sans text-[0.85rem] text-white"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
              >
                <div className="relative h-48">
                  <BlogCover category={p.category} title={p.title} photo={p.coverPhoto} />
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
        )}
      </div>
    </>
  );
}
