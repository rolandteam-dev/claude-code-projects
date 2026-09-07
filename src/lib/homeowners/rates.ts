/**
 * Mortgage rate trends for the homeowner dashboard, from the free FRED API
 * (Federal Reserve Bank of St. Louis). Uses the weekly Freddie Mac PMMS series:
 *   MORTGAGE30US — 30-year fixed
 *   MORTGAGE15US — 15-year fixed
 * (FRED's 5/1 ARM series was discontinued in 2015, so we show 30- and 15-year.)
 *
 * Env-gated on FRED_API_KEY — returns null when unset so the dashboard simply
 * hides the rate chart and shows the educational financing CTA instead. Get a
 * free key at https://fred.stlouisfed.org/docs/api/api_key.html.
 */
export type RatePoint = { date: string; r30?: number; r15?: number };
export type MortgageRates = {
  current: { r30?: number; r15?: number };
  series: RatePoint[];
} | null;

const FRED = "https://api.stlouisfed.org/fred/series/observations";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function series(seriesId: string, key: string, limit = 26): Promise<{ date: string; value: number }[]> {
  const p = new URLSearchParams({
    series_id: seriesId,
    api_key: key,
    file_type: "json",
    sort_order: "desc",
    limit: String(limit),
  });
  const res = await fetch(`${FRED}?${p.toString()}`, { next: { revalidate: 21_600 } }); // cache 6h
  if (!res.ok) return [];
  const data: any = await res.json();
  const obs: any[] = Array.isArray(data?.observations) ? data.observations : [];
  const out: { date: string; value: number }[] = [];
  for (const o of obs) {
    const v = Number(o?.value);
    if (o?.date && Number.isFinite(v) && v > 0) out.push({ date: String(o.date), value: v });
  }
  return out.reverse(); // ascending by date
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function mortgageRates(): Promise<MortgageRates> {
  const key = process.env.FRED_API_KEY;
  if (!key) return null;
  try {
    const [r30, r15] = await Promise.all([series("MORTGAGE30US", key), series("MORTGAGE15US", key)]);
    if (r30.length === 0 && r15.length === 0) return null;

    // Merge the two weekly series onto a shared set of dates.
    const byDate = new Map<string, RatePoint>();
    for (const p of r30) byDate.set(p.date, { date: p.date, r30: p.value });
    for (const p of r15) {
      const existing = byDate.get(p.date);
      if (existing) existing.r15 = p.value;
      else byDate.set(p.date, { date: p.date, r15: p.value });
    }
    const merged = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));

    const last30 = [...r30].reverse().find((p) => p.value > 0)?.value;
    const last15 = [...r15].reverse().find((p) => p.value > 0)?.value;

    return { current: { r30: last30, r15: last15 }, series: merged };
  } catch {
    return null;
  }
}
