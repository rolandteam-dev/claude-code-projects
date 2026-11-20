import { NextResponse, after } from "next/server";
import { workerAuthorized } from "@/lib/offers/config";
import { claimNext, offersDbConfigured, reapStale } from "@/lib/offers/db";
import { notifyReady, refreshJobMessage } from "@/lib/offers/slack";

export const runtime = "nodejs";

/**
 * The drafting machine polls this to take the next queued job.
 *
 *   POST /api/offers/worker/claim      Authorization: Bearer OFFER_WORKER_TOKEN
 *   → { job: { id, jobType, requestedBy, inputs, attempt } | null }
 *
 * The machine (which holds the logged-in TransactionDesk session) pulls work
 * rather than receiving it, so it needs no inbound access. A claimed job that is
 * never reported back is re-queued after 20 minutes, and failed after 3 tries.
 * See docs/offer-machine.md for the full contract.
 */
export async function POST(req: Request) {
  if (!workerAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!offersDbConfigured()) return NextResponse.json({ ok: false, error: "no database configured" }, { status: 503 });

  // Jobs the reaper gave up on need their Slack message corrected.
  const dead = await reapStale();
  const job = await claimNext();

  after(async () => {
    try {
      for (const d of dead) {
        await refreshJobMessage(d);
        await notifyReady(d);
      }
      if (job) await refreshJobMessage(job);
    } catch (e) {
      console.error("[offers] claim follow-up failed", e);
    }
  });

  if (!job) return NextResponse.json({ ok: true, job: null });
  return NextResponse.json({
    ok: true,
    job: {
      id: job.id,
      jobType: job.jobType,
      requestedBy: job.requestedBy,
      inputs: job.inputs,
      attempt: job.attempts,
    },
  });
}
