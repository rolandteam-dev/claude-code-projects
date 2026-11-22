import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { valueHome } from "@/lib/homeowners/nvValue";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Re-value backfill — fill in home values for the homeowners that have none yet.
 *
 * Phase 1 (public-records fallback) + Phase 2 (provider AVM) let `valueHome`
 * price homes that aren't on the MLS. New leads get valued on the fly at
 * send/dashboard time; this sweep catches up the EXISTING rows that were imported
 * without a value. It only computes + stores estimates — it sends NO email.
 *
 * Targets only the eligible un-valued subset (NV ZIP + valid email, no estimate)
 * — not the whole database — so cost is bounded to the real gap. Each valued home
 * is one provider lookup; beds/baths/sqft are cached, so it's paid once per home.
 *
 * Conservative, like the other write crons:
 *   - OFF on schedule by default: the scheduled run no-ops unless
 *     REVALUE_BACKFILL_ENABLED === "true".
 *   - Admin `?key=` runs DRY-RUN by default (count only — no lookups, no cost);
 *     add `&apply=1` to actually compute + store this run's batch.
 *   - Throttled by REVALUE_BACKFILL_PER_RUN (default 50) and a ~50s time budget.
 *
 * Auth: CRON_SECRET (Vercel Cron / `?secret=`) or ADMIN_TOKEN (`?key=`).
 * Preview (no cost): /api/cron/revalue-backfill?key=ADMIN_TOKEN&dryRun=1
 */
function authorizedAs(req: Request): "cron" | "admin" | null {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") === `Bearer ${secret}`) return "cron";
    if (url.searchParams.get("secret") === secret) return "cron";
  }
  const admin = process.env.ADMIN_TOKEN;
  if (admin && url.searchParams.get("key") === admin) return "admin";
  return null;
}

function perRunCap(url: URL): number {
  const raw = Number(url.searchParams.get("limit") ?? process.env.REVALUE_BACKFILL_PER_RUN ?? 50);
  return Number.isFinite(raw) && raw > 0 ? Math.min(Math.trunc(raw), 500) : 50;
}

async function run(req: Request) {
  const via = authorizedAs(req);
  if (!via) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  // Scheduled runs do nothing until explicitly enabled; an admin key can always
  // run (so you can dry-run a preview, or value a batch by hand with &apply=1).
  if (via === "cron" && process.env.REVALUE_BACKFILL_ENABLED !== "true") {
    return NextResponse.json({ ok: true, skipped: "backfill off (set REVALUE_BACKFILL_ENABLED=true to run on schedule)" });
  }
  // Dry-run by default for admin: count only, no provider lookups, no cost.
  const dryRun = url.searchParams.get("dryRun") === "1" || (via === "admin" && url.searchParams.get("apply") !== "1");
  const perRun = perRunCap(url);
  const store = homeownerStore();

  const needingValue = await store.countNeedingValue();
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: "dry-run",
      needingValue,
      perRun,
      note: "no lookups, no cost. Admin: add &apply=1 to value this run's batch; scheduled runs need REVALUE_BACKFILL_ENABLED=true. ~1 provider lookup per valued home.",
      via,
    });
  }

  const batch = await store.listNeedingValue(perRun);
  const startedAt = Date.now();
  const timeBudgetMs = 50_000;
  let attempted = 0;
  let valued = 0;
  let stillNone = 0;
  const errors: string[] = [];
  for (const h of batch) {
    if (Date.now() - startedAt > timeBudgetMs) break; // stay inside the function limit
    attempted++;
    try {
      const { estimate, facts } = await valueHome(h);
      if (facts) await store.updateFacts(h.token, facts);
      if (estimate) {
        await store.addEstimate(h.token, estimate);
        valued++;
      } else {
        stillNone++; // still couldn't value (no MLS, no public record, no AVM)
      }
    } catch (e) {
      errors.push(`${h.token}: ${String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "backfill",
    needingValue,
    perRun,
    attempted,
    valued,
    stillNone,
    remaining: Math.max(0, needingValue - valued),
    via,
    errors: errors.slice(0, 10),
  });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
