/**
 * Postgres-backed HomeownerStore driver. Activated by store.ts when
 * DATABASE_URL is present (Vercel Postgres / Neon / Supabase — any Postgres
 * connection string). Schema is created lazily and idempotently on first use,
 * so there's no separate migration step for this single-table MVP. Estimates
 * and views are stored as JSONB arrays to mirror the record shape exactly.
 */
import postgres from "postgres";
import type { EstimatePoint, Homeowner, HomeownerStore } from "./store";

let sqlClient: ReturnType<typeof postgres> | null = null;
function sql() {
  if (!sqlClient) {
    // max:1 keeps connection use serverless-friendly; use a pooled connection
    // string (e.g. Neon's -pooler host) in production.
    const url = (process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_DATABASE_URL) as string;
    sqlClient = postgres(url, { max: 1, prepare: false });
  }
  return sqlClient;
}

let ready: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!ready) {
    const s = sql();
    ready = s`
      CREATE TABLE IF NOT EXISTS homeowners (
        id text PRIMARY KEY,
        token text UNIQUE NOT NULL,
        first_name text NOT NULL DEFAULT '',
        last_name text NOT NULL DEFAULT '',
        email text NOT NULL DEFAULT '',
        phone text,
        address text NOT NULL DEFAULT '',
        city text NOT NULL DEFAULT '',
        state text NOT NULL DEFAULT 'NV',
        zip text NOT NULL DEFAULT '',
        beds int,
        baths numeric,
        sqft int,
        subscribed boolean NOT NULL DEFAULT true,
        source text NOT NULL DEFAULT 'manual',
        fub_person_id text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        last_emailed_at timestamptz,
        estimates jsonb NOT NULL DEFAULT '[]'::jsonb,
        views jsonb NOT NULL DEFAULT '[]'::jsonb
      )
    `.then(() => undefined);
  }
  return ready;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToHomeowner(r: any): Homeowner {
  return {
    id: r.id,
    token: r.token,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone ?? undefined,
    address: r.address,
    city: r.city,
    state: r.state,
    zip: r.zip,
    beds: r.beds ?? undefined,
    baths: r.baths != null ? Number(r.baths) : undefined,
    sqft: r.sqft ?? undefined,
    subscribed: r.subscribed,
    source: r.source,
    fubPersonId: r.fub_person_id ?? undefined,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    lastEmailedAt: r.last_emailed_at ? new Date(r.last_emailed_at).toISOString() : undefined,
    estimates: (r.estimates ?? []) as EstimatePoint[],
    views: (r.views ?? []) as string[],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const postgresStore: HomeownerStore = {
  async getByToken(token) {
    await ensureSchema();
    const rows = await sql()`SELECT * FROM homeowners WHERE token = ${token} LIMIT 1`;
    return rows.length ? rowToHomeowner(rows[0]) : null;
  },

  async list(limit) {
    await ensureSchema();
    const rows = limit
      ? await sql()`SELECT * FROM homeowners ORDER BY updated_at DESC LIMIT ${limit}`
      : await sql()`SELECT * FROM homeowners ORDER BY updated_at DESC`;
    return rows.map(rowToHomeowner);
  },
  async count() {
    await ensureSchema();
    const rows = await sql()`SELECT count(*)::int AS n FROM homeowners`;
    return (rows[0]?.n as number) ?? 0;
  },

  async listDueForEmail(intervalDays) {
    await ensureSchema();
    const rows = await sql()`
      SELECT * FROM homeowners
      WHERE subscribed = true
        AND (last_emailed_at IS NULL OR last_emailed_at < now() - (${intervalDays} * interval '1 day'))
    `;
    return rows.map(rowToHomeowner);
  },

  async upsert(h) {
    await ensureSchema();
    await sql()`
      INSERT INTO homeowners (
        id, token, first_name, last_name, email, phone, address, city, state, zip,
        beds, baths, sqft, subscribed, source, fub_person_id, created_at, updated_at,
        last_emailed_at, estimates, views
      ) VALUES (
        ${h.id}, ${h.token}, ${h.firstName}, ${h.lastName}, ${h.email}, ${h.phone ?? null},
        ${h.address}, ${h.city}, ${h.state}, ${h.zip}, ${h.beds ?? null}, ${h.baths ?? null},
        ${h.sqft ?? null}, ${h.subscribed}, ${h.source}, ${h.fubPersonId ?? null},
        ${h.createdAt}, now(), ${h.lastEmailedAt ?? null},
        ${sql().json(h.estimates)}, ${sql().json(h.views)}
      )
      ON CONFLICT (token) DO UPDATE SET
        first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
        email = EXCLUDED.email, phone = EXCLUDED.phone, address = EXCLUDED.address,
        city = EXCLUDED.city, state = EXCLUDED.state, zip = EXCLUDED.zip,
        beds = EXCLUDED.beds, baths = EXCLUDED.baths, sqft = EXCLUDED.sqft,
        source = EXCLUDED.source, fub_person_id = EXCLUDED.fub_person_id, updated_at = now()
    `;
    const saved = await this.getByToken(h.token);
    return saved ?? h;
  },

  async upsertContacts(records) {
    if (records.length === 0) return;
    await ensureSchema();
    const s = sql();
    // Per-row insert (no read-back) preserving estimates/views/subscribed on
    // conflict — the bulk import path. New rows get empty history + subscribed.
    for (const h of records) {
      await s`
        INSERT INTO homeowners (
          id, token, first_name, last_name, email, phone, address, city, state, zip,
          beds, baths, sqft, subscribed, source, fub_person_id, created_at, updated_at,
          estimates, views
        ) VALUES (
          ${h.id}, ${h.token}, ${h.firstName}, ${h.lastName}, ${h.email}, ${h.phone ?? null},
          ${h.address}, ${h.city}, ${h.state}, ${h.zip}, ${h.beds ?? null}, ${h.baths ?? null},
          ${h.sqft ?? null}, true, ${h.source}, ${h.fubPersonId ?? null},
          ${h.createdAt}, now(), '[]'::jsonb, '[]'::jsonb
        )
        ON CONFLICT (token) DO UPDATE SET
          first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
          email = EXCLUDED.email, phone = EXCLUDED.phone, address = EXCLUDED.address,
          city = EXCLUDED.city, state = EXCLUDED.state, zip = EXCLUDED.zip,
          beds = EXCLUDED.beds, baths = EXCLUDED.baths, sqft = EXCLUDED.sqft,
          source = EXCLUDED.source, fub_person_id = EXCLUDED.fub_person_id, updated_at = now()
      `;
    }
  },

  async recordView(token, at) {
    await ensureSchema();
    const ts = at ?? new Date().toISOString();
    await sql()`
      UPDATE homeowners
      SET views = COALESCE(views, '[]'::jsonb) || ${sql().json([ts])}
      WHERE token = ${token}
    `;
  },

  async addEstimate(token, point) {
    await ensureSchema();
    await sql()`
      UPDATE homeowners
      SET estimates = COALESCE(estimates, '[]'::jsonb) || ${sql().json([point])},
          updated_at = now()
      WHERE token = ${token}
    `;
  },

  async markEmailed(token, at) {
    await ensureSchema();
    await sql()`UPDATE homeowners SET last_emailed_at = ${at ?? new Date().toISOString()} WHERE token = ${token}`;
  },

  async unsubscribe(token) {
    await ensureSchema();
    await sql()`UPDATE homeowners SET subscribed = false WHERE token = ${token}`;
  },
};
