import { NextResponse } from "next/server";
import { distressAuth } from "@/lib/distress/auth";
import { distressDbConfigured } from "@/lib/distress/db";
import { syncLasVegasCode } from "@/lib/distress/lvCode";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Pull open City of Las Vegas code-enforcement cases into the Seller Engine.
 * Scheduled runs do nothing unless DISTRESS_ENGINE_ENABLED === "true".
 * Admin: /api/cron/distress-code-sync?key=ADMIN_TOKEN[&dryRun=1]
 *
 * Note: the city's feed has had no new cases since Feb 2024 (see lvCode.ts).
 */
function maxAgeDays(): number {
  const n = Number(process.env.DISTRESS_CODE_MAX_AGE_DAYS ?? 730);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.trunc(n), 3650) : 730;
}

export async function GET(req: Request) {
  const auth = distressAuth(req, { allowCron: true });
  if (!auth.ok) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!auth.admin && process.env.DISTRESS_ENGINE_ENABLED !== "true") {
    return NextResponse.json({ ok: true, skipped: "engine off (set DISTRESS_ENGINE_ENABLED=true to run on schedule)" });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  if (!dryRun && !distressDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured (DATABASE_URL)." }, { status: 200 });
  }
  try {
    const result = await syncLasVegasCode({ maxAgeDays: maxAgeDays(), dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
