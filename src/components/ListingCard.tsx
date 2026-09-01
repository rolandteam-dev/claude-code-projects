import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/idx/types";
import { SaveHomeButton } from "./portal/SaveHomeButton";

export function formatPrice(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function ListingCard({ l }: { l: Listing }) {
  const photo = l.photos[0];
  return (
    // The save control is a sibling of the card link, not a child of it — an
    // interactive control nested inside an anchor is invalid and swallows clicks.
    <div className="relative">
      <div className="absolute right-3 top-3 z-20">
        <SaveHomeButton id={l.id} address={`${l.address.line1}, ${l.address.city}`} />
      </div>

      <Link
        href={`/listings/${l.id}`}
        className="group block overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-white no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
      >
        <div className="relative flex h-44 items-end bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-4">
          {photo ? (
            <>
              <Image src={photo} alt={l.address.line1} fill loading="lazy" sizes="(max-width:640px) 100vw, 33vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </>
          ) : (
            // Neutral placeholder — only when a listing genuinely has no photo.
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/25" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
              </svg>
              <span className="font-sans text-[0.62rem] uppercase tracking-[0.14em]">Photo coming soon</span>
            </div>
          )}
          {l.status !== "Active" && (
            <span className="absolute left-3 top-3 z-10 rounded bg-[var(--color-gold)] px-2 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white">
              {l.status}
            </span>
          )}
          {l.isOurListing && (
            // Sits under the status chip on the left; the save control owns the top-right.
            <span className="absolute left-3 top-12 z-10 rounded bg-white/90 px-2 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
              Roland Team
            </span>
          )}
          <div className="relative z-10 font-sans text-[1.35rem] font-semibold text-white">{formatPrice(l.listPrice)}</div>
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
    </div>
  );
}
