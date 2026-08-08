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
            {l.lotAcres != null && <Fact label="Lot (acres)" value={String(l.lotAcres)} />}
            {l.yearBuilt != null && <Fact label="Year Built" value={String(l.yearBuilt)} />}
            <Fact label="Type" value={l.propertyType} />
          </div>

          <h1 className="mt-8 text-[1.6rem]">About this home</h1>
          <p>{l.description}</p>

          <div className="mt-4 font-sans text-[0.82rem] text-[var(--color-muted)]">
            MLS #{l.mlsNumber} · Status: {l.status}
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
