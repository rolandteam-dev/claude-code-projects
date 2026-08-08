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

/**
 * GLVAR / Las Vegas REALTORS® (IDX PLUS) dataset. Repliers requires a boardId
 * on every request when the API key can see more than one MLS, so all queries
 * are scoped to this board. Overridable via REPLIERS_BOARD_ID without a deploy.
 */
const DEFAULT_BOARD_ID = "193";

function boardId(): string {
  return (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
}

function apiKey(): string {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) {
    throw new Error(
      "Repliers provider selected (IDX_PROVIDER=repliers) but REPLIERS_API_KEY is not set. " +
        "Add REPLIERS_API_KEY in Vercel → Settings → Environment Variables.",
    );
  }
  return key;
}

/** Map our normalized PropertyType to a Repliers `class`, when it maps cleanly. */
function mapClassParam(t?: PropertyType): string | undefined {
  if (t === "Condo") return "CondoProperty";
  if (t === "Single Family" || t === "Townhouse" || t === "Multi-Family") return "ResidentialProperty";
  return undefined; // Land / unknown → don't over-constrain the query
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
  const seen = new Set<string>();
  const out: string[] = [];
  for (const im of images) {
    const url = cdnImage(typeof im === "string" ? im : s(im?.url, im?.image, im?.src, im?.path));
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

/** Optional positive number, else undefined. */
const numOpt = (...vals: any[]): number | undefined => {
  const x = n(...vals);
  return x > 0 ? x : undefined;
};

/** Flatten a set of array/comma-string sources into a unique, trimmed list. */
function collect(...sources: any[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    const parts = Array.isArray(src)
      ? src.map((v) => (typeof v === "string" ? v : s(v?.name, v?.value)))
      : typeof src === "string"
        ? src.split(/[,;|]/)
        : [];
    for (const p of parts) {
      const t = p.trim();
      const key = t.toLowerCase();
      if (t && t.toLowerCase() !== "none" && !seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    }
  }
  return out;
}

function mapRooms(rooms: any): Listing["rooms"] {
  if (!Array.isArray(rooms)) return undefined;
  const out = rooms
    .map((rm) => {
      const name = s(rm?.description, rm?.roomType, rm?.name, rm?.type);
      if (!name) return null;
      const dims = s(rm?.dimensions) || [rm?.length, rm?.width].filter(Boolean).join(" × ");
      const level = s(rm?.level, rm?.floor);
      return { name, dimensions: dims || undefined, level: level || undefined };
    })
    .filter(Boolean) as NonNullable<Listing["rooms"]>;
  return out.length ? out : undefined;
}

function daysOnMarket(listedISO: string, provided?: number): number | undefined {
  if (provided && provided > 0) return provided;
  const t = Date.parse(listedISO);
  if (!Number.isFinite(t)) return undefined;
  const days = Math.floor((Date.now() - t) / 86_400_000);
  return days >= 0 ? days : undefined;
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
    updatedAt: s(r.updatedOn, r.timestamps?.listingUpdate, r.timestamps?.repliersUpdatedOn) || undefined,
    listingOffice: s(office.brokerageName, office.name, r.listOfficeName),
    garageSpaces: numOpt(details.numGarageSpaces, details.garageSpaces, details.garage),
    stories: numOpt(details.numStories, details.stories, details.numFloors),
    style: s(details.style, details.architecturalStyle) || undefined,
    subdivision: s(details.subdivision, addr.neighborhood, addr.neighbourhood) || undefined,
    daysOnMarket: daysOnMarket(
      s(r.listDate, r.listedDate, r.onMarketDate),
      n(r.daysOnMarket, r.dom),
    ),
    hoaFee: numOpt(details.associationFee, details.hoaFee, details.maintenanceFee, r.condominium?.fees?.maintenance),
    hoaFrequency:
      s(
        details.associationFeeFrequency,
        details.hoaFeeFrequency,
        details.maintenanceFeeFrequency,
        r.condominium?.fees?.maintenanceFrequency,
      ) || undefined,
    annualTax: numOpt(r.taxes?.annualAmount, details.taxAnnualAmount, r.taxes?.amount),
    county: s(addr.county, r.county, details.county) || undefined,
    schoolDistrict:
      s(details.schoolDistrict, details.highSchoolDistrict, r.schoolDistrict, details.district) || undefined,
    schools: collect(
      details.schools,
      [details.elementarySchool, details.middleSchool, details.juniorSchool, details.highSchool],
      [details.elementarySchoolName, details.middleSchoolName, details.highSchoolName],
    ),
    heating: s(details.heating, details.heatType) || undefined,
    cooling: s(details.airConditioning, details.cooling, details.coolingType) || undefined,
    pool: s(details.swimmingPool, details.pool) || undefined,
    view: s(details.view) || undefined,
    features: collect(
      details.exteriorFeatures,
      details.interiorFeatures,
      details.features,
      details.amenities,
      details.appliances,
      details.flooring,
      r.condominium?.amenities,
    ),
    rooms: mapRooms(r.rooms),
    virtualTourUrl: s(r.virtualTourUrl, details.virtualTourUrl, r.tour, details.tourUrl) || undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function buildQuery(f: ListingFilters): string {
  const limit = f.limit ?? 24;
  const p = new URLSearchParams();
  // Always scope to the licensed GLVAR board and for-sale inventory.
  p.set("boardId", boardId());
  p.set("type", "sale");
  p.set("status", f.status && f.status !== "Active" ? "U" : "A");
  p.set("resultsPerPage", String(limit));
  p.set("pageNum", String(Math.floor((f.offset ?? 0) / limit) + 1));
  p.set("sortBy", "listPriceDesc");
  if (f.city) p.set("city", f.city);
  if (f.minPrice) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  if (f.minBeds) p.set("minBeds", String(f.minBeds));
  if (f.minBaths) p.set("minBaths", String(f.minBaths));
  const cls = mapClassParam(f.propertyType);
  if (cls) p.set("class", cls);
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

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Most-recent listing-update timestamp across a result set (for IDX "last updated"). */
function latestUpdate(rows: any[]): string | undefined {
  let best = 0;
  for (const r of rows) {
    const t = Date.parse(s(r?.updatedOn, r?.timestamps?.listingUpdate, r?.timestamps?.repliersUpdatedOn, r?.lastStatusUpdate));
    if (Number.isFinite(t) && t > best) best = t;
  }
  return best ? new Date(best).toISOString() : undefined;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const repliersProvider: ListingProvider = {
  async getListings(filters = {}) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = await query(`/listings?${buildQuery(filters)}`);
    const rows: unknown[] = data.listings ?? [];
    return {
      listings: rows.map(mapRecord),
      total: Number(data.count ?? data.total ?? rows.length),
      isSampleData: false,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      lastUpdated: latestUpdate(rows as any[]),
    } satisfies ListingResult;
  },

  async getListing(id) {
    // boardId is required to resolve a single MLS number to the right dataset.
    const p = new URLSearchParams({ boardId: boardId() });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = await query(`/listings/${encodeURIComponent(id)}?${p.toString()}`);
    if (!data || (!data.mlsNumber && !data.id)) return null;
    return mapRecord(data);
  },
};
