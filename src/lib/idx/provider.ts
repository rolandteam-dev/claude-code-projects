/**
 * Provider abstraction. The app calls getListings()/getListing() and never
 * knows which backend answers. Select the backend with the IDX_PROVIDER env
 * var; defaults to sample data until a live MLS feed is configured.
 *
 *   IDX_PROVIDER=mock   -> built-in sample listings (default)
 *   IDX_PROVIDER=reso   -> RESO Web API (requires RESO_API_BASE + RESO_TOKEN)
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
  const choice = (process.env.IDX_PROVIDER ?? "mock").toLowerCase();
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

export function getListings(filters?: ListingFilters): Promise<ListingResult> {
  return provider.getListings(filters);
}

export function getListing(id: string): Promise<Listing | null> {
  return provider.getListing(id);
}
