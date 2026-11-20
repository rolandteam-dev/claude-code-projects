import { NextResponse, after } from "next/server";
import { autoStartChannel, channelAllowed, isAllowedUser } from "@/lib/offers/config";
import { markSeen, offersDbConfigured } from "@/lib/offers/db";
import { say } from "@/lib/offers/convoMessages";
import { verifySlackSignature } from "@/lib/offers/slack";
import { handleTurn } from "@/lib/offers/turn";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Slack Events API endpoint: how the bot hears an agent's plain-English request.
 *
 *   app_mention             "@Offers write an offer for ..." (anywhere the bot is invited)
 *   message (in a thread)   the agent's answer to a question, or an edit to the card
 *   message (top level)     only in OFFER_CHANNEL_ID, from allowed users, no @mention needed
 *
 * Slack wants a reply in 3 seconds and retries if it doesn't get one, so this
 * acknowledges immediately and does the work in after(). A mention inside a thread
 * arrives as BOTH an app_mention and a message event; markSeen() makes the
 * message count once.
 *
 * SECURITY: public endpoint; fails closed without SLACK_SIGNING_SECRET and a valid
 * signature. Only allowlisted Slack users (OFFER_ALLOWED_SLACK_USERS) are ever read.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: Request) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "slack not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifySlackSignature(secret, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature"), raw)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // Slack's one-time URL check when the endpoint is first saved.
  if (body.type === "url_verification") return NextResponse.json({ challenge: String(body.challenge ?? "") });

  // We already acknowledged the original; a retry would only double-process.
  if (req.headers.get("x-slack-retry-num")) return new Response(null, { status: 200 });
  if (body.type !== "event_callback" || !body.event) return new Response(null, { status: 200 });
  if (!offersDbConfigured()) return new Response(null, { status: 200 });

  const e = body.event;
  const isMention = e.type === "app_mention";
  const isMessage = e.type === "message";
  if (!isMention && !isMessage) return new Response(null, { status: 200 });

  // Ignore the bot's own messages, edits, joins, file shares, and anything without a person behind it.
  if (e.bot_id || e.subtype || !e.user || !e.channel || !e.ts) return new Response(null, { status: 200 });
  if (!channelAllowed(e.channel)) return new Response(null, { status: 200 });

  const threadTs: string = e.thread_ts ?? e.ts;
  const inThread = Boolean(e.thread_ts);
  const text = String(e.text ?? "").replace(/<@[A-Z0-9]+>/g, "").trim();

  // A plain message starts an offer only in the dedicated channel; in a thread it can only continue one.
  const startNew = isMention || (isMessage && !inThread && autoStartChannel(e.channel));
  if (isMessage && inThread && !text) return new Response(null, { status: 200 });

  after(async () => {
    try {
      if (!isAllowedUser(e.user)) {
        // Only tell people who actually asked for the bot; never answer ordinary chatter.
        if (isMention && (await markSeen(`${e.channel}:${e.ts}`))) {
          await say(e.channel, threadTs, { text: "You're not set up to draft offers yet. Ask Mike to add you." });
        }
        return;
      }
      if (!(await markSeen(`${e.channel}:${e.ts}`))) return;
      await handleTurn({ channelId: e.channel, threadTs, userId: e.user, text, isMention, startNew });
    } catch (err) {
      console.error("[offers] events turn failed", err);
      try {
        await say(e.channel, threadTs, { text: "Something went wrong on my end. Please try that again." });
      } catch {
        /* nothing more to do */
      }
    }
  });

  return new Response(null, { status: 200 });
}
