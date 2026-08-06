import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { testimonials, testimonialsAreSample } from "@/content/testimonials";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client Reviews & Testimonials",
  description:
    "See what clients say about working with Roland Luxury for luxury Las Vegas and Henderson real estate.",
  alternates: { canonical: "/testimonials" },
  // Keep out of the index until real reviews replace the placeholders.
  robots: testimonialsAreSample ? { index: false, follow: true } : undefined,
};

export default function TestimonialsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Testimonials", path: "/testimonials" },
        ])}
      />

      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-14">
          <div className="eyebrow">Client Reviews</div>
          <h1 className="mt-2 font-serif text-[2.6rem] font-semibold">What our clients say</h1>
          <p className="mt-3 max-w-[640px] text-[var(--color-ink-soft)]">
            Real relationships, real results across Las Vegas and Henderson.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-14">
        {/* Aggregate rating + links to full reviews */}
        <div className="mb-10 flex flex-col items-center gap-4 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)] p-8 text-center">
          <div className="font-sans text-[3rem] font-semibold leading-none text-[var(--color-gold)]">5.0★</div>
          <p className="font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
            800+ five-star reviews across Zillow, Google &amp; Yelp
          </p>
          <p className="max-w-[560px] text-[0.95rem] text-[var(--color-ink-soft)]">
            A Top 1% Las Vegas real estate team with 1,000+ homes sold — and the reviews to back it up.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <a href="https://www.zillow.com/profile/MikeSRoland" target="_blank" rel="noopener noreferrer" className="btn !py-2.5 !px-5">
              Read Zillow Reviews
            </a>
            <a href="https://www.yelp.com/biz/the-roland-team-lpt-realty-las-vegas" target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2.5 !px-5">
              Read Yelp Reviews
            </a>
          </div>
        </div>

        {testimonialsAreSample && (
          <div className="mb-8 rounded-[10px] border border-dashed border-[var(--color-gold-2)] bg-[var(--color-sand)] p-4 font-sans text-[0.82rem] text-[var(--color-muted)]">
            <strong>Placeholder content.</strong> The quotes below are samples for layout only — replace them
            with real, verified client reviews before promoting this page. (This page is set to{" "}
            <code>noindex</code> until then.)
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure key={i} className="rounded-[12px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)]">
              <div className="font-sans text-[0.95rem] text-[var(--color-gold)]" aria-label={`${t.rating} out of 5 stars`}>
                {"★".repeat(t.rating)}
                <span className="text-[var(--color-line)]">{"★".repeat(5 - t.rating)}</span>
              </div>
              <blockquote className="mt-3 text-[1.02rem] leading-relaxed text-[var(--color-ink-soft)]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 font-sans text-[0.85rem] font-semibold text-[var(--color-ink)]">
                {t.author}
                <span className="ml-2 font-normal text-[var(--color-muted)]">· {t.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Ready to work with a team that delivers?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Let&apos;s talk about your move in Las Vegas or Henderson.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
