import { NextResponse } from "next/server";
import { resolveProperty } from "@/lib/homeowners/nvValue";
import { rateLimit, clientIp } from "@/lib/places";

export const runtime = "nodejs";

/**
 * Read-only MLS prefill for the estimator. Given an address + ZIP, returns the
 * home's beds/baths/sqft/type from the MLS when a record exists, so the form can
 * pre-fill them (editable). Never invents values: no record → { found: false }.
 * Writes nothing to the CRM or the homeowner store.
 */
const DROPDOWN = (style: string, propertyType: string): string => {
  const s = `${style} ${propertyType}`.toLowerCase();
  if (/\bcondo|condominium\b/.test(s)) return "Condo";
  if (/town\s?home|town\s?house|townhouse/.test(s)) return "Townhouse";
  if (/multi|duplex|triplex|fourplex/.test(s)) return "Multi-Family";
  return "Single Family";
};

export async function POST(req: Request) {
  if (!rateLimit(`res:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  let body: { address?: string; zip?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const prop = await resolveProperty({ address: body.address, zip: body.zip });
  if (!prop) return NextResponse.json({ ok: true, found: false });

  return NextResponse.json({
    ok: true,
    found: true,
    beds: prop.beds || null,
    baths: prop.baths || null,
    sqft: prop.sqft || null,
    propertyType: DROPDOWN(prop.style, prop.propertyType),
    matchedBy: prop.matchedBy,
  });
}
