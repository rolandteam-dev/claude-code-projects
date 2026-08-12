import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Follow Up Boss (FUB) Events API proxy for "Viewed Property" / "Saved
 * Property" tracking. This is the ONLY place in the app that talks to
 * api.followupboss.com for these events — the browser only ever calls this
 * same-origin route, and FUB_API_KEY is read server-side and never sent to
 * the client.
 *
 * Set FUB_API_KEY in Vercel → Project → Settings → Environment Variables
 * (Admin → API in Follow Up Boss). Until it's set, this route responds
 * gracefully without sending anything, so the UI never breaks.
 *
 * FUB Events API: https://docs.followupboss.com/reference/events-post
 */

const FUB_API_KEY = process.env.FUB_API_KEY;
const SOURCE = "rolandluxury.com";
const SYSTEM = "RolandLuxury";
const ALLOWED_TYPES = ["Viewed Property", "Saved Property"] as const;
type FubEventType = (typeof ALLOWED_TYPES)[number];

type FubPerson = {
    name?: string;
    emails: string[];
    phones?: string[];
};

type FubProperty = {
    street?: string;
    city?: string;
    state?: string;
    code?: string;
    mlsNumber?: string;
    price?: number;
    forRent?: boolean;
    url?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    lot?: number;
    type?: string;
};

type FubEventRequest = {
    type?: string;
    person?: FubPerson;
    property?: FubProperty;
};

export async function POST(req: NextRequest) {
    if (!FUB_API_KEY) {
          // CRM not configured yet — don't break the UX; the owner adds the key in Vercel.
      return NextResponse.json({ ok: false, error: "Missing FUB_API_KEY" }, { status: 500 });
    }

  let body: FubEventRequest | null = null;
    try {
          body = (await req.json()) as FubEventRequest;
    } catch {
          return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

  const { type, person, property } = body ?? {};

  if (!type || !ALLOWED_TYPES.includes(type as FubEventType)) {
        return NextResponse.json({ ok: false, error: "Unsupported event type" }, { status: 400 });
  }

  // Require an identified email so FUB can match this event to a contact.
  // Anonymous visits are already covered by the base FUB tracking pixel, so
  // we intentionally skip (not error) rather than send an unmatchable event.
  if (!person?.emails?.length) {
        return NextResponse.json({ ok: true, skipped: "no identified email" }, { status: 200 });
  }

  try {
        const res = await fetch("https://api.followupboss.com/v1/events", {
                method: "POST",
                headers: {
                          "Content-Type": "application/json",
                          Authorization: "Basic " + Buffer.from(`${FUB_API_KEY}:`).toString("base64"),
                },
                body: JSON.stringify({ source: SOURCE, system: SYSTEM, type, person, property }),
        });

      if (!res.ok) {
              const detail = await res.text().catch(() => "");
              return NextResponse.json({ ok: false, error: `FUB error ${res.status}`, detail: detail.slice(0, 300) }, { status: res.status });
      }

      return NextResponse.json({ ok: true });
  } catch {
        return NextResponse.json({ ok: false, error: "Could not reach CRM." }, { status: 502 });
  }
}
