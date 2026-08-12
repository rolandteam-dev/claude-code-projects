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
import { matchCommunitySlug, getCommunity } from "@/content/communities";

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

/**
 * Pool is carried inconsistently across MLSs: sometimes a descriptive list
 * (`poolFeatures: ["In Ground","Heated"]`), sometimes a scalar/boolean
 * (`swimmingPool: "Private"` or `"Y"`), and sometimes only as an entry inside
 * the exterior-features list. Check all three, and normalize empties/"None" to
 * undefined so we never render "Pool: None".
 */
function poolFrom(details: any): string | undefined {
  const isNo = (v: string) => {
    const t = v.trim().toLowerCase();
    return !t || t === "none" || t === "no" || t === "n" || t === "false" || t === "0";
  };
  const isYes = (v: string) => {
    const t = v.trim().toLowerCase();
    return t === "y" || t === "yes" || t === "true" || t === "1";
  };

  // 1) Descriptive list field (best: keeps "In Ground, Heated, Private").
  const featureList = collect(details.poolFeatures, details.poolDescription);
  if (featureList.length) return featureList.join(", ");

  // 2) Dedicated scalar field.
  const direct = s(details.swimmingPool, details.pool, details.privatePool).trim();
  if (direct && !isNo(direct)) return isYes(direct) ? "Yes" : direct;

  // 3) Last resort: a "pool" mention inside the general exterior/amenity lists.
  const mention = collect(details.exteriorFeatures, details.features, details.amenities).find(
    (f) => /\bpool\b/i.test(f) && !/no pool|without pool/i.test(f),
  );
  return mention || undefined;
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
    pool: poolFrom(details),
    view: s(details.view) || undefined,
    features: collect(
      details.exteriorFeatures,
      details.interiorFeatures,
      details.features,
      details.amenities,
      // HOA / community amenities carry the 55+/age-restricted flag; parking
      // features carry RV parking — collect both so those facets are searchable.
      details.associationAmenities,
      details.communityFeatures,
      details.parkingFeatures,
      details.appliances,
      details.flooring,
      r.condominium?.amenities,
    ),
    rooms: mapRooms(r.rooms),
    virtualTourUrl: s(r.virtualTourUrl, details.virtualTourUrl, r.tour, details.tourUrl) || undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Fields requested for search-result cards. The Repliers /listings SEARCH
 * endpoint omits the `images` array unless it's explicitly requested, which is
 * why cards rendered without a photo while the single-listing detail endpoint
 * (which returns images by default) worked. `images[1]` asks for ONLY the
 * primary photo so cards get a thumbnail without pulling every image on every
 * result. The other keys cover everything a card renders.
 */
const LIST_FIELDS =
  "mlsNumber,status,lastStatus,listPrice,listDate,updatedOn,class,type,address,map,details,office,images[1]";

function buildQuery(f: ListingFilters, opts: { fields?: string } = {}): string {
  const limit = f.limit ?? 24;
  const p = new URLSearchParams();
  // Always scope to the licensed GLVAR board and for-sale inventory.
  p.set("boardId", boardId());
  p.set("type", "sale");
  p.set("status", f.status && f.status !== "Active" ? "U" : "A");
  p.set("resultsPerPage", String(limit));
  p.set("pageNum", String(Math.floor((f.offset ?? 0) / limit) + 1));
  p.set("sortBy", "listPriceDesc");
  // Free-text keyword search (address, street, subdivision). Repliers matches
  // this across address + listing text; harmless if the visitor leaves it blank.
  if (f.q) p.set("search", f.q.trim());
  if (f.city) p.set("city", f.city);
  if (f.minPrice) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  if (f.minBeds) p.set("minBeds", String(f.minBeds));
  if (f.minBaths) p.set("minBaths", String(f.minBaths));
  const cls = mapClassParam(f.propertyType);
  if (cls) p.set("class", cls);
  if (opts.fields) p.set("fields", opts.fields);
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

/* ---- In-app facet filters (facets Repliers can't filter server-side) ---- */

/** 55+/age-restricted — the flag lives in the HOA/community amenities, so scan
 *  the collected feature list plus remarks and subdivision for the phrasing. */
function isAgeRestricted(l: Listing): boolean {
  const hay = [l.features?.join(" ") ?? "", l.description, l.subdivision ?? ""].join(" ");
  return /(age[-\s]?restrict|55\s*\+|55\s+(?:and|or)\s+(?:older|up|over)|active\s+adult|senior\s+community)/i.test(hay);
}

/** RV parking — a plain "RV" keyword match across features and remarks. */
function hasRvParking(l: Listing): boolean {
  const hay = [l.features?.join(" ") ?? "", l.description].join(" ");
  return /\brv\b/i.test(hay);
}

/** Build the set of predicates for whichever facet filters are active. */
function buildPostFilters(f: ListingFilters): Array<(l: Listing) => boolean> {
  const preds: Array<(l: Listing) => boolean> = [];
  if (f.minGarage) preds.push((l) => (l.garageSpaces ?? 0) >= f.minGarage!);
  if (f.noHoa) preds.push((l) => !l.hoaFee);
  if (f.newConstruction) {
    const cutoff = new Date().getFullYear() - 1; // "previous year or newer"
    preds.push((l) => (l.yearBuilt ?? 0) >= cutoff);
  }
  if (f.ageRestricted) preds.push(isAgeRestricted);
  if (f.rvParking) preds.push(hasRvParking);
  return preds;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Fetch one page of raw listing rows, requesting card image fields with a
 *  safe fallback if the board rejects the fields whitelist. */
async function fetchRows(filters: ListingFilters): Promise<{ rows: any[]; count: number }> {
  let data: any;
  try {
    data = await query(`/listings?${buildQuery(filters, { fields: LIST_FIELDS })}`);
  } catch {
    data = await query(`/listings?${buildQuery(filters)}`);
  }
  const rows: any[] = data.listings ?? [];
  return { rows, count: Number(data.count ?? data.total ?? rows.length) };
}

/**
 * Scan up to MAX_PAGES of a city and keep the rows that pass an optional
 * community match plus every active facet predicate, then paginate the matched
 * set in-app. This is the one path for any search Repliers can't do
 * server-side: community mapping, 55+, no-HOA, garage count, RV, new build.
 * Coverage is bounded to ~PER * MAX_PAGES listings per search — matches beyond
 * that window aren't counted (same trade-off the community search has always
 * had). Default price-descending sort surfaces higher-end homes first.
 */
async function scanAndFilter(
  filters: ListingFilters,
  slug: string | undefined,
  preds: Array<(l: Listing) => boolean>,
): Promise<ListingResult> {
  const pageSize = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  const PER = 100; // rows per Repliers request
  const MAX_PAGES = 4; // scan up to ~400 city listings

  const matched: Listing[] = [];
  const matchedRaw: any[] = [];
  let scanned = 0;
  let cityCount = Number.POSITIVE_INFINITY;

  for (let pageNum = 1; pageNum <= MAX_PAGES && scanned < cityCount; pageNum++) {
    const { rows, count } = await fetchRows({
      ...filters,
      communitySlug: undefined, // Repliers doesn't know our communities; match below
      limit: PER,
      offset: (pageNum - 1) * PER,
    });
    cityCount = count;
    if (rows.length === 0) break;
    for (const r of rows) {
      const l = mapRecord(r);
      if (slug && l.address.communitySlug !== slug) continue;
      if (!preds.every((p) => p(l))) continue;
      matched.push(l);
      matchedRaw.push(r);
    }
    scanned += rows.length;
    if (rows.length < PER) break;
  }

  return {
    listings: matched.slice(offset, offset + pageSize),
    total: matched.length,
    isSampleData: false,
    lastUpdated: latestUpdate(matchedRaw),
  };
}

/** Standard city/valley-wide search. Fast single-page path unless a facet
 *  filter is active, in which case we scan + filter to keep counts correct. */
async function cityListings(filters: ListingFilters): Promise<ListingResult> {
  const preds = buildPostFilters(filters);
  if (preds.length === 0) {
    const { rows, count } = await fetchRows(filters);
    return {
      listings: rows.map(mapRecord),
      total: count,
      isSampleData: false,
      lastUpdated: latestUpdate(rows),
    };
  }
  return scanAndFilter(filters, undefined, preds);
}

/**
 * Community-scoped search. Repliers has no single "community" filter and MLS
 * subdivision/neighborhood naming varies, so we scope the query to the
 * community's CITY and keep only the rows that map back to this community via
 * the same structured-field matching used to cross-link listings to community
 * pages (plus any active facet filters). That guarantees a home appears on a
 * community's page exactly when it would link to that community.
 */
async function communityListings(filters: ListingFilters): Promise<ListingResult> {
  const slug = filters.communitySlug!;
  const community = getCommunity(slug);
  const city = community?.city ?? filters.city;
  return scanAndFilter({ ...filters, city }, slug, buildPostFilters(filters));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const repliersProvider: ListingProvider = {
  async getListings(filters = {}) {
    return filters.communitySlug ? communityListings(filters) : cityListings(filters);
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
