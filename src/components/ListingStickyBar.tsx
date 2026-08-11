"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";

/**
 * Slim inquiry bar that slides up once the visitor scrolls past the hero, so
 * the price + "Schedule a Tour" CTA is always one tap away. Links to the
 * #schedule-tour form on the page.
 */
export function ListingStickyBar({ priceLabel, addressLabel }: { priceLabel: string; addressLabel: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line-dark)] bg-[var(--color-graphite)]/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 pr-16 sm:pr-4">
        <div className="min-w-0">
          <div className="font-serif text-[1.15rem] leading-tight text-white">{priceLabel}</div>
          <div className="truncate font-sans text-[0.76rem] text-white/65">{addressLabel}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${site.phone}`}
            className="hidden rounded-md border border-white/25 px-4 py-2 font-sans text-[0.82rem] font-semibold text-white no-underline hover:bg-white/10 sm:inline-block"
          >
            {site.phone}
          </a>
          <a href="#schedule-tour" className="btn !px-5 !py-2 !text-[0.72rem]">
            Schedule a Tour
          </a>
        </div>
      </div>
    </div>
  );
}
