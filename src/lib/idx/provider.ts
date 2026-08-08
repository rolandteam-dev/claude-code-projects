/**
 * Provider abstraction. The app calls getListings()/getListing() and never
 * knows which backend answers. Select the backend with the IDX_PROVIDER env
 * var; when it's unset the provider auto-detects: if REPLIERS_API_KEY is
 * present we go live against the Repliers GLVAR feed, otherwise we fall back
 * to the empty local provider (so nothing fake is ever shown).
 *
 *   IDX_PROVIDER=repliers -> live GLVAR MLS via Repliers (board 193)
 *   IDX_PROVIDER=reso     -> RESO Web API (requires RESO_API_BASE + RESO_TOKEN)
 *   IDX_PROVIDER=mock      -> empty local provider (dev only, no live feed)
 */
import type { Listing, ListingFilters, ListingResult } from "./types";
import { mockProvider } from "./mock";
import { resoProvider } from "./reso";
import { repliersProvider } from "./repliers";

export interface ListingProvider {
  getListings(filters?: ListingFilters): Promise<ListingResult>;
  getListing(id: string): Promise<Listing | null>;
}

function selectProvider(): ListingProvider {
  const explicit = process.env.IDX_PROVIDER?.toLowerCase();
  const choice = explicit || (process.env.REPLIERS_API_KEY ? "repliers" : "mock");
  switch (choice) {
    case "repliers":
      return repliersProvider;
    case "reso":
      return resoProvider;
    case "mock":
    default:
      return mockProvider;
  }
}

const provider = selectProvider();

const EMPTY: ListingResult = { listings: [], total: 0, isSampleData: false, error: true };

/**
 * Never let an upstream feed hiccup crash a page. On error we log server-side
 * and return a safe empty result so the UI can show a clean "no results / try
 * again" state instead of a 500.
 */
export async function getListings(filters?: ListingFilters): Promise<ListingResult> {
  try {
    return await provider.getListings(filters);
  } catch (err) {
    console.error("[idx] getListings failed:", err instanceof Error ? err.message : err);
    return EMPTY;
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    return await provider.getListing(id);
  } catch (err) {
    console.error("[idx] getListing failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
