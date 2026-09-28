/**
 * Why is a lead at risk here when Battr calls it compliant?
 *
 * Our at-risk count has run four to eight times Battr's for three weeks, and
 * it does not drain. That is the signature of a DISAGREEMENT, not a backlog:
 * a lead both systems call at risk gets stamped by Battr, becomes neglected
 * two or three days later and leaves. A lead only WE call at risk is never
 * stamped (nothing here writes during a dry run), so it can never become
 * neglected, and it sits in the at-risk count night after night.
 *
 * So the question is which leads Battr sees as worked. Each candidate
 * explanation is tested against every lead we hold at risk, with the lead's
 * own list threshold as the window:
 *
 *   automatedEmail — an action-plan or campaign email went out inside the
 *                    window. Battr's playbook says these do not count; if most
 *                    of the gap sits here, Battr counts them in practice.
 *   recordEdited   — the person record changed inside the window. An upper
 *                    bound on "stage or timeframe updated", which Battr counts
 *                    and we cannot read directly (see profileFields below).
 *   divergentSource — one of the two sources Mike chose to sweep and Battr
 *                    excludes. Expected, and not a defect.
 *   unexplained    — none of the above. These are the leads Battr should be
 *                    flagging too; if it is not, the cause is somewhere else.
 *
 * Counts and agent names only. No lead name leaves this module.
 */
import { listById, commWindowDays } from "./lists.mjs";
import { STAGE_UPDATED_FIELDS, TIMEFRAME_UPDATED_FIELDS, profileTouchAt } from "./communication.mjs";

/** The two sources swept on Mike's instruction that Battr excludes (sources.mjs). */
export const DIVERGENT_SOURCES = ["my +plus leads", "Steve Hawks"];

const DAY = 86_400_000;

/** The "days since last communication >" number on a list's at-risk tier, or null. */
export const atRiskDaysOf = (list) => commWindowDays(list?.at_risk_filters);

/** The tightest at-risk window among the lists that selected this lead. */
function windowDaysFor(record) {
  const days = (record.source_list_ids ?? []).map((id) => atRiskDaysOf(listById(id))).filter((d) => d !== null);
  return days.length ? Math.min(...days) : null;
}

const within = (at, days, now) => Number.isFinite(at) && at > 0 && days !== null && now - at <= days * DAY;
const ms = (value) => (value ? new Date(value).getTime() : NaN);

/**
 * @param {object} p
 * @param {object[]} p.results                   classified records (combined list)
 * @param {Map<number, object>} p.peopleById     raw FUB person payloads
 * @param {Map<number, number>} p.automatedAt    person id → last automated email (ms)
 * @param {number} [p.now]
 */
export function explainAtRisk({ results, peopleById, automatedAt = new Map(), now = Date.now() }) {
  const atRisk = results.filter((r) => r.status === "at_risk");
  const signals = { automatedEmail: 0, recordEdited: 0, divergentSource: 0, unexplained: 0 };
  const byList = new Map();
  const byAgent = new Map();

  for (const r of atRisk) {
    const person = peopleById.get(r.id) ?? r.contact?._raw ?? {};
    const days = windowDaysFor(r);

    const listNames = (r.source_list_ids ?? []).map((id) => listById(id)?.name ?? `list ${id}`);
    const listKey = listNames.join(" + ") || "(no list)";
    const listRow = byList.get(listKey) ?? { list: listKey, days, count: 0 };
    listRow.count++;
    byList.set(listKey, listRow);

    const hit = {
      automatedEmail: within(automatedAt.get(r.id), days, now),
      recordEdited: within(ms(person.updated), days, now),
      divergentSource: DIVERGENT_SOURCES.includes(r.source),
    };
    hit.unexplained = !hit.automatedEmail && !hit.recordEdited && !hit.divergentSource;

    const agent = r.owner ?? "(unassigned)";
    const agentRow = byAgent.get(agent) ?? { agent, atRisk: 0, automatedEmail: 0, recordEdited: 0, divergentSource: 0, unexplained: 0 };
    agentRow.atRisk++;
    for (const k of Object.keys(signals)) {
      if (hit[k]) {
        signals[k]++;
        agentRow[k]++;
      }
    }
    byAgent.set(agent, agentRow);
  }

  // Whether the stage/timeframe rule can fire at all. A zero here means the
  // rule is switched on and reads fields this account never sends.
  let stageField = 0;
  let timeframeField = 0;
  for (const person of peopleById.values()) {
    if (profileTouchAt(person, STAGE_UPDATED_FIELDS) !== null) stageField++;
    if (profileTouchAt(person, TIMEFRAME_UPDATED_FIELDS) !== null) timeframeField++;
  }

  return {
    total: atRisk.length,
    signals,
    byList: [...byList.values()].sort((a, b) => b.count - a.count),
    byAgent: [...byAgent.values()].sort((a, b) => b.atRisk - a.atRisk),
    profileFields: { people: peopleById.size, stageField, timeframeField },
  };
}

/** The report section. Markdown lines. */
export function renderGapSection(gap, { battrAtRisk = null, battrDate = null } = {}) {
  if (!gap || !gap.total) return [];
  const pct = (n) => `${Math.round((n / gap.total) * 100)}%`;
  const lines = [
    `## Why our at-risk count is higher than Battr's`,
    "",
    `We hold **${gap.total}** at risk` +
      (battrAtRisk !== null ? ` against Battr's **${battrAtRisk}**${battrDate ? ` (${battrDate})` : ""}` : "") +
      `. A lead both systems flag is stamped by Battr and swept within days; a lead only we flag is never stamped, ` +
      `so it cannot move on and it stays in this count every night. Each lead below is tested against its own ` +
      `list's at-risk window — a lead can match more than one line.`,
    "",
    `| Explanation | Leads | Share |`,
    `| --- | ---: | ---: |`,
    `| An automated email went out inside the window (Battr says these don't count) | ${gap.signals.automatedEmail} | ${pct(gap.signals.automatedEmail)} |`,
    `| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | ${gap.signals.recordEdited} | ${pct(gap.signals.recordEdited)} |`,
    `| From \`my +plus leads\` or \`Steve Hawks\` — swept by choice, excluded by Battr | ${gap.signals.divergentSource} | ${pct(gap.signals.divergentSource)} |`,
    `| **None of the above** — Battr should be flagging these too | **${gap.signals.unexplained}** | ${pct(gap.signals.unexplained)} |`,
    "",
  ];
  const { people, stageField, timeframeField } = gap.profileFields;
  lines.push(
    stageField + timeframeField === 0
      ? `- **The stage/timeframe rule is reading nothing.** Of ${people} FUB records pulled, none carries a stage-changed ` +
          `or timeframe-changed timestamp under any name we look for. Battr counts those changes as work; we currently cannot see them.`
      : `- Stage/timeframe timestamps found on ${stageField} / ${timeframeField} of ${people} FUB records.`,
    ""
  );
  lines.push(`| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const a of gap.byAgent.slice(0, 12)) {
    lines.push(`| ${a.agent} | ${a.atRisk} | ${a.automatedEmail} | ${a.recordEdited} | ${a.divergentSource} | ${a.unexplained} |`);
  }
  lines.push("", `| Judged by list | Window | At risk |`, `| --- | ---: | ---: |`);
  for (const l of gap.byList) lines.push(`| ${l.list} | ${l.days ?? "?"}d | ${l.count} |`);
  lines.push("");
  return lines;
}
