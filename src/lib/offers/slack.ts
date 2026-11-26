/**
 * Offer Machine — Slack plumbing: request verification, Web API calls, the
 * intake modal, and the thread message. Block Kit is built as plain objects.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { OfferJob } from "./db";
import {
  CONTINGENCIES,
  CONTINGENCY_LABEL,
  FINANCING,
  FINANCING_LABEL,
  JOB_TYPE_LABEL,
  formatMoney,
  type RawBuyerForm,
} from "./types";

type Block = Record<string, unknown>;

/** Slack signs `v0:{timestamp}:{raw body}`; reject anything older than 5 minutes (replay). */
export function verifySlackSignature(
  secret: string,
  timestamp: string | null,
  signature: string | null,
  rawBody: string,
  nowMs: number = Date.now(),
): boolean {
  if (!timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > 300) return false;
  const expected = "v0=" + createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface SlackResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
}

/** SLACK_API_BASE exists so tests can point the app at a fake Slack. Production leaves it unset. */
const slackBase = () => process.env.SLACK_API_BASE || "https://slack.com/api";

/** Read endpoints (users.info, users.list) take query parameters, not a JSON body. */
export async function slackGet(method: string, params: Record<string, string>): Promise<Record<string, unknown> & SlackResponse> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "no_token" };
  try {
    const res = await fetch(`${slackBase()}/${method}?${new URLSearchParams(params)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function slackApi(method: string, body: Record<string, unknown>): Promise<SlackResponse> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "no_token" };
  try {
    const res = await fetch(`${slackBase()}/${method}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as SlackResponse;
    // Silent failures (a wrong bot token, a missing scope, a bot not in the channel) were invisible; say so.
    if (!json.ok) console.error(`[offers] slack ${method} failed: ${json.error ?? "unknown error"}`);
    return json;
  } catch (e) {
    console.error(`[offers] slack ${method} request failed: ${String(e)}`);
    return { ok: false, error: String(e) };
  }
}

/** Slack mrkdwn treats & < > as control characters; user text must never inject mentions or links. */
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const plain = (text: string) => ({ type: "plain_text", text });

function textInput(blockId: string, label: string, opts: { optional?: boolean; multiline?: boolean; hint?: string; placeholder?: string } = {}): Block {
  return {
    type: "input",
    block_id: blockId,
    optional: opts.optional ?? false,
    label: plain(label),
    ...(opts.hint ? { hint: plain(opts.hint) } : {}),
    element: {
      type: "plain_text_input",
      action_id: "v",
      ...(opts.multiline ? { multiline: true } : {}),
      ...(opts.placeholder ? { placeholder: plain(opts.placeholder) } : {}),
    },
  };
}

const STANDARD_CONTINGENCIES = ["inspection", "appraisal", "loan"] as const;

/** The Phase 1 modal: a buyer offer. `channelId` rides along so the thread posts where it was asked. */
export function buildBuyerModal(channelId: string): Block {
  return {
    type: "modal",
    callback_id: "offer_buyer",
    private_metadata: JSON.stringify({ channelId }),
    title: plain("Buyer offer"),
    submit: plain("Draft offer"),
    close: plain("Cancel"),
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "The terms you type here are what goes into the contract. This creates a *draft* for you to review; nothing is sent to the seller side.",
        },
      },
      textInput("address", "Property address", { placeholder: "1234 Example St, Las Vegas NV 89xxx" }),
      textInput("client_name", "Buyer name(s)", { hint: "Everyone on the offer, e.g. Mark Smith and Megan Smith." }),
      textInput("list_price", "List price", { placeholder: "850000" }),
      textInput("offer_price", "Offer price", { placeholder: "835000" }),
      {
        type: "input",
        block_id: "financing",
        label: plain("Financing"),
        element: {
          type: "static_select",
          action_id: "v",
          placeholder: plain("How is the buyer paying?"),
          options: FINANCING.map((f) => ({ text: plain(FINANCING_LABEL[f]), value: f })),
        },
      },
      textInput("down_payment_percent", "Down payment (%)", {
        optional: true,
        placeholder: "5",
        hint: "Percent of the price. Required unless it is a cash offer. FHA is at least 3.5%.",
      }),
      {
        type: "input",
        block_id: "occupy",
        label: plain("Will the buyers live in the home?"),
        element: {
          type: "static_select",
          action_id: "v",
          placeholder: plain("Page 1 of the contract asks"),
          options: [
            { text: plain("Yes, it will be their residence"), value: "yes" },
            { text: plain("No (investment, second home)"), value: "no" },
          ],
        },
      },
      textInput("earnest_money", "Earnest money deposit", { optional: true, placeholder: "Blank = 1% of the price", hint: "The team's standard is 1%, wired within 3 business days." }),
      {
        type: "input",
        block_id: "close_date",
        optional: true,
        label: plain("Close of escrow"),
        hint: plain("Blank = 30 days out, moved to a Tue/Wed/Thu that isn't a holiday."),
        element: { type: "datepicker", action_id: "v" },
      },
      {
        type: "input",
        block_id: "contingencies",
        optional: true,
        label: plain("Contingencies"),
        hint: plain("Inspection, appraisal and loan are pre-checked (the standard). Uncheck to waive one."),
        element: {
          type: "checkboxes",
          action_id: "v",
          initial_options: STANDARD_CONTINGENCIES.map((c) => ({ text: plain(CONTINGENCY_LABEL[c]), value: c })),
          options: CONTINGENCIES.map((c) => ({ text: plain(CONTINGENCY_LABEL[c]), value: c })),
        },
      },
      textInput("inspection_days", "Inspection / due diligence days", { optional: true, placeholder: "Blank = 10" }),
      textInput("appraisal_days", "Appraisal days", { optional: true, placeholder: "Blank = 21" }),
      textInput("loan_days", "Loan days", { optional: true, placeholder: "Blank = 30" }),
      textInput("seller_credit", "Seller credit toward closing costs ($)", { optional: true, placeholder: "10000" }),
      {
        type: "input",
        block_id: "home_warranty",
        optional: true,
        label: plain("Home warranty"),
        hint: plain("Blank = the team's standard: seller pays (Achosa, up to $795)."),
        element: {
          type: "static_select",
          action_id: "v",
          placeholder: plain("Standard (seller pays)"),
          options: [
            { text: plain("Seller pays"), value: "seller" },
            { text: plain("Buyer pays"), value: "buyer" },
          ],
        },
      },
      textInput("inclusions", "Items included with the sale", {
        optional: true,
        multiline: true,
        placeholder: "refrigerator, washer, dryer, window coverings",
        hint: "Separate with commas or new lines.",
      }),
      textInput("mls_number", "MLS number", { optional: true, hint: "Goes on the personal-property line of the contract." }),
      textInput("agent_name", "Agent writing the offer", { optional: true, hint: "Blank = you." }),
      textInput("fub_person_id", "Follow Up Boss id", { optional: true, hint: "Digits from the FUB contact URL." }),
      textInput("notes", "Notes for the drafter", {
        optional: true,
        multiline: true,
        hint: "Context only. Notes never change price, dates or contingencies; use the fields above.",
      }),
    ],
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Pull plain values out of a view_submission's state, keyed by block id. */
export function readModalValues(stateValues: Record<string, Record<string, any>>): RawBuyerForm {
  const out: Record<string, string | string[] | undefined> = {};
  for (const [blockId, actions] of Object.entries(stateValues ?? {})) {
    const el = actions?.v;
    if (!el) continue;
    if (el.type === "static_select") out[blockId] = el.selected_option?.value;
    else if (el.type === "datepicker") out[blockId] = el.selected_date ?? undefined;
    else if (el.type === "checkboxes") out[blockId] = (el.selected_options ?? []).map((o: any) => String(o.value));
    else out[blockId] = el.value ?? undefined;
  }
  // The inclusions box is free text; the contract wants one item per entry.
  if (typeof out.inclusions === "string") {
    out.inclusions = out.inclusions.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  }
  return out as RawBuyerForm;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const STATUS_LINE: Record<OfferJob["status"], string> = {
  queued: ":hourglass_flowing_sand: *Queued.* Waiting for the drafting machine.",
  working: ":writing_hand: *Drafting in TransactionDesk…*",
  needs_review: ":eyes: *Draft ready for review.* Compare it to the terms above before approving.",
  approved: ":white_check_mark: *Approved.*",
  changes_requested: ":leftwards_arrow_with_hook: *Changes requested.* Run `/offer` again with the corrections.",
  failed: ":warning: *Couldn't draft this offer.*",
};

/** The terms as TYPED by the agent — shown to the reviewer next to whatever the worker reports. */
function termsText(job: OfferJob): string {
  const i = job.inputs;
  const pct = Math.round((i.offerPrice / i.listPrice) * 1000) / 10;
  const contingencies = i.contingencies.length
    ? i.contingencies.map((c) => CONTINGENCY_LABEL[c]).join(", ")
    : "None";
  return [
    `*${esc(i.address)}*`,
    `Buyer: ${esc(i.clientName)}`,
    `Offer: *${formatMoney(i.offerPrice)}*  (list ${formatMoney(i.listPrice)}, ${pct}%)`,
    `Financing: ${FINANCING_LABEL[i.financing]}`,
    `Earnest money: ${formatMoney(i.earnestMoney)}`,
    `Close of escrow: ${i.closeDate}`,
    `Contingencies: ${contingencies}`,
  ].join("\n");
}

export function jobMessage(job: OfferJob): { text: string; blocks: Block[] } {
  const title = `${JOB_TYPE_LABEL[job.jobType]} for ${job.inputs.address}`;
  const blocks: Block[] = [
    { type: "section", text: { type: "mrkdwn", text: `${JOB_TYPE_LABEL[job.jobType]} requested by <@${job.requestedBy}>` } },
    { type: "section", text: { type: "mrkdwn", text: termsText(job) } },
  ];

  let status = STATUS_LINE[job.status];
  if (job.status === "approved" && job.reviewedBy) {
    status = `:white_check_mark: *Approved by <@${job.reviewedBy}>.* Send it through Authentisign yourself. This tool never sends.`;
  } else if (job.status === "changes_requested" && job.reviewedBy) {
    status = `:leftwards_arrow_with_hook: *Changes requested by <@${job.reviewedBy}>.* Run \`/offer\` again with the corrections.`;
  } else if (job.status === "failed") {
    status = `${STATUS_LINE.failed}${job.error ? ` ${esc(job.error)}` : ""}`;
  }
  blocks.push({ type: "section", text: { type: "mrkdwn", text: status } });

  const r = job.result;
  if (r) {
    const lines = [esc(r.summary)];
    if (r.tdUrl) lines.push(`<${r.tdUrl}|Open the draft in TransactionDesk>`);
    blocks.push({ type: "section", text: { type: "mrkdwn", text: lines.join("\n").slice(0, 2900) } });
    if (r.mismatches.length) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:no_entry: *The draft disagrees with the terms above.* It can't be approved until this is fixed:\n${r.mismatches.map((m) => `• ${esc(m)}`).join("\n")}`.slice(0, 2900),
        },
      });
    }
    if (r.flags.length) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `:triangular_flag_on_post: *Check these:*\n${r.flags.map((f) => `• ${esc(f)}`).join("\n")}`.slice(0, 2900) },
      });
    }
  }

  if (job.status === "needs_review") {
    const actions: Block[] = [];
    if (!r || r.mismatches.length === 0) {
      actions.push({
        type: "button",
        action_id: "offer_approve",
        style: "primary",
        text: plain("Approve"),
        value: job.id,
        confirm: {
          title: plain("Approve this draft?"),
          text: plain("I compared the TransactionDesk draft to these terms. Approving does not send anything."),
          confirm: plain("Approve"),
          deny: plain("Not yet"),
        },
      });
    }
    actions.push({ type: "button", action_id: "offer_changes", text: plain("Request changes"), value: job.id });
    blocks.push({ type: "actions", block_id: `review_${job.id}`, elements: actions });
  }

  return { text: title, blocks };
}

/**
 * First post for a job. Tries the channel the command was run in; if the bot
 * isn't a member (or it was a DM), falls back to a DM with the requester so the
 * job is never invisible.
 */
export async function postJobRoot(job: OfferJob): Promise<{ channel: string; ts: string } | null> {
  const msg = jobMessage(job);
  const targets = [job.channelId, job.requestedBy].filter((c): c is string => Boolean(c));
  for (const channel of targets) {
    const res = await slackApi("chat.postMessage", { channel, ...msg, unfurl_links: false });
    if (res.ok && res.ts && res.channel) return { channel: res.channel, ts: res.ts };
  }
  return null;
}

/** Re-render the job's Slack message after a status change. No-op if it was never posted. */
export async function refreshJobMessage(job: OfferJob): Promise<void> {
  if (!job.channelId || !job.threadTs) return;
  await slackApi("chat.update", { channel: job.channelId, ts: job.threadTs, ...jobMessage(job) });
}

export async function replyInThread(job: OfferJob, text: string): Promise<void> {
  if (!job.channelId || !job.threadTs) return;
  await slackApi("chat.postMessage", { channel: job.channelId, thread_ts: job.threadTs, text, unfurl_links: false });
}

/** Ping the requester in the thread when a draft lands or fails. */
export async function notifyReady(job: OfferJob): Promise<void> {
  if (job.status === "needs_review") await replyInThread(job, `<@${job.requestedBy}> your draft is ready for review.`);
  else if (job.status === "failed") await replyInThread(job, `<@${job.requestedBy}> the draft couldn't be created.`);
}
