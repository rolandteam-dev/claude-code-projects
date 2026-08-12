"use client";

import { useEffect } from "react";
import { getIdentifiedEmail } from "@/lib/identity";
import { sendFubEvent, type FubProperty } from "@/lib/fubEvents";

/**
 * Fires a "Viewed Property" Follow Up Boss event once per listing per browser
 * session — but only once we already know the visitor's email (from a lead
 * form they've submitted this session, or a ?e= link from a marketing
 * email). Renders nothing. Anonymous visits are already tracked by the base
 * Follow Up Boss pixel, so we intentionally skip sending when there's no
 * identified email.
 */
export function ListingViewTracker({ listingId, property }: { listingId: string; property: FubProperty }) {
    useEffect(() => {
          const email = getIdentifiedEmail();
          if (!email) return;

                  const dedupeKey = `rl_viewed_${listingId}`;
          try {
                  if (window.sessionStorage.getItem(dedupeKey)) return;
                  window.sessionStorage.setItem(dedupeKey, "1");
          } catch {
                  // If sessionStorage is unavailable we still send once for this mount
            // rather than silently dropping the view.
          }

                  void sendFubEvent("Viewed Property", property, email);
          // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingId]);

  return null;
}
