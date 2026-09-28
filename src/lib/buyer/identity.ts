/**
 * Sealed visitor identity for marketing links.
 *
 * To attribute on-site browsing to a Follow Up Boss contact we need to know who
 * the visitor is. The obvious shortcut — putting their email in the URL as
 * ?e=jane@example.com — is a bad idea: the address lands in browser history,
 * referrer headers and server logs, anyone who forwards the link hands over
 * that identity, and anyone at all can type someone else's address and forge
 * activity on their CRM record.
 *
 * Instead a link carries ?c=<sealed>, an AES-256-GCM token that only this
 * server can open. The address is encrypted (not merely encoded) and the GCM
 * auth tag makes it unforgeable — a tampered token fails to open rather than
 * decoding to something attacker-chosen.
 *
 * Tokens are long-lived on purpose: a campaign link should still work months
 * later. Rotating BUYER_LINK_SECRET invalidates every previously issued link.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const IV_BYTES = 12;
const TAG_BYTES = 16;
/** Shared by both ends: sealing something this rejects would mint a dead link. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function key(): Buffer | null {
  const secret = process.env.BUYER_LINK_SECRET || process.env.CRON_SECRET;
  if (!secret) return null;
  // Any-length secret → a 32-byte key.
  return createHash("sha256").update(secret).digest();
}

/** Whether link sealing is configured at all. Nothing can be minted without it. */
export function identityConfigured(): boolean {
  return key() !== null;
}

/**
 * Seal an email into a URL-safe token. Returns null when no secret is
 * configured or the address isn't one openIdentity would accept back.
 */
export function sealIdentity(email: string): string | null {
  const k = key();
  const value = email.trim().toLowerCase();
  if (!k || !EMAIL.test(value)) return null;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, enc, cipher.getAuthTag()]).toString("base64url");
}

/**
 * Open a sealed token. Returns null for anything that isn't a token this
 * server sealed — wrong secret, tampered bytes, truncated input, or garbage.
 */
export function openIdentity(token: string | null | undefined): string | null {
  const k = key();
  if (!k || !token) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length <= IV_BYTES + TAG_BYTES) return null;
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(raw.length - TAG_BYTES);
    const body = raw.subarray(IV_BYTES, raw.length - TAG_BYTES);
    const decipher = createDecipheriv("aes-256-gcm", k, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    // Sanity-check the shape; a valid tag already proves we sealed it.
    return EMAIL.test(out) ? out : null;
  } catch {
    // final() throws when the auth tag doesn't match — i.e. tampering.
    return null;
  }
}
