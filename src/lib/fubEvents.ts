import type { Listing } from "@/lib/idx/types";

export type FubEventType = "Viewed Property" | "Saved Property";

export type FubProperty = {
    street?: string;
    city?: string;
    state?: string;
    code?: string;
    mlsNumber?: string;
    price?: number;
    forRent?: boolean;
    url?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    lot?: number;
    type?: string;
};

/** Maps our normalized Listing model to the Follow Up Boss Events API property shape. */
export function toFubProperty(listing: Listing, url: string): FubProperty {
    return {
          street: listing.address.line1,
          city: listing.address.city,
          state: listing.address.state,
          code: listing.address.postalCode,
          mlsNumber: listing.mlsNumber,
          price: listing.listPrice,
          forRent: false,
          url,
          bedrooms: listing.beds,
          bathrooms: listing.baths,
          area: listing.sqft,
          lot: listing.lotAcres,
          type: listing.propertyType,
    };
}

/**
 * Sends a "Viewed Property" / "Saved Property" event to Follow Up Boss via our
 * own server route at /api/fub-event (the browser never calls
 * api.followupboss.com or sees the FUB_API_KEY directly). Silently does
 * nothing when we don't know the visitor's email yet — anonymous traffic is
 * already covered by the base Follow Up Boss tracking pixel.
 */
export async function sendFubEvent(type: FubEventType, property: FubProperty, userEmail?: string | null): Promise<void> {
    if (!userEmail) return;
    try {
          await fetch("/api/fub-event", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type, person: { emails: [userEmail] }, property }),
          });
    } catch (e) {
          console.error("FUB event failed", e);
    }
}
