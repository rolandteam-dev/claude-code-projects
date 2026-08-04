import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "./Container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="shrink-0 font-sans font-semibold tracking-tight no-underline">
            <span className="whitespace-nowrap text-[1.02rem] text-[var(--color-ink)]">The Roland Team</span>
            <span className="ml-2 hidden text-[var(--color-gold)] xl:inline">·</span>
            <span className="ml-2 hidden whitespace-nowrap text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-muted)] xl:inline">
              Las Vegas Luxury
            </span>
          </Link>

          <nav className="hidden items-center gap-5 font-sans text-[0.85rem] lg:flex" aria-label="Primary">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-[var(--color-ink-soft)] no-underline transition-colors hover:text-[var(--color-gold)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href={`tel:${site.phone}`}
              className="hidden whitespace-nowrap font-sans text-[0.85rem] font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-gold)] xl:inline"
            >
              {site.phone}
            </a>
            <Link href={site.cta.href} className="btn hidden whitespace-nowrap sm:inline-flex !px-5 !py-2.5">
              {site.cta.label}
            </Link>

            {/* Mobile menu (no-JS, native details) */}
            <details className="relative lg:hidden">
              <summary
                aria-label="Menu"
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-[var(--color-line)] text-[var(--color-ink)] [&::-webkit-details-marker]:hidden"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </summary>
              <div className="absolute right-0 top-full mt-2 w-60 rounded-[10px] border border-[var(--color-line)] bg-white p-2 shadow-[var(--shadow-soft)]">
                {site.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 font-sans text-[0.92rem] text-[var(--color-ink-soft)] no-underline hover:bg-[var(--color-sand)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/listings" className="block rounded-md px-3 py-2 font-sans text-[0.92rem] text-[var(--color-ink-soft)] no-underline hover:bg-[var(--color-sand)]">
                  Homes for Sale
                </Link>
                <a href={`tel:${site.phone}`} className="block rounded-md px-3 py-2 font-sans text-[0.92rem] font-semibold text-[var(--color-gold)] no-underline">
                  {site.phone}
                </a>
              </div>
            </details>
          </div>
        </div>
      </Container>
    </header>
  );
}
