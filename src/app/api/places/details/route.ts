import { NextResponse } from "next/server";
import { placesKey, rateLimit, clientIp } from "@/lib/places";

export const runtime = "nodejs";

/**
 * Proxy for Google Place Details (New). Returns the structured address parts +
 * lat/lng for a placeId. Key stays server-side. Read-only (no writes).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const key = placesKey();
  if (!key) return NextResponse.json({ ok: false, error: "not_configured" });
  if (!rateLimit(`det:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const placeId = (url.searchParams.get("placeId") ?? "").trim();
  const session = url.searchParams.get("session") ?? "";
  if (!placeId) return NextResponse.json({ ok: false, error: "missing placeId" }, { status: 400 });

  try {
    const u = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    if (session) u.searchParams.set("sessionToken", session);
    const r = await fetch(u.toString(), {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "addressComponents,location,formattedAddress" },
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `places ${r.status}` });
    const data: any = await r.json();

    const comp = (type: string, kind: "long" | "short" = "long") => {
      const c = (data?.addressComponents ?? []).find((x: any) => (x.types ?? []).includes(type));
      return c ? (kind === "short" ? c.shortText : c.longText) ?? "" : "";
    };
    const streetNumber = comp("street_number");
    const streetName = comp("route");
    const city = comp("locality") || comp("sublocality") || comp("postal_town");
    const state = comp("administrative_area_level_1", "short");
    const zip = comp("postal_code");
    const loc = data?.location ?? {};

    return NextResponse.json({
      ok: true,
      address: [streetNumber, streetName].filter(Boolean).join(" "),
      streetNumber,
      streetName,
      city,
      state,
      zip,
      lat: typeof loc.latitude === "number" ? loc.latitude : null,
      lng: typeof loc.longitude === "number" ? loc.longitude : null,
      formatted: data?.formattedAddress ?? "",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
