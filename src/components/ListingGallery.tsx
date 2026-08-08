"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

/**
 * Listing photo gallery with a full-screen lightbox. The hero + thumbnail
 * strip preview a few photos; clicking any of them (or "View all N photos")
 * opens a lightbox that pages through EVERY photo the feed returned, with
 * keyboard (← → Esc), a counter, and a filmstrip.
 */
export function ListingGallery({
  photos,
  label,
  status,
  isActive,
  priceLabel,
  addressLabel,
}: {
  photos: string[];
  label: string;
  status: string;
  isActive: boolean;
  priceLabel: string;
  addressLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const count = photos.length;

  const go = useCallback((n: number) => setIdx(count ? ((n % count) + count) % count : 0), [count]);
  const openAt = (n: number) => {
    if (!count) return;
    setIdx(n);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowLeft") go(idx - 1);
      else if (e.key === "ArrowRight") go(idx + 1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, idx, go]);

  const hero = photos[0];
  const thumbs = photos.slice(1, 5);
  const extra = Math.max(0, count - 5);

  return (
    <>
      {/* Hero (click to open lightbox) */}
      <button
        type="button"
        onClick={() => openAt(0)}
        aria-label={count ? `View all ${count} photos of ${label}` : label}
        className="relative flex h-[320px] w-full items-end overflow-hidden rounded-[14px] bg-gradient-to-br from-[var(--color-graphite)] to-[var(--color-graphite-2)] p-6 text-left md:h-[460px]"
      >
        {hero && (
          <>
            <Image src={hero} alt={label} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
          </>
        )}
        <div className="relative z-10">
          {!isActive && (
            <span className="mb-2 inline-block rounded bg-[var(--color-gold)] px-2 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
              {status}
            </span>
          )}
          <div className="font-sans text-[2.2rem] font-semibold text-white">{priceLabel}</div>
          <div className="font-sans text-white/85">{addressLabel}</div>
        </div>
        {count > 1 && (
          <span className="absolute bottom-4 right-4 z-10 rounded-md bg-black/60 px-3 py-1.5 font-sans text-[0.75rem] font-semibold text-white backdrop-blur-sm">
            View all {count} photos
          </span>
        )}
      </button>

      {/* Thumbnail strip */}
      {thumbs.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {thumbs.map((p, i) => {
            const showMore = i === thumbs.length - 1 && extra > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => openAt(i + 1)}
                aria-label={`View photo ${i + 2} of ${count}`}
                className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-[var(--color-sand-deep)]"
              >
                <Image src={p} alt={`${label} photo ${i + 2}`} fill sizes="25vw" className="object-cover" />
                {showMore && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 font-sans text-[1.05rem] font-semibold text-white">
                    +{extra} more
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {open && count > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label={`${label} photo gallery`}
        >
          <div className="flex items-center justify-between px-4 py-3 font-sans text-white">
            <span className="text-[0.85rem] tabular-nums">
              {idx + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-3 py-1 text-[0.9rem] font-semibold hover:bg-white/10"
              aria-label="Close gallery"
            >
              Close ✕
            </button>
          </div>

          <div className="relative flex-1">
            <Image
              src={photos[idx]}
              alt={`${label} photo ${idx + 1}`}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(idx - 1)}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-[1.4rem] leading-none text-white hover:bg-white/20"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(idx + 1)}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-[1.4rem] leading-none text-white hover:bg-white/20"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded ${
                    i === idx ? "ring-2 ring-[var(--color-gold)]" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={p} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
