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

const DIRECTIONALS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"]);
const SUFFIXES = new Set([
  "ave", "avenue", "st", "street", "dr", "drive", "ln", "lane", "rd", "road", "ct", "court", "blvd", "boulevard",
  "way", "cir", "circle", "pl", "place", "pkwy", "parkway", "ter", "terrace", "trl", "trail", "hwy", "highway",
  "loop", "pt", "point", "aly", "alley", "sq", "square", "run", "pass", "path", "walk", "xing", "crossing",
]);

/**
 * The MLS stores street direction, name and suffix as SEPARATE fields, so a
 * search must use the bare street name only: "272 Helmsdale Dr" → "helmsdale",
 * "1912 W Hart Ave" → "hart", "9465 West Post Rd Apt 1035" → "post". Drops the
 * unit, any leading/trailing direction (N/S/E/W…) and the trailing suffix
 * (Dr/St/Pl/Ave…), but never reduces the name to nothing.
 */
export function searchStreetName(raw: string): string {
  let t = (raw || "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(apt|unit|ste|suite|bldg|#)\s*\S+\s*$/i, "")
    .replace(/#\s*\S+\s*$/, "")
    .split(/\s+/)
    .filter(Boolean);
  if (t.length > 1 && DIRECTIONALS.has(t[0])) t = t.slice(1);
  // Trailing direction and/or suffix, in either order ("Hart Ave W", "Main St N").
  while (t.length > 1 && (DIRECTIONALS.has(t[t.length - 1]) || SUFFIXES.has(t[t.length - 1]))) t = t.slice(0, -1);
  return t.join(" ").trim();
}

/** Same bare-name form, for comparing against the MLS's own streetName field. */
function normStreet(s: string): string {
  return searchStreetName(s);
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

  // Search by number + bare street name first (best comps); if the MLS filter
  // finds nothing, fall back to number + ZIP and match the name ourselves.
  // status must be a single value; check sold history (U) first, then active (A).
  const attempts: Array<{ withName: boolean; status: string }> = [];
  for (const withName of [true, false]) for (const status of ["U", "A"]) attempts.push({ withName, status });
  for (const { withName, status } of attempts) {
    const p = new URLSearchParams();
    p.set("boardId", boardId);
    p.set("zip", zip);
    p.set("streetNumber", streetNumber);
    if (withName && want) p.set("streetName", want.replace(/\b\w/g, (c) => c.toUpperCase())); // "helmsdale" → "Helmsdale"
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

export type PropertyFacts = { beds: number; baths: number; sqft: number };

/**
 * Value a Nevada home from its address. Returns the estimate (null if
 * out-of-state or unresolvable) and the property facts resolved from the MLS
 * (so callers can persist beds/baths/sqft for the dashboard facts row + comp
 * comparisons). `facts` is null when the property couldn't be resolved.
 */
export async function valueHome(h: Homeowner): Promise<{ estimate: EstimatePoint | null; facts: PropertyFacts | null }> {
  if (!isNevada(h)) return { estimate: null, facts: null };
  const prop = await resolveProperty(h);
  if (!prop || prop.sqft <= 0) return { estimate: null, facts: null };
  const r = await estimateHomeValue({
    zip: h.zip,
    city: h.city,
    propertyType: "Single Family",
    beds: prop.beds || 3,
    sqft: prop.sqft,
  });
  const estimate: EstimatePoint | null = r.ok
    ? { date: new Date().toISOString().slice(0, 10), value: r.estimate.mid, low: r.estimate.low, high: r.estimate.high }
    : null;
  return { estimate, facts: prop };
}
