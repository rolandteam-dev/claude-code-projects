/**
 * Google Maps helpers for the homeowner dashboard — both env-gated on
 * GOOGLE_MAPS_API_KEY so they degrade to nothing when unconfigured.
 *
 *  • staticMapUrl() — a Static Maps image of the home + nearby sold comps
 *    (lettered pins, matching the comp cards). Rendered as a plain <img>.
 *  • googleReviews() — the team's Google Business rating + a few reviews via
 *    the Places Details API (needs GOOGLE_PLACE_ID too).
 *
 * Restrict the Maps key by HTTP referrer in Google Cloud — it appears in the
 * map image URL (as every Static/Embed Maps key does).
 */
import type { Comp } from "@/lib/idx/market";

const STATIC = "https://maps.googleapis.com/maps/api/staticmap";
const PLACES = "https://maps.googleapis.com/maps/api/place/details/json";
const LABELS = "ABCDEFGHIJ";

export function staticMapUrl(input: {
  subject: { address: string; city: string; state: string; zip: string };
  comps?: Comp[];
}): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const { subject } = input;
  const suffix = `, ${subject.city} ${subject.state} ${subject.zip}`;
  const params = new URLSearchParams();
  params.set("size", "640x300");
  params.set("scale", "2");
  params.set("maptype", "roadmap");
  params.set("key", key);

  // Subject home marker (gold, label H).
  const parts = [`markers=color:0xC7A25A%7Clabel:H%7C${encodeURIComponent(subject.address + suffix)}`];
  // Comp markers A, B, C… (dark).
  (input.comps ?? []).slice(0, LABELS.length).forEach((c, i) => {
    parts.push(`markers=color:0x2b2b2b%7Clabel:${LABELS[i]}%7C${encodeURIComponent(c.address + suffix)}`);
  });
  return `${STATIC}?${params.toString()}&${parts.join("&")}`;
}

export type GoogleReview = { author: string; rating: number; text: string; when: string };
export type GoogleReviews = {
  rating: number;
  total: number;
  url?: string;
  reviews: GoogleReview[];
} | null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function googleReviews(): Promise<GoogleReviews> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;
  try {
    const p = new URLSearchParams({
      place_id: placeId,
      fields: "rating,user_ratings_total,reviews,url,name",
      reviews_sort: "newest",
      key,
    });
    const res = await fetch(`${PLACES}?${p.toString()}`, { next: { revalidate: 21_600 } });
    if (!res.ok) return null;
    const data: any = await res.json();
    const r = data?.result;
    if (!r || typeof r.rating !== "number") return null;
    const reviews: GoogleReview[] = (Array.isArray(r.reviews) ? r.reviews : [])
      .slice(0, 3)
      .map((x: any) => ({
        author: String(x?.author_name ?? "Google user"),
        rating: Number(x?.rating) || 0,
        text: String(x?.text ?? "").slice(0, 320),
        when: String(x?.relative_time_description ?? ""),
      }))
      .filter((x: GoogleReview) => x.text);
    return { rating: r.rating, total: Number(r.user_ratings_total) || 0, url: r.url, reviews };
  } catch {
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
