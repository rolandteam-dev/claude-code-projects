"use client";

import { useEffect } from "react";
import { trackListingView } from "@/lib/buyer/track";
import type { PropertyRef } from "@/lib/buyer/activity";

/**
 * Mounted on a listing detail page. Reports the view to Follow Up Boss for an
 * identified visitor — the signal an agent needs to know which homes a contact
 * is actually looking at. Renders nothing.
 *
 * Keyed on listingId so an in-app navigation between two listings reports both.
 */
export function ListingViewTracker({ listingId, property }: { listingId: string; property: PropertyRef }) {
  // property is intentionally not a dependency: it is rebuilt on every render
  // and its contents can't change without listingId changing.
  useEffect(() => {
    trackListingView(listingId, property);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);
  return null;
}
