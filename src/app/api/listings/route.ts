import { NextResponse } from "next/server";
import { getListing } from "@/lib/idx/provider";

export const runtime = "nodejs";

/**
 * Listings by id — used by the portal's Saved Homes page, which only knows the
 * ids the client saved in their browser and needs the current MLS record for
 * each (price and status change after a home is saved).
 *
 *   GET /api/listings?ids=123,456
 *
 * Ids that no longer resolve (sold and dropped from the feed) are simply
 * omitted; the caller shows them as no longer available.
 */

const MAX_IDS = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ listings: [] });
  }

  const results = await Promise.all(ids.map((id) => getListing(id).catch(() => null)));
  const listings = results.filter((l) => l !== null);

  return NextResponse.json(
    { listings, missing: ids.length - listings.length },
    // Prices move; keep it fresh but allow a short shared cache.
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=600" } },
  );
}
