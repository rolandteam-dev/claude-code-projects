import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendHomeownerActivity } from "@/lib/homeowners/fubActivity";

export const runtime = "nodejs";

/**
 * Resend → Follow Up Boss: email opens and clicks.
 *
 * Opens and clicks are the earliest signal that a dormant contact is paying
 * attention again, and nothing was listening for them before this. Each one is
 * forwarded to FUB as an event on the recipient's record so it reaches the
 * agents' calling filters.
 *
 * SECURITY: this endpoint is public and writes to the CRM, so it refuses
 * everything unless RESEND_WEBHOOK_SECRET is set and the Svix signature checks
 * out. Failing closed is deliberate — an open endpoint here would let anyone
 * forge activity on any contact by posting an email address.
 *
 * Set up: Resend → Webhooks → add this URL, subscribe to email.opened and
 * email.clicked, then copy the signing secret into RESEND_WEBHOOK_SECRET.
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

  const activity =
    payload.type === "email.opened" ? "email-open" : payload.type === "email.clicked" ? "email-click" : null;
  // Every other Resend event (delivered, bounced, complained) is acknowledged
  // and ignored — nothing to tell an agent about.
  if (!activity) return NextResponse.json({ ok: true, ignored: payload.type ?? "unknown" });

  const to = payload.data?.to;
  const email = (Array.isArray(to) ? to[0] : to)?.trim();
  if (!email) return NextResponse.json({ ok: true, skipped: "no recipient" });

  // FUB resolves the person from the email, so no local lookup is needed.
  const detail = [
    payload.data?.subject ? `Email: ${payload.data.subject}` : "",
    payload.data?.click?.link ? `Clicked: ${payload.data.click.link}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendHomeownerActivity(activity, { email }, detail || undefined);
  // Always 200 on a verified delivery: a non-2xx makes Resend retry, and a CRM
  // outage should not turn into a redelivery storm.
  return NextResponse.json({ ok: true, forwarded: result.sent, reason: result.reason });
}
