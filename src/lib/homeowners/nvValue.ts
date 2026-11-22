/**
 * Nevada home valuation (Plan B). The comp engine needs beds/baths/sqft, which
 * FUB contacts don't carry — so for Nevada homes we resolve those attributes
 * from the Las Vegas MLS (GLVAR via Repliers) by address, then value with the
 * same comp-based engine the public /home-value tool uses.
 *
 * We NEVER invent beds/baths/sqft. If the home can't be resolved from the MLS
 * (and the caller has no user-supplied details), valueHome returns no estimate
 * with a `reason`, and the dashboard asks the homeowner for the details instead
 * of fabricating a number.
 */
import type { EstimatePoint, Homeowner } from "./store";
import { estimateHomeValue } from "@/lib/idx/estimate";
import { resolvePropertyFromPublicRecords, publicRecordsAvm } from "@/lib/idx/publicRecords";

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193";

// The subject home's own MLS record can be a sale from years ago, so unlike the
// comp query (a recent window) the address lookup looks all the way back.
const WIDE_SOLD_SINCE = "2005-01-01";

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (...vals: any[]): number => {
  for (const v of vals) {
    const x = Number(v);
    if (Number.isFinite(x) && x > 0) return x;
  }
  return 0;
};

/** Loose street-name compare: lowercase, strip punctuation + common suffixes. */
function normStreet(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\b(ave|avenue|st|street|dr|drive|ln|lane|rd|road|ct|court|blvd|way|cir|circle|pl|place|pkwy|parkway|ter|terrace)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNevada(h: { state?: string; zip?: string }): boolean {
  return (h.state || "").toUpperCase() === "NV" || /^89\d{3}$/.test((h.zip || "").trim());
}

export type ResolvedProperty = {
  beds: number;
  baths: number;
  sqft: number;
  /** MLS structured fields (used for accurate comp-style matching). */
  propertyType: string;
  style: string;
  /** which lookup pass matched — for the admin diagnostic. */
  matchedBy: string;
};

/**
 * Find the subject property in the MLS by address → beds/baths/sqft (+ type/style).
 *
 * Two passes, sold history first (how most owned homes appear), then active.
 * `type=sale` + `lastStatus=Sld` + a wide `minSoldDate` are what actually return
 * SOLD records — `status=U` alone does not, which is why the previous lookup
 * missed homes that are genuinely in the MLS (e.g. ones we sold years ago).
 */
export async function resolveProperty(
  input: { address?: string; zip?: string },
): Promise<ResolvedProperty | null> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return null;
  const m = (input.address || "").trim().match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  const streetNumber = m?.[1];
  const streetName = m?.[2] ?? "";
  const zip = (input.zip || "").trim();
  if (!streetNumber || !zip) return null;
  const want = normStreet(streetName);
  const boardId = (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
  const headers = { "content-type": "application/json", "REPLIERS-API-KEY": key };

  const passes: { label: string; params: Record<string, string> }[] = [
    { label: "sold", params: { type: "sale", status: "U", lastStatus: "Sld", minSoldDate: WIDE_SOLD_SINCE } },
    { label: "active", params: { type: "sale", status: "A" } },
  ];

  for (const pass of passes) {
    const p = new URLSearchParams();
    p.set("boardId", boardId);
    p.set("zip", zip);
    p.set("streetNumber", streetNumber);
    p.set("resultsPerPage", "25");
    p.set("fields", "address,details,lastStatus,soldDate,listDate");
    for (const [k, v] of Object.entries(pass.params)) p.set(k, v);
    try {
      const res = await fetch(`${API_BASE}/listings?${p.toString()}`, { headers });
      if (!res.ok) continue;
      const data: any = await res.json();
      const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];
      const match =
        rows.find((r) => want && normStreet(r?.address?.streetName ?? "").includes(want)) ??
        (rows.length === 1 ? rows[0] : null);
      if (match) {
        const d = match.details ?? {};
        const sqft = num(d.sqft, d.squareFootage, d.livingArea, d.squareFeet);
        if (sqft > 0) {
          return {
            beds: num(d.numBedrooms, d.bedrooms, d.beds),
            baths: num(d.numBathrooms, d.bathrooms, d.baths),
            sqft,
            propertyType: String(d.propertyType ?? "").trim(),
            style: String(d.style ?? d.propertySubType ?? d.subType ?? "").trim(),
            matchedBy: pass.label,
          };
        }
      }
    } catch {
      // try next pass
    }
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type PropertyFacts = { beds: number; baths: number; sqft: number };

/** Why valueHome has (or doesn't have) a number — lets the dashboard respond precisely. */
export type ValueReason = "resolved" | "insufficient_comps" | "out_of_state" | "not_in_mls";

/** Where the subject home's beds/baths/sqft came from. */
export type ValueSource = "mls" | "public_records" | "avm";

export type ValueResult = {
  estimate: EstimatePoint | null;
  facts: PropertyFacts | null;
  reason: ValueReason;
  /** which data source resolved the home's attributes (when one did). */
  source?: ValueSource;
  /** upstream error detail, surfaced rather than swallowed. */
  detail?: string;
};

/**
 * Value a Nevada home from its address. Resolves beds/baths/sqft from the MLS
 * and values with the comp engine. NEVER invents inputs: if the home isn't in
 * the MLS (or has no usable beds/sqft), returns no estimate with reason
 * "not_in_mls" so the caller can collect the details from the homeowner.
 */
export async function valueHome(h: Homeowner): Promise<ValueResult> {
  if (!isNevada(h)) return { estimate: null, facts: null, reason: "out_of_state" };
  let source: ValueSource = "mls";
  let prop = await resolveProperty({ address: h.address, zip: h.zip });
  // Not on the MLS (never listed/sold) — fall back to public-records / assessor
  // data for the beds/baths/sqft, then value with the SAME comp engine below.
  // No-op unless PROPERTY_DATA_PROVIDER + key are configured, so the MLS path is
  // unchanged by default.
  if (!prop || prop.sqft <= 0 || prop.beds <= 0) {
    const pr = await resolvePropertyFromPublicRecords({ address: h.address, city: h.city, state: h.state, zip: h.zip });
    if (pr && pr.sqft > 0 && pr.beds > 0) {
      source = "public_records";
      prop = { beds: pr.beds, baths: pr.baths, sqft: pr.sqft, propertyType: pr.propertyType, style: pr.style, matchedBy: pr.source };
    }
  }
  // With real facts, value with the comp engine (one consistent, explainable
  // number). Keep its result if comps come up thin, so we can report the reason.
  let compResult: ValueResult | null = null;
  if (prop && prop.sqft > 0 && prop.beds > 0) {
    const r = await estimateFrom(
      { zip: h.zip, city: h.city, beds: prop.beds, baths: prop.baths, sqft: prop.sqft, propertyType: prop.style || prop.propertyType },
    );
    if (r.estimate) return { ...r, source };
    compResult = { ...r, source };
  }

  // Last resort: the provider's own AVM (needs only an address, so it can value a
  // home we have no facts for). No-op unless configured. A different model than
  // our comp number, so it's tagged source "avm".
  const avm = await publicRecordsAvm({ address: h.address, city: h.city, state: h.state, zip: h.zip });
  if (avm) {
    return {
      estimate: { date: new Date().toISOString().slice(0, 10), value: avm.value, low: avm.low, high: avm.high },
      facts: prop && prop.sqft > 0 ? { beds: prop.beds, baths: prop.baths, sqft: prop.sqft } : null,
      reason: "resolved",
      source: "avm",
    };
  }

  // Nothing could value it — never fabricate. Preserve the comp engine's reason
  // (insufficient_comps when we had facts), else not_in_mls.
  return compResult ?? { estimate: null, facts: null, reason: "not_in_mls" };
}

/**
 * Run the comp estimate from already-known facts (MLS- or user-supplied) and
 * shape the result. Shared by valueHome and the homeowner-details form so the
 * two paths value identically.
 */
export async function estimateFrom(input: {
  zip: string;
  city?: string;
  beds: number;
  baths?: number;
  sqft: number;
  propertyType?: string;
}): Promise<ValueResult> {
  const facts: PropertyFacts = { beds: input.beds, baths: input.baths ?? 0, sqft: input.sqft };
  const r = await estimateHomeValue({
    zip: input.zip,
    city: input.city,
    propertyType: input.propertyType,
    beds: input.beds,
    sqft: input.sqft,
  });
  if (!r.ok) {
    const reason: ValueReason = r.reason === "insufficient_comps" ? "insufficient_comps" : "not_in_mls";
    return { estimate: null, facts, reason, detail: r.reason === "upstream_error" ? r.detail : undefined };
  }
  return {
    estimate: {
      date: new Date().toISOString().slice(0, 10),
      value: r.estimate.mid,
      low: r.estimate.low,
      high: r.estimate.high,
    },
    facts,
    reason: "resolved",
  };
}
