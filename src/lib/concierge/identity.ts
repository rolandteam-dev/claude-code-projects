/**
 * Who we're talking to, if they've already told us.
 *
 * The moment a visitor submits any form on the site we remember their name and
 * contact details in this browser. That's what lets later behavior — opening
 * three homes in Ascaya, sitting on a listing for two minutes — be pushed into
 * Follow Up Boss as a real event on THEIR contact record, which is what fires
 * agent alerts, action plans, and FUB's AI texting. Without an identity we can
 * only invite them to raise their hand.
 */

export type Identity = { name?: string; email?: string; phone?: string };

const KEY = "rl_identity_v1";

export function getIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const id = JSON.parse(raw) as Identity;
    return id.email || id.phone ? id : null;
  } catch {
    return null;
  }
}

export function rememberIdentity(id: Identity) {
  if (typeof window === "undefined") return;
  if (!id.email && !id.phone) return;
  try {
    const prev = getIdentity() ?? {};
    const next: Identity = {
      name: id.name?.trim() || prev.name,
      email: id.email?.trim() || prev.email,
      phone: id.phone?.trim() || prev.phone,
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
}

export function firstName(id: Identity | null): string {
  return id?.name?.trim().split(/\s+/)[0] ?? "";
}
