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

export const ADMIN_MESSAGE = "At risk leads need to be worked ASAP or they will be swept to the pond.";

/**
 * Group this run's non-compliant records by owning agent.
 *
 * `sendWhen: 'any_non_compliant'` (the live setting) skips agents with a clean
 * board — an empty digest is noise that trains people to ignore the real ones.
 */
export function buildAgentDigests(
  results,
  { sendWhen = "any_non_compliant", excludeGroupIds = [], sweepDays, sweptIds = new Set() } = {}
) {
  const byAgent = new Map();
  const excluded = new Set(excludeGroupIds.map(Number));
  const gone = sweptIds instanceof Set ? sweptIds : new Set(sweptIds ?? []);

  for (const record of results) {
    if (record.status !== "at_risk" && record.status !== "neglected") continue;
    if (!record.ownerId) continue;

    const groups = record.contact?.owner_group_ids ?? [];
    if (groups.some((g) => excluded.has(Number(g)))) continue;

    const row = byAgent.get(record.ownerId) ?? {
      agentId: record.ownerId,
      agent: record.owner || `User ${record.ownerId}`,
      atRisk: [],
      neglected: [],
      swept: [],
    };

    // Three buckets, not two. A lead already moved tonight must never be listed
    // as "reach out today to keep this" — the agent would call a lead they no
    // longer own, and the next alert they get is one they don't read.
    if (record.status === "at_risk") row.atRisk.push(record);
    else if (gone.has(record.id)) row.swept.push(record);
    else row.neglected.push(record);

    byAgent.set(record.ownerId, row);
  }

  const digests = [...byAgent.values()];
  const total = (d) => d.atRisk.length + d.neglected.length + d.swept.length;
  if (sendWhen === "any_non_compliant") {
    return digests.filter((d) => total(d) > 0).map((d) => ({ ...d, sweepDays }));
  }
  return digests.map((d) => ({ ...d, sweepDays }));
}

const line = (r) =>
  `  • ${r.name}${r.daysSinceTouch !== undefined ? ` — ${r.daysSinceTouch} days quiet` : ""}${r.source ? ` (${r.source})` : ""}`;

/** Plain-text digest. Short on purpose — agents read this on a phone. */
export function renderDigestText(digest) {
  const parts = [ADMIN_MESSAGE, ""];

  // Ordered by what the agent can still do something about: the ones about to
  // go, then the ones on the clock, then — last, as a record — the ones gone.
  if (digest.neglected.length) {
    parts.push(`SWEEPING NEXT RUN (${digest.neglected.length}) — reach out today to keep these:`);
    parts.push(...digest.neglected.map(line), "");
  }
  if (digest.atRisk.length) {
    parts.push(`AT RISK (${digest.atRisk.length}):`);
    parts.push(...digest.atRisk.map(line), "");
  }
  if (digest.swept?.length) {
    parts.push(`MOVED TO THE POND TONIGHT (${digest.swept.length}) — no longer assigned to you:`);
    parts.push(...digest.swept.map(line), "");
  }

  parts.push("A lead is only swept after it has been flagged at risk first. Working it clears the flag.");
  return parts.join("\n");
}

export function renderDigestHtml(digest) {
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const list = (rows) =>
    `<ul>${rows
      .map((r) => `<li><strong>${esc(r.name)}</strong>${r.daysSinceTouch !== undefined ? ` — ${r.daysSinceTouch} days quiet` : ""}${r.source ? ` <em>(${esc(r.source)})</em>` : ""}</li>`)
      .join("")}</ul>`;

  return [
    `<p><strong>${esc(ADMIN_MESSAGE)}</strong></p>`,
    digest.neglected.length ? `<h3>Sweeping next run (${digest.neglected.length})</h3>${list(digest.neglected)}` : "",
    digest.atRisk.length ? `<h3>At risk (${digest.atRisk.length})</h3>${list(digest.atRisk)}` : "",
    digest.swept?.length
      ? `<h3>Moved to the pond tonight (${digest.swept.length})</h3><p style="color:#666">No longer assigned to you.</p>${list(digest.swept)}`
      : "",
    `<p style="color:#666">A lead is only swept after it has been flagged at risk first. Working it clears the flag.</p>`,
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
  if (channel === "email" && !dry && !process.env.RESEND_API_KEY && digests.length) {
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
        const anchor = [...digest.neglected, ...digest.atRisk].sort(
          (a, b) => (b.daysSinceTouch ?? 0) - (a.daysSinceTouch ?? 0)
        )[0];
        if (!anchor) continue;

        const total = digest.atRisk.length + digest.neglected.length;
        const name =
          `Battr: ${total} of your leads need outreach` +
          (digest.neglected.length ? ` (${digest.neglected.length} sweeping next run)` : "");

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

async function sendEmail(to, digest) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.BATTR_REPORT_FROM || "battr@therolandteam.com",
      to: [to],
      subject: `${digest.atRisk.length + digest.neglected.length} of your leads need outreach`,
      html: renderDigestHtml(digest),
      text: renderDigestText(digest),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 160)}`);
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
