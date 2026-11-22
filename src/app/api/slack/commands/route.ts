import { NextResponse } from "next/server";
import { isAllowedUser } from "@/lib/offers/config";
import { offersDbConfigured } from "@/lib/offers/db";
import { buildBuyerModal, slackApi, verifySlackSignature } from "@/lib/offers/slack";
import { ENABLED_JOB_TYPES, JOB_TYPE_LABEL, parseJobType } from "@/lib/offers/types";

export const runtime = "nodejs";

/**
 * Slack slash command: `/offer` (buyer offer), `/offer counter`, `/offer review`.
 *
 * Opens the intake modal. Slack gives a trigger_id that expires in ~3 seconds, so
 * views.open is called inline — not deferred. The job itself is created when the
 * modal is submitted (see /api/slack/interactions).
 *
 * SECURITY: public endpoint; refuses everything unless SLACK_SIGNING_SECRET is set
 * and the request signature checks out, and only allowlisted Slack users get a
 * modal (OFFER_ALLOWED_SLACK_USERS — empty means nobody).
 */
const ephemeral = (text: string) => NextResponse.json({ response_type: "ephemeral", text });

export async function POST(req: Request) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "slack not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifySlackSignature(secret, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature"), raw)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  const form = new URLSearchParams(raw);
  const userId = form.get("user_id");
  if (!isAllowedUser(userId)) {
    return ephemeral("You're not set up to draft offers yet. Ask Mike to add you.");
  }

  const type = parseJobType(form.get("text"));
  if (!type) {
    return ephemeral("Try `/offer` for a buyer offer. (`/offer counter` and `/offer review` are coming.)");
  }
  if (!ENABLED_JOB_TYPES.includes(type)) {
    return ephemeral(`${JOB_TYPE_LABEL[type]} isn't switched on yet. For now, \`/offer\` drafts buyer offers.`);
  }
  if (!offersDbConfigured()) {
    return ephemeral("The offer machine has no database configured, so it can't queue drafts.");
  }

  const triggerId = form.get("trigger_id");
  if (!triggerId) return ephemeral("Slack didn't send a trigger. Try the command again.");

  const res = await slackApi("views.open", {
    trigger_id: triggerId,
    view: buildBuyerModal(form.get("channel_id") ?? ""),
  });
  if (!res.ok) {
    return ephemeral(`Couldn't open the form (${res.error ?? "unknown error"}). Try again in a moment.`);
  }
  // Empty 200: the modal is the response.
  return new Response(null, { status: 200 });
}
