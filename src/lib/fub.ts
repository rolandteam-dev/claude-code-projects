/**
 * Follow Up Boss Events API helpers.
 *
 * FUB only accepts a fixed set of event types, and only a few of them start
 * automations. From their docs:
 *
 *   Valid types: Registration, Inquiry, Property Inquiry, General Inquiry,
 *   Seller Inquiry, Saved Property, Viewed Property, Property Search,
 *   Visited Open House.
 *
 *   Action plans / automations (agent alerts, AI texting) only fire on
 *   Registration, Property Inquiry, Seller Inquiry, General Inquiry and
 *   Visited Open House.
 *
 * So anything we want an agent — or FUB's AI — to react to immediately has to
 * land as one of those. Behavior-only signals (a listing view, a search) are
 * sent as Viewed Property / Property Search: they enrich the contact timeline
 * and smart lists without pretending to be a new inquiry.
 *
 * Anything we send that isn't a valid type would be rejected with a 400, so
 * intents like "Showing Request" are mapped to the nearest valid type and kept
 * as a tag, which is what the team actually filters on in FUB anyway.
 */

export const FUB_EVENT_TYPES = [
  "Registration",
  "Inquiry",
  "Property Inquiry",
  "General Inquiry",
  "Seller Inquiry",
  "Saved Property",
  "Viewed Property",
  "Property Search",
  "Visited Open House",
] as const;

export type FubEventType = (typeof FUB_EVENT_TYPES)[number];

const VALID = new Set<string>(FUB_EVENT_TYPES);

/** Intent names used around the site → the valid FUB type they map to. */
const ALIASES: Record<string, FubEventType> = {
  "showing request": "Property Inquiry",
  "tour request": "Property Inquiry",
  "buyer inquiry": "Property Inquiry",
  "listing inquiry": "Property Inquiry",
  "home valuation": "Seller Inquiry",
  "seller lead": "Seller Inquiry",
  "saved search": "Property Search",
  "new lead": "Registration",
};

export type FubProperty = {
  street?: string;
  city?: string;
  state?: string;
  code?: string;
  mlsNumber?: string;
  price?: number;
  forRent?: boolean;
  url?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  lot?: number;
};

/**
 * Coerce whatever the caller asked for into a type FUB accepts. Returns the
 * type plus, when we had to remap, the original label so it survives as a tag.
 */
export function normalizeEventType(
  requested: string | undefined,
  hasProperty: boolean,
): { type: FubEventType; keptAsTag?: string } {
  const fallback: FubEventType = hasProperty ? "Property Inquiry" : "General Inquiry";
  const raw = (requested ?? "").trim();
  if (!raw) return { type: fallback };
  if (VALID.has(raw)) {
    // "Inquiry" is FUB's shorthand; resolve it ourselves so the record is explicit.
    if (raw === "Inquiry") return { type: fallback };
    return { type: raw as FubEventType };
  }
  const alias = ALIASES[raw.toLowerCase()];
  return { type: alias ?? fallback, keptAsTag: raw };
}

/** Split a single "name" field into the first/last FUB expects. */
export function splitName(name?: string): { firstName?: string; lastName?: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined };
}

export type FubPerson = {
  firstName?: string;
  lastName?: string;
  emails?: { value: string }[];
  phones?: { value: string; type?: string }[];
  addresses?: { type: string; street: string }[];
  tags?: string[];
};

export type FubEvent = {
  source: string;
  system: string;
  type: FubEventType;
  message?: string;
  person: FubPerson;
  property?: FubProperty;
};

export type FubResult = { ok: true; queued: boolean } | { ok: false; status?: number; detail?: string };

/** Drop undefined/empty keys so we never send FUB a half-filled property. */
function clean<T extends object>(obj: T): T | undefined {
  const out = Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ) as T;
  return Object.keys(out).length ? out : undefined;
}

export async function postFubEvent(event: FubEvent): Promise<FubResult> {
  const key = process.env.FUB_API_KEY;
  // CRM not configured yet — don't break the UX; Mike adds the key in Vercel.
  if (!key) return { ok: true, queued: false };

  const body = { ...event, property: event.property ? clean(event.property) : undefined };

  try {
    const res = await fetch("https://api.followupboss.com/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        "X-System": "TheRolandTeamWebsite",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return { ok: false, status: res.status, detail };
    }
    return { ok: true, queued: true };
  } catch {
    return { ok: false, detail: "Could not reach CRM." };
  }
}
