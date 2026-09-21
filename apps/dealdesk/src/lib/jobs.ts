import { and, eq, lte, sql } from "drizzle-orm";
import { getAdminDb } from "@/db";
import * as s from "@/db/schema";

/**
 * Database-backed job queue, drained by /api/cron/jobs once a minute.
 *
 * Deliberately not a third-party queue: rows survive deploys, retries are
 * visible, and a failed extraction or send stays debuggable after the fact.
 * Runs on the owner connection because the queue spans tenants.
 */

export type JobKind =
  | "heartbeat"
  | "extract_contract"
  | "process_inbound_email"
  | "send_notification"
  | "score_deal_risk";

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

/** Handlers are registered per phase. Phase 0 ships the heartbeat only. */
const handlers: Partial<Record<JobKind, JobHandler>> = {
  heartbeat: async () => {
    // Proves the runner works end to end before real work exists.
  },
};

export function registerHandler(kind: JobKind, handler: JobHandler) {
  handlers[kind] = handler;
}

export async function enqueue(args: {
  kind: JobKind;
  payload?: Record<string, unknown>;
  teamId?: string | null;
  runAfter?: Date;
  maxAttempts?: number;
}) {
  const db = getAdminDb();
  const [job] = await db
    .insert(s.jobs)
    .values({
      kind: args.kind,
      payload: args.payload ?? {},
      teamId: args.teamId ?? null,
      runAfter: args.runAfter ?? new Date(),
      maxAttempts: args.maxAttempts ?? 5,
    })
    .returning();
  return job;
}

export type DrainResult = {
  claimed: number;
  succeeded: number;
  failed: number;
  details: Array<{ id: string; kind: string; ok: boolean; error?: string }>;
};

/**
 * Claims up to `limit` due jobs and runs them.
 *
 * The claim uses `for update skip locked`, so two overlapping cron invocations
 * cannot pick up the same job — the usual cause of duplicate emails and
 * duplicate texts in a naive queue.
 */
export async function drainJobs(limit = 20): Promise<DrainResult> {
  const db = getAdminDb();
  const runnerId = `runner-${Math.random().toString(36).slice(2, 10)}`;

  const claimed = await db.execute(sql`
    with due as (
      select id from ${s.jobs}
      where state = 'queued' and run_after <= now()
      order by run_after
      limit ${limit}
      for update skip locked
    )
    update ${s.jobs} j
    set state = 'running', locked_at = now(), locked_by = ${runnerId},
        attempts = j.attempts + 1
    from due
    where j.id = due.id
    returning j.id, j.kind, j.payload, j.attempts, j.max_attempts
  `);

  const rows = claimed as unknown as Array<{
    id: string;
    kind: JobKind;
    payload: Record<string, unknown>;
    attempts: number;
    max_attempts: number;
  }>;

  const result: DrainResult = {
    claimed: rows.length,
    succeeded: 0,
    failed: 0,
    details: [],
  };

  for (const row of rows) {
    const handler = handlers[row.kind];
    try {
      if (!handler) {
        throw new Error(`No handler registered for job kind "${row.kind}"`);
      }
      await handler(row.payload);
      await db
        .update(s.jobs)
        .set({ state: "succeeded", finishedAt: new Date(), lastError: null })
        .where(eq(s.jobs.id, row.id));
      result.succeeded += 1;
      result.details.push({ id: row.id, kind: row.kind, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Exhausted retries go to `dead` so they stop consuming runner capacity
      // but stay on the table for inspection.
      const exhausted = row.attempts >= row.max_attempts;
      await db
        .update(s.jobs)
        .set({
          state: exhausted ? "dead" : "queued",
          lastError: message,
          lockedAt: null,
          lockedBy: null,
          // Exponential backoff: 1m, 2m, 4m, 8m…
          runAfter: new Date(Date.now() + 60_000 * 2 ** (row.attempts - 1)),
          finishedAt: exhausted ? new Date() : null,
        })
        .where(eq(s.jobs.id, row.id));
      result.failed += 1;
      result.details.push({
        id: row.id,
        kind: row.kind,
        ok: false,
        error: message,
      });
    }
  }

  return result;
}

/** Re-queues jobs a crashed runner left locked in `running`. */
export async function requeueStale(olderThanMinutes = 10) {
  const db = getAdminDb();
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const rows = await db
    .update(s.jobs)
    .set({ state: "queued", lockedAt: null, lockedBy: null })
    .where(and(eq(s.jobs.state, "running"), lte(s.jobs.lockedAt, cutoff)))
    .returning({ id: s.jobs.id });
  return rows.length;
}
