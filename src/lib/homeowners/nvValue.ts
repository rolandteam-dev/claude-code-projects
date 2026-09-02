/**
 * Nevada home valuation (Plan B). Repliers' AVM needs beds/baths/sqft, which
 * FUB contacts don't carry — so for Nevada homes we resolve those attributes
 * from the Las Vegas MLS (GLVAR via Repliers) by address, then value with the
 * same comp-based engine the public /home-value tool uses. Out-of-state homes
 * (and NV homes with no MLS history) return null, and the dashboard shows a
 * "request your valuation" CTA instead of a number.
 */
import type { EstimatePoint, Homeowner } from "./store";
import { estimateHomeValue } from "@/lib/idx/estimate";

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193";

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

function isNevada(h: Homeowner): boolean {
  return (h.state || "").toUpperCase() === "NV" || /^89\d{3}$/.test((h.zip || "").trim());
}

/** Find the subject property in the MLS by address → beds/baths/sqft. */
async function resolveProperty(h: Homeowner): Promise<{ beds: number; baths: number; sqft: number } | null> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return null;
  const m = (h.address || "").trim().match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  const streetNumber = m?.[1];
  const streetName = m?.[2] ?? "";
  const zip = (h.zip || "").trim();
  if (!streetNumber || !zip) return null;
  const want = normStreet(streetName);
  const boardId = (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
  const headers = { "content-type": "application/json", "REPLIERS-API-KEY": key };

  // status must be a single value; check sold history (U) first, then active (A).
  for (const status of ["U", "A"]) {
    const p = new URLSearchParams();
    p.set("boardId", boardId);
    p.set("zip", zip);
    p.set("streetNumber", streetNumber);
    p.set("status", status);
    p.set("resultsPerPage", "20");
    p.set("fields", "address,details,soldDate,listDate");
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
          };
        }
      }
    } catch {
      // try next status
    }
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Value a Nevada home from its address; null if out-of-state or not resolvable. */
export async function valueHome(h: Homeowner): Promise<EstimatePoint | null> {
  if (!isNevada(h)) return null;
  const prop = await resolveProperty(h);
  if (!prop || prop.sqft <= 0) return null;
  const r = await estimateHomeValue({
    zip: h.zip,
    city: h.city,
    propertyType: "Single Family",
    beds: prop.beds || 3,
    sqft: prop.sqft,
  });
  if (!r.ok) return null;
  return { date: new Date().toISOString().slice(0, 10), value: r.estimate.mid, low: r.estimate.low, high: r.estimate.high };
}
