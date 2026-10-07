import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { estimateFrom } from "@/lib/homeowners/nvValue";

export const runtime = "nodejs";

/**
 * Homeowner-supplied details → a real comp estimate.
 *
 * When a home can't be resolved from the MLS, the dashboard asks the owner for
 * beds / baths / sqft / property type. This runs the SAME comp engine on those
 * user-supplied values (never invented), persists the estimate + facts, and
 * returns the number so the page can re-render the full dashboard.
 */
type Body = {
  token?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  propertyType?: string;
};

export async function POST(req: Request) {
  let d: Body;
  try {
    d = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const token = (d.token ?? "").trim();
  const beds = Math.round(Number(d.beds) || 0);
  const sqft = Math.round(Number(d.sqft) || 0);
  const baths = Number(d.baths) || 0;
  if (!token) return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
  if (beds <= 0 || sqft <= 0) {
    return NextResponse.json({ ok: false, error: "beds and square footage are required" }, { status: 400 });
  }

  const store = homeownerStore();
  const h = await store.getByToken(token);
  if (!h) return NextResponse.json({ ok: false, error: "link not found" }, { status: 404 });

  const r = await estimateFrom({
    zip: h.zip,
    city: h.city,
    beds,
    baths,
    sqft,
    propertyType: d.propertyType?.trim() || undefined,
  });

  // Persist the facts the owner gave us regardless, so the dashboard shows them.
  await store.updateFacts(token, { beds, baths: baths || undefined, sqft });

  if (!r.estimate) {
    // No fabricated number — tell the UI why (e.g. too few comps for this home).
    return NextResponse.json({ ok: false, reason: r.reason, detail: r.detail ?? null });
  }
  await store.addEstimate(token, r.estimate);
  return NextResponse.json({ ok: true, estimate: r.estimate });
}
