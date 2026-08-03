import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CommunityCard } from "@/components/CommunityCard";
import { communities } from "@/content/communities";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Las Vegas & Henderson Luxury Communities",
  description:
    "Explore the top luxury and guard-gated communities in Las Vegas and Henderson, NV — Ascaya, MacDonald Highlands, Seven Hills, The Ridges, and more.",
  alternates: { canonical: "/communities" },
};

export default function CommunitiesIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Communities", path: "/communities" },
        ])}
      />
      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-16">
          <div className="eyebrow">Communities</div>
          <h1 className="mt-2 max-w-[720px] text-[2.4rem]">
            Las Vegas &amp; Henderson&apos;s finest communities
          </h1>
          <p className="mt-4 max-w-[640px] text-[var(--color-ink-soft)]">
            From ultra-luxury guard-gated estates to established master plans, explore the neighborhoods that
            define Southern Nevada living — with local insight on each.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <CommunityCard key={c.slug} c={c} />
          ))}
        </div>
      </Container>
    </>
  );
}
