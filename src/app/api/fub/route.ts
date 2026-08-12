import { NextResponse } from "next/server";
import { addTag, sendEvent, type FubProperty } from "@/lib/fub";

export const runtime = "nodejs";

const ALLOWED_EVENTS = ["Viewed Property", "Saved Property"];
const ALLOWED_TAGS = ["lux_hot_repeat", "lux_reengaged", "lux_chatbot"];

type FubRequestBody = {
  action?: string;
  email?: string;
  type?: string;
  tag?: string;
  property?: FubProperty;
};

/**
* Same-origin bridge from client-side signals to the Follow Up Boss API.
* FUB_API_KEY (in lib/fub.ts) never reaches the browser -- only this route
* calls it, and only on this server.
*/
export async function POST(req: Request) {
  let body: FubRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    // No identified visitor -- the base FUB tracking pixel already covers
  // anonymous browsing, so there is nothing to send here.
  return NextResponse.json({ ok: true, skipped: "no email" });
  }

try {
  if (body.action === "event") {
    if (!body.type || !ALLOWED_EVENTS.includes(body.type)) {
      return NextResponse.json({ ok: false, error: "Unsupported event type" }, { status: 400 });
    }
    await sendEvent(body.type, email, body.property);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "tag") {
    if (!body.tag || !ALLOWED_TAGS.includes(body.tag)) {
      return NextResponse.json({ ok: false, error: "Unsupported tag" }, { status: 400 });
    }
    await addTag(email, body.tag);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : "Unknown error";
  return NextResponse.json({ ok: false, error: message }, { status: 502 });
}
}
