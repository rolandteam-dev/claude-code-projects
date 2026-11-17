import { NextResponse, after } from "next/server";
import { workerAuthorized } from "@/lib/offers/config";
import { completeJob, failJob, offersDbConfigured } from "@/lib/offers/db";
import { notifyReady, refreshJobMessage } from "@/lib/offers/slack";
import { parseJobResult } from "@/lib/offers/types";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The drafting machine reports back on a job it claimed.
 *
 *   POST /api/offers/worker/<job id>      Authorization: Bearer OFFER_WORKER_TOKEN
 *
 *   Draft saved:  { "status": "needs_review",
 *                   "result": { "summary": "...", "tdUrl": "https://...",
 *                               "flags": ["..."], "mismatches": ["..."] } }
 *   Gave up:      { "status": "failed", "error": "..." }
 *
 * `mismatches` is where the machine lists any field in the TransactionDesk draft
 * that disagrees with the typed inputs. Report them honestly: a non-empty list
 * removes the Approve button, which is the point.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!workerAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!offersDbConfigured()) return NextResponse.json({ ok: false, error: "no database configured" }, { status: 503 });

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: "bad job id" }, { status: 400 });

  let body: { status?: unknown; result?: unknown; error?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  let job;
  if (body.status === "needs_review") {
    const parsed = parseJobResult(body.result);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    job = await completeJob(id, parsed.result);
  } else if (body.status === "failed") {
    const error = typeof body.error === "string" && body.error.trim() ? body.error.trim() : "The drafting machine reported a failure.";
    job = await failJob(id, error);
  } else {
    return NextResponse.json({ ok: false, error: 'status must be "needs_review" or "failed"' }, { status: 400 });
  }

  // Null = the job wasn't in the state this report needs (already reported, re-queued, or unknown).
  if (!job) return NextResponse.json({ ok: false, error: "job is not awaiting this report" }, { status: 409 });

  after(async () => {
    try {
      await refreshJobMessage(job);
      await notifyReady(job);
    } catch (e) {
      console.error("[offers] report follow-up failed", e);
    }
  });

  return NextResponse.json({ ok: true, status: job.status });
}
