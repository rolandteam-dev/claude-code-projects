import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

/**
 * Internal agent console → Follow Up Boss people.
 *
 * Returns the team's portal clients and their latest activity so /agent can
 * show a live roster instead of a static page.
 *
 * Security note, deliberately: the page shell at /agent is public static HTML
 * (this site has no auth system). What's protected is the *data* — no client
 * record is returned without the shared passcode in TEAM_PASSCODE, which is
 * only ever checked here on the server. Treat the passcode as a shared team
 * secret, not as per-agent authentication. If per-agent access, audit logs, or
 * client-visible accounts are ever needed, that's the point to move the portal
 * onto real auth + a database.
 *
 * Env:
 *   TEAM_PASSCODE  shared passcode for the agent console (required)
 *   FUB_API_KEY    Follow Up Boss API key (already used by /api/lead)
 */

type FubPerson = {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  stage?: string;
  source?: string;
  created?: string;
  updated?: string;
  lastActivity?: string;
  tags?: string[];
  emails?: { value?: string }[];
  phones?: { value?: string }[];
  assignedTo?: string;
};

export type RosterClient = {
  id: number | null;
  name: string;
  email: string;
  phone: string;
  stage: string;
  journey: "buy" | "sell" | "unknown";
  assignedTo: string;
  tags: string[];
  lastActivity: string | null;
  /** Days since the last recorded activity — the "gone quiet" signal. */
  quietDays: number | null;
  fubUrl: string | null;
};

function passcodeOk(supplied: string | null): boolean {
  const expected = process.env.TEAM_PASSCODE;
  if (!expected || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  // Length differences leak nothing useful here, but compare in constant time
  // once the lengths match to avoid a character-by-character timing oracle.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

function toRoster(p: FubPerson): RosterClient {
  const tags = p.tags ?? [];
  const last = p.lastActivity ?? p.updated ?? null;
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || "Unnamed contact";
  return {
    id: p.id ?? null,
    name,
    email: p.emails?.[0]?.value ?? "",
    phone: p.phones?.[0]?.value ?? "",
    stage: p.stage ?? "",
    journey: tags.includes("Portal Seller") ? "sell" : tags.includes("Portal Buyer") ? "buy" : "unknown",
    assignedTo: p.assignedTo ?? "",
    tags,
    lastActivity: last,
    quietDays: daysSince(last),
    fubUrl: p.id ? `https://app.followupboss.com/2/people/view/${p.id}` : null,
  };
}

export async function POST(req: Request) {
  let passcode: string | null = null;
  try {
    const body = (await req.json()) as { passcode?: string };
    passcode = body.passcode ?? null;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!process.env.TEAM_PASSCODE) {
    return NextResponse.json(
      { ok: false, error: "The agent console isn't configured yet. Set TEAM_PASSCODE in Vercel." },
      { status: 503 },
    );
  }

  if (!passcodeOk(passcode)) {
    return NextResponse.json({ ok: false, error: "That passcode isn't right." }, { status: 401 });
  }

  const key = process.env.FUB_API_KEY;
  if (!key) {
    // Authorised, but there's no CRM to read yet — the console shows setup help.
    return NextResponse.json({ ok: true, configured: false, clients: [] as RosterClient[] });
  }

  const url = new URL("https://api.followupboss.com/v1/people");
  url.searchParams.set("tags", "Client Portal");
  url.searchParams.set("sort", "-updated");
  url.searchParams.set("limit", "100");

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        "X-System": "TheRolandTeamWebsite",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ ok: false, error: `CRM error ${res.status}`, detail }, { status: 502 });
    }
    const json = (await res.json()) as { people?: FubPerson[] };
    const clients = (json.people ?? []).map(toRoster);
    return NextResponse.json({ ok: true, configured: true, clients });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach Follow Up Boss." }, { status: 502 });
  }
}
