"use client";

/**
 * Lightweight, client-only "who is this visitor" helper for Follow Up Boss
 * event tracking. We only ever send a Viewed/Saved Property event when we
 * already know the visitor's email; this module is where that email is
 * captured and read from for the current browser session (sessionStorage).
 *
 * Identity sources, in priority order:
 *   1. The site has no visitor accounts/login today, so there is no
 *      logged-in session to read from.
 *   2. An email the visitor typed into one of our own lead forms this
 *      session (LeadForm, ScheduleTour, PreApprovalForm, HomeValuation) —
 *      see setIdentifiedEmail() calls in those components.
 *   3. An email passed in the URL from a marketing link, e.g.
 *      https://rolandluxury.com/listings/123?e=someone%40example.com —
 *      see captureIdentityFromUrl(), wired once in the root layout.
 * If none of those are available we simply don't send the event; anonymous
 * visits are already covered by the base Follow Up Boss tracking pixel.
 */

const STORAGE_KEY = "rl_identified_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getIdentifiedEmail(): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
          const value = window.sessionStorage.getItem(STORAGE_KEY);
          return value && EMAIL_RE.test(value) ? value : undefined;
    } catch {
          return undefined;
    }
}

export function setIdentifiedEmail(email?: string | null): void {
    if (typeof window === "undefined") return;
    const value = (email ?? "").trim();
    if (!EMAIL_RE.test(value)) return;
    try {
          window.sessionStorage.setItem(STORAGE_KEY, value);
    } catch {}
}

/**
 * Picks up ?e=<email> from the current URL (used by marketing/property-alert
 * emails) and stores it for the rest of this browser session. No-op if the
 * param is absent or not a valid email. Safe to call on every page load.
 */
export function captureIdentityFromUrl(): void {
    if (typeof window === "undefined") return;
    try {
          const params = new URLSearchParams(window.location.search);
          const email = params.get("e");
          if (email) setIdentifiedEmail(email);
    } catch {}
}
