import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lead intake → Follow Up Boss (FUB) Events API.
 *
 * To go live, set these in Vercel → Settings → Environment Variables:
 *   FUB_API_KEY     (required) — Follow Up Boss → Admin → API → your API key
 *   FUB_SYSTEM_KEY  (optional) — the X-System-Key from registering this site
 *                                as a system with FUB (recommended by FUB for
 *                                registered integrations; improves lead
 *                                attribution + avoids partner rate limits)
 *   FUB_SYSTEM      (optional) — the X-System name; defaults below
 *
 * Until FUB_API_KEY is present the endpoint accepts submissions gracefully
 * (queued:false) so the site's forms still work; no lead is stored until the
 * key is set.
 *
 * FUB Events API: https://docs.followupboss.com/reference/events-post
 */

// Identifies this website to Follow Up Boss. Override with FUB_SYSTEM if you
// register a different system name with FUB.
const DEFAULT_SYSTEM = "TheRolandTeamWebsite";
type LeadInput = {
  firstName?: string;
  lastName?: string;
  name?: string; // legacy single-field fallback
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
  type?: string; // e.g. "General Inquiry", "Seller Inquiry", "Property Inquiry"
  tag?: string;
  source?: string;
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

  const key = process.env.FUB_API_KEY;
  if (!key) {
    // CRM not configured yet — don't break the UX; Mike adds the key in Vercel.
    return NextResponse.json({ ok: true, queued: false }, { headers: CORS });
  }

  // Prefer explicit first/last fields; fall back to splitting a single name.
  let firstName = (data.firstName ?? "").trim();
  let lastName = (data.lastName ?? "").trim();
  if (!firstName && !lastName && data.name) {
    const parts = data.name.trim().split(/\s+/);
    firstName = parts[0] ?? "";
    lastName = parts.slice(1).join(" ");
  }

  const body = {
    source: data.source || "Luxury Website",
    system: "Roland Luxury Website",
    type: data.type || "General Inquiry",
    message: [data.address ? `Property: ${data.address}` : "", data.message || ""].filter(Boolean).join("\n"),
    person: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      emails: data.email ? [{ value: data.email }] : [],
      phones: data.phone ? [{ value: data.phone, type: "mobile" }] : [],
      tags: data.tag ? [data.tag] : [],
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
    "X-System": process.env.FUB_SYSTEM || DEFAULT_SYSTEM,
  };
  // FUB recommends sending X-System-Key for registered integrations. Only send
  // it when configured so a plain personal API key still works out of the box.
  if (process.env.FUB_SYSTEM_KEY) {
    headers["X-System-Key"] = process.env.FUB_SYSTEM_KEY;
  }

  try {
    const res = await fetch("https://api.followupboss.com/v1/events", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ ok: false, error: `CRM error ${res.status}`, detail }, { status: 502, headers: CORS });
    }
    return NextResponse.json({ ok: true, queued: true }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach CRM." }, { status: 502, headers: CORS });
  }
}
