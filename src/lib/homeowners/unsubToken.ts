/**
 * Stateless one-click unsubscribe for token-less transactional recipients
 * (guide / rebate / cash-offer confirmations). These people have no homeowner
 * store token, so the recurring-email helper (listUnsubscribeHeaders) can't be
 * used. Instead we sign the recipient's OWN email address with an HMAC the
 * server holds, put that in the https List-Unsubscribe URL, and verify it on the
 * way back in — so a one-click POST can suppress the address with no stored
 * token, and nobody can forge an opt-out for an address they don't control.
 *
 * Signing key: HOMEOWNER_UNSUB_SECRET if set, else ADMIN_TOKEN (always present
 * in prod). With neither, we can't sign, so the headers fall back to mailto-only
 * — exactly the previous behavior, so this is safe to ship before the env is set.
 *
 * Server-only: this pulls in `crypto`, so it must never be imported by a client
 * component. brand.ts stays crypto-free for that reason; this module imports the
 * brand's base URL + unsubscribe mailbox from it.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { homeownerBrand, unsubMailto } from "./brand";

function signingKey(): string {
  return (process.env.HOMEOWNER_UNSUB_SECRET ?? "").trim() || (process.env.ADMIN_TOKEN ?? "").trim();
}

/** Normalize so the signature matches regardless of case / surrounding space. */
function norm(email: string): string {
  return email.trim().toLowerCase();
}

/** HMAC-SHA256(email) → 32 hex chars, or "" when no signing key is configured. */
export function signEmail(email: string): string {
  const key = signingKey();
  if (!key) return "";
  return createHmac("sha256", key).update(norm(email)).digest("hex").slice(0, 32);
}

/** Constant-time check of a signature produced by signEmail. */
export function verifyEmailSig(email: string, sig: string): boolean {
  const expected = signEmail(email);
  if (!expected || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Absolute https one-click unsubscribe URL keyed on the email + its signature. */
export function emailUnsubscribeUrl(email: string): string {
  const base = homeownerBrand.baseUrl.replace(/\/$/, "");
  return `${base}/api/dashboard/unsubscribe?e=${encodeURIComponent(norm(email))}&sig=${signEmail(email)}`;
}

/**
 * List-Unsubscribe headers for a token-less recipient. mailto is ALWAYS present;
 * the https one-click + List-Unsubscribe-Post are added only when a signing key
 * exists (so an unsigned, unverifiable link can never be minted). Mirrors the
 * shape of listUnsubscribeHeaders(token) used for store contacts.
 */
export function listUnsubscribeHeadersForEmail(email: string): Record<string, string> {
  const mailto = `<mailto:${unsubMailto()}?subject=unsubscribe>`;
  if (!signEmail(email)) return { "List-Unsubscribe": mailto };
  return {
    "List-Unsubscribe": `${mailto}, <${emailUnsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
