/**
 * Per-agent alert digests.
 *
 * The nudge note lands on the lead; this is what tells the AGENT. Without it the
 * first an agent hears about a neglected lead is when it disappears from their
 * pipeline, which is how a sweep automation loses a team's trust.
 *
 * Mirrors the live `aida_actions_audit_alert`: send when an agent has anything
 * non-compliant, addressed to the agent, led by the admin message.
 */
import { formatRate } from "./atbats.mjs";
import { sendMail, mailConfigured } from "./email.mjs";

export const ADMIN_MESSAGE =
  "These leads have gone too long without a call, text or email from you. Please reach out to each one today.";

/**
 * Group this run's non-compliant records by owning agent.
 *
 * `sendWhen: 'any_non_compliant'` (the live setting) skips agents with a clean
 * board — an empty digest is noise that trains people to ignore the real ones.
 */
export function buildAgentDigests(
  results,
  { sendWhen = "any_non_compliant", excludeGroupIds = [], sweepDays, sweptIds = new Set(), unanswered = [], sweepsStartOn = null } = {}
) {
  const byAgent = new Map();
  const excluded = new Set(excludeGroupIds.map(Number));
  const gone = sweptIds instanceof Set ? sweptIds : new Set(sweptIds ?? []);

  const blank = (record) => ({
    agentId: record.ownerId,
    agent: record.owner || `User ${record.ownerId}`,
    atRisk: [],
    neglected: [],
    swept: [],
    unanswered: [],
  });

  const admit = (record) => {
    if (!record.ownerId) return null;
    const groups = record.contact?.owner_group_ids ?? [];
    if (groups.some((g) => excluded.has(Number(g)))) return null;
    const row = byAgent.get(record.ownerId) ?? blank(record);
    byAgent.set(record.ownerId, row);
    return row;
  };

  for (const record of results) {
    if (record.status !== "at_risk" && record.status !== "neglected") continue;
    const row = admit(record);
    if (!row) continue;

    // Three buckets, not two. A lead already moved tonight must never be listed
    // as "reach out today to keep this" — the agent would call a lead they no
    // longer own, and the next alert they get is one they don't read.
    if (record.status === "at_risk") row.atRisk.push(record);
    else if (gone.has(record.id)) row.swept.push(record);
    else row.neglected.push(record);
  }

  // A lead who called and got no call back is compliant on the clock and still
  // the most urgent thing on the agent's board. It goes at the top of their
  // email, and it is enough on its own to earn them one.
  for (const record of unanswered) {
    const row = admit(record);
    if (row) row.unanswered.push(record);
  }

  const digests = [...byAgent.values()];
  const total = (d) => d.atRisk.length + d.neglected.length + d.swept.length + d.unanswered.length;
  if (sendWhen === "any_non_compliant") {
    return digests.filter((d) => total(d) > 0).map((d) => ({ ...d, sweepDays, sweepsStartOn }));
  }
  return digests.map((d) => ({ ...d, sweepDays, sweepsStartOn }));
}

/**
 * When leads in the "way overdue" section actually leave the agent, in plain words.
 * Sweeping can be paused (rules.sweepsStartOn) or on; the agent must never be told
 * their leads go tonight when they do not, nor that nothing will ever happen.
 */
const sweepWhen = (digest) => {
  if (!digest.sweepsStartOn) return "next run";
  // Sweeping is paused (a start date out past this year): say so, never "from Jan 1".
  if (digest.sweepsStartOn > "2026-12-31") return "on a date to be announced";
  const day = new Date(`${digest.sweepsStartOn}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
  return `from ${day}`;
};

/** One plain sentence on what happens to the "way overdue" leads. */
export function pondSentence(digest) {
  const when = sweepWhen(digest);
  if (when === "next run") {
    return "If you do not contact these, they will be moved out of your name to the team pond at the next nightly check.";
  }
  if (when === "on a date to be announced") {
    return "Nothing is being moved out of your name right now. These are the leads that will be moved to the team pond first once that starts, and you will be told the date before it does.";
  }
  return `If you do not contact these, they will be moved out of your name to the team pond starting the night of ${when.replace(/^from /, "")}.`;
}

const firstName = (digest) => String(digest.agent ?? "").trim().split(/\s+/)[0] || "there";

const quiet = (r) =>
  r.daysSinceTouch !== undefined ? ` — no contact in ${r.daysSinceTouch} days` : "";

const line = (r) => `  • ${r.name}${quiet(r)}${r.source ? ` (${r.source})` : ""}`;

const waitLine = (r) =>
  `  • ${r.name} — waiting ${r.waitingDays ?? "?"} days for a call back${r.source ? ` (${r.source})` : ""}`;

const HOW_IT_WORKS = [
  "How this works:",
  "  • \"At risk\" means it has been longer than the follow-up time for that lead since you last called, texted or emailed them.",
  "  • When a lead is flagged, we add a note to it in Follow Up Boss.",
  "  • A call, text or email you log on the lead resets the clock and clears it from this list.",
  "  • A lead is only moved to the pond after it has been flagged and still has not been contacted.",
];

/** Plain-text digest. Short on purpose — agents read this on a phone. */
export function renderDigestText(digest) {
  const parts = [`Hi ${firstName(digest)},`, "", ADMIN_MESSAGE, ""];

  // Ordered by urgency: someone who reached out and heard nothing, then the
  // ones furthest behind, then the ones on the clock, then — last, as a record —
  // the ones already gone.
  if (digest.unanswered?.length) {
    parts.push(`THEY CONTACTED YOU AND NOBODY HAS CALLED THEM BACK (${digest.unanswered.length}) — call these first:`);
    parts.push(...digest.unanswered.map(waitLine), "");
  }
  if (digest.neglected.length) {
    parts.push(`WAY OVERDUE (${digest.neglected.length}) — reach out to these today:`);
    parts.push(pondSentence(digest), "");
    parts.push(...digest.neglected.map(line), "");
  }
  if (digest.atRisk.length) {
    parts.push(`AT RISK (${digest.atRisk.length}) — it has been too long since you contacted these:`);
    parts.push(...digest.atRisk.map(line), "");
  }
  if (digest.swept?.length) {
    parts.push(`MOVED TO THE POND TONIGHT (${digest.swept.length}) — no longer assigned to you:`);
    parts.push(...digest.swept.map(line), "");
  }

  parts.push(...HOW_IT_WORKS);
  return parts.join("\n");
}

export function renderDigestHtml(digest) {
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const list = (rows) =>
    `<ul>${rows
      .map((r) => `<li><strong>${esc(r.name)}</strong>${quiet(r)}${r.source ? ` <em>(${esc(r.source)})</em>` : ""}</li>`)
      .join("")}</ul>`;

  const waitList = (rows) =>
    `<ul>${rows
      .map((r) => `<li><strong>${esc(r.name)}</strong> — waiting ${r.waitingDays ?? "?"} days for a call back${r.source ? ` <em>(${esc(r.source)})</em>` : ""}</li>`)
      .join("")}</ul>`;

  return [
    `<p>Hi ${esc(firstName(digest))},</p>`,
    `<p><strong>${esc(ADMIN_MESSAGE)}</strong></p>`,
    digest.unanswered?.length
      ? `<h3>They contacted you and nobody has called them back (${digest.unanswered.length})</h3><p style="color:#666">Call these first.</p>${waitList(digest.unanswered)}`
      : "",
    digest.neglected.length
      ? `<h3>Way overdue (${digest.neglected.length})</h3><p>${esc(pondSentence(digest))}</p>${list(digest.neglected)}`
      : "",
    digest.atRisk.length
      ? `<h3>At risk (${digest.atRisk.length})</h3><p style="color:#666">It has been too long since you contacted these.</p>${list(digest.atRisk)}`
      : "",
    digest.swept?.length
      ? `<h3>Moved to the pond tonight (${digest.swept.length})</h3><p style="color:#666">No longer assigned to you.</p>${list(digest.swept)}`
      : "",
    `<p style="color:#666"><strong>How this works:</strong> &ldquo;At risk&rdquo; means it has been longer than the follow-up time for that lead since you last called, texted or emailed them. When a lead is flagged, we add a note to it in Follow Up Boss. A call, text or email you log on the lead resets the clock and clears it from this list. A lead is only moved to the pond after it has been flagged and still has not been contacted.</p>`,
  ].join("");
}

/**
 * Deliver the digests.
 *
 * An agent whose only non-compliant leads were all swept tonight gets no task:
 * there is nothing left for them to act on, and the sweep note on each lead
 * already says what happened.
 *
 * channel:
 *   "email"       one email per agent. Needs RESEND_API_KEY and agent emails.
 *   "fub_task"    one task per agent inside FUB, attached to their most overdue
 *                 lead. No email infrastructure, and tasks notify only the
 *                 assignee — unlike notes, which email the whole team.
 *   "report_only" render into the daily report, send nothing.
 */
export async function deliverDigests(digests, { channel = "report_only", fub, usersById = new Map(), dry = true, log = console.error } = {}) {
  const delivered = [];
  const failed = [];

  // One clear failure beats thirty identical 401s. A missing key is a setup
  // problem, not thirty agent problems, and it should read that way.
  if (channel === "email" && !dry && !mailConfigured() && digests.length) {
    log("  RESEND_API_KEY is not set — no agent emails can be sent");
    return {
      delivered: [],
      failed: [{ agent: `all ${digests.length} agents`, atRisk: [], neglected: [], swept: [], reason: "RESEND_API_KEY is not set on the repository" }],
    };
  }

  for (const digest of digests) {
    try {
      if (channel === "email") {
        const email = usersById.get(digest.agentId)?.email;
        if (!email) {
          failed.push({ ...digest, reason: "no email address on the FUB user record" });
          continue;
        }
        if (!dry) await sendEmail(email, digest);
        delivered.push({ ...digest, via: `email:${email}` });
      } else if (channel === "fub_task") {
        // Anchor on a lead the agent still owns. A task hung on a lead that was
        // swept tonight opens in a pond the agent may not even be able to see.
        const anchor =
          digest.unanswered?.[0] ??
          [...digest.neglected, ...digest.atRisk].sort((a, b) => (b.daysSinceTouch ?? 0) - (a.daysSinceTouch ?? 0))[0];
        if (!anchor) continue;

        const total = digest.atRisk.length + digest.neglected.length + (digest.unanswered?.length ?? 0);
        const name =
          `Battr: ${total} of your leads need a call or text` +
          (digest.neglected.length ? ` (${digest.neglected.length} way overdue)` : "");

        if (!dry) {
          await fub.request("POST", "/tasks", {
            body: { personId: anchor.id, assignedUserId: digest.agentId, name: name.slice(0, 255), dueDate: new Date().toISOString().slice(0, 10) },
          });
          await fub.note(anchor.id, renderDigestText(digest), "Battr: your at-risk leads");
        }
        delivered.push({ ...digest, via: `fub_task:${anchor.id}` });
      } else {
        delivered.push({ ...digest, via: "report_only" });
      }
    } catch (err) {
      log(`  alert to ${digest.agent} failed: ${err.message}`);
      failed.push({ ...digest, reason: err.message });
    }
  }

  return { delivered, failed };
}

export function digestSubject(digest) {
  const waiting = digest.unanswered?.length ?? 0;
  const total = digest.atRisk.length + digest.neglected.length + waiting;
  if (waiting) return `${waiting} lead${waiting === 1 ? "" : "s"} waiting on a call back, ${total} need a call or text`;
  return `${total} of your leads need a call or text`;
}

async function sendEmail(to, digest) {
  await sendMail({
    to,
    subject: digestSubject(digest),
    html: renderDigestHtml(digest),
    text: renderDigestText(digest),
  });
}

/** Agent scoreboard section for the daily report, including At Bats metrics. */
export function renderAtBatsSection(agentStats, { windowDays = 180 } = {}) {
  if (!agentStats.length) return "";
  const lines = [
    `## At Bats — last ${windowDays} days`,
    "",
    "| Agent | At bats | Pond claims | Converted | Conversion | Retention |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const a of agentStats) {
    lines.push(
      `| ${a.agent} | ${a.atBats} | ${a.pondClaims} | ${a.converted} | ${formatRate(a.conversionRate)} | ${formatRate(a.retentionRate)} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}
