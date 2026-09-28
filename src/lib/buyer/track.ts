"use client";

/**
 * Browser-side buyer tracking.
 *
 * Identity comes from a campaign link's ?c= token, captured once and kept for
 * this browser. We never hold or send a raw email from here — the token is
 * opaque to the browser and only the server can open it. A portal client's own
 * email is the one fallback, and they typed that in themselves.
 *
 * Nothing is sent for a visitor we can't identify; the FUB pixel already covers
 * anonymous browsing.
 */
import { peekPortal } from "@/lib/portal/store";
import type { BuyerActivity, PropertyRef } from "@/lib/buyer/activity";

const TOKEN_KEY = "rt.buyer.cid";
const SEEN_PREFIX = "rt.buyer.seen.";
const COUNT_PREFIX = "rt.buyer.count.";
/** Views of one listing in a session before it counts as real interest. */
const REPEAT_THRESHOLD = 3;

function safeLocal(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Pick up ?c= from a campaign link and remember it. Safe to call on every page
 * load; it's a no-op without the param. The token stays in the URL — stripping
 * it would fight the browser's history entry for no real gain, and it carries
 * no readable address.
 */
export function captureIdentity(): void {
  if (typeof window === "undefined") return;
  try {
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) safeLocal()?.setItem(TOKEN_KEY, c);
  } catch {
    /* ignore */
  }
}

function identity(): { token?: string; portalEmail?: string } {
  const token = safeLocal()?.getItem(TOKEN_KEY) ?? undefined;
  const portalEmail = peekPortal().profile?.email || undefined;
  return { token, portalEmail };
}

function post(activity: BuyerActivity, property?: PropertyRef) {
  const who = identity();
  if (!who.token && !who.portalEmail) return;
  const payload = JSON.stringify({ ...who, activity, property });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/buyer/event", new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch("/api/buyer/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never surface CRM trouble while someone is browsing */
  }
}

/**
 * A listing detail page was opened. Sends one view event per listing per
 * session — a visitor flipping back and forth between two homes should read as
 * two homes, not twenty events — and one "repeat interest" event the third time
 * they come back to the same one.
 */
export function trackListingView(listingId: string, property: PropertyRef): void {
  if (typeof window === "undefined") return;
  const session = safeSession();
  const seenKey = `${SEEN_PREFIX}${listingId}`;
  if (session && !session.getItem(seenKey)) {
    session.setItem(seenKey, "1");
    post("viewed-property", property);
  }
  const countKey = `${COUNT_PREFIX}${listingId}`;
  const next = Number(session?.getItem(countKey) ?? "0") + 1;
  session?.setItem(countKey, String(next));
  // Fires once, exactly at the threshold, not on every view beyond it.
  if (next === REPEAT_THRESHOLD) post("repeat-interest", property);
}

/** A listing was saved. Saves are rare and deliberate, so every one is sent. */
export function trackListingSave(property: PropertyRef): void {
  post("saved-property", property);
}
