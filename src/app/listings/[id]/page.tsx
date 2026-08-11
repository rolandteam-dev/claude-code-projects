import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { IdxDisclaimer } from "@/components/IdxDisclaimer";
import { ListingGallery } from "@/components/ListingGallery";
import { PaymentEstimator } from "@/components/PaymentEstimator";
import { ScheduleTour } from "@/components/ScheduleTour";
import { ListingStickyBar } from "@/components/ListingStickyBar";
import { ListingShareBar } from "@/components/ListingShareBar";
import { breadcrumbSchema } from "@/lib/schema";
import { getListing } from "@/lib/idx/provider";
import { formatPrice } from "@/components/ListingCard";
import { getCommunity } from "@/content/communities";
import { absoluteUrl, site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) return {};
  const title = `${l.address.line1}, ${l.address.city} — ${formatPrice(l.listPrice)}`;
  return {
    title,
    description: l.description.slice(0, 155),
    alternates: { canonical: `/listings/${l.id}` },
    openGraph: { title, description: l.description.slice(0, 155), url: `/listings/${l.id}`, type: "article" },
  };
}

type Row = { label: string; value: string };
type MaybeRow = Row | false | "" | 0 | undefined | null;
function rows(...items: MaybeRow[]): Row[] {
  return items.filter(Boolean) as Row[];
}

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) notFound();

  const community = l.address.communitySlug ? getCommunity(l.address.communitySlug) : undefined;

  const listingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${l.address.line1}, ${l.address.city}, ${l.address.state}`,
    description: l.description,
    category: l.propertyType,
    offers: {
      "@type": "Offer",
      price: l.listPrice,
      priceCurrency: "USD",
      availability: l.status === "Active" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
      url: absoluteUrl(`/listings/${l.id}`),
    },
  };

  const pricePerSqft = l.sqft > 0 ? Math.round(l.listPrice / l.sqft) : undefined;
  // Normalize the HOA fee to a monthly figure for the payment estimator.
  const hoaMonthly = (() => {
    if (l.hoaFee == null) return 0;
    const freq = (l.hoaFrequency ?? "monthly").toLowerCase();
    if (freq.includes("quarter")) return l.hoaFee / 3;
    if (freq.includes("annual") || freq.includes("year")) return l.hoaFee / 12;
    if (freq.includes("semi")) return l.hoaFee / 6;
    return l.hoaFee; // monthly (default)
  })();
  const hoaValue =
    l.hoaFee != null
      ? `${formatPrice(l.hoaFee)}${l.hoaFrequency ? `/${l.hoaFrequency.toLowerCase().replace(/ly$/, "")}` : "/mo"}`
      : undefined;

  const overview = rows(
    { label: "Property Type", value: l.propertyType },
    l.style && { label: "Style", value: l.style },
    l.status && { label: "Status", value: l.status },
    l.yearBuilt != null && { label: "Year Built", value: String(l.yearBuilt) },
    l.sqft > 0 && { label: "Living Area", value: `${l.sqft.toLocaleString()} sq ft` },
    pricePerSqft && { label: "Price / Sq Ft", value: `$${pricePerSqft.toLocaleString()}` },
    l.daysOnMarket != null && { label: "Days on Market", value: String(l.daysOnMarket) },
    (l.subdivision || community) && {
      label: "Community",
      value: l.subdivision || community!.name,
    },
    l.mlsNumber && { label: "MLS #", value: l.mlsNumber },
  );

  const interior = rows(
    l.beds > 0 && { label: "Bedrooms", value: String(l.beds) },
    l.baths > 0 && { label: "Bathrooms", value: String(l.baths) },
    l.stories != null && { label: "Stories", value: String(l.stories) },
    l.heating && { label: "Heating", value: l.heating },
    l.cooling && { label: "Cooling", value: l.cooling },
  );

  const exterior = rows(
    l.lotAcres != null && { label: "Lot Size", value: `${l.lotAcres} acres` },
    l.garageSpaces != null && { label: "Garage", value: `${l.garageSpaces} space${l.garageSpaces === 1 ? "" : "s"}` },
    l.pool && { label: "Pool", value: l.pool },
    l.view && { label: "View", value: l.view },
  );

  const hoaFees = rows(
    hoaValue && { label: "HOA Fee", value: hoaValue },
    l.hoaFrequency && l.hoaFee != null && { label: "HOA Frequency", value: l.hoaFrequency },
    l.annualTax != null && { label: "Annual Taxes", value: formatPrice(l.annualTax) },
  );

  const location = rows(
    l.address.city && { label: "City", value: l.address.city },
    l.address.postalCode && { label: "ZIP", value: l.address.postalCode },
    l.county && { label: "County", value: l.county },
    l.subdivision && { label: "Subdivision", value: l.subdivision },
  );

  const sections: Array<{ title: string; rows: Row[] }> = [
    { title: "Overview", rows: overview },
    { title: "Interior", rows: interior },
    { title: "Exterior & Lot", rows: exterior },
    { title: "HOA & Fees", rows: hoaFees },
    { title: "Location", rows: location },
  ].filter((s) => s.rows.length > 0);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Homes for Sale", path: "/listings" },
            { name: l.address.line1, path: `/listings/${l.id}` },
          ]),
          listingSchema,
        ]}
      />

      <Container size="wide" className="pt-5">
        <div className="flex items-center justify-between gap-4">
          <nav className="min-w-0 truncate font-sans text-[0.78rem] text-[var(--color-muted)]" aria-label="Breadcrumb">
            <Link href="/" className="no-underline hover:text-[var(--color-gold)]">Home</Link>
            {" › "}
            <Link href="/listings" className="no-underline hover:text-[var(--color-gold)]">Homes for Sale</Link>
            {" › "}
            <span className="text-[var(--color-ink-soft)]">{l.address.line1}</span>
          </nav>
          <ListingShareBar
            url={absoluteUrl(`/listings/${l.id}`)}
            title={`${l.address.line1}, ${l.address.city} — ${formatPrice(l.listPrice)}`}
            listingId={l.id}
          />
        </div>
      </Container>

      {/* Gallery — renders every photo the feed returns via the lightbox */}
      <Container size="wide" className="pt-4">
        <ListingGallery
          photos={l.photos}
          label={l.address.line1}
          status={l.status}
          isActive={l.status === "Active"}
          priceLabel={formatPrice(l.listPrice)}
          addressLabel={`${l.address.line1}, ${l.address.city}, ${l.address.state} ${l.address.postalCode}`}
        />
      </Container>

      {/* Editorial title band */}
      <Container size="wide" className="pt-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-[var(--color-line)] pb-8">
          <div className="min-w-0">
            <div className="font-sans text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-gold)]">
              {community?.name ?? l.address.city}, {l.address.state}
              {l.status !== "Active" ? ` · ${l.status}` : ""}
            </div>
            <h1 className="mt-3 font-serif text-[2.3rem] font-semibold leading-[1.05] text-[var(--color-ink)] md:text-[3rem]">
              {l.address.line1}
            </h1>
            <div className="mt-2 font-sans text-[1.02rem] text-[var(--color-ink-soft)]">
              {l.address.city}, {l.address.state} {l.address.postalCode}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-serif text-[2.4rem] leading-none text-[var(--color-gold)] md:text-[2.9rem]">
              {formatPrice(l.listPrice)}
            </div>
            {pricePerSqft && (
              <div className="mt-1 font-sans text-[0.82rem] text-[var(--color-muted)]">
                ${pricePerSqft.toLocaleString()} / sq ft
              </div>
            )}
          </div>
        </div>

        {/* Key facts */}
        <div className="flex flex-wrap gap-x-12 gap-y-5 py-7">
          <Fact label="Bedrooms" value={String(l.beds)} />
          <Fact label="Bathrooms" value={String(l.baths)} />
          {l.sqft > 0 && <Fact label="Square Feet" value={l.sqft.toLocaleString()} />}
          {l.lotAcres != null && <Fact label="Lot" value={`${l.lotAcres} ac`} />}
          {l.garageSpaces != null && <Fact label="Garage" value={String(l.garageSpaces)} />}
          {l.yearBuilt != null && <Fact label="Year Built" value={String(l.yearBuilt)} />}
          {l.daysOnMarket != null && <Fact label="Days on Market" value={String(l.daysOnMarket)} />}
        </div>
      </Container>

      <Container size="wide" className="grid gap-10 pb-24 md:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="prose-body">
          <h2 className="mt-0 font-serif text-[1.7rem]">About this home</h2>
          <p>{l.description}</p>

          {l.virtualTourUrl && (
            <a
              href={l.virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost mt-4 inline-flex"
            >
              ▶ Virtual Tour
            </a>
          )}

          {/* Grouped property details */}
          {sections.map((sec) => (
            <DetailSection key={sec.title} title={sec.title} rows={sec.rows} />
          ))}

          {/* Schools */}
          {(l.schoolDistrict || (l.schools && l.schools.length > 0)) && (
            <section>
              <h2 className="mt-10 font-serif text-[1.6rem]">Schools</h2>
              {l.schoolDistrict && (
                <p className="mt-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
                  School District: <span className="font-semibold text-[var(--color-ink)]">{l.schoolDistrict}</span>
                </p>
              )}
              {l.schools && l.schools.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 p-0">
                  {l.schools.map((sch) => (
                    <li
                      key={sch}
                      className="list-none rounded-full border border-[var(--color-line)] bg-[var(--color-sand)] px-3 py-1 font-sans text-[0.8rem] text-[var(--color-ink-soft)]"
                    >
                      {sch}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 font-sans text-[0.68rem] text-[var(--color-muted)]">
                School information is provided by the MLS and deemed reliable but not guaranteed. Verify enrollment
                eligibility directly with the school district.
              </p>
            </section>
          )}

          {/* Features & amenities */}
          {l.features && l.features.length > 0 && (
            <section>
              <h2 className="mt-10 font-serif text-[1.6rem]">Features &amp; Amenities</h2>
              <ul className="mt-4 flex flex-wrap gap-2 p-0">
                {l.features.map((f) => (
                  <li
                    key={f}
                    className="list-none rounded-full border border-[var(--color-line)] bg-[var(--color-sand)] px-3 py-1 font-sans text-[0.8rem] text-[var(--color-ink-soft)]"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Room dimensions */}
          {l.rooms && l.rooms.length > 0 && (
            <section>
              <h2 className="mt-10 font-serif text-[1.6rem]">Room Dimensions</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse font-sans text-[0.88rem]">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] text-left text-[0.72rem] uppercase tracking-[0.05em] text-[var(--color-muted)]">
                      <th className="py-2 pr-4 font-semibold">Room</th>
                      <th className="py-2 pr-4 font-semibold">Dimensions</th>
                      <th className="py-2 font-semibold">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.rooms.map((rm, i) => (
                      <tr key={i} className="border-b border-[var(--color-line)]">
                        <td className="py-2 pr-4 font-semibold text-[var(--color-ink)]">{rm.name}</td>
                        <td className="py-2 pr-4 text-[var(--color-ink-soft)]">{rm.dimensions ?? "—"}</td>
                        <td className="py-2 text-[var(--color-ink-soft)]">{rm.level ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Location map */}
          {l.coords && (
            <section>
              <h2 className="mt-10 font-serif text-[1.6rem]">Location</h2>
              <div className="mt-4 overflow-hidden rounded-[12px] border border-[var(--color-line)]">
                <iframe
                  title={`Map of ${l.address.line1}`}
                  className="h-[320px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${l.coords.lng - 0.012}%2C${l.coords.lat - 0.009}%2C${l.coords.lng + 0.012}%2C${l.coords.lat + 0.009}&layer=mapnik&marker=${l.coords.lat}%2C${l.coords.lng}`}
                />
              </div>
              <p className="mt-2 font-sans text-[0.72rem] text-[var(--color-muted)]">Approximate location shown.</p>
            </section>
          )}

          {community && (
            <p className="mt-8">
              Located in{" "}
              <Link href={`/communities/${community.slug}`} className="font-semibold text-[var(--color-gold)]">
                {community.name}
              </Link>
              . Learn more about the community, amenities, and lifestyle.
            </p>
          )}

          {/* De-emphasized MLS meta + IDX attribution (compliance minimum) */}
          <IdxDisclaimer listingOffice={l.listingOffice} lastUpdated={l.updatedAt ?? l.listedDate} />
        </div>

        {/* Contact rail — sticky */}
        <aside className="h-fit space-y-4 md:sticky md:top-24" id="schedule-tour">
          <ScheduleTour address={`${l.address.line1}, ${l.address.city}, ${l.address.state} ${l.address.postalCode}`} />

          <PaymentEstimator price={l.listPrice} hoaMonthly={hoaMonthly} annualTax={l.annualTax ?? 0} />

          <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)] p-5 text-center">
            <div className="font-sans text-[0.85rem] text-[var(--color-ink-soft)]">Prefer to talk now?</div>
            <a
              href={`tel:${site.phone}`}
              className="mt-1 block font-serif text-[1.4rem] text-[var(--color-gold)] no-underline"
            >
              {site.phone}
            </a>
            <p className="mt-3 border-t border-[var(--color-line)] pt-3 font-sans text-[0.7rem] text-[var(--color-muted)]">
              {site.parentBrand} · brokered by {site.brokerage}
            </p>
          </div>
        </aside>
      </Container>

      <ListingStickyBar
        priceLabel={formatPrice(l.listPrice)}
        addressLabel={`${l.address.line1}, ${l.address.city}`}
      />
    </>
  );
}

function DetailSection({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section>
      <h2 className="mt-10 font-serif text-[1.6rem]">{title}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 font-sans text-[0.95rem] sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-[0.7rem] uppercase tracking-[0.05em] text-[var(--color-muted)]">{r.label}</dt>
            <dd className="m-0 font-semibold text-[var(--color-ink)]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.7rem] uppercase tracking-[0.05em] text-[var(--color-muted)]">{label}</div>
      <div className="text-[1.1rem] font-semibold text-[var(--color-ink)]">{value}</div>
    </div>
  );
}
