/**
 * Team roster — a Postgres mirror of the Slack workspace members, synced monthly
 * (src/app/api/cron/slack-roster-sync). Deactivated Slack accounts are the
 * "former teammates" the Referral Watch flags; active accounts are current team
 * (excluded so they never trigger). Keeps the list current as people join/leave
 * without a manual CSV re-upload.
 *
 * Falls back to the static src/content/formerAgents.ts list when no database is
 * configured or the roster hasn't been synced yet, so the Referral Watch always
 * has a list to work from.
 */
import postgres from "postgres";
import { formerAgents } from "@/content/formerAgents";

function hasDb(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL);
}

let client: ReturnType<typeof postgres> | null = null;
function sql() {
  if (!client) {
    const url = (process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_DATABASE_URL) as string;
    client = postgres(url, { max: 1, prepare: false });
  }
  return client;
}

let ready: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = sql()`
      CREATE TABLE IF NOT EXISTS team_members (
        slack_id text PRIMARY KEY,
        name text NOT NULL DEFAULT '',
        status text NOT NULL DEFAULT '',
        is_bot boolean NOT NULL DEFAULT false,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `.then(() => undefined);
  }
  return ready;
}

export type SlackMember = { id: string; name: string; status: "Active" | "Deactivated"; isBot: boolean };

/** Deactivated (former) teammate names with a first + last. Falls back to the
 * static list when no DB / not yet synced. */
export async function formerAgentNames(): Promise<string[]> {
  if (!hasDb()) return formerAgents;
  try {
    await ensureSchema();
    const rows = await sql()`SELECT name FROM team_members WHERE status = 'Deactivated' AND is_bot = false`;
    const names = rows
      .map((r) => String(r.name ?? "").trim())
      .filter((n) => n.split(/\s+/).filter(Boolean).length >= 2);
    return names.length ? names : formerAgents; // not synced yet → static seed
  } catch {
    return formerAgents;
  }
}

/** Upsert the Slack members into the roster. Returns counts. */
export async function syncRoster(members: SlackMember[]): Promise<{ total: number; deactivated: number; active: number; bots: number }> {
  const counts = {
    total: members.length,
    deactivated: members.filter((m) => m.status === "Deactivated" && !m.isBot).length,
    active: members.filter((m) => m.status === "Active" && !m.isBot).length,
    bots: members.filter((m) => m.isBot).length,
  };
  if (!hasDb() || members.length === 0) return counts;
  await ensureSchema();
  for (const m of members) {
    await sql()`
      INSERT INTO team_members (slack_id, name, status, is_bot, updated_at)
      VALUES (${m.id}, ${m.name}, ${m.status}, ${m.isBot}, now())
      ON CONFLICT (slack_id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        is_bot = EXCLUDED.is_bot,
        updated_at = now()
    `;
  }
  return counts;
}
