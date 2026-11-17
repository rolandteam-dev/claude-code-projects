import { NextResponse } from "next/server";
import { homeownerStore, normPhone } from "@/lib/homeowners/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * DNC scrub import (ADMIN_TOKEN-gated). Paste/upload the phone numbers that came
 * back as ON the Do Not Call registry; this marks the matching homeowner records
 * `dnc = true` so the triage view routes them email-only and agents know not to
 * cold-call them. Phone-based (DNC is a calls/texts rule) — email with an
 * unsubscribe link stays allowed, so the value digest is unaffected.
 *
 *   POST /api/admin/dnc/import?key=ADMIN_TOKEN            → dry run (counts only)
 *   POST /api/admin/dnc/import?key=ADMIN_TOKEN&apply=1    → writes dnc=true
 *
 * Body: raw text / CSV (any format — US phone numbers are extracted wherever
 * they appear), or JSON { "phones": [...] } / { "text": "..." }.
 *
 * Owner data lives only in the database — never commit a scrub file to the repo.
 */
const PHONE_RE = /(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g;

export async function POST(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const apply = params.get("apply") === "1" || params.get("send") === "1";

  // Accept JSON { phones | text } or a raw text/CSV body.
  let text = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { phones?: unknown; text?: unknown };
    if (Array.isArray(body.phones)) text = body.phones.map((p) => String(p)).join("\n");
    else text = String(body.text ?? "");
  } else {
    text = await req.text();
  }

  const found = text.match(PHONE_RE) ?? [];
  const phones = [...new Set(found.map((m) => normPhone(m)).filter(Boolean))];
  if (phones.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid US phone numbers found in the input." }, { status: 400 });
  }

  try {
    const { matched, applied } = await homeownerStore().markDnc(phones, { apply });
    return NextResponse.json({
      ok: true,
      mode: apply ? "applied" : "dry-run",
      submitted: phones.length, // distinct valid numbers parsed from the input
      matched, // how many of those match a homeowner on file
      applied, // how many were actually marked dnc=true (0 on a dry run)
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
