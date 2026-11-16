import { NextResponse } from "next/server";
import { distressAuth } from "@/lib/distress/auth";
import { distressDbConfigured } from "@/lib/distress/db";
import { runPush } from "@/lib/distress/push";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily Seller Engine push into Follow Up Boss.
 *
 * OFF by default: nothing is sent unless DISTRESS_PUSH_ENABLED === "true".
 *   - Scheduled (CRON_SECRET) runs do nothing at all until it's enabled.
 *   - Admin preview: /api/cron/distress-push?key=ADMIN_TOKEN  → dry run, lists
 *     who WOULD be pushed today, writes nothing.
 *   - Admin send:    /api/cron/distress-push?key=ADMIN_TOKEN&send=1 → pushes,
 *     only when DISTRESS_PUSH_ENABLED is also "true".
 */
export async function GET(req: Request) {
  const auth = distressAuth(req, { allowCron: true });
  if (!auth.ok) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const enabled = process.env.DISTRESS_PUSH_ENABLED === "true";
  if (!auth.admin && !enabled) {
    return NextResponse.json({ ok: true, skipped: "push off (set DISTRESS_PUSH_ENABLED=true to run on schedule)" });
  }
  if (!distressDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured (DATABASE_URL)." }, { status: 200 });
  }
  const params = new URL(req.url).searchParams;
  // Scheduled runs send (they only get here when enabled); admin runs send only with send=1.
  const send = auth.admin ? params.get("send") === "1" : true;
  const report = await runPush({ send, deadlineMs: 240_000 });
  return NextResponse.json({ ok: true, ...report });
}
