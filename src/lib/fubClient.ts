"use client";

/**
* Browser-side helpers that turn on-site behavior into Follow Up Boss (FUB)
* signals: raw "Viewed Property" / "Saved Property" activity events, plus
* three computed high-intent tags (lux_hot_repeat, lux_reengaged,
* lux_chatbot) that FUB can't derive on its own. Everything here posts to
* our own same-origin /api/fub route -- the FUB_API_KEY never reaches the
* browser.
*
* Nothing is sent for anonymous visitors; the FollowUpBossPixel already
* covers anonymous browsing. "Identified" means we know the visitor's email
* -- captured from a lead form, the AI concierge chat, or an `?e=` token on
* an inbound marketing link.
*/

const EMAIL_KEY = "rl_identified_email";
const REPEAT_VIEW_THRESHOLD = 3;
const REENGAGE_DAYS = 30;

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

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {}
}

/** The visitor's identified email, if we have one on this browser. */
export function getIdentifiedEmail(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return safeGet(window.localStorage, EMAIL_KEY) || undefined;
}

/** Remember an identified visitor's email for future signals on this browser. */
export function setIdentifiedEmail(email?: string | null) {
  if (typeof window === "undefined" || !email) return;
  const trimmed = email.trim();
  if (!trimmed) return;
  safeSet(window.localStorage, EMAIL_KEY, trimmed);
}

/**
* Pick up an `?e=<email>` token from an inbound marketing link and remember
* it as the identified visitor for this browser. Safe to call on every page
* load -- it's a no-op when the param isn't present.
*/
export function captureEmailFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("e");
    if (token) setIdentifiedEmail(decodeURIComponent(token));
  } catch {}
}

async function postFub(payload: Record<string, unknown>, email?: string) {
  const resolvedEmail = email || getIdentifiedEmail();
  if (!resolvedEmail) return;
  try {
    await fetch("/api/fub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, email: resolvedEmail }),
    });
  } catch (e) {
    console.error("FUB signal failed", e);
  }
}

/** A) Listing detail page load -- raw "Viewed Property" event + repeat-view tag. */
export function onPropertyView(listingId: string, property: FubProperty, email?: string) {
  if (typeof window === "undefined") return;
  const resolvedEmail = email || getIdentifiedEmail();
  if (!resolvedEmail) return;

const viewedKey = `lux_viewed_${listingId}`;
  if (!safeGet(window.sessionStorage, viewedKey)) {
    safeSet(window.sessionStorage, viewedKey, "1");
    postFub({ action: "event", type: "Viewed Property", property }, resolvedEmail);
  }

const countKey = `lux_count_${listingId}`;
  const count = (parseInt(safeGet(window.sessionStorage, countKey) || "0", 10) || 0) + 1;
  safeSet(window.sessionStorage, countKey, String(count));
  if (count === REPEAT_VIEW_THRESHOLD) {
    postFub({ action: "tag", tag: "lux_hot_repeat" }, resolvedEmail);
  }
}

/** B) Save/favorite a listing -- raw "Saved Property" event. */
export function onPropertySave(property: FubProperty, email?: string) {
  postFub({ action: "event", type: "Saved Property", property }, email);
}

/** C) Call once per app load for an identified visitor. */
export function checkReengagement(email?: string) {
  if (typeof window === "undefined") return;
  const resolvedEmail = email || getIdentifiedEmail();
  if (!resolvedEmail) return;

const key = `rl_lastvisit_${resolvedEmail}`;
  const last = parseInt(safeGet(window.localStorage, key) || "0", 10);
  const now = Date.now();
  if (last && now - last > REENGAGE_DAYS * 86400000) {
    postFub({ action: "tag", tag: "lux_reengaged" }, resolvedEmail);
  }
  safeSet(window.localStorage, key, String(now));
}

/** D) Visitor meaningfully engages the AI concierge chatbot. */
export function onChatbotEngaged(email?: string) {
  postFub({ action: "tag", tag: "lux_chatbot" }, email);
}
