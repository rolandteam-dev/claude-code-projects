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

const MIN_COMPS = 5; // fewer than this → not defensible, defer to a human CMA
const SQFT_TOLERANCE = 0.2; // ±20%
const MONTHS_BACK = 6;

export type EstimateInput = {
  zip: string;
  city?: string;
  propertyType?: string;
  beds: number;
  sqft: number;
};

export type EstimateResult = {
  low: number;
  mid: number;
  high: number;
  compCount: number;
  ppsfMedian: number;
};

export type EstimateResponse =
  | { ok: true; estimate: EstimateResult }
  | { ok: false; reason: "not_configured" | "insufficient_comps" | "invalid_input" | "upstream_error" };

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
  p.set("fields", "mlsNumber,soldPrice,soldDate,lastStatus,class,address,details");

  let data: any;
  try {
    const res = await fetch(`${API_BASE}/listings?${p.toString()}`, {
      headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
      next: { revalidate: 3600 }, // comps move slowly; cache an hour
    });
    if (!res.ok) return { ok: false, reason: "upstream_error" };
    data = await res.json();
  } catch {
    return { ok: false, reason: "upstream_error" };
  }

  const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];

  // Re-apply every filter in-app so a loosened server param can't skew the math.
  const cutoffTs = Date.parse(cutoff);
  const ppsf: number[] = [];
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
    if (Number.isFinite(perSqft) && perSqft > 0) ppsf.push(perSqft);
  }

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
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
