/**
 * Offer Machine — one conversational turn. Called from the Slack events route
 * after the response has gone out (Slack wants an answer in 3 seconds).
 *
 *   message in -> Claude reads it -> merge -> (agent name check, MLS lookup)
 *              -> resolve against defaults -> ask for what's missing OR show the card
 *
 * Every decision about the offer is made by terms.ts; the model only reads.
 */
import { createConvo, getConvoByThread, saveConvo } from "./db";
import { cardMessage, edit, INTRO, questionMessage, say, supersededCard } from "./convoMessages";
import { extractTerms } from "./extract";
import { lookupListing } from "./lookup";
import { slackUserName, teamMemberNames } from "./people";
import { hasAnyTerm, matchPerson, mergeStated, resolveTerms } from "./terms";
import { todayLasVegas } from "./types";

/** A thread this long has drifted; starting fresh is safer than a confused model. */
const MAX_TURNS = 15;

export async function handleTurn(a: {
  channelId: string;
  threadTs: string;
  userId: string;
  text: string;
  isMention: boolean;
  /** Whether a message with no existing conversation may start one. */
  startNew: boolean;
}): Promise<void> {
  const { channelId, threadTs } = a;

  let convo = await getConvoByThread(channelId, threadTs);
  if (!convo) {
    if (!a.startNew) return;
    convo = await createConvo({
      channelId,
      threadTs,
      requestedBy: a.userId,
      speakerName: (await slackUserName(a.userId)) ?? "",
    });
  }

  if (convo.requestedBy !== a.userId) {
    if (a.isMention) await say(channelId, threadTs, { text: `This offer belongs to <@${convo.requestedBy}>. Message me in the channel to start your own.` });
    return;
  }
  if (convo.status === "done" || convo.status === "cancelled") {
    if (a.isMention) await say(channelId, threadTs, { text: "That offer is finished. Message me in the channel to start another." });
    return;
  }
  if (convo.turns >= MAX_TURNS) {
    await say(channelId, threadTs, { text: "This thread has gone on long enough that I'd start getting things wrong. Message me in the channel to start fresh." });
    return;
  }

  let speakerName = convo.speakerName;
  if (!speakerName) {
    speakerName = (await slackUserName(a.userId)) ?? "";
    if (speakerName) await saveConvo(convo.id, { speakerName });
  }

  const today = todayLasVegas();
  const turns = convo.turns + 1;

  if (!a.text.trim()) {
    await say(channelId, threadTs, INTRO);
    await saveConvo(convo.id, { turns });
    return;
  }

  // What the bot last asked for, so a bare "cash" or "10k" is read in context.
  const priorMissing = resolveTerms(convo.stated, { speakerName, today }).missing;
  const lastQuestion = priorMissing.length
    ? `I asked for: ${priorMissing.join("; ")}`
    : convo.status === "confirming"
      ? "I showed a confirmation card; the agent may confirm or change a term"
      : null;

  const result = await extractTerms({ message: a.text, current: convo.stated, lastQuestion, today });
  if (result.kind === "not_configured") {
    await say(channelId, threadTs, { text: "I'm not connected to Claude yet, so I can't read requests. Ask Mike to set ANTHROPIC_API_KEY. The /offer form still works." });
    return;
  }
  if (result.kind !== "ok") {
    console.error("[offers] extraction failed:", result.kind, "message" in result ? result.message : "");
    await say(channelId, threadTs, { text: "I couldn't read that one. Try rephrasing it, or use the /offer form." });
    await saveConvo(convo.id, { turns });
    return;
  }

  const { terms, cancel } = result.extraction;

  if (cancel) {
    await saveConvo(convo.id, { status: "cancelled", turns });
    if (convo.cardTs) await edit(channelId, convo.cardTs, supersededCard);
    await say(channelId, threadTs, { text: "Cancelled. Message me again whenever you want to write another offer." });
    return;
  }

  if (!hasAnyTerm(terms)) {
    await say(channelId, threadTs, convo.turns === 0 ? INTRO : { text: "I didn't catch an offer detail in that. Tell me what to change, or use the buttons on the card." });
    await saveConvo(convo.id, { turns });
    return;
  }

  const notes: string[] = [];
  const stated = mergeStated(convo.stated, terms);

  // "as the agent Mike Rowland": match against the team instead of trusting the spelling.
  if (terms.agentName) {
    const match = matchPerson(terms.agentName, await teamMemberNames());
    if (match) {
      stated.agentName = match.name;
      if (!match.exact) notes.push(`I read "${terms.agentName}" as ${match.name}.`);
    } else {
      notes.push(`I couldn't find "${terms.agentName}" on the team, so I used it as typed. Check the spelling.`);
    }
  }

  // MLS lookup, once per address. A miss is fine: the bot just asks for the list price.
  if (stated.address && !stated.lookup?.tried) {
    const hit = await lookupListing(stated.address);
    stated.lookup = { tried: true, ...(hit ?? {}) };
    if (hit && hit.status !== "Active" && hit.status !== "Coming Soon") {
      notes.push(`MLS shows this listing as ${hit.status}. Check that before you write the offer.`);
    }
  }

  const resolved = resolveTerms(stated, { speakerName, today });

  // An older card must never stay clickable once the offer has changed.
  if (convo.cardTs) await edit(channelId, convo.cardTs, supersededCard);

  if (resolved.missing.length > 0) {
    await say(channelId, threadTs, questionMessage(resolved, notes));
    await saveConvo(convo.id, { stated, status: "collecting", snapshot: null, cardTs: null, turns });
    return;
  }

  const cardTs = await say(channelId, threadTs, cardMessage(convo.id, turns, resolved, notes));
  await saveConvo(convo.id, {
    stated,
    status: resolved.inputs ? "confirming" : "collecting",
    snapshot: resolved.inputs ? { inputs: resolved.inputs, defaulted: resolved.defaulted } : null,
    cardTs,
    turns,
  });
}
