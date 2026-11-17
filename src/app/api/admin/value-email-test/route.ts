import { NextResponse } from "next/server";
import { sendValueEmail, renderValueEmailHtml, renderValueEmailText, valueEmailSubject } from "@/lib/homeowners/email";
import type { Homeowner } from "@/lib/homeowners/store";

export const runtime = "nodejs";

/**
 * Admin test of the VALUE email — the periodic "your home value update" (the
 * sibling of email-test, which sends the welcome). ADMIN_TOKEN-gated.
 *
 *  - ?preview=1  → renders the exact email HTML inline (no send). Works even when
 *                  HOMEOWNER_EMAIL_ENABLED is off, so you can always eyeball it.
 *  - ?to=you@x   → sends ONE live value email to that address only. Nothing is
 *                  stored and no contact is touched. It only actually sends when
 *                  HOMEOWNER_EMAIL_ENABLED === "true"; the JSON reports
 *                  `emailEnabled` either way, so this doubles as a flag check.
 *
 * Usage:
 *   /api/admin/value-email-test?key=ADMIN_TOKEN&preview=1
 *   /api/admin/value-email-test?key=ADMIN_TOKEN&to=you@example.com
 *
 * The sample carries two estimates so the "up $X since we started tracking"
 * movement line (and the change-led subject) render the way a real email would.
 */
function sample(params: URLSearchParams): Homeowner {
  const now = new Date();
  const iso = now.toISOString();
  const older = new Date(now.getTime() - 120 * 86_400_000).toISOString().slice(0, 10);
  return {
    id: "value-email-test",
    token: "value-email-test",
    firstName: (params.get("firstName") ?? "Mike").trim() || "Mike",
    lastName: "",
    email: (params.get("to") ?? "preview@example.com").trim(),
    address: (params.get("address") ?? "2412 Grassy Spring Pl").trim() || "2412 Grassy Spring Pl",
    city: (params.get("city") ?? "Henderson").trim() || "Henderson",
    state: "NV",
    zip: (params.get("zip") ?? "89052").trim() || "89052",
    subscribed: true,
    source: "value-email-test",
    createdAt: iso,
    updatedAt: iso,
    estimates: [
      { date: older, value: 648000, low: 615000, high: 681000 },
      { date: iso.slice(0, 10), value: 662500, low: 629000, high: 696000 },
    ],
    views: [],
  };
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Preview: render the real template, no send, no flag required.
  if (params.get("preview") === "1") {
    return new NextResponse(renderValueEmailHtml(sample(params)), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Plain-text preview — the text/plain alternative shipped with every send.
  if (params.get("text") === "1") {
    return new NextResponse(renderValueEmailText(sample(params)), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const to = (params.get("to") ?? "").trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json(
      { ok: false, error: "add ?preview=1 to view it, or a valid ?to= to send a live sample" },
      { status: 400 },
    );
  }

  const h = sample(params);
  const result = await sendValueEmail(h);
  return NextResponse.json({
    ok: result.sent,
    to,
    from: process.env.HOMEOWNER_FROM_EMAIL ?? "Mike Roland <mike@therolandteam.com> (default)",
    subject: valueEmailSubject(h),
    emailEnabled: process.env.HOMEOWNER_EMAIL_ENABLED === "true",
    ...result,
  });
}
