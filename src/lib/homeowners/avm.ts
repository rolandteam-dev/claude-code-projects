/**
 * Repliers AVM helper for the homeowner engine. Requests a fresh automated
 * value estimate for a stored home and returns it as an EstimatePoint to append
 * to the value history. Returns null (no-op) when the Repliers key or the
 * minimum property attributes are missing, so the refresh job degrades safely.
 *
 * Mirrors the request/response mapping used by /api/valuation; confirm exact
 * field names against a live Repliers response once the Estimates add-on is on.
 */
import type { EstimatePoint, Homeowner } from "./store";

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any): number | undefined => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : undefined;
};

function mapEstimate(json: any): { value: number; low?: number; high?: number } | null {
  const est = json?.estimate ?? json?.estimates ?? json;
  const value = num(est?.value ?? est?.estimate ?? est?.predictedValue ?? est?.price);
  if (!value) return null;
  const low = num(est?.low ?? est?.valueLow ?? est?.range?.low ?? est?.confidenceRange?.low);
  const high = num(est?.high ?? est?.valueHigh ?? est?.range?.high ?? est?.confidenceRange?.high);
  return { value, low, high };
}

export async function fetchEstimate(h: Homeowner): Promise<EstimatePoint | null> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return null;
  if (!h.address || !h.beds || !h.baths || !h.sqft) return null;
  try {
    const res = await fetch("https://api.repliers.io/estimates", {
      method: "POST",
      headers: { "content-type": "application/json", "REPLIERS-API-KEY": key },
      body: JSON.stringify({
        boardId: Number(process.env.REPLIERS_BOARD_ID ?? 193),
        numBedrooms: h.beds,
        numBathrooms: h.baths,
        sqft: h.sqft,
        address: { streetName: h.address, city: h.city, state: h.state, zip: h.zip },
      }),
    });
    if (!res.ok) return null;
    const mapped = mapEstimate(await res.json());
    if (!mapped) return null;
    return { date: new Date().toISOString().slice(0, 10), ...mapped };
  } catch {
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
