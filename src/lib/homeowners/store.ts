/**
 * Homeowner store — the data layer behind the Fello-style homeowner value
 * dashboards, automated value emails, and engagement tracking.
 *
 * Driver strategy (mirrors how the rest of the app treats external services):
 * this MVP ships an in-memory store seeded with demo records so the dashboard
 * renders and builds without any external dependency. A Postgres-backed driver
 * (Vercel Postgres / Neon) drops in behind this same async interface once
 * DATABASE_URL is provisioned — the pages and API routes call the interface,
 * not the driver, so nothing above this file changes.
 *
 * NOTE: the in-memory driver does not persist across serverless invocations —
 * it's for local dev, the build, and UI verification only. Production requires
 * the Postgres driver (next slice).
 */

import { isEligible } from "./eligibility";

export type EstimatePoint = {
  /** ISO date, e.g. "2026-07-01" */
  date: string;
  value: number;
  low?: number;
  high?: number;
};

export type Homeowner = {
  id: string;
  /** opaque, unguessable token used in the dashboard URL */
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  /** whether they still receive the automated value email */
  subscribed: boolean;
  /** where the record came from: "home-value", "fub", "manual", "import" */
  source: string;
  /** Follow Up Boss person id, when synced */
  fubPersonId?: string;
  createdAt: string;
  updatedAt: string;
  /** value estimate history, oldest → newest */
  estimates: EstimatePoint[];
  /** dashboard view timestamps (engagement signal) */
  views: string[];
  /** last automated value email send (ISO), if any */
  lastEmailedAt?: string;
  /** first automated email send (ISO), if any */
  firstEmailedAt?: string;
  /** total automated emails sent to this homeowner (accurate from when this was
   * added; older records may show fewer than were actually sent) */
  emailCount?: number;
};

/** Exact pipeline counts across the WHOLE database (not a sample). */
export type PipelineStats = {
  total: number;
  eligible: number;
  subscribed: number;
  /** eligible + subscribed + last email older than the interval (or never) — the real mailable-due set */
  dueNow: number;
  emailed7d: number;
};

export interface HomeownerStore {
  getByToken(token: string): Promise<Homeowner | null>;
  /** Most-recently-updated homeowners, optionally capped (for large databases). */
  list(limit?: number): Promise<Homeowner[]>;
  /** Total tracked homeowners. */
  count(): Promise<number>;
  /** Exact pipeline aggregates over every record (light columns only). */
  pipelineStats(intervalDays: number): Promise<PipelineStats>;
  /** records whose last email is older than `intervalDays` (or never sent) and still subscribed, engaged contacts first; `limit` caps the working set */
  listDueForEmail(intervalDays: number, limit?: number): Promise<Homeowner[]>;
  upsert(h: Homeowner): Promise<Homeowner>;
  /** Bulk contact upsert for imports — preserves estimates/views/subscribed on conflict. */
  upsertContacts(records: Homeowner[]): Promise<void>;
  recordView(token: string, at?: string): Promise<void>;
  addEstimate(token: string, point: EstimatePoint): Promise<void>;
  /** Persist resolved property facts (beds/baths/sqft) — only provided values. */
  updateFacts(token: string, facts: { beds?: number; baths?: number; sqft?: number }): Promise<void>;
  markEmailed(token: string, at?: string): Promise<void>;
  unsubscribe(token: string): Promise<void>;
  /**
   * Atomically take one slot from today's (Pacific) seller-report send budget.
   * Returns false once `limit` slots are taken — the caller must not send.
   */
  claimSellerSend(limit: number): Promise<boolean>;
  /** Give back a slot claimed by claimSellerSend when the send did not happen. */
  releaseSellerSend(): Promise<void>;
  /**
   * Atomically claim the one-and-only seller-report send for a FUB person.
   * True for exactly one caller, ever — concurrent webhook/poll runs for the
   * same contact cannot both win, so nobody is mailed twice.
   */
  claimSellerPerson(personId: string): Promise<boolean>;
  /** Undo claimSellerPerson when the send did not happen, so it can be retried. */
  releaseSellerPerson(personId: string): Promise<void>;
}

/** Calendar day in Las Vegas time (YYYY-MM-DD) — the daily send budget resets at local midnight. */
export function pacificDay(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

const now = () => new Date().toISOString();
const daysAgoISO = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

/**
 * Exact pipeline aggregates from light rows (email/state/zip/subscribed/
 * lastEmailedAt). Shared by both drivers so "eligible" uses the real isEligible
 * rule rather than a re-implemented SQL approximation.
 */
export function computePipelineStats(
  rows: Array<{ email?: string; state?: string; zip?: string; subscribed?: boolean; lastEmailedAt?: string | null }>,
  intervalDays: number,
): PipelineStats {
  const cutoff = Date.now() - Math.max(1, intervalDays) * 86_400_000;
  const sevenDays = Date.now() - 7 * 86_400_000;
  let total = 0;
  let eligible = 0;
  let subscribed = 0;
  let dueNow = 0;
  let emailed7d = 0;
  for (const r of rows) {
    total++;
    const elig = isEligible({ email: r.email, state: r.state, zip: r.zip });
    if (elig) eligible++;
    if (r.subscribed) subscribed++;
    const last = r.lastEmailedAt ? new Date(r.lastEmailedAt).getTime() : null;
    if (elig && r.subscribed && (last === null || last < cutoff)) dueNow++;
    if (last !== null && last >= sevenDays) emailed7d++;
  }
  return { total, eligible, subscribed, dueNow, emailed7d };
}

/* ---------------- In-memory driver (dev / build / UI verification) ---------------- */

function seed(): Map<string, Homeowner> {
  const m = new Map<string, Homeowner>();
  const demo: Homeowner = {
    id: "demo-1",
    token: "demo",
    firstName: "Jordan",
    lastName: "Avery",
    email: "jordan@example.com",
    address: "1042 Quiet Ridge Ave",
    city: "Henderson",
    state: "NV",
    zip: "89052",
    beds: 4,
    baths: 3,
    sqft: 2680,
    subscribed: true,
    source: "home-value",
    createdAt: daysAgoISO(400),
    updatedAt: now(),
    estimates: [
      { date: daysAgoISO(360), value: 612000, low: 585000, high: 639000 },
      { date: daysAgoISO(270), value: 628000, low: 601000, high: 655000 },
      { date: daysAgoISO(180), value: 641000, low: 613000, high: 669000 },
      { date: daysAgoISO(90), value: 655000, low: 626000, high: 684000 },
      { date: daysAgoISO(14), value: 672000, low: 642000, high: 702000 },
    ],
    views: [daysAgoISO(30), daysAgoISO(9), daysAgoISO(2)],
    lastEmailedAt: daysAgoISO(14),
  };
  m.set(demo.token, demo);
  return m;
}

// Persist across hot-reloads in dev via globalThis; a fresh Map per cold start.
const g = globalThis as unknown as { __homeownerStore?: Map<string, Homeowner> };
const mem: Map<string, Homeowner> = g.__homeownerStore ?? (g.__homeownerStore = seed());

const sellerSends = new Map<string, number>();
const sellerPeople = new Set<string>();

const memoryStore: HomeownerStore = {
  async getByToken(token) {
    return mem.get(token) ?? null;
  },
  async list(limit) {
    const all = [...mem.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return limit ? all.slice(0, limit) : all;
  },
  async count() {
    return mem.size;
  },
  async pipelineStats(intervalDays) {
    return computePipelineStats([...mem.values()], intervalDays);
  },
  async listDueForEmail(intervalDays, limit) {
    const cutoff = Date.now() - intervalDays * 86_400_000;
    const due = [...mem.values()].filter(
      (h) => h.subscribed && (!h.lastEmailedAt || new Date(h.lastEmailedAt).getTime() < cutoff)
    );
    // Engaged contacts (any dashboard view) first, then most-recently-updated —
    // warm-up reputation is built by mailing openers/clickers first.
    due.sort((a, b) => {
      const ea = (a.views?.length ?? 0) > 0 ? 1 : 0;
      const eb = (b.views?.length ?? 0) > 0 ? 1 : 0;
      if (ea !== eb) return eb - ea;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
    return limit && limit > 0 ? due.slice(0, limit) : due;
  },
  async upsert(h) {
    mem.set(h.token, { ...h, updatedAt: now() });
    return mem.get(h.token)!;
  },
  async upsertContacts(records) {
    for (const h of records) {
      const existing = mem.get(h.token);
      mem.set(h.token, {
        ...h,
        // Preserve engagement + subscription history across re-imports.
        estimates: existing?.estimates ?? h.estimates,
        views: existing?.views ?? h.views,
        subscribed: existing?.subscribed ?? h.subscribed,
        createdAt: existing?.createdAt ?? h.createdAt,
        lastEmailedAt: existing?.lastEmailedAt ?? h.lastEmailedAt,
        firstEmailedAt: existing?.firstEmailedAt ?? h.firstEmailedAt,
        emailCount: existing?.emailCount ?? h.emailCount,
        updatedAt: now(),
      });
    }
  },
  async recordView(token, at) {
    const h = mem.get(token);
    if (h) h.views.push(at ?? now());
  },
  async addEstimate(token, point) {
    const h = mem.get(token);
    if (h) {
      h.estimates.push(point);
      h.updatedAt = now();
    }
  },
  async updateFacts(token, facts) {
    const h = mem.get(token);
    if (h) {
      if (facts.beds != null && facts.beds > 0) h.beds = facts.beds;
      if (facts.baths != null && facts.baths > 0) h.baths = facts.baths;
      if (facts.sqft != null && facts.sqft > 0) h.sqft = facts.sqft;
      h.updatedAt = now();
    }
  },
  async markEmailed(token, at) {
    const h = mem.get(token);
    if (h) {
      const when = at ?? now();
      h.lastEmailedAt = when;
      if (!h.firstEmailedAt) h.firstEmailedAt = when;
      h.emailCount = (h.emailCount ?? 0) + 1;
    }
  },
  async unsubscribe(token) {
    const h = mem.get(token);
    if (h) h.subscribed = false;
  },
  async claimSellerSend(limit) {
    const day = pacificDay();
    const n = sellerSends.get(day) ?? 0;
    if (n >= limit) return false;
    sellerSends.set(day, n + 1);
    return true;
  },
  async releaseSellerSend() {
    const day = pacificDay();
    sellerSends.set(day, Math.max(0, (sellerSends.get(day) ?? 0) - 1));
  },
  async claimSellerPerson(personId) {
    if (sellerPeople.has(personId)) return false;
    sellerPeople.add(personId);
    return true;
  },
  async releaseSellerPerson(personId) {
    sellerPeople.delete(personId);
  },
};

/**
 * Returns the active store: Postgres when DATABASE_URL is configured, otherwise
 * the in-memory driver (dev / build / UI verification). Callers depend only on
 * the HomeownerStore interface, so the swap is invisible to them.
 */
export function homeownerStore(): HomeownerStore {
  // Accept the common connection-string names: DATABASE_URL (generic),
  // POSTGRES_URL (Vercel Postgres), and POSTGRES_DATABASE_URL (Neon/Vercel integration).
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL) {
    // Lazy require so the pg client is never loaded in the in-memory path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./postgres") as typeof import("./postgres")).postgresStore;
  }
  return memoryStore;
}

/**
 * Which driver is active: "postgres" means homeowner data persists; "memory"
 * means the in-memory fallback is in use and NOTHING persists across requests
 * (no DATABASE_URL/POSTGRES_URL set). Surfaced on the admin status page so a
 * missing database is obvious at a glance.
 */
export function storeDriver(): "postgres" | "memory" {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL
    ? "postgres"
    : "memory";
}

/** Unguessable token for dashboard URLs. */
export function newToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  ).slice(0, 24);
}

/* ---------------- Derived helpers (shared by dashboard + emails) ---------------- */

export function latestEstimate(h: Homeowner): EstimatePoint | null {
  return h.estimates.length ? h.estimates[h.estimates.length - 1] : null;
}

/** Total appreciation since the first tracked estimate. */
export function appreciation(h: Homeowner): { abs: number; pct: number } | null {
  if (h.estimates.length < 2) return null;
  const first = h.estimates[0].value;
  const last = h.estimates[h.estimates.length - 1].value;
  return { abs: last - first, pct: ((last - first) / first) * 100 };
}

/**
 * Lightweight behavioral engagement score (0–100) — a Fello-style "propensity"
 * proxy built from real signals we own: how often and how recently the owner
 * checks their dashboard. Not a data-vendor predictive model, but a strong,
 * honest indicator of who's paying attention to their equity.
 */
export function engagementScore(h: Homeowner): number {
  const nowMs = Date.now();
  let score = 0;
  for (const v of h.views) {
    const ageDays = (nowMs - new Date(v).getTime()) / 86_400_000;
    if (ageDays <= 7) score += 34;
    else if (ageDays <= 30) score += 20;
    else if (ageDays <= 90) score += 8;
    else score += 2;
  }
  return Math.min(100, Math.round(score));
}
