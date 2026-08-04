import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CommunityCard } from "@/components/CommunityCard";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { areas, getArea, communitiesInArea } from "@/content/areas";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArea(slug);
  if (!a) return {};
  return {
    title: a.seoTitle,
    description: a.seoDescription,
    alternates: { canonical: `/areas/${a.slug}` },
    openGraph: { title: a.seoTitle, description: a.seoDescription, url: `/areas/${a.slug}`, type: "article" },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArea(slug);
  if (!a) notFound();
  const areaCommunities = communitiesInArea(a.city);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Areas", path: "/areas" },
          { name: a.name, path: `/areas/${a.slug}` },
        ])}
      />

      <header className="bg-gradient-to-b from-[var(--color-graphite)] to-[var(--color-graphite-2)] text-white">
        <Container size="wide" className="py-16 text-center">
          <div className="font-sans text-[0.78rem] uppercase tracking-[0.22em] text-[var(--color-gold-2)]">
            {a.eyebrow}
          </div>
          <h1 className="mx-auto mt-4 max-w-[720px] text-[2.3rem] font-semibold leading-[1.15] text-white md:text-[2.8rem]">
            {a.h1}
          </h1>
          <p className="mx-auto mt-4 max-w-[600px] text-[1.1rem] text-[#d9dbe0]">{a.intro}</p>
          <Link href={`/listings?city=${encodeURIComponent(a.city)}`} className="btn mt-7">
            Search {a.name} Homes
          </Link>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-12">
        <p className="text-[1.2rem] leading-relaxed">{a.lead}</p>
        <h2 className="mt-10 text-[1.6rem]">Why buyers choose {a.name}</h2>
        <ul className="ml-5 list-disc space-y-2">
          {a.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </Container>

      {areaCommunities.length > 0 && (
        <Container size="wide" className="pb-16">
          <h2 className="text-[1.7rem]">Communities in {a.name}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areaCommunities.map((c) => (
              <CommunityCard key={c.slug} c={c} />
            ))}
          </div>
        </Container>
      )}

      <Container size="wide" className="pb-20">
        <div className="rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Thinking about {a.name}?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            The Roland Team knows every community in {a.name}. Let&apos;s find the right fit for you.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
