/**
 * Comp-based home value estimator — a transparent AVM built on the SAME
 * Repliers GLVAR feed that powers /listings (no paid "Estimates" add-on
 * required). Method mirrors what a listing agent does by hand:
 *
 *   1. Pull SOLD comparables in the subject ZIP, within ±20% of the subject
 *      sqft and ±1 bedroom, from the past 6 months.
 *   2. Compute $/sqft for each comp, drop the top & bottom 5% as outliers.
 *   3. Take the 25th / 50th / 75th percentile $/sqft, multiply by the
 *      subject sqft → low / midpoint / high of the estimate range.
 *
 * When that tight window doesn't yield MIN_COMPS — common in luxury ZIPs,
 * where transactions are fewer and homes vary more in size — we widen it a
 * step at a time (see RUNGS) and report which window was actually used, so a
 * widened estimate is never presented as a tight one.
 *
 * This is NOT an appraisal. If even the widest window comes up short, we
 * return insufficient_comps and the UI routes the visitor to a human CMA.
 *
 * NOTE: Repliers query params for SOLD data (status/lastStatus/minSoldDate/
 * zip/min|maxSqft) follow the documented shape but a few enum/key names can
 * vary by MLS — every server-side filter is re-applied in-app below so a
 * loosened server filter can never leak the wrong comps into the math.
 */

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193"; // GLVAR / Las Vegas REALTORS® (matches repliers.ts)

const MIN_COMPS = 5; // fewer than this → not defensible, defer to a human CMA

/**
 * Widening ladder. The tightest window (rung 0) is the most defensible, but in
 * a luxury ZIP — fewer transactions, wider size spread, more custom homes —
 * five sold comps inside ±20% of sqft with a matching bed count often don't
 * exist, and the seller we most want to capture gets dumped into a contact
 * form. So we relax the window one step at a time and stop at the FIRST rung
 * that clears MIN_COMPS, then tell the visitor which window produced the
 * number (see `window` on EstimateResult) so a widened estimate is never
 * passed off as a tight one.
 *
 * Order matters: give up size precision before bed matching, and reach further
 * back in time only as the last resort — a stale comp is worse than a
 * slightly-different-sized one in a market that moves.
 */
const RUNGS = [
  { sqftTolerance: 0.2, bedTolerance: 1, monthsBack: 6 },
  { sqftTolerance: 0.3, bedTolerance: 1, monthsBack: 6 },
  { sqftTolerance: 0.3, bedTolerance: null, monthsBack: 6 },
  { sqftTolerance: 0.3, bedTolerance: null, monthsBack: 12 },
] as const;

/** The loosest bounds any rung can ask for — one query covers every rung. */
const MAX_SQFT_TOLERANCE = Math.max(...RUNGS.map((r) => r.sqftTolerance));
const MAX_MONTHS_BACK = Math.max(...RUNGS.map((r) => r.monthsBack));

export type EstimateInput = {
  zip: string;
  city?: string;
  propertyType?: string;
  beds: number;
  sqft: number;
};

/** Which comp window produced the estimate — surfaced in the UI verbatim. */
export type EstimateWindow = {
  sqftTolerance: number; // 0.2 → comps within ±20% of the subject sqft
  bedsMatched: boolean; // false when the bed filter had to be dropped
  monthsBack: number;
  widened: boolean; // true when this isn't the tightest rung
};

export type EstimateResult = {
  low: number;
  mid: number;
  high: number;
  compCount: number;
  ppsfMedian: number;
  window: EstimateWindow;
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

/** ISO date (YYYY-MM-DD) for a comp-window cutoff N months ago. */
function cutoffISO(monthsBack: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return d.toISOString().slice(0, 10);
}

/** One normalized sold comp, kept only if it has the fields the math needs. */
type Comp = { ppsf: number; sqft: number; beds: number; soldTs: number };

/**
 * Low / mid / high from a set of $/sqft comps, trimming the top and bottom 5%
 * (distressed sales, non-arm's-length flips) before taking percentiles.
 */
function computeRange(comps: Comp[], sqft: number): Omit<EstimateResult, "window"> {
  const ppsf = comps.map((c) => c.ppsf).sort((a, b) => a - b);
  const trim = Math.floor(ppsf.length * 0.05);
  const trimmed = trim > 0 ? ppsf.slice(trim, ppsf.length - trim) : ppsf;

  const p25 = percentile(trimmed, 0.25);
  const p50 = percentile(trimmed, 0.5);
  const p75 = percentile(trimmed, 0.75);

  return {
    low: roundTo(p25 * sqft, 1000),
    mid: roundTo(p50 * sqft, 1000),
    high: roundTo(p75 * sqft, 1000),
    compCount: trimmed.length,
    ppsfMedian: Math.round(p50),
  };
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

  // Query the WIDEST rung's bounds once, then narrow in-app. One request covers
  // every rung, so widening costs no extra latency or API calls. Note the bed
  // filter is intentionally absent server-side — the loosest rung drops it, and
  // the tighter rungs re-apply it below.
  const minSqft = Math.round(sqft * (1 - MAX_SQFT_TOLERANCE));
  const maxSqft = Math.round(sqft * (1 + MAX_SQFT_TOLERANCE));
  const widestCutoff = cutoffISO(MAX_MONTHS_BACK);

  const p = new URLSearchParams();
  p.set("boardId", boardId);
  p.set("type", "sale");
  p.set("status", "U"); // off-market / closed
  p.set("lastStatus", "Sld"); // sold
  p.set("minSoldDate", widestCutoff);
  p.set("zip", zip);
  p.set("minSqft", String(minSqft));
  p.set("maxSqft", String(maxSqft));
  const cls = mapClassParam(input.propertyType);
  if (cls) p.set("class", cls);
  p.set("resultsPerPage", "100");
  p.set("sortBy", "soldDateDesc"); // newest first, so the 100-row cap keeps the freshest comps

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

  // Normalize once into the fields the rungs filter on. Every server-side
  // filter is re-applied here, so a loosened or ignored server param can never
  // leak a comp the math shouldn't see.
  const comps: Comp[] = [];
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

    const soldDate = String(r.soldDate ?? r.lastStatusUpdate ?? "").slice(0, 10);
    const soldTs = Date.parse(soldDate);

    const ppsf = soldPrice / rowSqft;
    if (!Number.isFinite(ppsf) || ppsf <= 0) continue;
    comps.push({ ppsf, sqft: rowSqft, beds: rowBeds, soldTs: Number.isFinite(soldTs) ? soldTs : NaN });
  }

  // Walk the ladder tight → loose and take the first window with enough comps.
  for (const [i, rung] of RUNGS.entries()) {
    const lo = sqft * (1 - rung.sqftTolerance);
    const hi = sqft * (1 + rung.sqftTolerance);
    const cutoffTs = Date.parse(cutoffISO(rung.monthsBack));

    const matched = comps.filter((c) => {
      if (c.sqft < lo || c.sqft > hi) return false;
      if (rung.bedTolerance != null && c.beds > 0 && Math.abs(c.beds - beds) > rung.bedTolerance) return false;
      // A comp with an unparseable sold date is kept only in the widest window,
      // where we can't claim a recency bound for it anyway.
      if (Number.isFinite(c.soldTs) && Number.isFinite(cutoffTs) && c.soldTs < cutoffTs) return false;
      return true;
    });

    if (matched.length < MIN_COMPS) continue;

    if (i > 0) {
      console.info(
        `[estimate] widened to rung ${i} for zip ${zip} (${beds}bd/${sqft}sqft): ` +
          `±${Math.round(rung.sqftTolerance * 100)}% sqft, ` +
          `${rung.bedTolerance == null ? "any beds" : `±${rung.bedTolerance} bed`}, ` +
          `${rung.monthsBack}mo → ${matched.length} comps`,
      );
    }

    return {
      ok: true,
      estimate: {
        ...computeRange(matched, sqft),
        window: {
          sqftTolerance: rung.sqftTolerance,
          bedsMatched: rung.bedTolerance != null,
          monthsBack: rung.monthsBack,
          widened: i > 0,
        },
      },
    };
  }

  // Even the widest window came up short — this one genuinely needs a human.
  // Logged so a thin ZIP stays distinguishable from a broken feed: rows=0
  // across many ZIPs means the key lost SOLD access, not that Las Vegas
  // stopped selling homes.
  console.warn(
    `[estimate] insufficient comps for zip ${zip} (${beds}bd/${sqft}sqft) at every rung: ` +
      `${rows.length} rows returned, ${comps.length} usable (need ${MIN_COMPS})`,
  );
  return { ok: false, reason: "insufficient_comps" };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
