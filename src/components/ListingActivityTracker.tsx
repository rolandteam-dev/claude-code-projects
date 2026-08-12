"use client";

import { useEffect } from "react";
import { onPropertyView, type FubProperty } from "@/lib/fubClient";

/**
* Mounted once on a listing detail page (including the intercepted modal
* view). Fires the raw "Viewed Property" event for an identified visitor and
* tracks in-session repeat views toward the lux_hot_repeat tag. Renders
* nothing.
*/
export function ListingActivityTracker({
  listingId,
  property,
}: {
  listingId: string;
  property: FubProperty;
}) {
  useEffect(() => {
    onPropertyView(listingId, property);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

return null;
}
