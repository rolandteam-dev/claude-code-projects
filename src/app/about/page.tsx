import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About The Roland Team",
  description:
    "Meet The Roland Team — a Las Vegas & Henderson luxury real estate group specializing in guard-gated communities, custom estates, and expert local representation.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About Us", path: "/about" },
        ])}
      />

      <header className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages.estate} priority />
        <Container size="wide" className="relative z-10 py-16 md:py-20">
          <div className="max-w-[640px]">
            <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
              About Us
            </div>
            <h1 className="mt-3 font-serif text-[2.8rem] font-semibold leading-[1.05] text-white md:text-[3.6rem]">
              Local expertise, luxury standards
            </h1>
            <p className="mt-5 max-w-[560px] text-[1.12rem] text-[#d9dbe0]">
              The Roland Team helps buyers and sellers navigate Las Vegas and Henderson&apos;s most desirable
              communities — with honest guidance and a genuine understanding of what makes each neighborhood
              distinct.
            </p>
          </div>
        </Container>
      </header>

      <Container size="narrow" className="prose-body py-14">
        <p className="text-[1.2rem] leading-relaxed text-[var(--color-ink-soft)]">
          We&apos;re a Las Vegas and Henderson real estate group focused on the communities that define Southern
          Nevada living — from ultra-luxury, guard-gated enclaves like Ascaya and The Ridges to established
          family master plans across the valley.
        </p>
        <p>
          We pair deep local knowledge with a client-first approach: honest guidance, sharp negotiation, and a
          real understanding of the neighborhoods we serve. Whether you&apos;re relocating to Las Vegas, moving
          up to your forever home, or selling a signature estate, we&apos;re here to make the process clear and
          the outcome exceptional.
        </p>
      </Container>

      {/* Meet the team */}
      <Container size="wide" className="pb-8">
        <h2 className="text-[1.7rem]">Meet the team</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Lead */}
          <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="flex h-40 items-end rounded-[10px] bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-4">
              <span className="font-sans text-[0.7rem] uppercase tracking-[0.14em] text-white/70">Add photo</span>
            </div>
            <div className="mt-4 font-sans text-[1.1rem] font-semibold text-[var(--color-ink)]">Mike Roland</div>
            <div className="font-sans text-[0.82rem] text-[var(--color-gold)]">Team Lead · The Roland Team | LPT Realty</div>
            <p className="mt-2 text-[0.9rem] text-[var(--color-ink-soft)]">
              [Add Mike&apos;s bio — background, specialties, and what clients can expect.]
            </p>
          </div>

          {/* Placeholder slots for real agents */}
          {[1, 2].map((n) => (
            <div key={n} className="rounded-[12px] border border-dashed border-[var(--color-line)] bg-[var(--color-sand)] p-6">
              <div className="flex h-40 items-center justify-center rounded-[10px] border border-dashed border-[var(--color-line)] text-center">
                <span className="font-sans text-[0.78rem] text-[var(--color-muted)]">Add team member</span>
              </div>
              <div className="mt-4 font-sans text-[1.05rem] font-semibold text-[var(--color-muted)]">Agent name</div>
              <p className="mt-2 text-[0.88rem] text-[var(--color-muted)]">Add a real agent bio, role, and photo.</p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-sans text-[0.78rem] text-[var(--color-muted)]">
          Team bios and photos are placeholders — send real names, roles, headshots, and bios and I&apos;ll drop
          them in.
        </p>
      </Container>

      <Container size="wide" className="pb-20">
        <div className="rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">Let&apos;s find your place in Las Vegas</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">
            Buying, selling, or just exploring — we&apos;d love to help.
          </p>
          <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
        </div>
      </Container>
    </>
  );
}
