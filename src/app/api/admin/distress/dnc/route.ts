import { NextResponse } from "next/server";
import { addInternalDnc, distressDbConfigured } from "@/lib/distress/db";
import { normalizePhone } from "@/lib/distress/parse";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Add numbers to the team's internal do-not-call list (owner asked not to be
 * called, wrong number, etc.). These are never pushed again, from any list.
 *
 *   POST /api/admin/distress/dnc  {"key": "...", "phones": ["7025550100"], "reason": "asked"}
 */
export async function POST(req: Request) {
  let body: { key?: string; phones?: unknown; reason?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || body.key !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!distressDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured (DATABASE_URL)." }, { status: 200 });
  }
  const raw = Array.isArray(body.phones) ? body.phones : [];
  const phones = [...new Set(raw.map((p) => normalizePhone(String(p))).filter((p): p is string => Boolean(p)))];
  if (phones.length === 0) return NextResponse.json({ ok: false, error: "No valid phone numbers." }, { status: 400 });
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : "manual";
  const added = await addInternalDnc(phones, reason);
  return NextResponse.json({ ok: true, received: raw.length, valid: phones.length, added });
}
