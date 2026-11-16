/**
 * Push the day's best Seller Engine owners into Follow Up Boss for agents to
 * call. OFF unless DISTRESS_PUSH_ENABLED === "true"; every other run is a dry
 * run that reports what it WOULD push and writes nothing.
 *
 * Safety rules baked in (see docs/seller-engine.md):
 *   - Only phones a list source marked clear of Do Not Call are sent, minus our
 *     internal do-not-call list. Unscrubbed numbers stay out unless
 *     DISTRESS_ALLOW_UNSCRUBBED === "true".
 *   - Owners already in FUB (any matching phone) are never re-created or
 *     re-assigned — they belong to whoever has them. They're marked and skipped.
 *     If that lookup fails, the owner is skipped, never pushed blind.
 *   - No email address is sent, so FUB can't start an email drip on a cold owner.
 *   - A daily cap (per agent when DISTRESS_AGENT_IDS is set) bounds volume.
 */
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";
import { loadCandidates, markExisting, markPushed, pushesToday, saveScore, type Candidate } from "./db";
import { scoreParcel, signalLabel, type ScoreResult } from "./score";

export const PUSH_SOURCE = "Seller Engine";

export type PushConfig = {
  enabled: boolean;
  agents: string[];
  perAgent: number;
  dailyCap: number;
  minScore: number;
  allowUnscrubbed: boolean;
};

function intEnv(name: string, fallback: number, max: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.trunc(n), max) : fallback;
}

export function pushConfig(): PushConfig {
  const agents = (process.env.DISTRESS_AGENT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
  const perAgent = intEnv("DISTRESS_PER_AGENT_DAILY", 7, 50);
  return {
    enabled: process.env.DISTRESS_PUSH_ENABLED === "true",
    agents,
    perAgent,
    // With agents listed, the cap is agents x per-agent; otherwise a flat cap
    // (12 agents x 7 = 84) and FUB's own lead flow does the assigning.
    dailyCap: agents.length ? agents.length * perAgent : intEnv("DISTRESS_DAILY_CAP", 84, 500),
    minScore: intEnv("DISTRESS_MIN_SCORE", 30, 1000),
    allowUnscrubbed: process.env.DISTRESS_ALLOW_UNSCRUBBED === "true",
  };
}

/** Pick the agent with the fewest pushes today who is still under the cap. */
export function pickAgent(agents: string[], byAgent: Map<string, number>, perAgent: number): string | null {
  let best: string | null = null;
  let bestN = Infinity;
  for (const a of agents) {
    const n = byAgent.get(a) ?? 0;
    if (n < perAgent && n < bestN) {
      best = a;
      bestN = n;
    }
  }
  return best;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function findExistingPerson(key: string, phones: string[]): Promise<string | null> {
  for (const phone of phones) {
    const res = await fetch(`${FUB_BASE}/v1/people?phone=${encodeURIComponent(phone)}&limit=1&fields=id`, {
      headers: fubHeaders(key),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`FUB lookup ${res.status}`);
    const data: any = await res.json();
    const id = data?.people?.[0]?.id;
    if (id) return String(id);
  }
  return null;
}

function splitName(owner: string): { firstName?: string; lastName?: string } {
  const clean = owner.replace(/\s+/g, " ").trim();
  if (!clean) return {};
  // Entity owners (trusts, LLCs) go in as the last name so nothing is invented.
  if (/\b(TRUST|LLC|INC|CORP|LP|LTD|ESTATE)\b/i.test(clean)) return { lastName: clean };
  const parts = clean.split(" ");
  if (parts.length === 1) return { lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

function noteFor(c: Candidate, r: ScoreResult): string {
  return [
    `Seller Engine score ${r.score}.`,
    `Why: ${r.reasons.join("; ")}.`,
    c.apn ? `APN ${c.apn}.` : "",
    "Cold owner from public distress lists, not an inbound lead. Call only; do not text or email unless they ask you to.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function createInFub(key: string, c: Candidate, r: ScoreResult): Promise<string | null> {
  const body = {
    source: PUSH_SOURCE,
    system: "The Roland Team Website",
    type: "Seller Inquiry",
    message: noteFor(c, r),
    person: {
      ...splitName(c.ownerName),
      phones: c.callable.map((value) => ({ value, type: "mobile" })),
      addresses: c.address
        ? [{ type: "home", street: c.address, city: c.city, state: "NV", code: c.zip || undefined }]
        : undefined,
      tags: [PUSH_SOURCE, ...r.lists.map((t) => `SE: ${signalLabel(t)}`)],
    },
  };
  const res = await fetch(`${FUB_BASE}/v1/events`, {
    method: "POST",
    headers: fubHeaders(key, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`FUB event ${res.status}`);
  const data: any = await res.json().catch(() => null);
  return data?.id ? String(data.id) : null;
}

async function assignInFub(key: string, personId: string, userId: string): Promise<void> {
  const res = await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(personId)}`, {
    method: "PUT",
    headers: fubHeaders(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ assignedUserId: Number(userId) }),
  });
  if (!res.ok) throw new Error(`FUB assign ${res.status}`);
}

export type PushItem = {
  address: string;
  city: string;
  score: number;
  reasons: string[];
  phones: number;
  outcome: "pushed" | "would-push" | "existing-contact" | "error";
  assignedUserId?: string | null;
  error?: string;
};

export type PushReport = {
  dryRun: boolean;
  config: Omit<PushConfig, "agents"> & { agents: number };
  alreadyToday: number;
  remainingToday: number;
  considered: number;
  qualified: number;
  items: PushItem[];
  stoppedEarly?: string;
};

export async function runPush(opts: { send: boolean; deadlineMs?: number }): Promise<PushReport> {
  const cfg = pushConfig();
  const dryRun = !(opts.send && cfg.enabled);
  const fubKey = process.env.FUB_API_KEY;
  const started = Date.now();
  const deadline = opts.deadlineMs ?? 240_000;

  const today = await pushesToday();
  const remaining = Math.max(0, cfg.dailyCap - today.total);
  const report: PushReport = {
    dryRun,
    config: { ...cfg, agents: cfg.agents.length },
    alreadyToday: today.total,
    remainingToday: remaining,
    considered: 0,
    qualified: 0,
    items: [],
  };
  if (!dryRun && !fubKey) {
    report.stoppedEarly = "FUB_API_KEY is not set";
    return report;
  }

  // Pull more than we need: some will age out, fall under the bar or be existing contacts.
  const candidates = await loadCandidates({ allowUnscrubbed: cfg.allowUnscrubbed, limit: Math.max(200, remaining * 4) });
  report.considered = candidates.length;

  const scored = candidates
    .map((c) => ({ c, r: scoreParcel(c.signals, c.facts) }))
    .filter(({ r }) => !r.excluded && r.score >= cfg.minScore)
    .sort((a, b) => b.r.score - a.r.score);
  report.qualified = scored.length;

  const byAgent = new Map(today.byAgent);
  let budget = dryRun ? Math.min(remaining || cfg.dailyCap, cfg.dailyCap) : remaining;

  for (const { c, r } of scored) {
    if (budget <= 0) break;
    if (Date.now() - started > deadline) {
      report.stoppedEarly = "time limit; the next run continues";
      break;
    }
    const item: PushItem = {
      address: c.address,
      city: c.city,
      score: r.score,
      reasons: r.reasons,
      phones: c.callable.length,
      outcome: "would-push",
    };

    if (dryRun) {
      report.items.push(item);
      budget--;
      continue;
    }

    try {
      await saveScore(c.parcelKey, r.score, r.reasons);
      const existing = await findExistingPerson(fubKey as string, c.callable);
      if (existing) {
        await markExisting(c.parcelKey, existing);
        report.items.push({ ...item, outcome: "existing-contact" });
        continue; // doesn't use budget
      }
      let agent: string | null = null;
      if (cfg.agents.length) {
        agent = pickAgent(cfg.agents, byAgent, cfg.perAgent);
        if (!agent) break; // every agent is full for today
      }
      const personId = await createInFub(fubKey as string, c, r);
      // The person now exists in FUB: record the push before anything else can
      // fail, so a retry never creates them twice.
      let assigned: string | null = null;
      let assignError: string | undefined;
      if (agent && personId) {
        try {
          await assignInFub(fubKey as string, personId, agent);
          assigned = agent;
        } catch (e) {
          assignError = `created but not assigned: ${e instanceof Error ? e.message : String(e)}`;
        }
        // Count the slot either way so one agent can't be skipped into overload.
        byAgent.set(agent, (byAgent.get(agent) ?? 0) + 1);
      }
      await markPushed(c.parcelKey, r.score, personId, assigned);
      report.items.push({ ...item, outcome: "pushed", assignedUserId: assigned, error: assignError });
      budget--;
    } catch (e) {
      report.items.push({ ...item, outcome: "error", error: String(e instanceof Error ? e.message : e) });
    }
  }
  return report;
}
