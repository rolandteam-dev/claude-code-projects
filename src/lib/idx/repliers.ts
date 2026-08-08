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
import { matchCommunitySlug } from "@/content/communities";

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
const n = (...vals: any[]): number => {
  for (const v of vals) {
    if (v != null && v !== "") {
      const x = Number(v);
      if (Number.isFinite(x)) return x;
    }
  }
  return 0;
};
const s = (...vals: any[]): string => {
  for (const v of vals) if (v != null && v !== "") return String(v);
  return "";
};

function mapImages(images: any): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((im) => cdnImage(typeof im === "string" ? im : s(im?.url, im?.image, im?.src, im?.path)))
    .filter(Boolean);
}

function mapRecord(r: any): Listing {
  const addr = r.address ?? {};
  const details = r.details ?? {};
  const map = r.map ?? r.coordinates ?? {};
  const office = r.office ?? r.brokerage ?? {};
  const line1 =
    [addr.streetNumber, addr.streetDirection, addr.streetName, addr.streetSuffix].filter(Boolean).join(" ").trim() ||
    s(addr.unparsedAddress, addr.address, typeof r.address === "string" ? r.address : "");
  const lat = n(map.latitude, map.lat);
  const lng = n(map.longitude, map.lng, map.long);
  return {
    id: s(r.mlsNumber, r.id, r.listingId),
    mlsNumber: s(r.mlsNumber, r.listingId, r.id),
    status: mapStatus(s(r.lastStatus, r.status)),
    listPrice: n(r.listPrice, r.price),
    address: {
      line1,
      city: s(addr.city, addr.municipality),
      state: s(addr.state, addr.province) || "NV",
      postalCode: s(addr.zip, addr.postalCode, addr.zipCode),
      communitySlug: matchCommunitySlug([
        s(addr.neighborhood, addr.neighbourhood),
        s(addr.area, addr.district),
        s(details.subdivision, details.subdivisionName, r.subdivision),
        s(details.community, addr.community),
        line1,
      ]),
    },
    beds: n(details.numBedrooms, details.numBeds, details.bedrooms, details.beds),
    baths: n(details.numBathrooms, details.numBaths, details.bathrooms, details.baths),
    sqft: n(details.sqft, details.squareFootage, details.livingArea, details.squareFeet),
    lotAcres: n(details.lotSizeAcres, details.lotAcres) || undefined,
    yearBuilt: n(details.yearBuilt) || undefined,
    propertyType: mapType(s(details.propertyType, details.propertySubType, details.style, r.class)),
    description: s(details.description, details.remarks, r.description),
    photos: mapImages(r.images ?? r.photos),
    coords: lat && lng ? { lat, lng } : undefined,
    listedDate: s(r.listDate, r.listedDate, r.onMarketDate) || new Date().toISOString().slice(0, 10),
    listingOffice: s(office.brokerageName, office.name, r.listOfficeName),
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
