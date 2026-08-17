/**
 * Client → /api/intent bridge.
 *
 * Everything here is a no-op for anonymous visitors: without an email or phone
 * there is no FUB contact to attach the event to. Once someone has filled in
 * any form on the site, their details live in localStorage (`identity.ts`) and
 * every meaningful thing they do afterwards can be pushed to their record —
 * which is what triggers agent alerts and FUB's AI follow-up.
 */

import type { FubProperty } from "@/lib/fub";
import { claimOncePerSession, type ViewedListing } from "./behavior";
import { getIdentity } from "./identity";

export type IntentEvent =
  | "hot-lead"
  | "tour-request"
  | "viewed-property"
  | "property-search"
  | "seller-inquiry";

export function toProperty(l: ViewedListing): FubProperty {
  return {
    street: l.street,
    city: l.city,
    state: l.state,
    code: l.postalCode,
    mlsNumber: l.mlsNumber,
    price: l.price,
    bedrooms: l.beds,
    bathrooms: l.baths,
    area: l.sqft,
    type: l.propertyType,
    url: typeof window !== "undefined" ? new URL(l.url, window.location.origin).toString() : l.url,
    forRent: false,
  };
}

/**
 * Push an intent event for a known visitor.
 * `once` dedupes noisy signals (a listing view, a search) to one per visit.
 * Resolves to true only when the CRM actually accepted the event.
 */
export async function reportIntent(
  event: IntentEvent,
  opts: {
    message: string;
    tags?: string[];
    property?: FubProperty;
    source?: string;
    once?: string;
    /** override the stored identity, e.g. straight from a form submit */
    person?: { name?: string; email?: string; phone?: string };
  },
): Promise<boolean> {
  const person = opts.person ?? getIdentity();
  if (!person || (!person.email && !person.phone)) return false;
  if (opts.once && !claimOncePerSession(opts.once)) return false;

  try {
    const res = await fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        person,
        property: opts.property,
        message: opts.message,
        tags: opts.tags,
        source: opts.source ?? "Roland Luxury Concierge",
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    });
    const json = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; queued?: boolean };
    return Boolean(json.ok && json.queued);
  } catch {
    return false;
  }
}
