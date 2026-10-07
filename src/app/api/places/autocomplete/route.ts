import { NextResponse } from "next/server";
import { placesKey, rateLimit, clientIp, CLARK_COUNTY } from "@/lib/places";

export const runtime = "nodejs";

/**
 * Proxy for Google Places Autocomplete (New). The API key stays server-side.
 * Fails soft — any problem returns an empty suggestion list so the UI can fall
 * back to manual entry rather than block an estimate. Read-only (no writes).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(req: Request) {
  const key = placesKey();
  if (!key) return NextResponse.json({ ok: true, suggestions: [] }); // not configured → manual entry
  if (!rateLimit(`ac:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited", suggestions: [] }, { status: 429 });
  }

  let body: { input?: string; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, suggestions: [] }, { status: 400 });
  }
  const input = (body.input ?? "").trim();
  if (input.length < 3) return NextResponse.json({ ok: true, suggestions: [] });

  try {
    const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input,
        sessionToken: body.sessionToken || undefined,
        regionCode: "us",
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        locationBias: {
          circle: {
            center: { latitude: CLARK_COUNTY.latitude, longitude: CLARK_COUNTY.longitude },
            radius: CLARK_COUNTY.radiusMeters,
          },
        },
      }),
    });
    if (!r.ok) return NextResponse.json({ ok: true, suggestions: [] }); // fail soft → manual
    const data: any = await r.json();
    const suggestions = (data?.suggestions ?? [])
      .map((s: any) => s?.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({ placeId: p.placeId as string, text: (p.text?.text as string) ?? "" }))
      .filter((s: any) => s.placeId && s.text)
      .slice(0, 6);
    return NextResponse.json({ ok: true, suggestions });
  } catch {
    return NextResponse.json({ ok: true, suggestions: [] });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
