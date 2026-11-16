import { NextResponse } from "next/server";
import { distressAuth } from "@/lib/distress/auth";
import { distressDbConfigured } from "@/lib/distress/db";
import { importList } from "@/lib/distress/importList";
import { normalizeDate } from "@/lib/distress/parse";
import { isSignalType, SIGNAL_TYPES } from "@/lib/distress/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Upload one distress list as CSV (e.g. a PropStream export).
 *
 *   POST /api/admin/distress/import?key=ADMIN_TOKEN&list=nod&source=propstream
 *   Content-Type: text/csv   (body = the file)
 *
 * list: one of nod, trustee_sale, probate, tax_delinquent, code_violation,
 * vacant, expired, fsbo. blankDnc=clear treats an empty Do Not Call cell as
 * "not on the list" — only use it once you've confirmed the export leaves the
 * cell blank for clean numbers. Default treats blanks as unscrubbed.
 *
 * asOf=YYYY-MM-DD dates every row that has no date column of its own, so the
 * list ages out on schedule. Use it for the County Treasurer's annual
 * delinquent list (list=tax_delinquent&source=treasurer&asOf=2026-05-06): save
 * the county's Excel file as CSV first.
 *
 * The file is stored in the database only; never commit an export to this repo.
 */
export async function POST(req: Request) {
  if (!distressAuth(req, { allowCron: false }).ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!distressDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured (DATABASE_URL)." }, { status: 200 });
  }
  const params = new URL(req.url).searchParams;
  const list = params.get("list") ?? "";
  if (!isSignalType(list)) {
    return NextResponse.json({ ok: false, error: `list must be one of: ${SIGNAL_TYPES.join(", ")}` }, { status: 400 });
  }
  const source = (params.get("source") ?? "upload").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "upload";
  const blankDnc = params.get("blankDnc") === "clear" ? "clear" : "unknown";
  const asOfRaw = params.get("asOf") ?? "";
  const asOf = asOfRaw ? normalizeDate(asOfRaw) : undefined;
  if (asOfRaw && !asOf) {
    return NextResponse.json({ ok: false, error: "asOf must be a date like 2026-05-06." }, { status: 400 });
  }

  const csv = await req.text();
  if (!csv.trim()) return NextResponse.json({ ok: false, error: "Empty body: send the CSV file." }, { status: 400 });

  try {
    const result = await importList(csv, { list, source, blankDnc, asOf });
    return NextResponse.json({ ok: true, list, source, blankDnc, asOf: asOf ?? null, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
