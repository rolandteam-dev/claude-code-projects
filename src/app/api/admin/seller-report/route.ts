import { NextResponse } from "next/server";
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";
import { maybeSendSellerReport } from "@/lib/homeowners/sellerAuto";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Test / manual send of the seller home report for ONE Follow Up Boss contact
 * (ADMIN_TOKEN-gated). Dry-runs by default so a pasted URL can't email anyone.
 *
 *   ?key=ADMIN_TOKEN&personId=123            → report whether they'd qualify
 *   ?key=ADMIN_TOKEN&personId=123&send=1     → actually send (tags them "Home Report Sent")
 *
 * The contact still needs the seller tag, a valid email, and a Nevada address
 * with ZIP, and HOMEOWNER_EMAIL_ENABLED must be "true" — same rules as the
 * automatic path. Manual mode: the new-lead age window is ignored.
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || p.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.FUB_API_KEY;
  const personId = (p.get("personId") ?? "").trim();
  if (!apiKey) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" });
  if (!/^\d+$/.test(personId)) return NextResponse.json({ ok: false, error: "personId (FUB numeric id) required" });

  const res = await fetch(`${FUB_BASE}/v1/people/${personId}?fields=allFields`, { headers: fubHeaders(apiKey) });
  if (!res.ok) return NextResponse.json({ ok: false, error: `FUB ${res.status}` }, { status: 502 });
  const person = await res.json();

  const result = await maybeSendSellerReport(person, { manual: true, dryRun: p.get("send") !== "1" });
  return NextResponse.json({ ok: true, dryRun: p.get("send") !== "1", result });
}
