/**
 * Seller Engine storage (Postgres). Same lazy, idempotent schema approach as
 * the homeowner store: tables are created on first use, no migration step.
 *
 * Owner lists live ONLY here (and in FUB). This repo is public — never commit
 * an exported list, a sample with real owners, or a key.
 */
import postgres from "postgres";
import type { DncStatus, ParcelFacts, PhoneRecord, Signal, SignalType } from "./types";
import { isSignalType } from "./types";
import { scoreParcel } from "./score";

let client: ReturnType<typeof postgres> | null = null;

export function distressDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL);
}

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
    const s = sql();
    ready = (async () => {
      await s`
        CREATE TABLE IF NOT EXISTS distress_parcels (
          parcel_key text PRIMARY KEY,
          apn text,
          address text NOT NULL DEFAULT '',
          city text NOT NULL DEFAULT '',
          zip text NOT NULL DEFAULT '',
          owner_name text NOT NULL DEFAULT '',
          mail_address text NOT NULL DEFAULT '',
          mail_city text NOT NULL DEFAULT '',
          mail_state text NOT NULL DEFAULT '',
          mail_zip text NOT NULL DEFAULT '',
          absentee boolean,
          last_sale_date date,
          institutional boolean NOT NULL DEFAULT false,
          score int NOT NULL DEFAULT 0,
          reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
          fub_person_id text,
          fub_existing boolean NOT NULL DEFAULT false,
          pushed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )`;
      await s`
        CREATE TABLE IF NOT EXISTS distress_signals (
          parcel_key text NOT NULL REFERENCES distress_parcels(parcel_key) ON DELETE CASCADE,
          type text NOT NULL,
          source text NOT NULL,
          ref text NOT NULL,
          event_date date,
          detail text,
          first_seen_at timestamptz NOT NULL DEFAULT now(),
          last_seen_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (parcel_key, type, ref)
        )`;
      await s`
        CREATE TABLE IF NOT EXISTS distress_phones (
          parcel_key text NOT NULL REFERENCES distress_parcels(parcel_key) ON DELETE CASCADE,
          phone text NOT NULL,
          dnc text NOT NULL DEFAULT 'unknown',
          source text NOT NULL,
          checked_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (parcel_key, phone)
        )`;
      // Internal do-not-call list: anyone who asked not to be called, forever.
      await s`
        CREATE TABLE IF NOT EXISTS distress_dnc (
          phone text PRIMARY KEY,
          reason text NOT NULL DEFAULT '',
          added_at timestamptz NOT NULL DEFAULT now()
        )`;
      await s`
        CREATE TABLE IF NOT EXISTS distress_pushes (
          id bigserial PRIMARY KEY,
          parcel_key text NOT NULL,
          fub_person_id text,
          assigned_user_id text,
          score int NOT NULL,
          pushed_at timestamptz NOT NULL DEFAULT now()
        )`;
      await s`CREATE INDEX IF NOT EXISTS distress_parcels_unpushed ON distress_parcels (score DESC) WHERE pushed_at IS NULL`;
      await s`CREATE INDEX IF NOT EXISTS distress_parcels_apn ON distress_parcels (apn)`;
      await s`CREATE INDEX IF NOT EXISTS distress_pushes_day ON distress_pushes (pushed_at)`;
    })();
    ready.catch(() => {
      ready = null; // let the next call retry after a transient failure
    });
  }
  return ready;
}

export type ParcelUpsert = {
  parcelKey: string;
  apn: string | null;
  address: string;
  city: string;
  zip: string;
  ownerName: string;
  mailAddress: string;
  mailCity: string;
  mailState: string;
  mailZip: string;
  absentee?: boolean;
  lastSaleDate?: string;
  institutional: boolean;
};

/** Insert or enrich a parcel. Non-empty incoming values win; blanks never erase. */
export async function upsertParcel(p: ParcelUpsert): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    INSERT INTO distress_parcels (
      parcel_key, apn, address, city, zip, owner_name, mail_address, mail_city,
      mail_state, mail_zip, absentee, last_sale_date, institutional
    ) VALUES (
      ${p.parcelKey}, ${p.apn}, ${p.address}, ${p.city}, ${p.zip}, ${p.ownerName},
      ${p.mailAddress}, ${p.mailCity}, ${p.mailState}, ${p.mailZip},
      ${p.absentee ?? null}, ${p.lastSaleDate ?? null}, ${p.institutional}
    )
    ON CONFLICT (parcel_key) DO UPDATE SET
      apn = COALESCE(EXCLUDED.apn, distress_parcels.apn),
      address = COALESCE(NULLIF(EXCLUDED.address, ''), distress_parcels.address),
      city = COALESCE(NULLIF(EXCLUDED.city, ''), distress_parcels.city),
      zip = COALESCE(NULLIF(EXCLUDED.zip, ''), distress_parcels.zip),
      owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), distress_parcels.owner_name),
      mail_address = COALESCE(NULLIF(EXCLUDED.mail_address, ''), distress_parcels.mail_address),
      mail_city = COALESCE(NULLIF(EXCLUDED.mail_city, ''), distress_parcels.mail_city),
      mail_state = COALESCE(NULLIF(EXCLUDED.mail_state, ''), distress_parcels.mail_state),
      mail_zip = COALESCE(NULLIF(EXCLUDED.mail_zip, ''), distress_parcels.mail_zip),
      absentee = COALESCE(EXCLUDED.absentee, distress_parcels.absentee),
      last_sale_date = COALESCE(EXCLUDED.last_sale_date, distress_parcels.last_sale_date),
      institutional = EXCLUDED.institutional OR distress_parcels.institutional,
      updated_at = now()
  `;
}

export async function upsertSignal(parcelKey: string, sig: Signal, ref: string): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    INSERT INTO distress_signals (parcel_key, type, source, ref, event_date, detail)
    VALUES (${parcelKey}, ${sig.type}, ${sig.source}, ${ref}, ${sig.eventDate ?? null}, ${sig.detail ?? null})
    ON CONFLICT (parcel_key, type, ref) DO UPDATE SET
      event_date = COALESCE(EXCLUDED.event_date, distress_signals.event_date),
      detail = COALESCE(EXCLUDED.detail, distress_signals.detail),
      last_seen_at = now()
  `;
}

/**
 * Record a phone. A "listed" status is sticky: once any source says a number is
 * on a Do Not Call list, a later "clear" or "unknown" never overrides it.
 */
export async function upsertPhone(parcelKey: string, p: PhoneRecord, source: string): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    INSERT INTO distress_phones (parcel_key, phone, dnc, source)
    VALUES (${parcelKey}, ${p.phone}, ${p.dnc}, ${source})
    ON CONFLICT (parcel_key, phone) DO UPDATE SET
      dnc = CASE
        WHEN distress_phones.dnc = 'listed' OR EXCLUDED.dnc = 'listed' THEN 'listed'
        WHEN EXCLUDED.dnc = 'clear' THEN 'clear'
        ELSE distress_phones.dnc
      END,
      source = EXCLUDED.source,
      checked_at = now()
  `;
}

/* ------------------------------------------------------------ bulk writes */

const CHUNK = 500;

function chunks<T>(list: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
}

/** Same merge rules as upsertParcel, many rows per statement. */
export async function upsertParcelsBulk(list: ParcelUpsert[]): Promise<void> {
  if (list.length === 0) return;
  await ensureSchema();
  const s = sql();
  // One statement can't touch the same row twice: merge duplicates first.
  const merged = new Map<string, ParcelUpsert>();
  for (const p of list) {
    const prev = merged.get(p.parcelKey);
    if (!prev) {
      merged.set(p.parcelKey, { ...p });
      continue;
    }
    for (const k of Object.keys(p) as (keyof ParcelUpsert)[]) {
      const v = p[k];
      if (v !== undefined && v !== null && v !== "") (prev as Record<string, unknown>)[k] = v;
    }
    prev.institutional = prev.institutional || p.institutional;
  }
  for (const part of chunks([...merged.values()])) {
    const rows = part.map((p) => ({
      parcel_key: p.parcelKey,
      apn: p.apn,
      address: p.address,
      city: p.city,
      zip: p.zip,
      owner_name: p.ownerName,
      mail_address: p.mailAddress,
      mail_city: p.mailCity,
      mail_state: p.mailState,
      mail_zip: p.mailZip,
      absentee: p.absentee ?? null,
      last_sale_date: p.lastSaleDate ?? null,
      institutional: p.institutional,
    }));
    await s`
      INSERT INTO distress_parcels ${s(
        rows,
        "parcel_key",
        "apn",
        "address",
        "city",
        "zip",
        "owner_name",
        "mail_address",
        "mail_city",
        "mail_state",
        "mail_zip",
        "absentee",
        "last_sale_date",
        "institutional",
      )}
      ON CONFLICT (parcel_key) DO UPDATE SET
        apn = COALESCE(EXCLUDED.apn, distress_parcels.apn),
        address = COALESCE(NULLIF(EXCLUDED.address, ''), distress_parcels.address),
        city = COALESCE(NULLIF(EXCLUDED.city, ''), distress_parcels.city),
        zip = COALESCE(NULLIF(EXCLUDED.zip, ''), distress_parcels.zip),
        owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), distress_parcels.owner_name),
        mail_address = COALESCE(NULLIF(EXCLUDED.mail_address, ''), distress_parcels.mail_address),
        mail_city = COALESCE(NULLIF(EXCLUDED.mail_city, ''), distress_parcels.mail_city),
        mail_state = COALESCE(NULLIF(EXCLUDED.mail_state, ''), distress_parcels.mail_state),
        mail_zip = COALESCE(NULLIF(EXCLUDED.mail_zip, ''), distress_parcels.mail_zip),
        absentee = COALESCE(EXCLUDED.absentee, distress_parcels.absentee),
        last_sale_date = COALESCE(EXCLUDED.last_sale_date, distress_parcels.last_sale_date),
        institutional = EXCLUDED.institutional OR distress_parcels.institutional,
        updated_at = now()
    `;
  }
}

export type SignalUpsert = { parcelKey: string; ref: string; signal: Signal };

export async function upsertSignalsBulk(list: SignalUpsert[]): Promise<void> {
  if (list.length === 0) return;
  await ensureSchema();
  const s = sql();
  const merged = new Map<string, SignalUpsert>();
  for (const x of list) {
    const k = `${x.parcelKey}|${x.signal.type}|${x.ref}`;
    const prev = merged.get(k);
    // Keep the newest event date when the same signal repeats.
    if (!prev || (x.signal.eventDate ?? "") > (prev.signal.eventDate ?? "")) merged.set(k, x);
  }
  for (const part of chunks([...merged.values()])) {
    const rows = part.map((x) => ({
      parcel_key: x.parcelKey,
      type: x.signal.type,
      source: x.signal.source,
      ref: x.ref,
      event_date: x.signal.eventDate ?? null,
      detail: x.signal.detail ?? null,
    }));
    await s`
      INSERT INTO distress_signals ${s(rows, "parcel_key", "type", "source", "ref", "event_date", "detail")}
      ON CONFLICT (parcel_key, type, ref) DO UPDATE SET
        event_date = COALESCE(EXCLUDED.event_date, distress_signals.event_date),
        detail = COALESCE(EXCLUDED.detail, distress_signals.detail),
        last_seen_at = now()
    `;
  }
}

/**
 * Remove signals of the given types from a parcel when they were recorded on
 * or before `before` (YYYY-MM-DD): a rescinded default, a cancelled sale, a
 * completed foreclosure. Undated signals are left alone. Returns rows removed.
 */
export async function clearSignalsBefore(
  list: { parcelKey: string; types: SignalType[]; before: string }[],
): Promise<number> {
  if (list.length === 0) return 0;
  await ensureSchema();
  const s = sql();
  let n = 0;
  for (const c of list) {
    const res = await s`
      DELETE FROM distress_signals
      WHERE parcel_key = ${c.parcelKey}
        AND type = ANY(${c.types})
        AND event_date IS NOT NULL
        AND event_date <= ${c.before}
    `;
    n += res.count;
  }
  return n;
}

export type PhoneUpsert = { parcelKey: string; phone: PhoneRecord; source: string };

const DNC_RANK: Record<DncStatus, number> = { unknown: 0, clear: 1, listed: 2 };

export async function upsertPhonesBulk(list: PhoneUpsert[]): Promise<void> {
  if (list.length === 0) return;
  await ensureSchema();
  const s = sql();
  const merged = new Map<string, PhoneUpsert>();
  for (const x of list) {
    const k = `${x.parcelKey}|${x.phone.phone}`;
    const prev = merged.get(k);
    if (!prev || DNC_RANK[x.phone.dnc] > DNC_RANK[prev.phone.dnc]) merged.set(k, x);
  }
  for (const part of chunks([...merged.values()])) {
    const rows = part.map((x) => ({
      parcel_key: x.parcelKey,
      phone: x.phone.phone,
      dnc: x.phone.dnc,
      source: x.source,
    }));
    // "listed" is sticky: a later clear/unknown never un-lists a number.
    await s`
      INSERT INTO distress_phones ${s(rows, "parcel_key", "phone", "dnc", "source")}
      ON CONFLICT (parcel_key, phone) DO UPDATE SET
        dnc = CASE
          WHEN distress_phones.dnc = 'listed' OR EXCLUDED.dnc = 'listed' THEN 'listed'
          WHEN EXCLUDED.dnc = 'clear' THEN 'clear'
          ELSE distress_phones.dnc
        END,
        source = EXCLUDED.source,
        checked_at = now()
    `;
  }
}

export async function addInternalDnc(phones: string[], reason: string): Promise<number> {
  if (phones.length === 0) return 0;
  await ensureSchema();
  const s = sql();
  let n = 0;
  for (const phone of phones) {
    const r = await s`
      INSERT INTO distress_dnc (phone, reason) VALUES (${phone}, ${reason})
      ON CONFLICT (phone) DO NOTHING
    `;
    n += r.count;
  }
  return n;
}

export type Candidate = {
  parcelKey: string;
  apn: string | null;
  address: string;
  city: string;
  zip: string;
  ownerName: string;
  facts: ParcelFacts;
  signals: Signal[];
  /** Numbers cleared to call: scrubbed (or allowed unscrubbed) and not on our internal list. */
  callable: string[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Parcels not yet pushed (and not already FUB contacts) that have at least one
 * callable phone. Scoring happens in the caller; this only gathers the facts.
 */
export async function loadCandidates(opts: { allowUnscrubbed: boolean; limit: number }): Promise<Candidate[]> {
  await ensureSchema();
  const s = sql();
  const okStatuses: DncStatus[] = opts.allowUnscrubbed ? ["clear", "unknown"] : ["clear"];

  const parcels: any[] = await s`
    SELECT p.*, array_agg(DISTINCT ph.phone) AS callable
    FROM distress_parcels p
    JOIN distress_phones ph ON ph.parcel_key = p.parcel_key
    WHERE p.pushed_at IS NULL
      AND p.fub_existing = false
      AND p.institutional = false
      AND ph.dnc = ANY(${okStatuses})
      AND NOT EXISTS (SELECT 1 FROM distress_dnc d WHERE d.phone = ph.phone)
      AND NOT EXISTS (
        SELECT 1 FROM distress_phones l
        WHERE l.phone = ph.phone AND l.dnc = 'listed'
      )
    GROUP BY p.parcel_key
    ORDER BY p.score DESC, p.updated_at DESC
    LIMIT ${opts.limit}
  `;
  if (parcels.length === 0) return [];

  const keys = parcels.map((p) => p.parcel_key);
  const sigRows: any[] = await s`
    SELECT parcel_key, type, source, event_date, detail
    FROM distress_signals WHERE parcel_key = ANY(${keys})
  `;
  const byKey = groupSignals(sigRows);

  const now = Date.now();
  return parcels.map((p) => ({
    parcelKey: p.parcel_key,
    apn: p.apn,
    address: p.address,
    city: p.city,
    zip: p.zip,
    ownerName: p.owner_name,
    facts: {
      absentee: p.absentee ?? undefined,
      institutional: p.institutional,
      yearsOwned: p.last_sale_date
        ? Math.floor((now - new Date(p.last_sale_date).getTime()) / (365.25 * 86_400_000))
        : undefined,
    },
    signals: byKey.get(p.parcel_key) ?? [],
    callable: (p.callable as string[]).filter(Boolean),
  }));
}

/**
 * Recompute and store the score for the given parcels (after an import), so
 * the push queue can be ordered by it. Returns how many were scored.
 */
export async function rescore(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  await ensureSchema();
  const s = sql();
  let n = 0;
  for (let i = 0; i < keys.length; i += 500) {
    const chunk = keys.slice(i, i + 500);
    const parcels: any[] = await s`
      SELECT parcel_key, absentee, institutional, last_sale_date FROM distress_parcels
      WHERE parcel_key = ANY(${chunk})
    `;
    const sigRows: any[] = await s`
      SELECT parcel_key, type, source, event_date, detail FROM distress_signals
      WHERE parcel_key = ANY(${chunk})
    `;
    const byKey = groupSignals(sigRows);
    const now = Date.now();
    for (const p of parcels) {
      const r = scoreParcel(byKey.get(p.parcel_key) ?? [], {
        absentee: p.absentee ?? undefined,
        institutional: p.institutional,
        yearsOwned: p.last_sale_date
          ? Math.floor((now - new Date(p.last_sale_date).getTime()) / (365.25 * 86_400_000))
          : undefined,
      });
      await saveScore(p.parcel_key, r.score, r.reasons);
      n++;
    }
  }
  return n;
}

function groupSignals(rows: any[]): Map<string, Signal[]> {
  const byKey = new Map<string, Signal[]>();
  for (const r of rows) {
    if (!isSignalType(r.type)) continue;
    const list = byKey.get(r.parcel_key) ?? [];
    list.push({
      type: r.type as SignalType,
      source: r.source,
      eventDate: r.event_date ? new Date(r.event_date).toISOString().slice(0, 10) : undefined,
      detail: r.detail ?? undefined,
    });
    byKey.set(r.parcel_key, list);
  }
  return byKey;
}

export async function saveScore(parcelKey: string, score: number, reasons: string[]): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    UPDATE distress_parcels SET score = ${score}, reasons = ${s.json(reasons)}, updated_at = now()
    WHERE parcel_key = ${parcelKey}
  `;
}

export async function markExisting(parcelKey: string, fubPersonId: string): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    UPDATE distress_parcels SET fub_existing = true, fub_person_id = ${fubPersonId}, updated_at = now()
    WHERE parcel_key = ${parcelKey}
  `;
}

export async function markPushed(
  parcelKey: string,
  score: number,
  fubPersonId: string | null,
  assignedUserId: string | null,
): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    UPDATE distress_parcels SET pushed_at = now(), fub_person_id = ${fubPersonId}, updated_at = now()
    WHERE parcel_key = ${parcelKey}
  `;
  await s`
    INSERT INTO distress_pushes (parcel_key, fub_person_id, assigned_user_id, score)
    VALUES (${parcelKey}, ${fubPersonId}, ${assignedUserId}, ${score})
  `;
}

/** Pushes since midnight Las Vegas time, total and per assigned agent. */
export async function pushesToday(): Promise<{ total: number; byAgent: Map<string, number> }> {
  await ensureSchema();
  const s = sql();
  const rows: any[] = await s`
    SELECT assigned_user_id, count(*)::int AS n FROM distress_pushes
    WHERE pushed_at >= (date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'America/Los_Angeles')
    GROUP BY assigned_user_id
  `;
  const byAgent = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    total += r.n;
    if (r.assigned_user_id) byAgent.set(String(r.assigned_user_id), r.n);
  }
  return { total, byAgent };
}

export type Summary = {
  parcels: number;
  withCallablePhone: number;
  pushed: number;
  existingContacts: number;
  institutional: number;
  bySignal: Record<string, number>;
  byListCount: Record<string, number>;
  phones: Record<string, number>;
  internalDnc: number;
  top: { address: string; city: string; zip: string; score: number; reasons: string[]; pushed: boolean }[];
};

export async function summary(): Promise<Summary> {
  await ensureSchema();
  const s = sql();
  const [counts]: any[] = await s`
    SELECT
      (SELECT count(*)::int FROM distress_parcels) AS parcels,
      (SELECT count(*)::int FROM distress_parcels WHERE pushed_at IS NOT NULL) AS pushed,
      (SELECT count(*)::int FROM distress_parcels WHERE fub_existing) AS existing,
      (SELECT count(*)::int FROM distress_parcels WHERE institutional) AS institutional,
      (SELECT count(DISTINCT parcel_key)::int FROM distress_phones WHERE dnc = 'clear') AS callable,
      (SELECT count(*)::int FROM distress_dnc) AS dnc
  `;
  const sig: any[] = await s`SELECT type, count(DISTINCT parcel_key)::int AS n FROM distress_signals GROUP BY type`;
  const stack: any[] = await s`
    SELECT lists, count(*)::int AS n FROM (
      SELECT parcel_key, count(DISTINCT type) AS lists FROM distress_signals GROUP BY parcel_key
    ) t GROUP BY lists ORDER BY lists
  `;
  const ph: any[] = await s`SELECT dnc, count(*)::int AS n FROM distress_phones GROUP BY dnc`;
  const top: any[] = await s`
    SELECT address, city, zip, score, reasons, pushed_at FROM distress_parcels
    WHERE institutional = false ORDER BY score DESC LIMIT 25
  `;
  return {
    parcels: counts.parcels,
    withCallablePhone: counts.callable,
    pushed: counts.pushed,
    existingContacts: counts.existing,
    institutional: counts.institutional,
    bySignal: Object.fromEntries(sig.map((r) => [r.type, r.n])),
    byListCount: Object.fromEntries(stack.map((r) => [`${r.lists}`, r.n])),
    phones: Object.fromEntries(ph.map((r) => [r.dnc, r.n])),
    internalDnc: counts.dnc,
    top: top.map((r) => ({
      address: r.address,
      city: r.city,
      zip: r.zip,
      score: r.score,
      reasons: r.reasons ?? [],
      pushed: Boolean(r.pushed_at),
    })),
  };
}
