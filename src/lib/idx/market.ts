/**
 * Neighborhood market context for the homeowner dashboard — built on the same
 * Repliers GLVAR feed as the estimator and /listings. Two reads:
 *   • recentComps()   — recent SOLD comparables near the home (for a "recent
 *                        nearby sales" list).
 *   • zipMarketStats() — the ACTIVE market in the ZIP (count, median list
 *                        price, median $/sqft, median days on market).
 * Both are env-gated (REPLIERS_API_KEY) and return empty/null gracefully so the
 * dashboard simply omits these sections when the feed isn't configured.
 */
const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193";
const SQFT_TOLERANCE = 0.2;
const MONTHS_BACK = 6;

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (...vals: any[]): number => {
  for (const v of vals) {
    if (v != null && v !== "") {
      const x = Number(v);
      if (Number.isFinite(x)) return x;
    }
  }
  return 0;
};

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mapClassParam(t?: string): string | undefined {
  const s = (t ?? "").toLowerCase();
  if (s.includes("condo")) return "CondoProperty";
  if (s.includes("single") || s.includes("town") || s.includes("multi")) return "ResidentialProperty";
  return undefined;
}

async function fetchListings(params: URLSearchParams): Promise<any[]> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`${API_BASE}/listings?${params.toString()}`, {
      headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.listings) ? data.listings : [];
  } catch {
    return [];
  }
}

function addrLine(r: any): string {
  const a = r?.address ?? {};
  const num1 = a.streetNumber ?? a.number ?? "";
  const name = a.streetName ?? a.street ?? "";
  const suffix = a.streetSuffix ?? "";
  const line = [num1, name, suffix].filter(Boolean).join(" ").trim();
  return line || "Nearby home";
}

export type Comp = {
  address: string;
  soldPrice: number;
  soldDate: string;
  beds: number;
  sqft: number;
  ppsf: number;
};

export async function recentComps(input: {
  zip: string;
  beds?: number;
  sqft?: number;
  propertyType?: string;
  limit?: number;
}): Promise<Comp[]> {
  const zip = (input.zip ?? "").trim();
  if (!zip) return [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS_BACK);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const p = new URLSearchParams();
  p.set("boardId", (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim());
  p.set("type", "sale");
  p.set("status", "U");
  p.set("lastStatus", "Sld");
  p.set("minSoldDate", cutoffISO);
  p.set("zip", zip);
  if (input.beds && input.beds > 0) {
    p.set("minBeds", String(Math.max(1, input.beds - 1)));
    p.set("maxBeds", String(input.beds + 1));
  }
  if (input.sqft && input.sqft > 0) {
    p.set("minSqft", String(Math.round(input.sqft * (1 - SQFT_TOLERANCE))));
    p.set("maxSqft", String(Math.round(input.sqft * (1 + SQFT_TOLERANCE))));
  }
  const cls = mapClassParam(input.propertyType);
  if (cls) p.set("class", cls);
  p.set("resultsPerPage", "50");
  p.set("sortBy", "soldDateDesc");
  p.set("fields", "mlsNumber,soldPrice,soldDate,address,details");

  const rows = await fetchListings(p);
  const comps: Comp[] = [];
  for (const r of rows) {
    const details = r?.details ?? {};
    const rowZip = String(r?.address?.zip ?? r?.address?.postalCode ?? "").trim();
    if (rowZip && rowZip !== zip) continue;
    const soldPrice = num(r.soldPrice, r.price, details.soldPrice);
    const sqft = num(details.sqft, details.squareFootage, details.livingArea);
    if (soldPrice <= 0 || sqft <= 0) continue;
    comps.push({
      address: addrLine(r),
      soldPrice,
      soldDate: String(r.soldDate ?? "").slice(0, 10),
      beds: num(details.numBedrooms, details.bedrooms, details.beds),
      sqft,
      ppsf: Math.round(soldPrice / sqft),
    });
    if (comps.length >= (input.limit ?? 6)) break;
  }
  return comps;
}

export type ZipMarketStats = {
  zip: string;
  activeCount: number;
  medianList: number;
  medianPpsf: number;
  medianDom: number;
};

export async function zipMarketStats(input: {
  zip: string;
  propertyType?: string;
}): Promise<ZipMarketStats | null> {
  const zip = (input.zip ?? "").trim();
  if (!zip) return null;

  const p = new URLSearchParams();
  p.set("boardId", (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim());
  p.set("type", "sale");
  p.set("status", "A"); // active
  p.set("zip", zip);
  const cls = mapClassParam(input.propertyType);
  if (cls) p.set("class", cls);
  p.set("resultsPerPage", "100");
  p.set("fields", "mlsNumber,listPrice,listDate,address,details");

  const rows = await fetchListings(p);
  const listPrices: number[] = [];
  const ppsfs: number[] = [];
  const doms: number[] = [];
  const nowTs = Date.now();
  for (const r of rows) {
    const rowZip = String(r?.address?.zip ?? r?.address?.postalCode ?? "").trim();
    if (rowZip && rowZip !== zip) continue;
    const details = r?.details ?? {};
    const list = num(r.listPrice, r.price, details.listPrice);
    if (list > 0) listPrices.push(list);
    const sqft = num(details.sqft, details.squareFootage, details.livingArea);
    if (list > 0 && sqft > 0) ppsfs.push(list / sqft);
    const dom = num(details.daysOnMarket, r.daysOnMarket);
    if (dom > 0) doms.push(dom);
    else {
      const ld = String(r.listDate ?? "").slice(0, 10);
      if (ld && Number.isFinite(Date.parse(ld))) doms.push(Math.max(0, Math.round((nowTs - Date.parse(ld)) / 86_400_000)));
    }
  }
  if (listPrices.length === 0) return null;
  return {
    zip,
    activeCount: listPrices.length,
    medianList: Math.round(median(listPrices) / 1000) * 1000,
    medianPpsf: Math.round(median(ppsfs)),
    medianDom: Math.round(median(doms)),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
