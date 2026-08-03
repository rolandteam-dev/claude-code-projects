/**
 * Sample-data provider. Realistic but clearly non-live listings so the
 * listings UI is fully functional before the GLVAR/MLS feed is connected.
 * Every result carries isSampleData: true so the UI can label it honestly.
 */
import type { Listing, ListingFilters, ListingResult } from "./types";
import type { ListingProvider } from "./provider";

const SAMPLE: Listing[] = [
  {
    id: "sample-1001",
    mlsNumber: "SAMPLE-1001",
    status: "Active",
    listPrice: 6250000,
    address: { line1: "12 Cloud Rock Ct", city: "Henderson", state: "NV", postalCode: "89012", communitySlug: "ascaya" },
    beds: 5, baths: 6, sqft: 7200, lotAcres: 0.9, yearBuilt: 2022,
    propertyType: "Single Family",
    description:
      "A modern desert masterpiece in Ascaya, cantilevered into Black Mountain with walls of glass framing the Las Vegas Strip. Sample listing for layout preview.",
    photos: [], coords: { lat: 35.985, lng: -115.03 }, listedDate: "2026-07-15",
    listingOffice: "The Roland Team | LPT Realty", isOurListing: true,
  },
  {
    id: "sample-1002",
    mlsNumber: "SAMPLE-1002",
    status: "Active",
    listPrice: 2895000,
    address: { line1: "45 Highlands Ridge Dr", city: "Henderson", state: "NV", postalCode: "89012", communitySlug: "macdonald-highlands" },
    beds: 4, baths: 5, sqft: 5100, lotAcres: 0.5, yearBuilt: 2019,
    propertyType: "Single Family",
    description:
      "Contemporary estate in MacDonald Highlands overlooking DragonRidge, with an infinity pool and Strip views. Sample listing for layout preview.",
    photos: [], coords: { lat: 36.0, lng: -115.05 }, listedDate: "2026-07-20",
    listingOffice: "The Roland Team | LPT Realty", isOurListing: true,
  },
  {
    id: "sample-1003",
    mlsNumber: "SAMPLE-1003",
    status: "Active",
    listPrice: 875000,
    address: { line1: "980 Seven Hills Blvd", city: "Henderson", state: "NV", postalCode: "89052", communitySlug: "seven-hills" },
    beds: 4, baths: 3, sqft: 3100, lotAcres: 0.22, yearBuilt: 2008,
    propertyType: "Single Family",
    description:
      "Turnkey family home in a gated Seven Hills enclave with mountain views and a resort-style backyard. Sample listing for layout preview.",
    photos: [], listedDate: "2026-07-24",
    listingOffice: "Sample Realty of Nevada",
  },
  {
    id: "sample-1004",
    mlsNumber: "SAMPLE-1004",
    status: "Active",
    listPrice: 549000,
    address: { line1: "310 Lakeshore Ct", city: "Henderson", state: "NV", postalCode: "89011", communitySlug: "lake-las-vegas" },
    beds: 3, baths: 3, sqft: 2100, yearBuilt: 2016,
    propertyType: "Condo",
    description:
      "Waterfront-view condo steps from the Village at Lake Las Vegas with a lock-and-leave lifestyle. Sample listing for layout preview.",
    photos: [], listedDate: "2026-07-28",
    listingOffice: "Sample Realty of Nevada",
  },
  {
    id: "sample-1005",
    mlsNumber: "SAMPLE-1005",
    status: "Active",
    listPrice: 1195000,
    address: { line1: "77 Red Rock Vista", city: "Las Vegas", state: "NV", postalCode: "89135", communitySlug: "the-ridges-summerlin" },
    beds: 4, baths: 4, sqft: 3600, lotAcres: 0.2, yearBuilt: 2015,
    propertyType: "Single Family",
    description:
      "Desert-contemporary home in Summerlin's Ridges with clean lines and Red Rock views. Sample listing for layout preview.",
    photos: [], listedDate: "2026-07-30",
    listingOffice: "Sample Realty of Nevada",
  },
  {
    id: "sample-1006",
    mlsNumber: "SAMPLE-1006",
    status: "Coming Soon",
    listPrice: 725000,
    address: { line1: "215 Cadence Crest Ave", city: "Henderson", state: "NV", postalCode: "89011", communitySlug: "cadence" },
    beds: 4, baths: 3, sqft: 2650, yearBuilt: 2023,
    propertyType: "Single Family",
    description:
      "Nearly new home in Cadence near Central Park with modern finishes and a smart layout. Sample listing for layout preview.",
    photos: [], listedDate: "2026-08-01",
    listingOffice: "Sample Realty of Nevada",
  },
];

function applyFilters(list: Listing[], f: ListingFilters = {}): Listing[] {
  return list.filter((l) => {
    if (f.city && l.address.city.toLowerCase() !== f.city.toLowerCase()) return false;
    if (f.communitySlug && l.address.communitySlug !== f.communitySlug) return false;
    if (f.status && l.status !== f.status) return false;
    if (f.propertyType && l.propertyType !== f.propertyType) return false;
    if (f.minPrice && l.listPrice < f.minPrice) return false;
    if (f.maxPrice && l.listPrice > f.maxPrice) return false;
    if (f.minBeds && l.beds < f.minBeds) return false;
    if (f.minBaths && l.baths < f.minBaths) return false;
    return true;
  });
}

export const mockProvider: ListingProvider = {
  async getListings(filters = {}) {
    const filtered = applyFilters(SAMPLE, filters);
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? filtered.length;
    return {
      listings: filtered.slice(offset, offset + limit),
      total: filtered.length,
      isSampleData: true,
    } satisfies ListingResult;
  },
  async getListing(id) {
    return SAMPLE.find((l) => l.id === id) ?? null;
  },
};

export const sampleListings = SAMPLE;
