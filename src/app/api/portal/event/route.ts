import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Client Portal engagement → Follow Up Boss Events API.
 *
 * Mirrors /api/lead, but every event is tagged "Client Portal" (plus a
 * per-action tag) so the team can build FUB smart lists like "portal clients
 * who saved a home this week". Like /api/lead, this degrades gracefully when
 * FUB_API_KEY isn't set — the portal keeps working, nothing is stored.
 *
 * FUB Events API: https://docs.followupboss.com/reference/events-post
 */

type EventInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  journey?: "buy" | "sell";
  action?: string;
  label?: string;
  detail?: string;
  savedCount?: number;
  completedCount?: number;
  budget?: number;
  timeline?: string;
  areas?: string[];
};

/**
 * FUB event types are a fixed vocabulary; anything unknown is rejected by the
 * API. Map our actions onto the closest supported type and keep the specifics
 * in the message body and tags.
 */
function fubType(action: string | undefined, journey: string | undefined): string {
  switch (action) {
    case "portal.saved-home":
    case "portal.saved-search":
      return "Saved Property";
    case "portal.tour-request":
      return "Property Inquiry";
    case "portal.message":
    case "portal.vendor-intro":
      return "General Inquiry";
    case "portal.start":
      return journey === "sell" ? "Seller Inquiry" : "Registration";
    default:
      return "General Inquiry";
  }
}

export async function POST(req: Request) {
  let data: EventInput | null = null;
  try {
    data = (await req.json()) as EventInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // No identity means FUB has nothing to attach the activity to.
  if (!data || (!data.email && !data.phone)) {
    return NextResponse.json({ ok: false, error: "An email or phone is required." }, { status: 400 });
  }

  const key = process.env.FUB_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, queued: false });
  }

  const journeyTag = data.journey === "sell" ? "Portal Seller" : "Portal Buyer";
  const tags = ["Client Portal", journeyTag, data.action ? `Portal: ${data.action.replace("portal.", "")}` : ""].filter(
    Boolean,
  );

  const context = [
    data.label || "Client Portal activity",
    data.detail ? `Details: ${data.detail}` : "",
    data.budget ? `Target price: $${Math.round(data.budget).toLocaleString("en-US")}` : "",
    data.timeline ? `Timeline: ${data.timeline}` : "",
    data.areas?.length ? `Focused on: ${data.areas.join(", ")}` : "",
    typeof data.savedCount === "number" ? `Saved homes: ${data.savedCount}` : "",
    typeof data.completedCount === "number" ? `Journey steps completed: ${data.completedCount}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const body = {
    source: "The Roland Team Client Portal",
    system: "The Roland Team Website",
    type: fubType(data.action, data.journey),
    message: context,
    person: {
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      emails: data.email ? [{ value: data.email }] : [],
      phones: data.phone ? [{ value: data.phone, type: "mobile" }] : [],
      tags,
    },
  };

  try {
    const res = await fetch("https://api.followupboss.com/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        "X-System": "TheRolandTeamWebsite",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ ok: false, error: `CRM error ${res.status}`, detail }, { status: 502 });
    }
    return NextResponse.json({ ok: true, queued: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach CRM." }, { status: 502 });
  }
}
