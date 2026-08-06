/**
 * Repliers provider — live GLVAR MLS via the Repliers API (repliers.com).
 *
 * Dormant until selected + keyed:
 *   IDX_PROVIDER=repliers
 *   REPLIERS_API_KEY=<your Repliers API key>   (sandbox first, then production)
 *
 * Docs: https://docs.repliers.io/  — GET https://api.repliers.io/listings
 * Images are served from the Repliers CDN (https://cdn.repliers.io/) with
 * dynamic resizing, so we never host listing photos ourselves.
 *
 * Field mappings below follow Repliers' documented listing shape; confirm the
 * exact field names against a real sandbox response before go-live (a few
 * enumerations/keys can vary by MLS).
 */
import type { Listing, ListingFilters, ListingResult, PropertyType, ListingStatus } from "./types";
import type { ListingProvider } from "./provider";

const API_BASE = "https://api.repliers.io";
const CDN_BASE = "https://cdn.repliers.io";

function apiKey(): string {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) {
    throw new Error(
      "Repliers provider selected (IDX_PROVIDER=repliers) but REPLIERS_API_KEY is not set. " +
        "Create a Repliers account and add the key in Vercel env vars.",
    );
  }
  return key;
}

function mapStatus(v: string | undefined): ListingStatus {
  const s = (v ?? "").toLowerCase();
  if (s.startsWith("a")) return "Active";
  if (s.includes("pend") || s.includes("pc") || s.includes("sc")) return "Pending";
  if (s.includes("sold") || s.includes("closed") || s.startsWith("u")) return "Closed";
  if (s.includes("coming")) return "Coming Soon";
  return "Active";
}

function mapType(v: string | undefined): PropertyType {
  const s = (v ?? "").toLowerCase();
  if (s.includes("condo") || s.includes("apart")) return "Condo";
  if (s.includes("town")) return "Townhouse";
  if (s.includes("land") || s.includes("lot")) return "Land";
  if (s.includes("multi") || s.includes("duplex")) return "Multi-Family";
  return "Single Family";
}

/** Build a resized CDN URL for a Repliers image path. */
function cdnImage(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${CDN_BASE}/${path.replace(/^\//, "")}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRecord(r: any): Listing {
  const addr = r.address ?? {};
  const details = r.details ?? {};
  const map = r.map ?? {};
  const line1 = [addr.streetNumber, addr.streetName, addr.streetSuffix].filter(Boolean).join(" ").trim();
  return {
    id: String(r.mlsNumber ?? r.id),
    mlsNumber: String(r.mlsNumber ?? r.id),
    status: mapStatus(r.lastStatus ?? r.status),
    listPrice: Number(r.listPrice ?? 0),
    address: {
      line1: line1 || (addr.unparsedAddress ?? ""),
      city: addr.city ?? "",
      state: addr.state ?? "NV",
      postalCode: addr.zip ?? addr.postalCode ?? "",
    },
    beds: Number(details.numBedrooms ?? 0),
    baths: Number(details.numBathrooms ?? 0),
    sqft: Number(details.sqft ?? details.squareFootage ?? 0),
    lotAcres: details.lotSizeAcres != null ? Number(details.lotSizeAcres) : undefined,
    yearBuilt: details.yearBuilt != null ? Number(details.yearBuilt) : undefined,
    propertyType: mapType(details.propertyType ?? r.class),
    description: details.description ?? "",
    photos: Array.isArray(r.images) ? r.images.map(cdnImage).filter(Boolean) : [],
    coords:
      map.latitude != null && map.longitude != null
        ? { lat: Number(map.latitude), lng: Number(map.longitude) }
        : undefined,
    listedDate: r.listDate ?? r.listedDate ?? new Date().toISOString().slice(0, 10),
    listingOffice: r.office?.brokerageName ?? "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function buildQuery(f: ListingFilters): string {
  const p = new URLSearchParams();
  p.set("status", f.status && f.status !== "Active" ? "U" : "A");
  p.set("resultsPerPage", String(f.limit ?? 24));
  p.set("pageNum", String(Math.floor((f.offset ?? 0) / (f.limit ?? 24)) + 1));
  p.set("sortBy", "listPriceDesc");
  if (f.city) p.set("city", f.city);
  if (f.minPrice) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  if (f.minBeds) p.set("minBeds", String(f.minBeds));
  if (f.minBaths) p.set("minBaths", String(f.minBaths));
  return p.toString();
}

async function query(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "REPLIERS-API-KEY": apiKey(), "Content-Type": "application/json" },
    next: { revalidate: 900 }, // refresh listings every 15 min without a rebuild
  });
  if (!res.ok) throw new Error(`Repliers request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export const repliersProvider: ListingProvider = {
  async getListings(filters = {}) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = await query(`/listings?${buildQuery(filters)}`);
    const rows: unknown[] = data.listings ?? [];
    return {
      listings: rows.map(mapRecord),
      total: Number(data.count ?? rows.length),
      isSampleData: false,
    } satisfies ListingResult;
  },

  async getListing(id) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = await query(`/listings/${encodeURIComponent(id)}`);
    if (!data || (!data.mlsNumber && !data.id)) return null;
    return mapRecord(data);
  },
};
