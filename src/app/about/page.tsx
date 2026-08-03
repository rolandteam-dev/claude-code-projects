import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About The Roland Team",
  description:
    "The Roland Team is a Las Vegas & Henderson luxury real estate group specializing in guard-gated communities, custom estates, and expert local representation.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container size="narrow" className="prose-body py-16">
      <div className="eyebrow">About</div>
      <h1 className="mt-2 text-[2.3rem]">Local expertise, luxury standards</h1>
      <p className="mt-4 text-[1.2rem] leading-relaxed text-[var(--color-ink-soft)]">
        The Roland Team is a Las Vegas and Henderson real estate group focused on the communities that define
        Southern Nevada living — from ultra-luxury, guard-gated enclaves like Ascaya and The Ridges to
        established family master plans across the valley.
      </p>
      <p>
        We pair deep local knowledge with a client-first approach: honest guidance, sharp negotiation, and a
        genuine understanding of what makes each neighborhood distinct. Whether you&apos;re relocating to Las
        Vegas, moving up to your forever home, or selling a signature estate, we&apos;re here to make the
        process clear and the outcome exceptional.
      </p>
      <p>
        With hundreds of families served and deep roots in the Las Vegas luxury market, our team knows every
        gate on the hill — and how to get you through it.
      </p>
      <Link href={site.cta.href} className="btn mt-6">{site.cta.label}</Link>
    </Container>
  );
}
