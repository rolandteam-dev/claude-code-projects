/**
 * Local fallback provider. The hard-coded "sample-*" listings that used to
 * live here have been removed — the site now shows the live GLVAR/Repliers
 * feed only. When no live feed is configured (e.g. local dev without a key),
 * this provider returns NO listings rather than fabricated ones, so nothing
 * fake is ever presented as a real home for sale.
 */
import type { ListingFilters, ListingResult } from "./types";
import type { ListingProvider } from "./provider";

export const mockProvider: ListingProvider = {
  async getListings(_filters: ListingFilters = {}): Promise<ListingResult> {
    void _filters;
    return { listings: [], total: 0, isSampleData: false };
  },
  async getListing(_id: string) {
    void _id;
    return null;
  },
};
