import { NextResponse } from "next/server";
import { ingestHomeowner, type IngestInput } from "@/lib/homeowners/ingest";
import { sendWelcomeEmail } from "@/lib/homeowners/email";

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
    // Best-effort welcome email; never fail the request if email isn't configured.
    const email = await sendWelcomeEmail(homeowner);
    return NextResponse.json({ ok: true, token, url, emailed: email.sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
