import Link from "next/link";
import type { Listing } from "@/lib/idx/types";

export function formatPrice(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function ListingCard({ l }: { l: Listing }) {
  return (
    <Link
      href={`/listings/${l.id}`}
      className="group block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
    >
      <div className="relative flex h-44 items-end bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-4">
        {l.status !== "Active" && (
          <span className="absolute left-3 top-3 rounded bg-[var(--color-gold)] px-2 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white">
            {l.status}
          </span>
        )}
        {l.isOurListing && (
          <span className="absolute right-3 top-3 rounded bg-white/90 px-2 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
            Roland Team
          </span>
        )}
        <div className="font-sans text-[1.35rem] font-semibold text-white">{formatPrice(l.listPrice)}</div>
      </div>
      <div className="p-5">
        <div className="font-sans text-[0.95rem] font-semibold text-[var(--color-ink)]">{l.address.line1}</div>
        <div className="text-[0.85rem] text-[var(--color-muted)]">
          {l.address.city}, {l.address.state} {l.address.postalCode}
        </div>
        <div className="mt-3 flex gap-4 font-sans text-[0.82rem] text-[var(--color-ink-soft)]">
          <span><strong>{l.beds}</strong> bd</span>
          <span><strong>{l.baths}</strong> ba</span>
          <span><strong>{l.sqft.toLocaleString()}</strong> sqft</span>
        </div>
      </div>
    </Link>
  );
}
