import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ListingCard } from "@/components/ListingCard";
import { IdxDisclaimer } from "@/components/IdxDisclaimer";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getListings } from "@/lib/idx/provider";
import type { ListingFilters, PropertyType } from "@/lib/idx/types";

export const metadata: Metadata = {
  title: "Homes for Sale in Las Vegas & Henderson",
  description:
    "Search homes for sale in Las Vegas, Henderson, and Summerlin — luxury estates, guard-gated communities, condos, and more with Roland Luxury.",
  alternates: { canonical: "/listings" },
};

const PROPERTY_TYPES: PropertyType[] = ["Single Family", "Condo", "Townhouse", "Land", "Multi-Family"];

function num(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
}
function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.length ? s : undefined;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: ListingFilters = {
    city: str(sp.city),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    minBeds: num(sp.minBeds),
    propertyType: str(sp.propertyType) as PropertyType | undefined,
    limit: 24,
  };
  const { listings, total, isSampleData } = await getListings(filters);

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
          <div className="eyebrow">Homes for Sale</div>
          <h1 className="mt-2 text-[2.2rem]">Search Las Vegas &amp; Henderson listings</h1>
          <p className="mt-3 max-w-[620px] text-[var(--color-ink-soft)]">
            Browse available homes across the valley&apos;s most sought-after communities.
          </p>

          {/* Filter bar (GET form → server component re-renders) */}
          <form className="mt-6 flex flex-wrap gap-3" action="/listings" method="get">
            <select name="city" defaultValue={filters.city ?? ""} className={field} aria-label="City">
              <option value="">All cities</option>
              <option>Henderson</option>
              <option>Las Vegas</option>
              <option>Boulder City</option>
            </select>
            <select name="minBeds" defaultValue={sp.minBeds as string ?? ""} className={field} aria-label="Minimum beds">
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
            <select name="maxPrice" defaultValue={sp.maxPrice as string ?? ""} className={field} aria-label="Max price">
              <option value="">Max price</option>
            <option value="750000">Up to $750K</option>
              <option value="1000000">Up to $1M</option>
              <option value="1500000">Up to $1.5M</option>
              <option value="2000000">Up to $2M</option>
              <option value="3000000">Up to $3M</option>
              <option value="5000000">Up to $5M</option>
              <option value="7500000">Up to $7.5M</option>
              <option value="10000000">Up to $10M</option>
              <option value="15000000">Up to $15M</option>
              <option value="20000000">Up to $20M</option>
              <option value="30000000">Up to $30M</option>
            </select>
            <button type="submit" className="btn !py-2 !px-6">Search</button>
          </form>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        <div className="mb-6 font-sans text-[0.85rem] text-[var(--color-muted)]">
          {total} {total === 1 ? "home" : "homes"} found
        </div>

        {listings.length === 0 ? (
          <p className="text-[var(--color-ink-soft)]">No homes match your search. Try widening your filters.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        )}

        <IdxDisclaimer isSampleData={isSampleData} />
      </Container>
    </>
  );
}
