"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Overlay modal used by the intercepting route so clicking a listing card on
 * /listings opens the property in a "mini tab" over the results. Closing (X,
 * backdrop click, or Esc) navigates back to the results. A direct visit or
 * refresh of /listings/[id] bypasses this and renders the full page.
 */
export function ListingModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:p-6"
      onClick={() => router.back()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative my-0 h-fit min-h-full w-full max-w-[1120px] bg-white shadow-2xl sm:my-4 sm:min-h-0 sm:rounded-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky close bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white/95 px-4 py-2.5 backdrop-blur sm:rounded-t-[16px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 font-sans text-[0.82rem] font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-gold)]"
          >
            ‹ Back to results
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-sand)] hover:text-[var(--color-ink)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="pb-8">{children}</div>
      </div>
    </div>
  );
}
