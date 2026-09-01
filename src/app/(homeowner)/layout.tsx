import type { Metadata } from "next";
import { homeownerBrand } from "@/lib/homeowners/brand";

/**
 * Homeowner experience chrome — The Roland Team brand, deliberately minimal
 * (no marketing nav) so a homeowner's private value dashboard reads as a clean,
 * personal report. These pages are private per-recipient links, so they are
 * marked noindex.
 */
export const metadata: Metadata = {
  title: "Your Home Value | The Roland Team",
  robots: { index: false, follow: false },
};

export default function HomeownerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--color-line)] bg-white">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gold-3)]/50 bg-[var(--color-graphite)] font-serif text-[0.95rem] text-[var(--color-gold-2)]">
              ✦
            </span>
            <span className="font-serif text-[1.05rem] font-semibold text-[var(--color-ink)]">
              {homeownerBrand.name}
            </span>
          </div>
          <a
            href={`tel:${homeownerBrand.phone}`}
            className="font-sans text-[0.85rem] font-semibold text-[var(--color-gold)] no-underline"
          >
            {homeownerBrand.phone}
          </a>
        </div>
      </header>

      <main className="flex-1 bg-[var(--color-sand)]">{children}</main>

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="mx-auto max-w-[1040px] px-6 py-8 text-center font-sans text-[0.78rem] leading-relaxed text-[var(--color-muted)]">
          <div className="font-semibold text-[var(--color-ink-soft)]">{homeownerBrand.legalName}</div>
          <div className="mt-1">
            <a href={`tel:${homeownerBrand.phone}`} className="no-underline hover:text-[var(--color-gold)]">
              {homeownerBrand.phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${homeownerBrand.email}`} className="no-underline hover:text-[var(--color-gold)]">
              {homeownerBrand.email}
            </a>
          </div>
          <div className="mt-3 text-[0.72rem]">
            Estimates are automated and not an appraisal or guarantee of value. Equal Housing Opportunity.
          </div>
        </div>
      </footer>
    </>
  );
}
