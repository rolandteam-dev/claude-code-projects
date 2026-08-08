import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { IdxDisclaimer } from "@/components/IdxDisclaimer";
import { ListingGallery } from "@/components/ListingGallery";
import { breadcrumbSchema } from "@/lib/schema";
import { getListing } from "@/lib/idx/provider";
import { getListings } from "@/lib/idx/provider";
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

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) notFound();

  const { isSampleData } = await getListings({ limit: 1 });
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
  const detailRows = (
    [
      { label: "Property Type", value: l.propertyType },
      l.style && { label: "Style", value: l.style },
      l.yearBuilt != null && { label: "Year Built", value: String(l.yearBuilt) },
      l.sqft > 0 && { label: "Living Area", value: `${l.sqft.toLocaleString()} sq ft` },
      pricePerSqft && { label: "Price / Sq Ft", value: `$${pricePerSqft.toLocaleString()}` },
      l.lotAcres != null && { label: "Lot Size", value: `${l.lotAcres} acres` },
      l.garageSpaces != null && { label: "Garage", value: `${l.garageSpaces} space${l.garageSpaces === 1 ? "" : "s"}` },
      l.stories != null && { label: "Stories", value: String(l.stories) },
      l.hoaFee != null && { label: "HOA", value: `${formatPrice(l.hoaFee)}/mo` },
      l.annualTax != null && { label: "Annual Taxes", value: formatPrice(l.annualTax) },
      l.heating && { label: "Heating", value: l.heating },
      l.cooling && { label: "Cooling", value: l.cooling },
      l.pool && { label: "Pool", value: l.pool },
      l.view && { label: "View", value: l.view },
      l.subdivision && { label: "Subdivision", value: l.subdivision },
      l.daysOnMarket != null && { label: "Days on Market", value: String(l.daysOnMarket) },
    ] as Array<{ label: string; value: string } | false | "" | undefined>
  ).filter(Boolean) as Array<{ label: string; value: string }>;

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
        <nav className="font-sans text-[0.78rem] text-[var(--color-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="no-underline hover:text-[var(--color-gold)]">Home</Link>
          {" › "}
          <Link href="/listings" className="no-underline hover:text-[var(--color-gold)]">Homes for Sale</Link>
          {" › "}
          <span className="text-[var(--color-ink-soft)]">{l.address.line1}</span>
        </nav>
      </Container>

      {/* Gallery */}
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

      <Container size="wide" className="grid gap-10 py-10 md:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="prose-body">
          <div className="flex flex-wrap gap-8 border-b border-[var(--color-line)] pb-6 font-sans">
            <Fact label="Bedrooms" value={String(l.beds)} />
            <Fact label="Bathrooms" value={String(l.baths)} />
            <Fact label="Square Feet" value={l.sqft.toLocaleString()} />
            {pricePerSqft && <Fact label="Price / Sq Ft" value={`$${pricePerSqft.toLocaleString()}`} />}
            {l.garageSpaces != null && <Fact label="Garage" value={String(l.garageSpaces)} />}
            {l.daysOnMarket != null && <Fact label="Days on Market" value={String(l.daysOnMarket)} />}
          </div>

          <h2 className="mt-8 text-[1.6rem]">About this home</h2>
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

          {/* Full property details */}
          <section>
            <h2 className="mt-10 text-[1.6rem]">Property Details</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 font-sans text-[0.95rem] sm:grid-cols-3">
              {detailRows.map((r) => (
                <div key={r.label}>
                  <dt className="text-[0.7rem] uppercase tracking-[0.05em] text-[var(--color-muted)]">{r.label}</dt>
                  <dd className="m-0 font-semibold text-[var(--color-ink)]">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Features & amenities */}
          {l.features && l.features.length > 0 && (
            <section>
              <h2 className="mt-10 text-[1.6rem]">Features &amp; Amenities</h2>
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
              <h2 className="mt-10 text-[1.6rem]">Room Dimensions</h2>
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
              <h2 className="mt-10 text-[1.6rem]">Location</h2>
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

          <div className="mt-8 font-sans text-[0.82rem] text-[var(--color-muted)]">
            MLS #{l.mlsNumber} · Status: {l.status} · Listed {l.listedDate}
          </div>

          {community && (
            <p className="mt-6">
              Located in{" "}
              <Link href={`/communities/${community.slug}`} className="font-semibold text-[var(--color-gold)]">
                {community.name}
              </Link>
              . Learn more about the community, amenities, and lifestyle.
            </p>
          )}

          <IdxDisclaimer isSampleData={isSampleData} listingOffice={l.listingOffice} />
        </div>

        {/* Contact rail */}
        <aside className="h-fit rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)] p-6">
          <div className="font-sans text-[1.05rem] font-semibold">Interested in this home?</div>
          <p className="mt-2 text-[0.9rem] text-[var(--color-ink-soft)]">
            Roland Luxury can arrange a private showing and share current details.
          </p>
          <Link href={site.cta.href} className="btn mt-4 w-full">Request a Showing</Link>
          <a href={`tel:${site.phone}`} className="mt-3 block text-center font-sans text-[0.85rem] font-semibold text-[var(--color-gold)] no-underline">
            {site.phone}
          </a>
        </aside>
      </Container>
    </>
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
