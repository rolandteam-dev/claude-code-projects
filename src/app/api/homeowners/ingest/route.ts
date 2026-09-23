import { NextResponse } from "next/server";
import { ingestHomeowner, type IngestInput } from "@/lib/homeowners/ingest";
import { sendWelcomeEmail } from "@/lib/homeowners/email";
import { sendHomeownerActivity } from "@/lib/homeowners/fubActivity";
import { notifyAssignedAgent } from "@/lib/homeowners/agentAlert";

export const runtime = "nodejs";

/**
 * Create (or refresh) a homeowner record and return their private dashboard
 * link. This is the funnel the public estimator calls when a homeowner opts to
 * "track" their home: we store them, seed the value they just saw, send a
 * welcome email with the dashboard link, and hand the link back to the UI.
 * Email + address are required.
 */
export async function POST(req: Request) {
  let d: IngestInput;
  try {
    d = (await req.json()) as IngestInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!d.email || !d.address) {
    return NextResponse.json({ ok: false, error: "email and address are required" }, { status: 400 });
  }

  try {
    const { token, url, homeowner } = await ingestHomeowner(d);
    // The request itself is the seller signal — it must reach the CRM even when
    // email is switched off, which is why this is not tied to the send above.
    await sendHomeownerActivity("home-value-request", homeowner);
    // Speed-to-lead: a brand-new home-value signup is a strong seller signal —
    // alert the assigned agent (or team fallback) directly. force:true because
    // the signup's own tags aren't in the hot-click set. Off unless enabled.
    try {
      await notifyAssignedAgent(
        {
          firstName: homeowner.firstName,
          lastName: homeowner.lastName,
          email: homeowner.email,
          phone: homeowner.phone,
          address: `${homeowner.address}, ${homeowner.city}, ${homeowner.state} ${homeowner.zip}`.trim(),
          type: "Seller Inquiry",
          tags: ["Home Value Request"],
          message: "Just requested their home value on the dashboard — brand-new lead. Call fast.",
        },
        { force: true, signal: "New Home-Value Lead" },
      );
    } catch {
      // never fail the signup on the alert
    }
    // Best-effort welcome email; never fail the request if email isn't configured.
    const email = await sendWelcomeEmail(homeowner);
    return NextResponse.json({ ok: true, token, url, emailed: email.sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
