export type FubProperty = {
  street?: string;
  city?: string;
  state?: string;
  code?: string;
  mlsNumber?: string;
  price?: number;
  url?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  type?: string;
};

const BASE = "https://api.followupboss.com/v1";
const SOURCE = "rolandluxury.com";
const SYSTEM = "RolandLuxury";
const HOT_TAGS = ["lux_hot_repeat", "lux_reengaged", "lux_chatbot"];
const HOT_FLAG = "lux_hot";

function auth() {
  const key = process.env.FUB_API_KEY;
  if (!key) throw new Error("FUB_API_KEY is not configured");
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

/**
* Raw property activity -> FUB Events API (Viewed Property / Saved Property).
* Server-only: never import this file from a Client Component, and never let
* FUB_API_KEY reach the browser.
* https://docs.followupboss.com/reference/events-post
*/
export async function sendEvent(type: string, email: string, property?: FubProperty) {
  if (!process.env.FUB_API_KEY) {
    return { ok: true, skipped: "FUB_API_KEY not configured" };
  }
  const res = await fetch(`${BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth() },
    body: JSON.stringify({ source: SOURCE, system: SYSTEM, type, person: { emails: [email] }, property }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`FUB event ${type} failed: ${res.status} ${detail}`);
  }
  return { ok: true };
}

/**
* Merge a computed intent tag onto the matching FUB person record.
*
* SAFETY: this always PUTs with ?mergeTags=true. That query param is what
* makes the People API append tags instead of overwriting the contact's
* entire tag list -- never remove it or call this endpoint without it.
*/
export async function addTag(email: string, tag: string) {
  if (!process.env.FUB_API_KEY) {
    return { ok: true, skipped: "FUB_API_KEY not configured" };
  }

const lookup = await fetch(`${BASE}/people?email=${encodeURIComponent(email)}&limit=1`, {
  headers: { Authorization: auth() },
});
  if (!lookup.ok) {
    const detail = (await lookup.text()).slice(0, 300);
    throw new Error(`FUB person lookup failed: ${lookup.status} ${detail}`);
  }
  const lookupJson = await lookup.json();
  const person = lookupJson?.people?.[0];
  if (!person?.id) {
    return { ok: true, skipped: "person not found" };
  }

const tags = HOT_TAGS.includes(tag) ? [tag, HOT_FLAG] : [tag];

const put = await fetch(`${BASE}/people/${person.id}?mergeTags=true`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: auth() },
  body: JSON.stringify({ tags }),
});
  if (!put.ok) {
    const detail = (await put.text()).slice(0, 300);
    throw new Error(`FUB tag merge failed: ${put.status} ${detail}`);
  }
  return { ok: true };
}
