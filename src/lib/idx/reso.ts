/**
 * RESO Web API (OData) provider — the live MLS adapter.
 *
 * This is intentionally the ONE place that touches the MLS feed. It stays
 * dormant until IDX_PROVIDER=reso and credentials are present:
 *
 *   IDX_PROVIDER=reso
 *   RESO_API_BASE=https://<glvar-vendor-host>/reso/odata   (from GLVAR's vendor)
 *   RESO_TOKEN=<bearer token or access token>
 *
 * Field names below follow the RESO Data Dictionary. Confirm the exact
 * fields/enumerations against the GLVAR feed's $metadata before go-live —
 * some MLSs expose slightly different Media shapes or status enumerations.
 * IDX display rules (attribution, disclaimers, update cadence, no
 * commingling) also apply and are handled in the UI layer + IdxDisclaimer.
 */
import type { Listing, ListingFilters, ListingResult, PropertyType, ListingStatus } from "./types";
import type { ListingProvider } from "./provider";
import { matchCommunitySlug } from "@/content/communities";

function config() {
  const base = process.env.RESO_API_BASE;
  const token = process.env.RESO_TOKEN;
  if (!base || !token) {
    throw new Error(
      "RESO provider selected (IDX_PROVIDER=reso) but RESO_API_BASE / RESO_TOKEN are not set. " +
        "Add them once GLVAR issues IDX credentials.",
    );
  }
  return { base: base.replace(/\/$/, ""), token };
}

function mapStatus(v: string | undefined): ListingStatus {
  switch ((v ?? "").toLowerCase()) {
    case "active": return "Active";
    case "pending": return "Pending";
    case "closed": return "Closed";
    case "coming soon": return "Coming Soon";
    default: return "Active";
  }
}

function mapType(v: string | undefined): PropertyType {
  const s = (v ?? "").toLowerCase();
  if (s.includes("condo")) return "Condo";
  if (s.includes("town")) return "Townhouse";
  if (s.includes("land") || s.includes("lot")) return "Land";
  if (s.includes("multi")) return "Multi-Family";
  return "Single Family";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRecord(r: any): Listing {
  return {
    id: String(r.ListingKey ?? r.ListingId),
    mlsNumber: String(r.ListingId ?? r.ListingKey),
    status: mapStatus(r.StandardStatus),
    listPrice: Number(r.ListPrice ?? 0),
    address: {
      line1: r.UnparsedAddress ?? [r.StreetNumber, r.StreetName, r.StreetSuffix].filter(Boolean).join(" "),
      city: r.City ?? "",
      state: r.StateOrProvince ?? "NV",
      postalCode: r.PostalCode ?? "",
      communitySlug: matchCommunitySlug([
        r.SubdivisionName,
        r.MLSAreaMajor ?? r.MLSAreaMinor,
        r.UnparsedAddress ?? r.StreetName,
      ]),
    },
    beds: Number(r.BedroomsTotal ?? 0),
    baths: Number(r.BathroomsTotalInteger ?? r.BathroomsFull ?? 0),
    sqft: Number(r.LivingArea ?? 0),
    lotAcres: r.LotSizeAcres != null ? Number(r.LotSizeAcres) : undefined,
    yearBuilt: r.YearBuilt != null ? Number(r.YearBuilt) : undefined,
    propertyType: mapType(r.PropertySubType ?? r.PropertyType),
    description: r.PublicRemarks ?? "",
    photos: Array.isArray(r.Media)
      ? r.Media.map((m: any) => m.MediaURL).filter(Boolean)
      : [],
    coords:
      r.Latitude != null && r.Longitude != null
        ? { lat: Number(r.Latitude), lng: Number(r.Longitude) }
        : undefined,
    listedDate: r.ListingContractDate ?? r.OnMarketDate ?? new Date().toISOString().slice(0, 10),
    listingOffice: r.ListOfficeName ?? "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function buildFilter(f: ListingFilters): string {
  const clauses: string[] = ["StandardStatus eq 'Active'"];
  if (f.status) clauses[0] = `StandardStatus eq '${f.status}'`;
  if (f.city) clauses.push(`City eq '${f.city.replace(/'/g, "''")}'`);
  if (f.minPrice) clauses.push(`ListPrice ge ${f.minPrice}`);
  if (f.maxPrice) clauses.push(`ListPrice le ${f.maxPrice}`);
  if (f.minBeds) clauses.push(`BedroomsTotal ge ${f.minBeds}`);
  if (f.minBaths) clauses.push(`BathroomsTotalInteger ge ${f.minBaths}`);
  return clauses.join(" and ");
}

async function query(path: string): Promise<unknown> {
  const { base, token } = config();
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    // Revalidate on the server so listings stay fresh without a rebuild.
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`RESO request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export const resoProvider: ListingProvider = {
  async getListings(filters = {}) {
    const top = filters.limit ?? 24;
    const skip = filters.offset ?? 0;
    const params = new URLSearchParams({
      $filter: buildFilter(filters),
      $top: String(top),
      $skip: String(skip),
      $count: "true",
      $orderby: "ListPrice desc",
    });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = await query(`/Property?${params.toString()}`);
    const rows: unknown[] = data.value ?? [];
    return {
      listings: rows.map(mapRecord),
      total: Number(data["@odata.count"] ?? rows.length),
      isSampleData: false,
    } satisfies ListingResult;
  },

  async getListing(id) {
    const params = new URLSearchParams({ $expand: "Media" });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const data: any = await query(`/Property('${encodeURIComponent(id)}')?${params.toString()}`);
    if (!data || (!data.ListingKey && !data.ListingId)) return null;
    return mapRecord(data);
  },
};
