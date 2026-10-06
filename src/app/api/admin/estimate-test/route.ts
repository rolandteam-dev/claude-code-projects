import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { styleWantFor, styleTextOf, matchesStyle } from "@/lib/idx/estimate";
import { resolveProperty } from "@/lib/homeowners/nvValue";

export const runtime = "nodejs";

/**
 * Diagnostic (ADMIN-gated, read-only) for the estimator.
 *
 * Auth: send the admin token as `Authorization: Bearer <token>` (preferred).
 * `?key=<token>` is still accepted for pasted-URL workflows. The token is never
 * logged or echoed.
 *
 *   ?comps=1&zip=89052&beds=3&sqft=2000   ← style audit of the comp pool
 *   ?address=...&city=...&zip=...          ← MLS resolve + listings + AVM probe
 *   ?token=<homeowner token>              ← same, by stored homeowner
 *
 * Default mode never invents beds/baths/sqft: each input is tagged with its
 * source (mls | user | missing). The AVM probe only runs when every required
 * field is present; otherwise it reports what's missing.
 */
function authorized(req: Request): boolean {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return false;
  if (req.headers.get("authorization") === `Bearer ${admin}`) return true;
  return new URL(req.url).searchParams.get("key") === admin;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
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

  const boardId = Number(process.env.REPLIERS_BOARD_ID ?? 193);
  const headers = { "content-type": "application/json", "REPLIERS-API-KEY": key };
  const trunc = (s: string) => s.slice(0, 1500);

  // ---- &comps=1: classify the sold-comp pool by style (band is a diagnostic,
  // not a home's facts — these defaults only size the comp window) ----
  if (params.get("comps") === "1") {
    if (!zip) return NextResponse.json({ ok: false, error: "provide ?zip= (and beds/sqft) for comps mode" });
    const beds = Number(params.get("beds") ?? 3) || 3;
    const sqft = Number(params.get("sqft") ?? 2000) || 2000;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    const p = new URLSearchParams();
    p.set("boardId", String(boardId));
    p.set("type", "sale");
    p.set("status", "U");
    p.set("lastStatus", "Sld");
    p.set("minSoldDate", cutoff.toISOString().slice(0, 10));
    p.set("zip", zip);
    p.set("minBeds", String(Math.max(1, beds - 1)));
    p.set("maxBeds", String(beds + 1));
    p.set("minSqft", String(Math.round(sqft * 0.8)));
    p.set("maxSqft", String(Math.round(sqft * 1.2)));
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
    return NextResponse.json({ ok: true, mode: "comps", input: { zip, beds, sqft, want }, total: rows.length, kept, droppedAsAttached, byStyle, sample });
  }

  // ---- default: MLS resolve + raw listings + AVM probe, with source tags ----
  if (!address) return NextResponse.json({ ok: false, error: "provide ?token=, ?address=, or ?comps=1&zip=" });
  const m = address.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  const streetNumber = m?.[1];
  const streetName = m?.[2] ?? address;

  // What the real production lookup now returns for this address.
  const resolved = await resolveProperty({ address, zip });

  // Each value: MLS first, then user-supplied (?beds=/&baths=/&sqft=/&propertyType=/&style=),
  // else missing. NEVER a hardcoded default.
  const pick = (mls: number | string | undefined, user: string | null) => {
    if (mls !== undefined && mls !== "" && Number(mls) !== 0) return { value: mls, source: "mls" as const };
    if (user != null && user !== "") return { value: user, source: "user" as const };
    return { value: null, source: "missing" as const };
  };
  const inputs = {
    beds: pick(resolved?.beds, params.get("beds")),
    baths: pick(resolved?.baths, params.get("baths")),
    sqft: pick(resolved?.sqft, params.get("sqft")),
    propertyType: pick(resolved?.propertyType, params.get("propertyType")),
    style: pick(resolved?.style, params.get("style")),
  };

  // AVM probe — only when every required field is present (never guesses).
  const missing = Object.entries(inputs)
    .filter(([, v]) => v.source === "missing")
    .map(([k]) => k);
  let estimate: unknown;
  if (missing.length || !streetNumber) {
    estimate = { status: "skipped", reason: "missing required fields", missing: missing.concat(streetNumber ? [] : ["streetNumber"]) };
  } else {
    try {
      const r = await fetch("https://api.repliers.io/estimates", {
        method: "POST",
        headers,
        body: JSON.stringify({
          boardId,
          address: { streetNumber, streetName, city, state, zip },
          details: {
            numBedrooms: Number(inputs.beds.value),
            numBathrooms: Number(inputs.baths.value),
            sqft: Number(inputs.sqft.value),
            propertyType: String(inputs.propertyType.value),
            style: String(inputs.style.value),
          },
        }),
      });
      estimate = { status: r.status, body: trunc(await r.text()) }; // surfaces 400 field errors verbatim
    } catch (e) {
      estimate = { error: String(e) };
    }
  }

  // Raw listings lookup with the PROVEN query (sold history + wide window).
  let listings: unknown;
  try {
    const p = new URLSearchParams();
    p.set("boardId", String(boardId));
    if (zip) p.set("zip", zip);
    if (streetNumber) p.set("streetNumber", streetNumber);
    p.set("type", "sale");
    p.set("status", "U");
    p.set("lastStatus", "Sld");
    p.set("minSoldDate", "2005-01-01");
    p.set("resultsPerPage", "5");
    p.set("fields", "mlsNumber,status,lastStatus,soldPrice,listPrice,soldDate,class,address,details");
    const r = await fetch(`https://api.repliers.io/listings?${p.toString()}`, { headers });
    listings = { status: r.status, body: trunc(await r.text()) };
  } catch (e) {
    listings = { error: String(e) };
  }

  return NextResponse.json({
    ok: true,
    input: { address, city, state, zip, streetNumber, streetName, boardId },
    resolved: resolved ?? null, // null = not found in MLS → UI asks the owner
    inputs, // per-value { value, source: mls | user | missing }
    estimate, // AVM probe (not used in production; comp engine is)
    listings,
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
