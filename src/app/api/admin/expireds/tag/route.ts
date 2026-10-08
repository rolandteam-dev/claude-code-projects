import { NextResponse } from "next/server";
import { expiredMatches } from "@/lib/idx/expired";
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Tag the matched expired-listing owners as "Expired" in Follow Up Boss.
 * Re-runs the same read-only matcher, then writes the tag (mergeTags=true, so
 * it's idempotent — FUB won't duplicate it) to each match that has a FUB id.
 *
 * Auth: ADMIN_TOKEN via `?key=` or `Authorization: Bearer`.
 */
const EXPIRED_TAG = "Expired";

function authorized(req: Request): boolean {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return false;
  const params = new URL(req.url).searchParams;
  if (params.get("key") === admin) return true;
  if (req.headers.get("authorization") === `Bearer ${admin}`) return true;
  return false;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" }, { status: 200 });

  let body: { days?: number } = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine — default window
  }
  const sinceDays = Math.min(Math.max(Number(body.days) || 90, 1), 365);

  const result = await expiredMatches(sinceDays);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason, detail: result.detail }, { status: 200 });
  }

  let tagged = 0;
  let failed = 0;
  let noFubId = 0;
  for (const m of result.matched) {
    const id = m.contact.fubPersonId;
    if (!id) {
      noFubId++;
      continue;
    }
    try {
      const res = await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(id)}?mergeTags=true`, {
        method: "PUT",
        headers: fubHeaders(key, { "Content-Type": "application/json" }),
        body: JSON.stringify({ tags: [EXPIRED_TAG] }),
      });
      if (res.ok) tagged++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, matched: result.matched.length, tagged, failed, noFubId });
}
