/**
 * Report dedup. MLS sold/expired data LAGS (a closing can hit the feed a week
 * or two after it happens), so filtering the daily report by a tight sold-date
 * window misses everything. Instead we pull a WIDER look-back window and report
 * only the items we haven't reported before — "new since yesterday" the way
 * Fello's Segment Watch counts "N new contacts". This table is what "seen"
 * means.
 *
 * Falls back to returning everything when no database is configured (so the
 * report still works, just without dedup).
 */
import postgres from "postgres";

function hasDb(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL);
}

let client: ReturnType<typeof postgres> | null = null;
function sql() {
  if (!client) {
    const url = (process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_DATABASE_URL) as string;
    client = postgres(url, { max: 1, prepare: false });
  }
  return client;
}

let ready: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = sql()`
      CREATE TABLE IF NOT EXISTS report_seen (
        kind text NOT NULL,
        mls text NOT NULL,
        seen_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (kind, mls)
      )
    `.then(() => undefined);
  }
  return ready;
}

/**
 * Return the subset of `items` not previously reported for `kind`, and (unless
 * dryRun) mark them seen. No DB → returns everything (window-based behavior).
 */
export async function filterNew<T extends { mlsNumber: string }>(
  kind: string,
  items: T[],
  opts: { dryRun?: boolean } = {},
): Promise<T[]> {
  if (!hasDb()) return items;
  const ids = items.map((i) => i.mlsNumber).filter(Boolean);
  if (ids.length === 0) return [];
  try {
    await ensureSchema();
    const seenRows = await sql()`SELECT mls FROM report_seen WHERE kind = ${kind} AND mls = ANY(${ids})`;
    const seen = new Set(seenRows.map((r) => String(r.mls)));
    const fresh = items.filter((i) => i.mlsNumber && !seen.has(i.mlsNumber));
    if (!opts.dryRun && fresh.length) {
      for (const i of fresh) {
        await sql()`INSERT INTO report_seen (kind, mls) VALUES (${kind}, ${i.mlsNumber}) ON CONFLICT DO NOTHING`;
      }
    }
    return fresh;
  } catch {
    return items; // dedup is best-effort; never drop the report on a DB hiccup
  }
}
