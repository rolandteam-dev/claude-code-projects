"use client";

/**
 * Portal engagement → Follow Up Boss.
 *
 * The point of the portal is that the agent can see what the client is doing.
 * Every meaningful action (saved a home, checked off a step, opened the budget
 * planner, asked for a vendor intro) posts an event that lands on the client's
 * FUB person record, so the team works the CRM and nothing new to check.
 *
 * Rules:
 *  - Never send anything before we know who the client is. Without an email or
 *    phone, FUB can't attach the event to a person, so we drop it.
 *  - De-duplicate per browser session. Checking a box five times shouldn't
 *    create five CRM events.
 *  - Fire-and-forget. A CRM hiccup must never break the client's UI.
 */

import { peekPortal } from "./store";

const SEEN_KEY = "rl.portal.sent.v1";

export type PortalAction =
  | "portal.start"
  | "portal.saved-home"
  | "portal.saved-search"
  | "portal.task-complete"
  | "portal.stage-complete"
  | "portal.budget"
  | "portal.vendor-intro"
  | "portal.tour-request"
  | "portal.message";

/** Human-readable label per action — this is what the agent reads in FUB. */
const LABEL: Record<PortalAction, string> = {
  "portal.start": "Started their Client Portal",
  "portal.saved-home": "Saved a home in the portal",
  "portal.saved-search": "Saved a search in the portal",
  "portal.task-complete": "Completed a step in their portal",
  "portal.stage-complete": "Finished a stage of their journey",
  "portal.budget": "Used the portal budget planner",
  "portal.vendor-intro": "Requested a vendor introduction",
  "portal.tour-request": "Requested a tour from the portal",
  "portal.message": "Sent a message from the portal",
};

function seen(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function remember(key: string) {
  try {
    const s = seen();
    s.add(key);
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
  } catch {
    /* storage disabled — we just lose de-duplication for this visit */
  }
}

/**
 * @param action  what the client did
 * @param detail  the specifics an agent needs to act, e.g. the address
 * @param opts.always  bypass session de-duplication (use for real requests,
 *                     like a tour or vendor intro, which are never duplicates)
 */
export function trackPortal(action: PortalAction, detail = "", opts: { always?: boolean } = {}): void {
  if (typeof window === "undefined") return;

  const { profile, saved, done } = peekPortal();
  if (!profile || (!profile.email && !profile.phone)) return;

  const key = `${action}|${detail}`;
  if (!opts.always && seen().has(key)) return;
  remember(key);

  const body = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    journey: profile.journey,
    action,
    label: LABEL[action],
    detail,
    // Snapshot so the agent gets context without opening anything else.
    savedCount: saved.length,
    completedCount: done.length,
    budget: profile.budget || undefined,
    timeline: profile.timeline || undefined,
    areas: profile.areas,
  };

  try {
    const payload = JSON.stringify(body);
    // sendBeacon survives navigation (client clicks a saved home and leaves).
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/portal/event", new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch("/api/portal/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never surface CRM problems to the client */
  }
}
