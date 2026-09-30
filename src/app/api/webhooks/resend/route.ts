import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendHomeownerActivity } from "@/lib/homeowners/fubActivity";

export const runtime = "nodejs";

/**
 * Resend → Follow Up Boss: real email engagement only.
 *
 * A CLICK on a content link is genuine interest, so it is forwarded to FUB as an
 * event on the recipient's record and reaches the agents' calling filters. An
 * OPEN is NOT engagement — forwarding every open created a CRM notification each
 * time a mail client merely rendered (or pre-fetched) the message — so opens, and
 * all non-click events, are acknowledged and dropped. Two navigation clicks are
 * dropped too, because they are not interest in the property:
 *   • the agent-alert "Open in Follow Up Boss" button (a followupboss.com link the
 *     assigned AGENT taps, not the homeowner), and
 *   • the unsubscribe link (handled by its own route; never a buying signal).
 *
 * SECURITY: this endpoint is public and writes to the CRM, so it refuses
 * everything unless RESEND_WEBHOOK_SECRET is set and the Svix signature checks
 * out. Failing closed is deliberate — an open endpoint here would let anyone
 * forge activity on any contact by posting an email address.
 *
 * Set up: Resend → Webhooks → add this URL, subscribe to email.clicked (opens may
 * be subscribed too — they are safely ignored), then copy the signing secret into
 * RESEND_WEBHOOK_SECRET.
 */

/** Svix signature: base64 HMAC-SHA256 over `${id}.${timestamp}.${body}`. */
function verify(secret: string, id: string, timestamp: string, body: string, header: string): boolean {
  // Secrets are issued as "whsec_<base64>"; the HMAC key is the decoded part.
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  // The header carries one or more space-separated "v1,<sig>" entries.
  return header.split(" ").some((part) => {
    const sig = part.startsWith("v1,") ? part.slice(3) : part;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/** Reject replays of a captured delivery. Svix timestamps are unix seconds. */
function fresh(timestamp: string, toleranceSeconds = 300): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(Date.now() / 1000 - ts) <= toleranceSeconds;
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ ok: false, error: "unsigned" }, { status: 401 });
  }

  const raw = await req.text();
  if (!fresh(timestamp) || !verify(secret, id, timestamp, raw, signature)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: { to?: string | string[]; subject?: string; click?: { link?: string } } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // Only a CLICK is engagement. Opens (and delivered/bounced/complained) are
  // acknowledged and dropped — an open is not interest and forwarding it just
  // creates notification noise on the contact.
  if (payload.type !== "email.clicked") {
    return NextResponse.json({ ok: true, ignored: payload.type ?? "unknown" });
  }

  // Drop navigation clicks that aren't interest in the property: the agent-alert
  // "Open in Follow Up Boss" button (a followupboss.com link the agent taps) and
  // the unsubscribe link (handled by its own route).
  const link = (payload.data?.click?.link ?? "").trim();
  if (/followupboss\.com/i.test(link) || /\/api\/dashboard\/unsubscribe/i.test(link)) {
    return NextResponse.json({ ok: true, ignored: "navigation click" });
  }

  const to = payload.data?.to;
  const email = (Array.isArray(to) ? to[0] : to)?.trim();
  if (!email) return NextResponse.json({ ok: true, skipped: "no recipient" });

  // FUB resolves the person from the email, so no local lookup is needed.
  const detail = [
    payload.data?.subject ? `Email: ${payload.data.subject}` : "",
    link ? `Clicked: ${link}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendHomeownerActivity("email-click", { email }, detail || undefined);
  // Always 200 on a verified delivery: a non-2xx makes Resend retry, and a CRM
  // outage should not turn into a redelivery storm.
  return NextResponse.json({ ok: true, forwarded: result.sent, reason: result.reason });
}
