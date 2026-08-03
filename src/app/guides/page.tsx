import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { guides } from "@/content/guides";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Las Vegas Real Estate Buyer & Seller Guides",
  description:
    "Free, expert guides to buying and selling a home in Las Vegas and Henderson — neighborhoods, financing, the closing process, and relocation tips.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">Guides</div>
          <h1 className="mt-2 max-w-[720px] text-[2.4rem]">Buyer &amp; seller guides for Las Vegas</h1>
          <p className="mt-4 max-w-[640px] text-[var(--color-ink-soft)]">
            Straight-talking, local guidance for every step of your move — from getting pre-approved to
            picking the right neighborhood and closing with confidence.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="block rounded-[12px] border border-[var(--color-line)] bg-white p-7 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <div className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                {g.category} · {g.readMinutes} min read
              </div>
              <h2 className="mt-2 text-[1.4rem]">{g.title}</h2>
              <p className="mt-2 text-[0.95rem] text-[var(--color-ink-soft)]">{g.intro}</p>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
