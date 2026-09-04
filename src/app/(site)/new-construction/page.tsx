import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CommunityCard } from "@/components/CommunityCard";
import { NewConstructionFinder } from "@/components/NewConstructionFinder";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema } from "@/lib/schema";
import { communities } from "@/content/communities";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "New Construction Homes in Las Vegas & Henderson",
  description:
    "New construction homes in Las Vegas and Henderson — explore builder communities like Skye Canyon, Cadence, Inspirada, and Summerlin with The Roland Team.",
  alternates: { canonical: "/new-construction" },
};

// Communities with significant new-construction activity.
const NEW_BUILD_SLUGS = ["skye-canyon", "cadence", "inspirada", "summerlin", "mountains-edge", "the-ridges-summerlin"];

export default function NewConstructionHub() {
  const newBuildCommunities = communities.filter((c) => NEW_BUILD_SLUGS.includes(c.slug));

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "New Construction", path: "/new-construction" },
        ])}
      />

      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.newConstruction} priority />
        <Container size="wide" className="relative z-10 py-16 md:py-20">
          <div className="max-w-[660px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              New Construction
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.6rem]">
              New Construction Homes in Las Vegas
            </h1>
            <p className="mt-5 max-w-[560px] text-[1.12rem] text-[#d9dbe0]">
              Southern Nevada is one of the country&apos;s most active new-home markets. Explore the valley&apos;s
              growing builder communities — and let us represent your interests with the builder, at no cost to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/guides/new-construction-vs-resale-las-vegas" className="btn">New vs. Resale Guide</Link>
              <Link href={site.cta.href} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
                Talk to an Expert
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16">
        <div className="eyebrow">Find by area</div>
        <h2 className="mt-2 text-[1.9rem]">New-construction homes near you</h2>
        <p className="mt-2 max-w-[640px] text-[var(--color-ink-soft)]">
          Pick an area to see newly built homes — from the previous year or newer — live from the Las Vegas MLS.
        </p>
        <div className="mt-8">
          <NewConstructionFinder />
        </div>
      </Container>

      <Container size="wide" className="pb-16">
        <h2 className="text-[1.7rem]">New-construction communities</h2>
        <p className="mt-2 max-w-[640px] text-[var(--color-ink-soft)]">
          Modern floor plans, energy efficiency, and warranties in the valley&apos;s newest neighborhoods.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newBuildCommunities.map((c) => (
            <CommunityCard key={c.slug} c={c} />
          ))}
        </div>

        <div className="mt-14 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)] p-8">
          <h2 className="text-[1.4rem]">Bring your own agent to the builder</h2>
          <p className="mt-2 max-w-[680px] text-[var(--color-ink-soft)]">
            The on-site sales rep works for the builder. Register with The Roland Team on your first visit and we
            represent <em>you</em> — comparing incentives, reviewing the contract, and guiding your upgrade
            choices, typically at no cost to you.
          </p>
          <Link href={site.cta.href} className="btn mt-5">Get Represented</Link>
        </div>
      </Container>
    </>
  );
}
