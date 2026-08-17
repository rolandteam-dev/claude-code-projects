"use client";

import { useEffect } from "react";
import { trackCommunity, trackListing, type ViewedListing } from "@/lib/concierge/behavior";
import { reportIntent, toProperty } from "@/lib/concierge/report";

/**
 * Server pages hand the concierge the facts it can't infer from a URL.
 *
 * Beyond feeding the proactive triggers, a listing view by a visitor we can
 * already identify is pushed to Follow Up Boss as a "Viewed Property" event —
 * once per home per visit — so their timeline and smart lists stay live even
 * when they never touch a form.
 */

export function TrackListingView({ listing }: { listing: Omit<ViewedListing, "at"> }) {
  useEffect(() => {
    trackListing(listing);
    void reportIntent("viewed-property", {
      message: `Viewed ${listing.street}, ${listing.city} — $${listing.price.toLocaleString()}, ${listing.beds} bd / ${listing.baths} ba.`,
      tags: ["Website Activity"],
      property: toProperty({ ...listing, at: Date.now() }),
      once: `listing:${listing.id}`,
    });
    // Re-run only when the home changes, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id]);

  return null;
}

export function TrackCommunityView({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    trackCommunity(slug, name);
  }, [slug, name]);

  return null;
}
