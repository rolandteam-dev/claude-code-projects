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
};

export interface HomeownerStore {
  getByToken(token: string): Promise<Homeowner | null>;
  list(): Promise<Homeowner[]>;
  /** records whose last email is older than `intervalDays` (or never sent) and still subscribed */
  listDueForEmail(intervalDays: number): Promise<Homeowner[]>;
  upsert(h: Homeowner): Promise<Homeowner>;
  recordView(token: string, at?: string): Promise<void>;
  addEstimate(token: string, point: EstimatePoint): Promise<void>;
  markEmailed(token: string, at?: string): Promise<void>;
  unsubscribe(token: string): Promise<void>;
}

const now = () => new Date().toISOString();
const daysAgoISO = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

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

const memoryStore: HomeownerStore = {
  async getByToken(token) {
    return mem.get(token) ?? null;
  },
  async list() {
    return [...mem.values()];
  },
  async listDueForEmail(intervalDays) {
    const cutoff = Date.now() - intervalDays * 86_400_000;
    return [...mem.values()].filter(
      (h) => h.subscribed && (!h.lastEmailedAt || new Date(h.lastEmailedAt).getTime() < cutoff)
    );
  },
  async upsert(h) {
    mem.set(h.token, { ...h, updatedAt: now() });
    return mem.get(h.token)!;
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
  async markEmailed(token, at) {
    const h = mem.get(token);
    if (h) h.lastEmailedAt = at ?? now();
  },
  async unsubscribe(token) {
    const h = mem.get(token);
    if (h) h.subscribed = false;
  },
};

/**
 * Returns the active store: Postgres when DATABASE_URL is configured, otherwise
 * the in-memory driver (dev / build / UI verification). Callers depend only on
 * the HomeownerStore interface, so the swap is invisible to them.
 */
export function homeownerStore(): HomeownerStore {
  // POSTGRES_URL is what Vercel Postgres injects; DATABASE_URL is the generic name.
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    // Lazy require so the pg client is never loaded in the in-memory path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./postgres") as typeof import("./postgres")).postgresStore;
  }
  return memoryStore;
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
