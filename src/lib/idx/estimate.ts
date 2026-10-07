/**
 * Comp-based home value estimator — a transparent AVM built on the SAME
 * Repliers GLVAR feed that powers /listings (no paid "Estimates" add-on
 * required). Method mirrors what a listing agent does by hand:
 *
 *   1. Pull SOLD comparables in the subject ZIP from the past 6 months,
 *      within ±20% of the subject sqft and ±1 bedroom.
 *   2. Compute $/sqft for each comp, drop the top & bottom 5% as outliers.
 *   3. Take the 25th / 50th / 75th percentile $/sqft, multiply by the
 *      subject sqft → low / midpoint / high of the estimate range.
 *
 * This is NOT an appraisal. If there aren't enough recent comps to be
 * defensible, we return null and the UI routes the visitor to a human CMA.
 *
 * NOTE: Repliers query params for SOLD data (status/lastStatus/minSoldDate/
 * zip/min|maxSqft) follow the documented shape but a few enum/key names can
 * vary by MLS — every server-side filter is re-applied in-app below so a
 * loosened server filter can never leak the wrong comps into the math.
 */

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193"; // GLVAR / Las Vegas REALTORS® (matches repliers.ts)

const MIN_COMPS = 10; // fewer than this → not defensible, defer to a human CMA. Live ZIP
// sweep (9/29) showed 56–89 comps in every valley ZIP, so 10 never starves a real market;
// it only makes small/unique homes with a thin comp set defer to a human CMA (more honest).
const SQFT_TOLERANCE = 0.2; // ±20%
const MONTHS_BACK = 6;

export type EstimateInput = {
  zip: string;
  city?: string;
  propertyType?: string;
  beds: number;
  sqft: number;
  /** Subject coordinates (from address autocomplete). When present and enough
   * comps fall within the radius, the estimate uses the NEAREST comps instead
   * of the whole ZIP. Absent → ZIP-wide, exactly as before. */
  lat?: number;
  lng?: number;
  /** Comp radius in miles (default COMP_RADIUS_MILES env or 3). */
  radiusMiles?: number;
};

export type EstimateResult = {
  low: number;
  mid: number;
  high: number;
  compCount: number;
  ppsfMedian: number;
  /** Which comp set produced the range: "radius" = nearest comps to the home's
   * coordinates, "zip" = all comps in the ZIP (the fallback / prior behavior). */
  basis: "radius" | "zip";
  /** Radius actually used, when basis is "radius". */
  radiusMiles?: number;
};

export type EstimateResponse =
  | { ok: true; estimate: EstimateResult }
  | {
      ok: false;
      reason: "not_configured" | "insufficient_comps" | "invalid_input" | "upstream_error";
      /** Field-level upstream error text, surfaced rather than swallowed. */
      detail?: string;
    };

type StyleWant = "detached" | "attached" | null;

/** What product the subject is, for comp-style matching. */
export function styleWantFor(t?: string): StyleWant {
  const s = (t ?? "").toLowerCase();
  if (s.includes("condo")) return "attached";
  if (s.includes("town")) return "attached";
  if (s.includes("single") || s.includes("multi") || s.includes("detached")) return "detached";
  return null; // land / unknown → no style constraint
}

const ATTACHED_RE = /(condo|condominium|attached|town\s?home|town\s?house|apartment|high[-\s]?rise|mid[-\s]?rise|\bloft\b|co-?op)/;
const DETACHED_RE = /(single[-\s]?family|detached|\bsfr\b)/;

/**
 * Keep a comp unless it POSITIVELY reads as the wrong product (fail-open).
 *
 * The GLVAR feed files many DETACHED homes that sit in an HOA/PUD under
 * CondoProperty, so the `class` field is not detached-vs-attached and can't be
 * used as a server filter (doing so returned zero comps across ~half the
 * valley). Instead we pull all comps and read each row's own style text, only
 * dropping one when it clearly is the wrong kind. No style text → keep.
 */
export function matchesStyle(want: StyleWant, styleText: string): boolean {
  if (!want || !styleText) return true;
  const t = styleText.toLowerCase();
  if (want === "detached") return !ATTACHED_RE.test(t);
  return !DETACHED_RE.test(t);
}

/** Linear-interpolated percentile over an ascending-sorted array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

const DEFAULT_RADIUS_MILES = 3;

/** Great-circle distance in miles between two lat/lng points (haversine). */
function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8; // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

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

/**
 * Structured style text on a row (GLVAR: `details.style`, e.g. "Single Family
 * Residence" / "Condominium" / "Townhouse"). ONLY the structured style fields —
 * NOT `class` (CondoProperty even for detached HOA homes), NOT
 * `details.propertyType` (the constant "Residential"), and NOT
 * `details.description` (free-text remarks like "detached casita" or "near the
 * townhomes" that carry no property-type signal). Reading any of those
 * reintroduced the original bug one layer down. Empty string → fail open (kept).
 */
export function styleTextOf(row: any): string {
  const d = row?.details ?? {};
  return [d.style, d.propertySubType, d.subType]
    .filter((v) => typeof v === "string" && v.trim())
    .join(" ");
}

/** A comp row's coordinates, if the feed carries them (GLVAR: `map.latitude/
 * longitude`, sometimes on `address`). Missing/zero → null (never 0,0). */
function coordsOf(row: any): { lat: number | null; lng: number | null } {
  const m = row?.map ?? {};
  const a = row?.address ?? {};
  const lat = num(m.latitude, m.lat, a.latitude, a.lat);
  const lng = num(m.longitude, m.lng, a.longitude, a.lng);
  return { lat: lat || null, lng: lng || null };
}

/** ISO date (YYYY-MM-DD) for the comp-window cutoff, MONTHS_BACK months ago. */
function cutoffISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - MONTHS_BACK);
  return d.toISOString().slice(0, 10);
}

export async function estimateHomeValue(input: EstimateInput): Promise<EstimateResponse> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };

  const zip = (input.zip ?? "").trim();
  const beds = Math.round(num(input.beds));
  const sqft = Math.round(num(input.sqft));
  if (!zip || beds <= 0 || sqft <= 0) return { ok: false, reason: "invalid_input" };

  const boardId = (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
  const minSqft = Math.round(sqft * (1 - SQFT_TOLERANCE));
  const maxSqft = Math.round(sqft * (1 + SQFT_TOLERANCE));
  const cutoff = cutoffISO();

  const p = new URLSearchParams();
  p.set("boardId", boardId);
  p.set("type", "sale");
  p.set("status", "U"); // off-market / closed
  p.set("lastStatus", "Sld"); // sold
  p.set("minSoldDate", cutoff);
  p.set("zip", zip);
  p.set("minBeds", String(Math.max(1, beds - 1)));
  p.set("maxBeds", String(beds + 1));
  p.set("minSqft", String(minSqft));
  p.set("maxSqft", String(maxSqft));
  // Do NOT filter by `class` server-side: on GLVAR, detached homes in an HOA/PUD
  // are filed under CondoProperty, so a class filter returns an empty bucket
  // across most of the valley. We pull all comps and classify in-app instead.
  const want = styleWantFor(input.propertyType);
  p.set("resultsPerPage", "100");
  p.set("sortBy", "soldDateDesc");
  p.set("fields", "mlsNumber,soldPrice,soldDate,lastStatus,class,address,details,map");

  let data: any;
  try {
    const res = await fetch(`${API_BASE}/listings?${p.toString()}`, {
      headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
      next: { revalidate: 3600 }, // comps move slowly; cache an hour
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, reason: "upstream_error", detail: body.slice(0, 300) || `HTTP ${res.status}` };
    }
    data = await res.json();
  } catch (e) {
    return { ok: false, reason: "upstream_error", detail: String(e).slice(0, 300) };
  }

  const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];

  // Subject coordinates + comp radius for distance-based selection.
  const subjLat = num(input.lat);
  const subjLng = num(input.lng);
  const haveGeo = subjLat !== 0 && subjLng !== 0 && Number.isFinite(subjLat) && Number.isFinite(subjLng);
  const radius = Math.min(25, Math.max(0.5, num(input.radiusMiles, process.env.COMP_RADIUS_MILES) || DEFAULT_RADIUS_MILES));

  // Re-apply every filter in-app so a loosened server param can't skew the math.
  const cutoffTs = Date.parse(cutoff);
  const comps: { ppsf: number; dist: number | null }[] = [];
  for (const r of rows) {
    const details = r?.details ?? {};
    const addr = r?.address ?? {};
    const rowZip = String(addr.zip ?? addr.postalCode ?? addr.zipCode ?? "").trim();
    if (zip && rowZip && rowZip !== zip) continue;

    const soldPrice = num(r.soldPrice, r.price, details.soldPrice);
    const rowSqft = num(details.sqft, details.squareFootage, details.livingArea, details.squareFeet);
    const rowBeds = num(details.numBedrooms, details.numBeds, details.bedrooms, details.beds);
    if (soldPrice <= 0 || rowSqft <= 0) continue;
    if (rowSqft < minSqft || rowSqft > maxSqft) continue;
    if (rowBeds > 0 && Math.abs(rowBeds - beds) > 1) continue;

    // Fail-open style gate: drop a comp only when it positively reads as the
    // wrong product (e.g. a true condo when valuing a detached home).
    if (!matchesStyle(want, styleTextOf(r))) continue;

    const soldDate = String(r.soldDate ?? r.lastStatusUpdate ?? "").slice(0, 10);
    if (soldDate && Number.isFinite(cutoffTs) && Date.parse(soldDate) < cutoffTs) continue;

    const perSqft = soldPrice / rowSqft;
    if (!Number.isFinite(perSqft) || perSqft <= 0) continue;

    let dist: number | null = null;
    if (haveGeo) {
      const c = coordsOf(r);
      if (c.lat != null && c.lng != null) dist = milesBetween(subjLat, subjLng, c.lat, c.lng);
    }
    comps.push({ ppsf: perSqft, dist });
  }

  // Prefer the NEAREST comps when we have the home's coordinates and enough
  // sales fall within the radius. Otherwise fall back to the full ZIP set —
  // identical to the prior behavior, so this can never shrink a thin market
  // below the minimum or make a report blank.
  let basis: "radius" | "zip" = "zip";
  let selected = comps;
  if (haveGeo) {
    const near = comps.filter((c) => c.dist != null && c.dist <= radius);
    if (near.length >= MIN_COMPS) {
      selected = near;
      basis = "radius";
    }
  }

  const ppsf = selected.map((c) => c.ppsf);
  if (ppsf.length < MIN_COMPS) return { ok: false, reason: "insufficient_comps" };

  // Trim the top & bottom 5% of $/sqft (distressed sales, non-arm's-length flips).
  ppsf.sort((a, b) => a - b);
  const trim = Math.floor(ppsf.length * 0.05);
  const trimmed = trim > 0 ? ppsf.slice(trim, ppsf.length - trim) : ppsf;

  const p25 = percentile(trimmed, 0.25);
  const p50 = percentile(trimmed, 0.5);
  const p75 = percentile(trimmed, 0.75);

  return {
    ok: true,
    estimate: {
      low: roundTo(p25 * sqft, 1000),
      mid: roundTo(p50 * sqft, 1000),
      high: roundTo(p75 * sqft, 1000),
      compCount: trimmed.length,
      ppsfMedian: Math.round(p50),
      basis,
      radiusMiles: basis === "radius" ? radius : undefined,
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
