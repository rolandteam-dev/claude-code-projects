import { NextResponse } from "next/server";
import { placesKey, CLARK_COUNTY } from "@/lib/places";

export const runtime = "nodejs";

/**
 * TEMPORARY diagnostic for the Places autocomplete setup. Makes one test
 * Autocomplete (New) call server-side and returns the raw upstream status +
 * Google's error body, so we can see exactly why suggestions are empty. Never
 * returns the API key itself (only whether one is present). Remove once the
 * estimator autocomplete is confirmed working.
 */
export async function GET() {
  const key = placesKey();
  if (!key) {
    return NextResponse.json({
      ok: false,
      keyPresent: false,
      note: "No GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) is set in this deployment's environment.",
    });
  }
  try {
    const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input: "1600 S Las Vegas Blvd",
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
    const bodyText = await r.text();
    let suggestionsCount: number | null = null;
    try {
      const parsed = JSON.parse(bodyText);
      suggestionsCount = Array.isArray(parsed?.suggestions) ? parsed.suggestions.length : null;
    } catch {
      // leave null
    }
    return NextResponse.json({
      ok: r.ok,
      keyPresent: true,
      upstreamStatus: r.status,
      suggestionsCount,
      upstreamBody: bodyText.slice(0, 700),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, keyPresent: true, error: String(e) });
  }
}
