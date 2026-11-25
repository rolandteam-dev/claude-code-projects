/**
 * Offer Machine — Slack messages for the conversational intake: the confirmation
 * card, the question, and the finished terms sheet + cover email.
 */
import { OFFER_DEFAULTS_ARE_PLACEHOLDERS } from "../../content/offerDefaults";
import { esc, slackApi } from "./slack";
import { coverEmail, questionText, sheetText, type ResolvedTerms, type Source } from "./terms";
import { homeownerBrand } from "../homeowners/brand";
import { fillRpa } from "./rpa/fill";
import { draftLink, loadBlank, saveDraft } from "./rpa/store";
import { todayLasVegas, type BuyerOfferInputs } from "./types";

type Block = Record<string, unknown>;
export interface Msg {
  text: string;
  blocks?: Block[];
}

const plain = (text: string) => ({ type: "plain_text", text });
const md = (text: string): Block => ({ type: "section", text: { type: "mrkdwn", text: text.slice(0, 2900) } });
const ctx = (text: string): Block => ({ type: "context", elements: [{ type: "mrkdwn", text: text.slice(0, 2900) }] });

const SOURCE_TAG: Record<Source, string> = {
  stated: "",
  default: " _(default)_",
  lookup: " _(from MLS)_",
  speaker: " _(you)_",
};

/** Button values carry the card's version so an old card can never confirm a changed offer. */
export const buttonValue = (convoId: string, version: number) => `${convoId}.${version}`;

export function cardMessage(convoId: string, version: number, r: ResolvedTerms, notes: string[]): Msg {
  const blocks: Block[] = [
    md(
      "*Here's the offer as I understand it.* Check it, then confirm. To change anything, reply in this thread (for example \"make it $510k\").",
    ),
    md(r.display.map((d) => `*${d.label}:* ${esc(d.value)}${SOURCE_TAG[d.source]}`).join("\n")),
  ];
  if (r.defaulted.length) {
    blocks.push(ctx(`:information_source: You didn't say these, so I filled them from defaults: ${r.defaulted.join(", ")}.`));
    if (OFFER_DEFAULTS_ARE_PLACEHOLDERS) {
      blocks.push(ctx(":warning: The defaults are placeholders, not the team's standard terms yet. Check each one."));
    }
  }
  for (const n of notes) blocks.push(ctx(esc(n)));

  const actions: Block[] = [];
  if (r.errors) {
    blocks.push(md(`:no_entry: *Fix these before you can confirm:*\n${Object.values(r.errors).map((e) => `• ${esc(e)}`).join("\n")}`));
  } else {
    actions.push({
      type: "button",
      action_id: "offer_convo_confirm",
      style: "primary",
      text: plain("Confirm and get the sheet"),
      value: buttonValue(convoId, version),
    });
  }
  actions.push({ type: "button", action_id: "offer_convo_cancel", text: plain("Cancel"), value: buttonValue(convoId, version) });
  blocks.push({ type: "actions", block_id: `convo_${convoId}_${version}`, elements: actions });

  return { text: "Here's the offer as I understand it.", blocks };
}

export function questionMessage(r: ResolvedTerms, notes: string[]): Msg {
  const got = r.display.filter((d) => d.source === "stated" || d.source === "lookup");
  const lines = [
    ...notes.map(esc),
    ...(got.length ? [`Got so far: ${got.map((d) => `${d.label} ${esc(d.value)}`).join(" · ")}`] : []),
    questionText(r.missing),
  ];
  return { text: lines.join("\n\n") };
}

export const INTRO: Msg = {
  text:
    "Tell me about the offer and I'll ask for anything missing. For example: " +
    "_\"Write an offer for Mark and Megan Smith on 123 Main Street for $500,000.\"_",
};

export const supersededCard: Msg = {
  text: "Superseded.",
  blocks: [ctx("_This card was replaced by a newer one below._")],
};

export const confirmedCard = (userId: string): Msg => ({
  text: "Confirmed.",
  blocks: [md(`:white_check_mark: *Confirmed by <@${userId}>.* The offer sheet is below.`)],
});

export const cancelledCard = (userId: string): Msg => ({
  text: "Cancelled.",
  blocks: [md(`:x: *Cancelled by <@${userId}>.* Message me again to start another offer.`)],
});

/** The deliverable: a terms sheet in TransactionDesk field order, plus the cover email. */
export function sheetMessage(inputs: BuyerOfferInputs, defaulted: string[]): Msg {
  const mail = coverEmail(inputs);
  return {
    text: `Offer sheet for ${inputs.address}`,
    blocks: [
      md(`*Offer sheet for ${esc(inputs.address)}*\nKey these into your TransactionDesk offer, then send it as usual. Nothing has been sent.`),
      md("```" + esc(sheetText(inputs, defaulted)) + "```"),
      md("*Cover email draft* (fill in the listing agent's name and your contact details)"),
      md("```" + esc(`Subject: ${mail.subject}\n\n${mail.body}`) + "```"),
    ],
  };
}

/**
 * The terms sheet plus, when the blank RPA is stored, a link to the filled RPA draft.
 * Never throws: if the form can't be filled the agent still gets the sheet.
 */
export async function sheetMessageWithRpa(inputs: BuyerOfferInputs, defaulted: string[]): Promise<Msg> {
  const msg = sheetMessage(inputs, defaulted);
  try {
    const blank = await loadBlank();
    if (!blank) return msg;
    const filled = await fillRpa(blank, inputs, todayLasVegas());
    const link = draftLink(await saveDraft(filled.pdf), homeownerBrand.baseUrl);
    if (!link) return msg;
    const todo = filled.stillToDo.map((t) => `• ${t}`).join("\n");
    const warn = filled.warnings.length ? `\n:warning: ${filled.warnings.join(" ")}` : "";
    const placeholder = OFFER_DEFAULTS_ARE_PLACEHOLDERS && defaulted.length ? "\n:warning: Some terms are placeholder defaults, so check them." : "";
    msg.blocks = [
      ...(msg.blocks ?? []),
      md(
        `*Filled Residential Purchase Agreement (draft)*\n<${link}|Download the RPA draft (PDF)> (link works for 7 days)\n` +
          `Review it, finish the blanks below, then upload it to TransactionDesk to sign and send.${warn}${placeholder}`,
      ),
      md(`*Still for you to complete:*\n${todo}`),
    ];
  } catch (e) {
    console.error("[offers] RPA draft failed", e);
  }
  return msg;
}

/** Post in a thread; returns the new message's ts. */
export async function say(channel: string, threadTs: string, msg: Msg): Promise<string | null> {
  const res = await slackApi("chat.postMessage", { channel, thread_ts: threadTs, unfurl_links: false, ...msg });
  return res.ok && res.ts ? res.ts : null;
}

export async function edit(channel: string, ts: string, msg: Msg): Promise<void> {
  await slackApi("chat.update", { channel, ts, blocks: [], ...msg });
}

/**
 * Post the terms sheet for the /offer form (no thread to reply into): try the
 * channel the command ran in, then a DM with the agent, so it is never lost.
 */
export async function postSheet(targets: Array<string | null>, inputs: BuyerOfferInputs, defaulted: string[]): Promise<void> {
  for (const channel of targets.filter((c): c is string => Boolean(c))) {
    const res = await slackApi("chat.postMessage", { channel, unfurl_links: false, ...(await sheetMessageWithRpa(inputs, defaulted)) });
    if (res.ok) return;
  }
}
