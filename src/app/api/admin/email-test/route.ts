import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/homeowners/email";
import type { Homeowner } from "@/lib/homeowners/store";

export const runtime = "nodejs";

/**
 * Admin test-send (ADMIN_TOKEN-gated): sends ONE welcome email to a chosen
 * address so you can confirm the pipeline end to end — Resend key, verified
 * sending domain, and the template — before anything goes to a real contact.
 *
 * Nothing is stored and no contact is touched: it builds a throwaway homeowner
 * and mails it to whatever ?to= you pass (send it to yourself).
 *
 * Usage: /api/admin/email-test?key=ADMIN_TOKEN&to=you@example.com
 *
 * If it returns {"sent": false}, the "reason" tells you why:
 *  - "sending disabled ..."  → HOMEOWNER_EMAIL_ENABLED isn't "true" yet
 *  - "email not configured"  → RESEND_API_KEY or HOMEOWNER_FROM_EMAIL missing
 *  - a Resend error string   → usually the sending domain isn't verified yet
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const to = (params.get("to") ?? "").trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "provide a valid ?to= email address" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const sample: Homeowner = {
    id: "email-test",
    token: "email-test",
    firstName: (params.get("firstName") ?? "there").trim() || "there",
    lastName: "",
    email: to,
    address: "123 Test Ln",
    city: "Henderson",
    state: "NV",
    zip: "89052",
    subscribed: true,
    source: "email-test",
    createdAt: now,
    updatedAt: now,
    estimates: [{ date: now.slice(0, 10), value: 675000, low: 640000, high: 710000 }],
    views: [],
  };

  const result = await sendWelcomeEmail(sample);
  return NextResponse.json({
    ok: result.sent,
    to,
    from: process.env.HOMEOWNER_FROM_EMAIL ?? null,
    emailEnabled: process.env.HOMEOWNER_EMAIL_ENABLED === "true",
    ...result,
  });
}
