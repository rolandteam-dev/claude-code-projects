import { NextResponse } from "next/server";
import { ingestHomeowner } from "@/lib/homeowners/ingest";
import { sendWelcomeEmail } from "@/lib/homeowners/email";

export const runtime = "nodejs";

/**
 * Admin: create (or refresh) a single homeowner + return their dashboard link,
 * and optionally send the welcome email. For seeding a test contact (e.g. an
 * agent's own home) without going through the public funnel. ADMIN_TOKEN-gated.
 *
 * Usage:
 *   /api/admin/seed-homeowner?key=ADMIN_TOKEN&firstName=Bruce&email=bruce@x.com
 *      &address=123 Main St&city=Henderson&state=NV&zip=89052
 *   Add &email=0 style? No — email is required. Add &sendEmail=0 to skip the
 *   welcome email (just get the link back).
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || p.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const email = (p.get("email") ?? "").trim();
  const address = (p.get("address") ?? "").trim();
  if (!email || !address) {
    return NextResponse.json({ ok: false, error: "email and address are required" }, { status: 400 });
  }

  try {
    const { token, url, homeowner } = await ingestHomeowner({
      firstName: p.get("firstName") ?? undefined,
      lastName: p.get("lastName") ?? undefined,
      email,
      phone: p.get("phone") ?? undefined,
      address,
      city: p.get("city") ?? undefined,
      state: p.get("state") ?? "NV",
      zip: p.get("zip") ?? undefined,
      source: p.get("source") ?? "admin-test",
    });

    let emailed: { sent: boolean; reason?: string } = { sent: false, reason: "skipped" };
    if (p.get("sendEmail") !== "0") emailed = await sendWelcomeEmail(homeowner);

    return NextResponse.json({
      ok: true,
      token,
      url,
      emailed,
      valued: homeowner.estimates.length > 0,
      note: emailed.sent
        ? "Created + welcome email sent."
        : `Created. Welcome email not sent (${emailed.reason ?? "unknown"}). Open the url to view the dashboard.`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
