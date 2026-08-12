import { NextResponse } from "next/server";
import { estimateHomeValue } from "@/lib/idx/estimate";

export const runtime = "nodejs";

/**
 * Comp-based home value estimate. Returns an instant low/mid/high range from
 * recent SOLD comparables in the subject ZIP (via the Repliers GLVAR feed).
 * No contact info is required to see the number — lead capture happens on the
 * separate "request a full CMA" step, so this endpoint only computes.
 */
export async function POST(req: Request) {
  let body: { zip?: string; city?: string; propertyType?: string; beds?: number | string; sqft?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_input" }, { status: 400 });
  }

  const result = await estimateHomeValue({
    zip: String(body.zip ?? "").trim(),
    city: body.city ? String(body.city).trim() : undefined,
    propertyType: body.propertyType ? String(body.propertyType).trim() : undefined,
    beds: Number(body.beds) || 0,
    sqft: Number(body.sqft) || 0,
  });

  // Always 200 — the UI branches on `ok`/`reason` to show either the range or a
  // graceful "request a CMA" fallback. Never a 500 for a normal "no comps" case.
  return NextResponse.json(result);
}
