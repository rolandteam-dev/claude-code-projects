import Link from "next/link";
import { site } from "@/lib/site";
import { communities } from "@/content/communities";
import { areas } from "@/content/areas";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-line)] bg-[var(--color-sand)]">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="font-sans text-[1.05rem] font-semibold">Roland Luxury</div>
            <p className="mt-2 text-[0.9rem] text-[var(--color-muted)]">
              {site.tagline}. Specialists in Las Vegas & Henderson luxury and guard-gated communities.
            </p>
            <p className="mt-2 text-[0.8rem] text-[var(--color-muted)]">
              The luxury division of {site.parentBrand} | {site.brokerage}.
            </p>
          </div>

          <div>
            <div className="eyebrow mb-3">Communities</div>
            <ul className="space-y-2 font-sans text-[0.9rem]">
              {communities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/communities/${c.slug}`} className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3">Explore</div>
            <ul className="space-y-2 font-sans text-[0.9rem]">
              {site.nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/listings" className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                  Homes for Sale
                </Link>
              </li>
              <li>
                <Link href="/home-value" className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                  Home Valuation
                </Link>
              </li>
              <li>
                <Link href="/calculators" className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                  Calculators
                </Link>
              </li>
              <li>
                <Link href="/neighborhood-finder" className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                  Neighborhood Finder
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                  Testimonials
                </Link>
              </li>
            </ul>
            <div className="eyebrow mb-3 mt-6">Areas</div>
            <ul className="space-y-2 font-sans text-[0.9rem]">
              {areas.map((a) => (
                <li key={a.slug}>
                  <Link href={`/areas/${a.slug}`} className="text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]">
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3">Contact</div>
            <ul className="space-y-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
              <li><a href={`tel:${site.phone}`} className="no-underline hover:text-[var(--color-gold)]">{site.phone}</a></li>
              <li><a href={`mailto:${site.email}`} className="no-underline hover:text-[var(--color-gold)]">{site.email}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--color-line)] pt-6 text-[0.8rem] text-[var(--color-muted)]">
          © {new Date().getFullYear()} {site.legalName}. All rights reserved. Equal Housing Opportunity.
        </div>
      </Container>
    </footer>
  );
}
