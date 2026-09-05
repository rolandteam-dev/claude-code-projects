/**
 * Shared Follow Up Boss → Homeowner mapping. Used by both the bulk importer
 * (cron/fub-sync) and the real-time webhook (webhooks/fub) so a contact lands
 * the same way no matter which path brought it in.
 *
 * The dashboard token is a keyed HMAC of the FUB person id, so importing the
 * same person twice updates the same record (and its estimate/view/subscription
 * history) instead of duplicating it.
 */
import { createHmac } from "crypto";
import type { Homeowner } from "./store";

export const FUB_BASE = "https://api.followupboss.com";

export function fubAuthHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

/**
 * Standard headers for a Follow Up Boss API call. Always sends Authorization +
 * X-System; adds X-System-Key when FUB_X_SYSTEM_KEY is set. FUB requires the
 * system key specifically on webhook-registration calls (it 403s without it),
 * and sending it on every call is harmless, so this is used everywhere. Request
 * a registered system name + key from FUB and store them as FUB_X_SYSTEM /
 * FUB_X_SYSTEM_KEY.
 */
export function fubHeaders(key: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: fubAuthHeader(key),
    "X-System": process.env.FUB_X_SYSTEM || "TheRolandTeamWebsite",
  };
  const systemKey = process.env.FUB_X_SYSTEM_KEY;
  if (systemKey) headers["X-System-Key"] = systemKey;
  return { ...headers, ...(extra ?? {}) };
}

export function tokenForFub(id: string): string {
  const salt = process.env.HOMEOWNER_TOKEN_SALT || process.env.CRON_SECRET || "roland-fallback-salt";
  return createHmac("sha256", salt).update(`fub:${id}`).digest("hex").slice(0, 24);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function pickAddress(person: any): { street: string; city: string; state: string; zip: string } | null {
  const addrs: any[] = Array.isArray(person?.addresses) ? person.addresses : [];
  const a = addrs.find((x) => x && (x.street || x.streetAddress));
  if (!a) return null;
  const street = (a.street || a.streetAddress || "").trim();
  if (!street) return null;
  return {
    street,
    city: (a.city || "").trim(),
    state: (a.state || "NV").trim(),
    zip: (a.code || a.zip || "").trim(),
  };
}

/**
 * Map a FUB person record to a Homeowner. Returns null when the contact has no
 * usable home address or no email — the two things the dashboard + email need.
 */
export function personToHomeowner(person: any): Homeowner | null {
  const addr = pickAddress(person);
  const email = person?.emails?.[0]?.value ?? "";
  if (!addr || !email) return null;
  const now = new Date().toISOString();
  return {
    id: `fub-${person.id}`,
    token: tokenForFub(String(person.id)),
    firstName: person.firstName ?? "",
    lastName: person.lastName ?? "",
    email,
    phone: person.phones?.[0]?.value ?? undefined,
    address: addr.street,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    subscribed: true,
    source: "fub",
    fubPersonId: String(person.id),
    createdAt: now,
    updatedAt: now,
    estimates: [],
    views: [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
