import { NextResponse } from "next/server";
import { sendFubLead } from "@/lib/fub";
import { ingestHomeowner } from "@/lib/homeowners/ingest";
import { sendCashOfferEmail } from "@/lib/homeowners/email";

export const runtime = "nodejs";

/**
 * Cash Offer request intake. Three things happen, each best-effort and
 * independently env-gated so one missing key never breaks the others:
 *   1. Drop a tagged seller lead into Follow Up Boss.
 *   2. Track the homeowner (creates their value dashboard for ongoing nurture).
 *   3. Send an acknowledgement email with next steps.
 * Returns ok as long as the request was well-formed; the UI shows a thank-you.
 */
type Input = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  timeframe?: string;
  condition?: string;
};

export async function POST(req: Request) {
  let d: Input;
  try {
    d = (await req.json()) as Input;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!d.address || (!d.email && !d.phone)) {
    return NextResponse.json({ ok: false, error: "An address and an email or phone are required." }, { status: 400 });
  }

  const fullAddress = [d.address, d.city, d.state, d.zip].filter(Boolean).join(", ");
  const detail = [
    "Cash offer request from the website.",
    d.timeframe ? `Timeframe: ${d.timeframe}` : "",
    d.condition ? `Condition: ${d.condition}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // 1. CRM lead
  await sendFubLead({
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    address: d.address,
    city: d.city,
    state: d.state,
    zip: d.zip,
    type: "Seller Inquiry",
    source: "Cash Offer Request",
    tags: ["Seller Lead", "Cash Offer"],
    message: detail,
  });

  // 2. Track the homeowner (best-effort; needs an email to create a dashboard)
  if (d.email) {
    try {
      await ingestHomeowner({
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        address: d.address,
        city: d.city,
        state: d.state,
        zip: d.zip,
        source: "cash-offer",
      });
    } catch {
      // non-fatal
    }
    // 3. Acknowledgement email
    await sendCashOfferEmail({ email: d.email, firstName: d.firstName, address: fullAddress });
  }

  return NextResponse.json({ ok: true });
}
