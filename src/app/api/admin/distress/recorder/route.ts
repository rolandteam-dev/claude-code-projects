import { NextResponse } from "next/server";
import { distressAuth } from "@/lib/distress/auth";
import { distressDbConfigured } from "@/lib/distress/db";
import { importRecorder } from "@/lib/distress/importRecorder";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Upload a Clark County Recorder export (AcclaimWeb "Export to CSV").
 *
 *   POST /api/admin/distress/recorder?key=ADMIN_TOKEN[&dryRun=1]
 *   Content-Type: text/csv   (body = the file)
 *
 * Defaults, trustee-sale notices and lis pendens become signals; rescissions,
 * cancellations and trustee's deeds remove them. dryRun=1 reports what the
 * file would do without writing anything. See docs/seller-engine.md for the
 * search to run before exporting.
 *
 * The file goes to the database only; never commit an export to this repo.
 */
export async function POST(req: Request) {
  if (!distressAuth(req, { allowCron: false }).ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  if (!dryRun && !distressDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured (DATABASE_URL)." }, { status: 200 });
  }
  const csv = await req.text();
  if (!csv.trim()) return NextResponse.json({ ok: false, error: "Empty body: send the CSV file." }, { status: 400 });

  try {
    const result = await importRecorder(csv, { dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
