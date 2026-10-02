/**
 * What counts as working a lead.
 *
 * READ OFF BATTR'S PLAYBOOK, 23 Sep 2026 — "WHAT COUNTS AS A VALID
 * COMMUNICATION":
 *
 *     Logged phone call (inbound or outbound)
 *     Logged text message
 *     Logged email
 *     Stage updated to a more advanced stage
 *     Timeframe updated in FUB
 *
 *     "Automated emails do NOT count — only manual activity resets the clock."
 *
 * THIS REPLACES A POLICY WE CHOSE FOR A REASON THAT TURNED OUT NOT TO APPLY.
 *
 * Email was excluded here from day one, on the grounds that Follow Up Boss
 * makes a batch send to five hundred leads a single click, so counting email
 * would let one blast mark the whole database as worked. That reasoning was
 * sound and the conclusion was wrong: Battr already draws the line between a
 * manual email and an automated one, and counts only the first. Excluding the
 * channel entirely was a blunt fix for a problem that has a precise one.
 *
 * The cost of the blunt version was the biggest number in this project: 281
 * at risk against Battr's 15 on 22 Sep. A lead an agent emailed by hand, or
 * moved from Lead to Spoke with Customer, read to us as untouched.
 *
 * WHAT THIS MODULE WILL NOT DO IS GUESS. An email row whose origin cannot be
 * determined is neither counted nor ignored — it is reported, and the caller
 * treats the touch index as incomplete, which turns sweeps off. Counting it
 * would reopen the batch-email hole; ignoring it would sweep a lead the agent
 * actually wrote to. Neither is a decision this module is entitled to make on
 * a field it could not read.
 */

/**
 * Fields that mark an email as machine-sent. Any one of them present means the
 * message came from an action plan, a campaign or a template rather than an
 * agent typing it.
 *
 * Names are candidates, not confirmed: FUB's /v1/emails rows were inspected on
 * 12 Sep and carried no direction field at all, and these were the fields that
 * looked capable of carrying origin. `describeEmailOrigin` reports which ones
 * were actually present so this list can be narrowed from a real run rather
 * than argued about.
 */
export const AUTOMATION_FIELDS = ["actionPlanId", "campaignOrigin", "emailTemplateId", "automationId", "campaignId"];

/** Fields that mark an email as sent by a person. */
export const MANUAL_FIELDS = ["userId", "sentByUserId", "createdById"];

const present = (row, field) => {
  const v = row?.[field];
  return v !== null && v !== undefined && v !== "" && v !== false;
};

/**
 * @returns {"manual"|"automated"|"unknown"}
 *
 * Automation wins over manual: an action plan email still carries the agent's
 * user id as its sender, so "has a user id" alone cannot mean hand-written.
 */
export function emailOrigin(row) {
  if (AUTOMATION_FIELDS.some((f) => present(row, f))) return "automated";
  if (MANUAL_FIELDS.some((f) => present(row, f))) return "manual";
  return "unknown";
}

/**
 * Fold emails into a touch index, counting only the manual ones.
 *
 * Mirrors `foldTouches` and is monotonic for the same reason: it only moves
 * last-touch forward. Returns the tally so the caller can refuse to sweep on a
 * pass that could not classify what it read.
 */
export function foldEmailTouches(index, rows = [], { personId: knownPersonId = null, automated = null } = {}) {
  const tally = { manual: 0, automated: 0, unknown: 0, skipped: 0 };
  for (const row of rows) {
    // The id is KNOWN — these rows came back from /emails?personId=N. Relying
    // on the row to repeat it is what made the first version of this pass a
    // silent no-op: on 24 Sep it reported "0 manual, 0 automated, 0
    // undetermined" while the very next line listed four origin fields found
    // on the sample. Rows were read; every one of them was dropped here.
    const personId = row.personId ?? row.person?.id ?? knownPersonId;
    // FUB is not consistent about the timestamp key across endpoints, and a
    // missing one fails exactly as quietly as a missing id.
    const created = row.created ?? row.createdAt ?? row.sent ?? row.sentAt ?? row.date;
    if (!personId || !created) {
      tally.skipped++;
      continue;
    }
    const at = new Date(created).getTime();
    if (!Number.isFinite(at)) {
      tally.skipped++;
      continue;
    }

    const origin = emailOrigin(row);
    tally[origin]++;
    // Automated sends never touch the index — they are not work. They are
    // recorded on the side only so the report can measure how much of the gap
    // with Battr they would explain (gap.mjs).
    if (origin === "automated" && automated && row.isIncoming !== true) {
      automated.set(personId, Math.max(automated.get(personId) ?? 0, at));
    }
    if (origin !== "manual") continue;

    const inbound = row.isIncoming === true || row.direction === "inbound";
    const entry = index.get(personId) ?? { lastOutbound: 0, lastInbound: 0 };
    if (inbound) {
      if (at > entry.lastInbound) entry.inVia = "email";
      entry.lastInbound = Math.max(entry.lastInbound, at);
    } else {
      if (at > entry.lastOutbound) entry.outVia = "email";
      entry.lastOutbound = Math.max(entry.lastOutbound, at);
    }
    index.set(personId, entry);
  }
  return tally;
}

/**
 * Which origin fields a sample of rows actually carries, for the diagnostic.
 * Names only and counts only — no subject, body, address or lead identity.
 */
export function describeEmailOrigin(rows = []) {
  const seen = {};
  for (const field of [...AUTOMATION_FIELDS, ...MANUAL_FIELDS]) {
    const n = rows.filter((r) => present(r, field)).length;
    if (n) seen[field] = n;
  }
  return { rows: rows.length, fields: seen };
}

/**
 * The person-record timestamps for a stage advance or a timeframe change.
 *
 * Battr counts both as working a lead, and neither is a message, so neither
 * appears in any communication endpoint. If FUB carries no such timestamp the
 * answer is null and the caller says so — an agent who advances a stage and
 * never calls is then still read as untouched, which is the gap this cannot
 * close on its own.
 */
export const STAGE_UPDATED_FIELDS = ["stageUpdated", "stageUpdatedAt", "lastStageChange", "stageChanged"];
export const TIMEFRAME_UPDATED_FIELDS = ["timeframeUpdated", "timeframeUpdatedAt", "lastTimeframeChange"];

/**
 * Follow Up Boss's own "last email" dates on the person record.
 *
 * Found on 2 Oct 2026 by comparing the leads only we flag with the leads Battr
 * flagged: `lastSentEmail` and `lastEmail` sat inside the lead's window for 31
 * of 44 leads Battr leaves alone and for 0 of the 16 it flagged — a cleaner
 * split than anything else on the record. Yet 82% of the leads Battr flagged
 * had an automated email in the same window, so these fields are NOT counting
 * drips: they are the emails a person sent (or got back).
 *
 * `lastEmail` can be an email the lead sent, so it is only read when inbound
 * contact counts as a touch (it does).
 */
export const FUB_EMAIL_FIELDS = ["lastSentEmail", "lastEmail"];

/** The NEWEST of several person-record dates. profileTouchAt returns the first one present. */
export function latestProfileTouchAt(person, fields) {
  let latest = null;
  for (const field of fields) {
    if (!present(person, field)) continue;
    const at = Date.parse(person[field]);
    if (Number.isFinite(at) && (latest === null || at > latest)) latest = at;
  }
  return latest;
}

export function profileTouchAt(person, fields) {
  for (const field of fields) {
    if (!present(person, field)) continue;
    const at = Date.parse(person[field]);
    if (Number.isFinite(at)) return at;
  }
  return null;
}
