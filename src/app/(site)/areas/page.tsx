import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { areas, communitiesInArea } from "@/content/areas";

export const metadata: Metadata = {
  title: "Areas We Serve — Las Vegas, Henderson & Beyond",
  description:
    "Explore the cities and areas The Roland Team serves across Southern Nevada — Las Vegas, Henderson, Boulder City, and their communities.",
  alternates: { canonical: "/areas" },
};

export default function AreasIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Areas", path: "/areas" },
        ])}
      />
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">Areas We Serve</div>
          <h1 className="mt-2 max-w-[720px] text-[2.4rem]">Southern Nevada, area by area</h1>
          <p className="mt-4 max-w-[640px] text-[var(--color-ink-soft)]">
            Every city in the valley has its own character. Explore the areas we serve and the communities within
            each.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {areas.map((a) => (
            <Link
              key={a.slug}
              href={`/areas/${a.slug}`}
              className="block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <div className="flex h-32 items-end bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-5">
                <div className="font-sans text-[1.5rem] font-semibold text-white">{a.name}</div>
              </div>
              <div className="p-5">
                <p className="text-[0.92rem] text-[var(--color-ink-soft)]">{a.intro}</p>
                <div className="mt-3 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-gold)]">
                  {communitiesInArea(a.city).length} communities →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
