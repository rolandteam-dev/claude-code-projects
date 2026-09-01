/**
 * Portal roster — the team's portal clients, read from Follow Up Boss.
 *
 * Server-only: it uses FUB_API_KEY and is called from the internal Seller
 * Radar-style dashboard at /admin/clients. The CRM is the source of truth, so
 * nothing about a client is stored on our side.
 */

type FubPerson = {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  stage?: string;
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
  lastActivity: string | null;
  /** Days since the last recorded activity — the "gone quiet" signal. */
  quietDays: number | null;
  fubUrl: string | null;
};

export type RosterResult =
  /** configured:false means no FUB key yet — the dashboard shows setup help. */
  { ok: true; configured: boolean; clients: RosterClient[] } | { ok: false; error: string };

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

function toRoster(p: FubPerson): RosterClient {
  const tags = p.tags ?? [];
  const last = p.lastActivity ?? p.updated ?? null;
  return {
    id: p.id ?? null,
    name: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || "Unnamed contact",
    email: p.emails?.[0]?.value ?? "",
    phone: p.phones?.[0]?.value ?? "",
    stage: p.stage ?? "",
    journey: tags.includes("Portal Seller") ? "sell" : tags.includes("Portal Buyer") ? "buy" : "unknown",
    assignedTo: p.assignedTo ?? "",
    lastActivity: last,
    quietDays: daysSince(last),
    fubUrl: p.id ? `https://app.followupboss.com/2/people/view/${p.id}` : null,
  };
}

/** Everyone tagged "Client Portal" in FUB, most-recently-updated first. */
export async function portalRoster(): Promise<RosterResult> {
  const key = process.env.FUB_API_KEY;
  if (!key) return { ok: true, configured: false, clients: [] };

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
    if (!res.ok) return { ok: false, error: `Follow Up Boss returned ${res.status}.` };
    const json = (await res.json()) as { people?: FubPerson[] };
    return { ok: true, configured: true, clients: (json.people ?? []).map(toRoster) };
  } catch {
    return { ok: false, error: "Could not reach Follow Up Boss." };
  }
}
