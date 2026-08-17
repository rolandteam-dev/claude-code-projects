import { NextResponse } from "next/server";
import { normalizeEventType, postFubEvent, splitName, type FubEventType, type FubProperty } from "@/lib/fub";

export const runtime = "nodejs";

/**
 * Behavior → Follow Up Boss.
 *
 * This is the endpoint that makes the concierge "aggressive" on the CRM side.
 * When a visitor we can already identify (they've filled in any form on the
 * site before, in this browser) starts behaving like a buyer — opening homes,
 * lingering on one, coming back a second day, accepting a tour offer — we push
 * that moment into FUB as a real event on their contact record.
 *
 * What that gets Mike:
 *  - `hot-lead` / `tour-request` land as Property Inquiry (or General Inquiry
 *    with no property attached) → these are the types FUB fires action plans
 *    and automations on, so agent alerts and AI texting kick off immediately.
 *  - `viewed-property` / `property-search` land as Viewed Property / Property
 *    Search → timeline + smart-list fuel, without faking a new inquiry.
 *
 * An anonymous visitor can't be pushed anywhere — there's no contact record to
 * attach to — so we answer `{ ok: true, queued: false, reason: "unidentified" }`
 * and the widget asks for a name and number first.
 */

type IntentEvent = "hot-lead" | "tour-request" | "viewed-property" | "property-search" | "seller-inquiry";

type IntentInput = {
  event?: IntentEvent;
  person?: { name?: string; firstName?: string; lastName?: string; email?: string; phone?: string };
  property?: FubProperty;
  message?: string;
  tags?: string[];
  source?: string;
  /** page the visitor was on when this fired, for the CRM note */
  url?: string;
};

/** Only the first two start automations — that's the point of splitting them. */
const EVENT_TYPES: Record<IntentEvent, FubEventType | "auto"> = {
  "hot-lead": "auto", // Property Inquiry when a home is attached, else General Inquiry
  "tour-request": "auto",
  "seller-inquiry": "Seller Inquiry",
  "viewed-property": "Viewed Property",
  "property-search": "Property Search",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  let data: IntentInput | null = null;
  try {
    data = (await req.json()) as IntentInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers: CORS });
  }

  const event = data?.event;
  if (!event || !(event in EVENT_TYPES)) {
    return NextResponse.json({ ok: false, error: "Unknown event." }, { status: 400, headers: CORS });
  }

  const person = data?.person ?? {};
  const email = person.email?.trim();
  const phone = person.phone?.trim();
  if (!email && !phone) {
    // Nothing to attach to in the CRM — the widget takes it from here.
    return NextResponse.json({ ok: true, queued: false, reason: "unidentified" }, { headers: CORS });
  }

  const property = data?.property && Object.keys(data.property).length ? data.property : undefined;
  const configured = EVENT_TYPES[event];
  const type =
    configured === "auto" ? normalizeEventType(undefined, Boolean(property)).type : configured;

  let firstName = person.firstName?.trim();
  let lastName = person.lastName?.trim();
  if (!firstName && !lastName && person.name) {
    const split = splitName(person.name);
    firstName = split.firstName;
    lastName = split.lastName;
  }

  const tags = [...new Set((data?.tags ?? []).map((t) => String(t).trim()).filter(Boolean))];

  const result = await postFubEvent({
    source: data?.source || "Roland Luxury Concierge",
    system: "Roland Luxury Website",
    type,
    message: [data?.message, data?.url ? `Page: ${data.url}` : ""].filter(Boolean).join("\n"),
    person: {
      firstName,
      lastName,
      emails: email ? [{ value: email }] : [],
      phones: phone ? [{ value: phone, type: "mobile" }] : [],
      tags,
    },
    property,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.status ? `CRM error ${result.status}` : "Could not reach CRM.", detail: result.detail },
      { status: 502, headers: CORS },
    );
  }

  return NextResponse.json({ ok: true, queued: result.queued, type }, { headers: CORS });
}
