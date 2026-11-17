/**
 * Offer Machine storage (Postgres). Same lazy, idempotent schema approach as the
 * Seller Engine: the table is created on first use, no migration step.
 *
 * `inputs` holds client names, addresses and prices. This repo is public — never
 * commit an export or a sample with a real client.
 */
import postgres from "postgres";
import type { BuyerOfferInputs, JobResult, JobStatus, JobType } from "./types";
import type { StatedTerms } from "./terms";

let client: ReturnType<typeof postgres> | null = null;

export function offersDbConfigured(): boolean {
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
        CREATE TABLE IF NOT EXISTS offer_jobs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          job_type text NOT NULL,
          status text NOT NULL DEFAULT 'queued',
          requested_by text NOT NULL,
          channel_id text,
          thread_ts text,
          inputs jsonb NOT NULL,
          result jsonb,
          error text,
          reviewed_by text,
          reviewed_at timestamptz,
          attempts int NOT NULL DEFAULT 0,
          claimed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )`;
      await s`CREATE INDEX IF NOT EXISTS offer_jobs_status_idx ON offer_jobs (status, created_at)`;
      await s`
        CREATE TABLE IF NOT EXISTS offer_conversations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_id text NOT NULL,
          thread_ts text NOT NULL,
          requested_by text NOT NULL,
          speaker_name text NOT NULL DEFAULT '',
          stated jsonb NOT NULL DEFAULT '{}'::jsonb,
          snapshot jsonb,
          status text NOT NULL DEFAULT 'collecting',
          card_ts text,
          turns int NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (channel_id, thread_ts)
        )`;
      // Slack retries and double-fires (a mention in a thread arrives as BOTH an
      // app_mention and a message event); this makes each message count once.
      await s`
        CREATE TABLE IF NOT EXISTS offer_events_seen (
          key text PRIMARY KEY,
          seen_at timestamptz NOT NULL DEFAULT now()
        )`;
    })().catch((e) => {
      ready = null; // retry on the next call rather than caching a failure
      throw e;
    });
  }
  return ready;
}

export interface OfferJob {
  id: string;
  jobType: JobType;
  status: JobStatus;
  requestedBy: string;
  channelId: string | null;
  threadTs: string | null;
  inputs: BuyerOfferInputs;
  result: JobResult | null;
  error: string | null;
  reviewedBy: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toJob(r: any): OfferJob {
  return {
    id: r.id,
    jobType: r.job_type,
    status: r.status,
    requestedBy: r.requested_by,
    channelId: r.channel_id ?? null,
    threadTs: r.thread_ts ?? null,
    inputs: r.inputs,
    result: r.result ?? null,
    error: r.error ?? null,
    reviewedBy: r.reviewed_by ?? null,
    attempts: r.attempts,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** A job stuck "working" this long is assumed dead (machine asleep, crash). */
const STALE_MINUTES = 20;
const MAX_ATTEMPTS = 3;

export async function createJob(args: {
  jobType: JobType;
  requestedBy: string;
  channelId: string | null;
  inputs: BuyerOfferInputs;
}): Promise<OfferJob> {
  await ensureSchema();
  const s = sql();
  const rows = await s`
    INSERT INTO offer_jobs (job_type, requested_by, channel_id, inputs)
    VALUES (${args.jobType}, ${args.requestedBy}, ${args.channelId}, ${s.json(args.inputs as never)})
    RETURNING *`;
  return toJob(rows[0]);
}

export async function setThread(id: string, channelId: string, threadTs: string): Promise<void> {
  await ensureSchema();
  await sql()`UPDATE offer_jobs SET channel_id = ${channelId}, thread_ts = ${threadTs}, updated_at = now() WHERE id = ${id}`;
}

export async function getJob(id: string): Promise<OfferJob | null> {
  await ensureSchema();
  const rows = await sql()`SELECT * FROM offer_jobs WHERE id = ${id}`;
  return rows[0] ? toJob(rows[0]) : null;
}

/**
 * Put dead "working" jobs back in the queue, or fail them once they have been
 * tried MAX_ATTEMPTS times. Returns the ones that were failed so the caller can
 * update their Slack message.
 */
export async function reapStale(): Promise<OfferJob[]> {
  await ensureSchema();
  const s = sql();
  await s`
    UPDATE offer_jobs SET status = 'queued', updated_at = now()
    WHERE status = 'working' AND attempts < ${MAX_ATTEMPTS}
      AND claimed_at < now() - make_interval(mins => ${STALE_MINUTES})`;
  const failed = await s`
    UPDATE offer_jobs SET status = 'failed', error = 'The drafting machine stopped responding.', updated_at = now()
    WHERE status = 'working' AND attempts >= ${MAX_ATTEMPTS}
      AND claimed_at < now() - make_interval(mins => ${STALE_MINUTES})
    RETURNING *`;
  return failed.map(toJob);
}

/** Atomically take the oldest queued job. Two workers can never get the same one. */
export async function claimNext(): Promise<OfferJob | null> {
  await ensureSchema();
  const rows = await sql()`
    UPDATE offer_jobs
    SET status = 'working', attempts = attempts + 1, claimed_at = now(), updated_at = now()
    WHERE id = (
      SELECT id FROM offer_jobs WHERE status = 'queued'
      ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    RETURNING *`;
  return rows[0] ? toJob(rows[0]) : null;
}

/** working -> needs_review. Null when the job isn't in "working" (late or duplicate report). */
export async function completeJob(id: string, result: JobResult): Promise<OfferJob | null> {
  await ensureSchema();
  const s = sql();
  const rows = await s`
    UPDATE offer_jobs SET status = 'needs_review', result = ${s.json(result as never)}, error = NULL, updated_at = now()
    WHERE id = ${id} AND status = 'working'
    RETURNING *`;
  return rows[0] ? toJob(rows[0]) : null;
}

export async function failJob(id: string, error: string): Promise<OfferJob | null> {
  await ensureSchema();
  const rows = await sql()`
    UPDATE offer_jobs SET status = 'failed', error = ${error.slice(0, 500)}, updated_at = now()
    WHERE id = ${id} AND status IN ('queued', 'working')
    RETURNING *`;
  return rows[0] ? toJob(rows[0]) : null;
}

/** needs_review -> approved / changes_requested. Null if already decided (double click). */
export async function reviewJob(
  id: string,
  by: string,
  decision: "approved" | "changes_requested",
): Promise<OfferJob | null> {
  await ensureSchema();
  const rows = await sql()`
    UPDATE offer_jobs SET status = ${decision}, reviewed_by = ${by}, reviewed_at = now(), updated_at = now()
    WHERE id = ${id} AND status = 'needs_review'
    RETURNING *`;
  return rows[0] ? toJob(rows[0]) : null;
}

export async function listRecent(limit = 50): Promise<OfferJob[]> {
  await ensureSchema();
  const rows = await sql()`SELECT * FROM offer_jobs ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map(toJob);
}

// ------------------------------------------------- conversational intake (Stage 1)

export type ConvoStatus = "collecting" | "confirming" | "done" | "cancelled";

/** The offer exactly as the agent saw it on the confirmation card. Confirm uses THIS, not a recompute. */
export interface ConvoSnapshot {
  inputs: BuyerOfferInputs;
  defaulted: string[];
}

export interface OfferConvo {
  id: string;
  channelId: string;
  threadTs: string;
  requestedBy: string;
  speakerName: string;
  stated: StatedTerms;
  snapshot: ConvoSnapshot | null;
  status: ConvoStatus;
  cardTs: string | null;
  turns: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toConvo(r: any): OfferConvo {
  return {
    id: r.id,
    channelId: r.channel_id,
    threadTs: r.thread_ts,
    requestedBy: r.requested_by,
    speakerName: r.speaker_name ?? "",
    stated: r.stated ?? {},
    snapshot: r.snapshot ?? null,
    status: r.status,
    cardTs: r.card_ts ?? null,
    turns: r.turns,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** True the first time a Slack message key is seen, false for every repeat. */
export async function markSeen(key: string): Promise<boolean> {
  await ensureSchema();
  const s = sql();
  const rows = await s`INSERT INTO offer_events_seen (key) VALUES (${key}) ON CONFLICT DO NOTHING RETURNING key`;
  if (Math.random() < 0.02) await s`DELETE FROM offer_events_seen WHERE seen_at < now() - interval '2 days'`;
  return rows.length > 0;
}

export async function getConvoByThread(channelId: string, threadTs: string): Promise<OfferConvo | null> {
  await ensureSchema();
  const rows = await sql()`SELECT * FROM offer_conversations WHERE channel_id = ${channelId} AND thread_ts = ${threadTs}`;
  return rows[0] ? toConvo(rows[0]) : null;
}

export async function getConvo(id: string): Promise<OfferConvo | null> {
  await ensureSchema();
  const rows = await sql()`SELECT * FROM offer_conversations WHERE id = ${id}`;
  return rows[0] ? toConvo(rows[0]) : null;
}

export async function createConvo(args: {
  channelId: string;
  threadTs: string;
  requestedBy: string;
  speakerName: string;
}): Promise<OfferConvo> {
  await ensureSchema();
  const s = sql();
  const rows = await s`
    INSERT INTO offer_conversations (channel_id, thread_ts, requested_by, speaker_name)
    VALUES (${args.channelId}, ${args.threadTs}, ${args.requestedBy}, ${args.speakerName})
    ON CONFLICT (channel_id, thread_ts) DO NOTHING
    RETURNING *`;
  if (rows[0]) return toConvo(rows[0]);
  return (await getConvoByThread(args.channelId, args.threadTs)) as OfferConvo;
}

export async function saveConvo(
  id: string,
  patch: { stated?: StatedTerms; snapshot?: ConvoSnapshot | null; status?: ConvoStatus; cardTs?: string | null; turns?: number; speakerName?: string },
): Promise<void> {
  await ensureSchema();
  const s = sql();
  await s`
    UPDATE offer_conversations SET
      stated = COALESCE(${patch.stated ? s.json(patch.stated as never) : null}, stated),
      snapshot = CASE WHEN ${patch.snapshot !== undefined} THEN ${patch.snapshot ? s.json(patch.snapshot as never) : null} ELSE snapshot END,
      status = COALESCE(${patch.status ?? null}, status),
      card_ts = CASE WHEN ${patch.cardTs !== undefined} THEN ${patch.cardTs ?? null} ELSE card_ts END,
      turns = COALESCE(${patch.turns ?? null}, turns),
      speaker_name = COALESCE(${patch.speakerName ?? null}, speaker_name),
      updated_at = now()
    WHERE id = ${id}`;
}

/** confirming -> done, only if the card the agent clicked is still the current one. Null otherwise. */
export async function finishConvo(id: string, version: number): Promise<OfferConvo | null> {
  await ensureSchema();
  const rows = await sql()`
    UPDATE offer_conversations SET status = 'done', updated_at = now()
    WHERE id = ${id} AND status = 'confirming' AND turns = ${version}
    RETURNING *`;
  return rows[0] ? toConvo(rows[0]) : null;
}

export async function cancelConvo(id: string): Promise<OfferConvo | null> {
  await ensureSchema();
  const rows = await sql()`
    UPDATE offer_conversations SET status = 'cancelled', updated_at = now()
    WHERE id = ${id} AND status IN ('collecting', 'confirming')
    RETURNING *`;
  return rows[0] ? toConvo(rows[0]) : null;
}
