import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { styleWantFor, styleTextOf, matchesStyle } from "@/lib/idx/estimate";

export const runtime = "nodejs";

/**
 * Diagnostic (ADMIN_TOKEN-gated, read-only) for the estimator. Shows the RAW
 * Repliers responses for an address plus, with &comps=1, exactly how the comp
 * pool classifies by style — the map you read to confirm the class fix works
 * and to discover the real style field names.
 *
 *   ?key=ADMIN_TOKEN&zip=89052&beds=3&sqft=2000&comps=1   ← the style audit
 *   ?key=ADMIN_TOKEN&token=<homeowner token>              ← AVM + lookup by token
 *   ?key=ADMIN_TOKEN&address=...&city=...&zip=...         ← AVM + lookup by address
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const beds = Number(params.get("beds") ?? 3) || 3;
  const baths = Number(params.get("baths") ?? 2) || 2;
  const sqft = Number(params.get("sqft") ?? 2000) || 2000;
  const boardId = Number(process.env.REPLIERS_BOARD_ID ?? 193);
  const headers = { "content-type": "application/json", "REPLIERS-API-KEY": key };
  const trunc = (s: string) => s.slice(0, 1500);

  // ---- &comps=1: classify the sold-comp pool by style (the fix verification) ----
  if (params.get("comps") === "1") {
    if (!zip) return NextResponse.json({ ok: false, error: "provide ?zip= (and beds/sqft) for comps mode" });
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    const minSqft = Math.round(sqft * 0.8);
    const maxSqft = Math.round(sqft * 1.2);
    const p = new URLSearchParams();
    p.set("boardId", String(boardId));
    p.set("type", "sale");
    p.set("status", "U"); // single value — "A,U" 400s
    p.set("lastStatus", "Sld");
    p.set("minSoldDate", cutoff.toISOString().slice(0, 10));
    p.set("zip", zip);
    p.set("minBeds", String(Math.max(1, beds - 1)));
    p.set("maxBeds", String(beds + 1));
    p.set("minSqft", String(minSqft));
    p.set("maxSqft", String(maxSqft));
    // No class filter — the whole point of the fix.
    p.set("resultsPerPage", "100");
    p.set("fields", "mlsNumber,soldPrice,soldDate,lastStatus,class,address,details");

    let data: any;
    try {
      const r = await fetch(`https://api.repliers.io/listings?${p.toString()}`, { headers });
      if (!r.ok) return NextResponse.json({ ok: false, error: `listings ${r.status}`, body: trunc(await r.text()) });
      data = await r.json();
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) });
    }
    const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];
    const want = styleWantFor(params.get("propertyType") ?? "Single Family");
    const byStyle: Record<string, number> = {};
    let kept = 0;
    let droppedAsAttached = 0;
    const sample: any[] = [];
    for (const r of rows) {
      const styleText = styleTextOf(r);
      const label = styleText || "(no style fields)";
      byStyle[label] = (byStyle[label] ?? 0) + 1;
      if (matchesStyle(want, styleText)) kept++;
      else droppedAsAttached++;
      if (sample.length < 5) sample.push({ class: r?.class ?? null, style: label, details: r?.details ?? null });
    }
    return NextResponse.json({
      ok: true,
      mode: "comps",
      input: { zip, beds, sqft, want },
      total: rows.length,
      kept,
      droppedAsAttached,
      byStyle,
      sample,
    });
  }

  // ---- default: raw AVM + address lookup ----
  if (!address) return NextResponse.json({ ok: false, error: "provide ?token=, ?address=, or ?comps=1&zip=" });
  const m = address.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  const streetNumber = m?.[1];
  const streetName = m?.[2] ?? address;

  // 1. Estimates (AVM) by address — now with the required details object.
  let estimate: unknown = null;
  try {
    const r = await fetch("https://api.repliers.io/estimates", {
      method: "POST",
      headers,
      body: JSON.stringify({
        boardId,
        address: { streetNumber, streetName, city, state, zip },
        details: { numBedrooms: beds, numBathrooms: baths, sqft },
      }),
    });
    estimate = { status: r.status, body: trunc(await r.text()) };
  } catch (e) {
    estimate = { error: String(e) };
  }

  // 2. Listings address lookup — single status value ("A,U" 400s).
  let listings: unknown = null;
  try {
    const p = new URLSearchParams();
    p.set("boardId", String(boardId));
    if (zip) p.set("zip", zip);
    if (streetNumber) p.set("streetNumber", streetNumber);
    p.set("resultsPerPage", "3");
    p.set("status", "U");
    p.set("fields", "mlsNumber,status,lastStatus,soldPrice,listPrice,class,address,details");
    const r = await fetch(`https://api.repliers.io/listings?${p.toString()}`, { headers });
    listings = { status: r.status, body: trunc(await r.text()) };
  } catch (e) {
    listings = { error: String(e) };
  }

  return NextResponse.json({
    ok: true,
    input: { address, city, state, zip, streetNumber, streetName, beds, baths, sqft, boardId },
    estimate,
    listings,
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
