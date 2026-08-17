"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { startSession, trackPageView, trackSearch, trackSellerSignal } from "@/lib/concierge/behavior";
import { reportIntent } from "@/lib/concierge/report";

/**
 * Site-wide shopping-behavior tracker for the concierge.
 *
 * Records what a URL alone can tell us — visits, searches and their filters,
 * and seller-side pages. Listing and community detail get richer facts from
 * <TrackListingView /> / <TrackCommunityView />, which the server pages render
 * with the real data.
 *
 * Nothing here identifies anyone. It's this browser's own activity, kept in
 * this browser, read by the concierge to decide when to offer help.
 */

const SELLER_PATHS = ["/home-value", "/sell", "/market-report"];

const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000)}K`;

/** Turn ?minBeds=4&city=Henderson&maxPrice=1200000 into readable criteria. */
function describeSearch(params: URLSearchParams): string {
  const bits: string[] = [];
  const beds = Number(params.get("minBeds"));
  if (beds) bits.push(`${beds}+ bd`);
  const type = params.get("propertyType");
  if (type) bits.push(type);
  const where = params.get("community") || params.get("city");
  if (where) bits.push(`in ${where.replace(/-/g, " ")}`);
  const min = Number(params.get("minPrice"));
  const max = Number(params.get("maxPrice"));
  if (min && max) bits.push(`${money(min)}–${money(max)}`);
  else if (max) bits.push(`under ${money(max)}`);
  else if (min) bits.push(`over ${money(min)}`);
  return bits.join(" ") || "all homes";
}

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    trackPageView();

    if (SELLER_PATHS.includes(pathname)) {
      trackSellerSignal();
      return;
    }

    // A filtered search is a statement of intent — record it, and for visitors
    // we already know, log it in the CRM as a Property Search.
    if (pathname === "/listings" && searchParams.toString()) {
      const query = searchParams.toString();
      const url = `/listings?${query}`;
      const label = describeSearch(searchParams);
      trackSearch(url, label);
      void reportIntent("property-search", {
        message: `Searched: ${label}`,
        tags: ["Website Activity"],
        once: `search:${query}`,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function BehaviorTracker() {
  // useSearchParams needs a Suspense boundary so static pages still prerender.
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
