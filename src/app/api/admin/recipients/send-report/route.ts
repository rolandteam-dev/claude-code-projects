import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { sendValueEmail } from "@/lib/homeowners/email";
import { valueHome } from "@/lib/homeowners/nvValue";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Admin one-click "Send report" for a single homeowner (the Recipients table
 * button). Refreshes their value estimate, then sends the home-value email — the
 * same work one iteration of the digest does, on demand, for the one contact.
 *
 * ADMIN_TOKEN-gated. Requires HOMEOWNER_EMAIL_ENABLED="true" to actually send,
 * and refuses an unsubscribed contact (Re-add them first) so a manual click can
 * never override an opt-out.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!process.env.ADMIN_TOKEN || url.searchParams.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  if (!token) return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });

  if (process.env.HOMEOWNER_EMAIL_ENABLED !== "true") {
    return NextResponse.json({ ok: false, error: "sending is disabled (HOMEOWNER_EMAIL_ENABLED)" }, { status: 200 });
  }

  const store = homeownerStore();
  const h = await store.getByToken(token);
  if (!h) return NextResponse.json({ ok: false, error: "contact not found" }, { status: 404 });
  if (!h.subscribed) {
    return NextResponse.json({ ok: false, error: "contact is unsubscribed — Re-add them first" }, { status: 200 });
  }

  try {
    // Refresh the estimate so the report carries a current number (as the digest does).
    const { estimate, facts } = await valueHome(h);
    if (facts) await store.updateFacts(h.token, facts);
    if (estimate) {
      await store.addEstimate(h.token, estimate);
      h.estimates.push(estimate);
    }
    const r = await sendValueEmail(h);
    if (r.sent) {
      await store.markEmailed(h.token);
      return NextResponse.json({ ok: true, sent: true, to: h.email });
    }
    return NextResponse.json({ ok: false, error: r.reason ?? "send failed" }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
