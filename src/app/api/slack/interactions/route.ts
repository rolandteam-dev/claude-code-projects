import { NextResponse, after } from "next/server";
import { canReview, isAllowedUser } from "@/lib/offers/config";
import { createJob, getJob, reviewJob, setThread, type OfferJob } from "@/lib/offers/db";
import {
  postJobRoot,
  readModalValues,
  refreshJobMessage,
  replyInThread,
  slackApi,
  verifySlackSignature,
} from "@/lib/offers/slack";
import { validateBuyerForm } from "@/lib/offers/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Slack interactivity endpoint (modal submit + button clicks).
 *
 *   view_submission "offer_buyer"  → validate the typed terms, queue a job, close
 *                                    the modal, post the thread in the background.
 *   block_actions offer_approve /
 *                 offer_changes    → record the reviewer's decision, refresh the thread.
 *
 * Slack wants a reply within 3 seconds, so anything that talks to Slack's Web API
 * runs in after(). Only the cheap, decision-making work is inline.
 *
 * SECURITY: public endpoint; fails closed without SLACK_SIGNING_SECRET and a valid
 * signature. Every action re-checks the allowlist — a leaked job id is not enough.
 *
 * Approving only records the decision. Nothing in this app sends a contract.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function modalErrors(errors: Record<string, string>) {
  return NextResponse.json({ response_action: "errors", errors });
}

async function handleSubmission(payload: any) {
  if (payload.view?.callback_id !== "offer_buyer") return new Response(null, { status: 200 });

  const userId: string = payload.user?.id ?? "";
  if (!isAllowedUser(userId)) return modalErrors({ address: "You're not set up to draft offers." });

  const checked = validateBuyerForm(readModalValues(payload.view.state?.values ?? {}));
  if (!checked.ok) return modalErrors(checked.errors);

  let channelId: string | null = null;
  try {
    channelId = JSON.parse(payload.view.private_metadata || "{}").channelId || null;
  } catch {
    /* no channel recorded: the thread falls back to a DM */
  }

  let job: OfferJob;
  try {
    job = await createJob({ jobType: "buyer_offer", requestedBy: userId, channelId, inputs: checked.inputs });
  } catch (e) {
    console.error("[offers] createJob failed", e);
    return modalErrors({ address: "Couldn't save this draft request. Try again." });
  }

  after(async () => {
    try {
      const posted = await postJobRoot(job);
      if (posted) await setThread(job.id, posted.channel, posted.ts);
    } catch (e) {
      console.error("[offers] posting thread failed", e);
    }
  });

  return new Response(null, { status: 200 });
}

async function ephemeralTo(job: OfferJob | null, payload: any, text: string) {
  const channel = job?.channelId || payload.channel?.id;
  if (!channel) return;
  await slackApi("chat.postEphemeral", { channel, user: payload.user?.id, text });
}

async function handleReview(payload: any, decision: "approved" | "changes_requested", jobId: string) {
  const userId: string = payload.user?.id ?? "";
  const job = await getJob(jobId);
  if (!job) return ephemeralTo(null, payload, "I couldn't find that draft.");

  if (!canReview(job.requestedBy, userId)) {
    return ephemeralTo(job, payload, "Only the agent who requested this draft, or a listed reviewer, can decide on it.");
  }
  if (decision === "approved" && (job.result?.mismatches.length ?? 0) > 0) {
    return ephemeralTo(job, payload, "This draft disagrees with the typed terms, so it can't be approved. Request changes instead.");
  }

  const updated = await reviewJob(jobId, userId, decision);
  if (!updated) {
    // Someone else decided first (or a double click). Make sure the message reflects reality.
    await refreshJobMessage(job);
    return ephemeralTo(job, payload, "That draft was already decided.");
  }
  await refreshJobMessage(updated);
  if (decision === "approved") {
    await replyInThread(updated, `Approved by <@${userId}>. The draft is in TransactionDesk; sending it for signature is still a manual step.`);
  }
}

export async function POST(req: Request) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "slack not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifySlackSignature(secret, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature"), raw)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }

  if (payload.type === "view_submission") return handleSubmission(payload);

  if (payload.type === "block_actions") {
    const action = payload.actions?.[0];
    const jobId = String(action?.value ?? "");
    if ((action?.action_id === "offer_approve" || action?.action_id === "offer_changes") && UUID.test(jobId)) {
      const decision = action.action_id === "offer_approve" ? "approved" : "changes_requested";
      after(async () => {
        try {
          await handleReview(payload, decision, jobId);
        } catch (e) {
          console.error("[offers] review failed", e);
        }
      });
    }
  }

  return new Response(null, { status: 200 });
}
