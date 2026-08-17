import { NextResponse } from "next/server";
import { getListings } from "@/lib/idx/provider";

export const runtime = "nodejs";

/**
 * New-construction homes for a chosen area. The visitor picks a city on
 * /new-construction and this returns the live GLVAR/Repliers listings in that
 * city built in the previous calendar year or newer (the `newConstruction`
 * facet). No contact info required — it's a browse/discovery endpoint; lead
 * capture happens separately when a buyer asks to be represented.
 *
 * Always 200 with a JSON body; the UI branches on `error`/`listings.length`
 * to show results or a clean "we'll match you by hand" fallback.
 */

// Cities the GLVAR feed filters natively. Kept in lockstep with the /listings
// city facet so results stay accurate (Summerlin, etc. are districts of these
// cities, not separate feed cities, so we don't offer them as false filters).
const ALLOWED_CITIES = ["Las Vegas", "Henderson", "North Las Vegas", "Boulder City"] as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityParam = url.searchParams.get("city")?.trim() ?? "";

  // An empty/absent city means valley-wide; otherwise it must be a known city.
  const city = cityParam
    ? ALLOWED_CITIES.find((c) => c.toLowerCase() === cityParam.toLowerCase())
    : undefined;

  if (cityParam && !city) {
    return NextResponse.json({ listings: [], total: 0, city: cityParam, error: true, reason: "unknown_city" }, { status: 400 });
  }

  const result = await getListings({ city, newConstruction: true, status: "Active", limit: 9 });

  return NextResponse.json({
    listings: result.listings,
    total: result.total,
    city: city ?? null,
    lastUpdated: result.lastUpdated ?? null,
    error: result.error ?? false,
  });
}
