import { NextResponse } from "next/server";
import { normalizeEventType, postFubEvent, splitName, type FubProperty } from "@/lib/fub";

export const runtime = "nodejs";

/**
 * Lead intake → Follow Up Boss (FUB) Events API.
 * Set FUB_API_KEY in Vercel → Settings → Environment Variables to go live.
 * Until then the endpoint accepts submissions gracefully (queued:false) so
 * the site's forms still work; no lead is stored until the key is present.
 *
 * Event types are normalized in `@/lib/fub` — FUB rejects anything outside its
 * fixed list, and only a few types start action plans / AI texting.
 *
 * FUB Events API: https://docs.followupboss.com/reference/events-post
 */
type LeadInput = {
  firstName?: string;
  lastName?: string;
  name?: string; // legacy single-field fallback
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
  type?: string; // e.g. "General Inquiry", "Seller Inquiry", "Property Inquiry"
  tag?: string; // single tag (back-compat)
  tags?: string[] | string; // one or more tags (array or comma-separated)
  source?: string;
  /** structured listing details, so the lead lands on the right home in FUB */
  property?: FubProperty;
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
  let data: LeadInput | null = null;
  try {
    data = (await req.json()) as LeadInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers: CORS });
  }

  if (!data || (!data.email && !data.phone)) {
    return NextResponse.json({ ok: false, error: "An email or phone is required." }, { status: 400, headers: CORS });
  }

  // Prefer explicit first/last fields; fall back to splitting a single name.
  let firstName = (data.firstName ?? "").trim();
  let lastName = (data.lastName ?? "").trim();
  if (!firstName && !lastName && data.name) {
    const split = splitName(data.name);
    firstName = split.firstName ?? "";
    lastName = split.lastName ?? "";
  }

  const address = data.address?.trim();
  const property = data.property && Object.keys(data.property).length ? data.property : undefined;
  const { type, keptAsTag } = normalizeEventType(data.type, Boolean(property || address));

  // Merge single `tag` and/or `tags` (array or comma-separated) into a unique
  // list, keeping any intent label FUB itself won't accept as an event type.
  const rawTags = [
    ...(Array.isArray(data.tags) ? data.tags : typeof data.tags === "string" ? data.tags.split(",") : []),
    ...(data.tag ? [data.tag] : []),
    ...(keptAsTag ? [keptAsTag] : []),
  ].map((t) => String(t).trim());
  const tags = [...new Set(rawTags.filter(Boolean))];

  const result = await postFubEvent({
    source: data.source || "Luxury Website",
    system: "Roland Luxury Website",
    type,
    message: [address ? `Property address: ${address}` : "", data.message || ""].filter(Boolean).join("\n"),
    person: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      emails: data.email ? [{ value: data.email }] : [],
      phones: data.phone ? [{ value: data.phone, type: "mobile" }] : [],
      // Structured address so it lands in FUB's address field (not just notes).
      addresses: address ? [{ type: "home", street: address }] : undefined,
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

  return NextResponse.json({ ok: true, queued: result.queued }, { headers: CORS });
}
