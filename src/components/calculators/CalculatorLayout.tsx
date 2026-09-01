import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { HeroBg } from "@/components/HeroBg";
import { heroImages } from "@/lib/heroImages";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { site } from "@/lib/site";
import type { CalculatorMeta } from "@/content/calculators";
import type { Faq } from "@/content/communities";

/**
 * Shared scaffold for calculator tool pages: hero, the interactive tool,
 * an FAQ block (also emitted as FAQPage JSON-LD), and a lead CTA. Keeps every
 * calculator page consistent and lets each page file stay minimal.
 */
export function CalculatorLayout({
  calc,
  intro,
  faqs,
  cta,
  children,
}: {
  calc: CalculatorMeta;
  intro: string;
  faqs: Faq[];
  cta: { heading: string; body: string; primaryLabel: string; primaryHref: string };
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Calculators", path: "/calculators" },
            { name: calc.name, path: `/calculators/${calc.slug}` },
          ]),
          faqSchema(faqs),
        ]}
      />

      <section className="relative overflow-hidden bg-[var(--color-graphite)] text-white">
        <HeroBg src={heroImages[calc.hero]} priority />
        <Container size="wide" className="relative z-10 py-14 md:py-16">
          <div className="font-sans text-[0.76rem] uppercase tracking-[0.24em] text-[var(--color-gold-2)]">
            {calc.audience} · Calculators
          </div>
          <h1 className="mt-3 max-w-[720px] font-serif text-[2.6rem] font-semibold leading-[1.06] text-white md:text-[3.1rem]">
            {calc.name}
          </h1>
          <p className="mt-4 max-w-[620px] text-[1.08rem] text-[#d9dbe0]">{intro}</p>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        {children}
      </Container>

      {faqs.length > 0 && (
        <Container size="narrow" className="prose-body pb-8">
          <h2 className="text-[1.6rem]">Frequently asked questions</h2>
          <div className="mt-2">
            {faqs.map((f) => (
              <details key={f.q} className="border-b border-[var(--color-line)] py-4">
                <summary className="cursor-pointer font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">
                  {f.q}
                </summary>
                <p className="mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      )}

      <Container size="narrow" className="pb-16">
        <div className="rounded-[14px] bg-[var(--color-graphite)] px-7 py-12 text-center text-white">
          <h2 className="text-[1.7rem] text-white">{cta.heading}</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[#cfd3da]">{cta.body}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href={cta.primaryHref} className="btn">
              {cta.primaryLabel}
            </Link>
            <a href={`tel:${site.phone}`} className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10">
              Call {site.phone}
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
