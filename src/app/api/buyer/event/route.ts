import { NextResponse } from "next/server";
import { openIdentity } from "@/lib/buyer/identity";
import { sendBuyerActivity, type BuyerActivity, type PropertyRef } from "@/lib/buyer/activity";

export const runtime = "nodejs";

/**
 * Browser → Follow Up Boss bridge for buyer activity.
 *
 * WHO the visitor is never comes from the request body. The browser sends the
 * sealed token it picked up from a campaign link, and only this server can open
 * it — so a caller cannot claim to be someone else by posting their email.
 * The one exception is a portal client, whose email we already hold because
 * they typed it into the hub themselves; that arrives as `portalEmail` and is
 * used only when no sealed token is present.
 *
 * Anonymous visitors send nothing and get nothing written — the FUB tracking
 * pixel already covers anonymous browsing.
 */

const ALLOWED: BuyerActivity[] = ["viewed-property", "saved-property", "repeat-interest"];

type Body = {
  /** Sealed identity from a campaign link (?c=). Authoritative. */
  token?: string;
  /** Email the visitor gave us themselves in the portal. Fallback only. */
  portalEmail?: string;
  activity?: string;
  property?: PropertyRef;
};

/** Trust the sealed token first; fall back to a self-supplied portal email. */
function identify(body: Body): string | null {
  const sealed = openIdentity(body.token);
  if (sealed) return sealed;
  const portal = body.portalEmail?.trim().toLowerCase();
  if (portal && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(portal)) return portal;
  return null;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }

  const activity = body.activity as BuyerActivity | undefined;
  if (!activity || !ALLOWED.includes(activity)) {
    return NextResponse.json({ ok: false, error: "unsupported activity" }, { status: 400 });
  }

  const email = identify(body);
  // No identity: nothing to attach an event to. Not an error — most visitors
  // are anonymous, and the pixel already covers them.
  if (!email) return NextResponse.json({ ok: true, skipped: "anonymous" });

  const result = await sendBuyerActivity(activity, email, body.property);
  return NextResponse.json({ ok: true, sent: result.sent, reason: result.reason });
}
