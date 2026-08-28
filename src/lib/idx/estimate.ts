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

function mapClassParam(t?: string): string | undefined {
  const s = (t ?? "").toLowerCase();
  if (s.includes("condo")) return "CondoProperty";
  if (s.includes("single") || s.includes("town") || s.includes("multi")) return "ResidentialProperty";
  return undefined; // land / unknown → don't over-constrain
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

/** ISO date (YYYY-MM-DD) for the comp-window cutoff, MONTHS_BACK months ago. */
function cutoffISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - MONTHS_BACK);
  return d.toISOString().slice(0, 10);
}

/** Fields requested for comp rows. Kept narrow so a comp scan stays cheap. */
const COMP_FIELDS = "mlsNumber,soldPrice,soldDate,lastStatus,class,address,details";

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** One Repliers comp query. Throws with the upstream status on a non-2xx. */
async function fetchComps(params: URLSearchParams, key: string): Promise<any> {
  const res = await fetch(`${API_BASE}/listings?${params.toString()}`, {
    headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
    next: { revalidate: 3600 }, // comps move slowly; cache an hour
  });
  if (!res.ok) throw new Error(`Repliers request failed: ${res.status} ${res.statusText}`);
  return res.json();
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
  const cls = mapClassParam(input.propertyType);
  if (cls) p.set("class", cls);
  p.set("resultsPerPage", "100");
  p.set("sortBy", "soldDateDesc");

  const withFields = new URLSearchParams(p);
  withFields.set("fields", COMP_FIELDS);

  let data: any;
  try {
    data = await fetchComps(withFields, key);
  } catch (err) {
    // A board that rejects an unrecognized key in the `fields` whitelist fails
    // the whole request, which would sink EVERY estimate while /listings kept
    // working. Retry once without the whitelist — same fallback the listings
    // provider uses (fetchRows in repliers.ts). Costs a heavier payload, but a
    // slow estimate beats a permanently silent one.
    console.warn(`[estimate] comp query with fields whitelist failed (${errMsg(err)}); retrying without it`);
    try {
      data = await fetchComps(p, key);
    } catch (err2) {
      console.error(`[estimate] comp query failed for zip ${zip}: ${errMsg(err2)}`);
      return { ok: false, reason: "upstream_error" };
    }
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

    const soldDate = String(r.soldDate ?? r.lastStatusUpdate ?? "").slice(0, 10);
    if (soldDate && Number.isFinite(cutoffTs) && Date.parse(soldDate) < cutoffTs) continue;

    const perSqft = soldPrice / rowSqft;
    if (Number.isFinite(perSqft) && perSqft > 0) ppsf.push(perSqft);
  }

  if (ppsf.length < MIN_COMPS) {
    // Logged so a genuinely thin ZIP is distinguishable from a broken feed:
    // rows=0 across many ZIPs means the key has no SOLD access, not that Las
    // Vegas stopped selling homes.
    console.warn(
      `[estimate] insufficient comps for zip ${zip} (${beds}bd/${sqft}sqft): ` +
        `${rows.length} rows returned, ${ppsf.length} usable (need ${MIN_COMPS})`,
    );
    return { ok: false, reason: "insufficient_comps" };
  }

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
