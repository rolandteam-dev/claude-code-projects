import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";

export const runtime = "nodejs";

/**
 * Diagnostic (ADMIN_TOKEN-gated, read-only): shows the RAW Repliers responses
 * for a home's address, so we can see exactly why valuation isn't returning a
 * number. Hits both the Estimates (AVM) endpoint and a listings address lookup.
 * Usage: /api/admin/estimate-test?key=ADMIN_TOKEN&token=<homeowner token>
 * or ...&address=1042 Quiet Ridge Ave&city=Henderson&zip=89052
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "REPLIERS_API_KEY not set" });

  let address = params.get("address") ?? "";
  let city = params.get("city") ?? "";
  let state = params.get("state") ?? "NV";
  let zip = params.get("zip") ?? "";
  const token = params.get("token");
  if (token) {
    const h = await homeownerStore().getByToken(token);
    if (!h) return NextResponse.json({ ok: false, error: "token not found" });
    address = h.address;
    city = h.city;
    state = h.state;
    zip = h.zip;
  }
  if (!address) return NextResponse.json({ ok: false, error: "provide ?token= or ?address=" });

  const m = address.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  const streetNumber = m?.[1];
  const streetName = m?.[2] ?? address;
  const boardId = Number(process.env.REPLIERS_BOARD_ID ?? 193);
  const headers = { "content-type": "application/json", "REPLIERS-API-KEY": key };
  const trunc = (s: string) => s.slice(0, 1500);

  // 1. Estimates (AVM) by address
  let estimate: unknown = null;
  try {
    const r = await fetch("https://api.repliers.io/estimates", {
      method: "POST",
      headers,
      body: JSON.stringify({ boardId, address: { streetNumber, streetName, city, state, zip } }),
    });
    estimate = { status: r.status, body: trunc(await r.text()) };
  } catch (e) {
    estimate = { error: String(e) };
  }

  // 2. Listings address lookup (to see if we can resolve beds/baths/sqft for plan B)
  let listings: unknown = null;
  try {
    const p = new URLSearchParams();
    p.set("boardId", String(boardId));
    if (zip) p.set("zip", zip);
    if (streetNumber) p.set("streetNumber", streetNumber);
    p.set("resultsPerPage", "3");
    p.set("status", "A,U");
    p.set("fields", "mlsNumber,status,lastStatus,soldPrice,listPrice,address,details");
    const r = await fetch(`https://api.repliers.io/listings?${p.toString()}`, { headers });
    listings = { status: r.status, body: trunc(await r.text()) };
  } catch (e) {
    listings = { error: String(e) };
  }

  return NextResponse.json({
    ok: true,
    input: { address, city, state, zip, streetNumber, streetName, boardId },
    estimate,
    listings,
  });
}
