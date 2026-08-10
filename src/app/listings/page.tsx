import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { ListingCard } from "@/components/ListingCard";
import { IdxDisclaimer } from "@/components/IdxDisclaimer";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getListings, getListing } from "@/lib/idx/provider";
import { getCommunity } from "@/content/communities";
import type { ListingFilters, PropertyType } from "@/lib/idx/types";

export const metadata: Metadata = {
  title: "Homes for Sale in Las Vegas & Henderson",
  description:
    "Search live MLS homes for sale in Las Vegas, Henderson, North Las Vegas, and Summerlin — luxury estates, guard-gated communities, condos, and more with Roland Luxury.",
  alternates: { canonical: "/listings" },
};

const PROPERTY_TYPES: PropertyType[] = ["Single Family", "Condo", "Townhouse", "Land", "Multi-Family"];
const CITIES = ["Henderson", "Las Vegas", "North Las Vegas", "Boulder City"];
const PAGE_SIZE = 24;

// Luxury price policy: default the Min to $400k when the visitor hasn't chosen
// one, and never show anything below $300k (even via a hand-edited URL). Keeps
// the site curated without turning away legitimate mid-market leads — a visitor
// can still opt down to $300k via the Min dropdown.
const DEFAULT_MIN_PRICE = 400_000;
const HARD_MIN_PRICE = 300_000;

// Price tiers span entry-level to ultra-luxury so both ends of the valley's
// market are covered. Used for the Min and Max price dropdowns.
const PRICE_POINTS = [
  300_000, 400_000, 500_000, 600_000, 750_000, 900_000, 1_000_000, 1_250_000,
  1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 7_500_000,
  10_000_000, 15_000_000, 20_000_000, 30_000_000,
];

/** Compact price label, e.g. 1_500_000 -> "$1.5M", 750_000 -> "$750K". */
function priceLabel(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  return `$${Math.round(n / 1_000)}K`;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
}
function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.length ? s : undefined;
}

/** Preserve the current filters while changing only the page. */
function pageHref(sp: Record<string, string | string[] | undefined>, page: number): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val) p.set(k, val);
  }
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, num(sp.page) ?? 1);
  const q = str(sp.q);
  // If the keyword looks like an MLS number and resolves to a real listing,
  // take the visitor straight to that property's page.
  if (q && /^\d{5,9}$/.test(q)) {
    const hit = await getListing(q);
    if (hit) redirect(`/listings/${hit.id}`);
  }
  const communityParam = str(sp.community);
  const community = communityParam ? getCommunity(communityParam) : undefined;
  // Apply the luxury floor: default to $400k, clamp anything lower to $300k.
  const minPrice = Math.max(HARD_MIN_PRICE, num(sp.minPrice) ?? DEFAULT_MIN_PRICE);
  const filters: ListingFilters = {
    q,
    city: str(sp.city),
    communitySlug: community?.slug,
    minPrice,
    maxPrice: num(sp.maxPrice),
    minBeds: num(sp.minBeds),
    propertyType: str(sp.propertyType) as PropertyType | undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  const { listings, total, lastUpdated, error } = await getListings(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const field =
    "font-sans text-[0.85rem] rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-[var(--color-ink)]";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Homes for Sale", path: "/listings" },
        ])}
      />

      <section className="bg-[var(--color-sand)]">
        <Container size="wide" className="py-12">
          <div className="eyebrow">{community ? `${community.city}, NV` : "Homes for Sale"}</div>
          <h1 className="mt-2 text-[2.2rem]">
            {community ? `${community.name} Homes for Sale` : "Search Las Vegas & Henderson listings"}
          </h1>
          <p className="mt-3 max-w-[620px] text-[var(--color-ink-soft)]">
            {community ? (
              <>
                Live MLS listings in {community.name}, {community.city}.{" "}
                <Link
                  href={`/listings?city=${encodeURIComponent(community.city)}`}
                  className="font-semibold text-[var(--color-gold)]"
                >
                  View all {community.city} homes
                </Link>
              </>
            ) : (
              "Browse live MLS homes across the valley's most sought-after communities."
            )}
          </p>

          {/* Filter bar (GET form → server component re-renders) */}
          <form className="mt-6 flex flex-wrap gap-3" action="/listings" method="get">
            {/* Keyword / address / MLS# search — full width above the filters */}
            <div className="flex basis-full gap-2">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search by address, MLS #, or community…"
                aria-label="Search by address, MLS number, or community"
                className={`${field} grow`}
              />
              <button type="submit" className="btn !py-2 !px-6">Search</button>
            </div>
            {community ? (
              // Keep the community filter while refining beds/price/type.
              <input type="hidden" name="community" value={community.slug} />
            ) : (
              <select name="city" defaultValue={filters.city ?? ""} className={field} aria-label="City">
                <option value="">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <select name="minBeds" defaultValue={(sp.minBeds as string) ?? ""} className={field} aria-label="Minimum beds">
              <option value="">Beds (any)</option>
              <option value="2">2+ beds</option>
              <option value="3">3+ beds</option>
              <option value="4">4+ beds</option>
              <option value="5">5+ beds</option>
            </select>
            <select name="propertyType" defaultValue={filters.propertyType ?? ""} className={field} aria-label="Property type">
              <option value="">Any type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select name="minPrice" defaultValue={String(minPrice)} className={field} aria-label="Minimum price">
              {PRICE_POINTS.map((p) => (
                <option key={p} value={p}>{priceLabel(p)}+</option>
              ))}
            </select>
            <select name="maxPrice" defaultValue={(sp.maxPrice as string) ?? ""} className={field} aria-label="Maximum price">
              <option value="">Max price</option>
              {PRICE_POINTS.map((p) => (
                <option key={p} value={p}>Up to {priceLabel(p)}</option>
              ))}
            </select>
            <button type="submit" className="btn !py-2 !px-6">Search</button>
          </form>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        <div className="mb-6 font-sans text-[0.85rem] text-[var(--color-muted)]">
          {total.toLocaleString()} {total === 1 ? "home" : "homes"} found
          {totalPages > 1 && <> · page {page} of {totalPages}</>}
        </div>

        {error ? (
          <div className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-8 text-center">
            <p className="text-[var(--color-ink-soft)]">
              We&apos;re having trouble loading live listings right now. Please try again in a moment, or{" "}
              <Link href="/contact" className="font-semibold text-[var(--color-gold)]">contact us</Link> and we&apos;ll
              send matching homes directly.
            </p>
          </div>
        ) : listings.length === 0 ? (
          <p className="text-[var(--color-ink-soft)]">No homes match your search. Try widening your filters.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3 font-sans text-[0.85rem]" aria-label="Pagination">
            {page > 1 ? (
              <Link href={pageHref(sp, page - 1)} className="btn btn-ghost !py-2 !px-5">‹ Prev</Link>
            ) : (
              <span className="btn btn-ghost !py-2 !px-5 opacity-40" aria-disabled="true">‹ Prev</span>
            )}
            <span className="text-[var(--color-muted)]">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Link href={pageHref(sp, page + 1)} className="btn btn-ghost !py-2 !px-5">Next ›</Link>
            ) : (
              <span className="btn btn-ghost !py-2 !px-5 opacity-40" aria-disabled="true">Next ›</span>
            )}
          </nav>
        )}

        <IdxDisclaimer lastUpdated={lastUpdated} />
      </Container>
    </>
  );
}
