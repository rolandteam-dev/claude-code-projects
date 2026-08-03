import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "./Container";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="font-sans font-semibold tracking-tight text-[1.05rem] no-underline">
            <span className="text-[var(--color-ink)]">The Roland Team</span>
            <span className="ml-2 hidden text-[var(--color-gold)] sm:inline">·</span>
            <span className="ml-2 hidden text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-muted)] sm:inline">
              Las Vegas Luxury
            </span>
          </Link>

          <nav className="hidden items-center gap-7 font-sans text-[0.9rem] md:flex" aria-label="Primary">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[var(--color-ink-soft)] no-underline transition-colors hover:text-[var(--color-gold)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href={site.cta.href} className="btn hidden sm:inline-flex !py-2.5 !px-5">
            {site.cta.label}
          </Link>
        </div>
      </Container>
    </header>
  );
}
