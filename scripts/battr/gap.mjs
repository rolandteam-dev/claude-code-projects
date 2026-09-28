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
 * What set a lead's latest touch, as we see it: the channel and when.
 * Diagnostic only — the classifier never reads this.
 */
export function lastTouchOf(entry, person = {}) {
  const candidates = [
    [entry?.lastOutbound, `${entry?.outVia ?? "outbound"} out`],
    [entry?.lastInbound, `${entry?.inVia ?? "inbound"} in`],
    [profileTouchAt(person, STAGE_UPDATED_FIELDS), "stage change"],
    [profileTouchAt(person, TIMEFRAME_UPDATED_FIELDS), "timeframe change"],
  ].filter(([at]) => Number.isFinite(at) && at > 0);
  if (!candidates.length) return { at: null, via: "nothing in 100 days" };
  const [at, via] = candidates.reduce((best, c) => (c[0] > best[0] ? c : best));
  return { at, via };
}

/**
 * @param {object} p
 * @param {object[]} p.results                   classified records (combined list)
 * @param {Map<number, object>} p.peopleById     raw FUB person payloads
 * @param {Map<number, number>} p.automatedAt    person id → last automated email (ms)
 * @param {Map<number, object>} [p.touchIndex]   person id → { lastOutbound, outVia, … }
 * @param {string} [p.stampKey]                  the field Battr writes its At Risk Since date to
 * @param {number} [p.recentDays]                how far back a Battr stamp counts as "tonight's"
 * @param {number} [p.now]
 */
export function explainAtRisk({
  results,
  peopleById,
  automatedAt = new Map(),
  touchIndex = new Map(),
  stampKey = "customBattrAtRiskSince",
  recentDays = 3,
  now = Date.now(),
}) {
  const atRisk = results.filter((r) => r.status === "at_risk");
  const signals = { automatedEmail: 0, recordEdited: 0, divergentSource: 0, unexplained: 0, byRule: 0 };
  const byList = new Map();
  const byAgent = new Map();
  // The control group. A lead carrying Battr's stamp is one Battr ALSO calls
  // at risk, so whatever is common among those leads cannot be what Battr
  // counts as work. If automated email is as common there as among the leads
  // only we flag, automated email is not the difference.
  const split = {
    battrAgrees: { leads: 0, automatedEmail: 0, divergentSource: 0 },
    onlyUs: { leads: 0, automatedEmail: 0, divergentSource: 0 },
  };

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
    // Expected by a rule Mike chose: a drip is not work (rules.automatedEmailCountsAsTouch),
    // and the two divergent sources are swept on purpose.
    hit.byRule = hit.automatedEmail || hit.divergentSource;

    const side = person[stampKey] ? split.battrAgrees : split.onlyUs;
    side.leads++;
    if (hit.automatedEmail) side.automatedEmail++;
    if (hit.divergentSource) side.divergentSource++;

    const agent = r.owner ?? "(unassigned)";
    const agentRow = byAgent.get(agent) ?? { agent, atRisk: 0, automatedEmail: 0, recordEdited: 0, divergentSource: 0, unexplained: 0, byRule: 0 };
    agentRow.atRisk++;
    for (const k of Object.keys(signals)) {
      if (hit[k]) {
        signals[k]++;
        agentRow[k]++;
      }
    }
    byAgent.set(agent, agentRow);
  }

  // Whether the stage/timeframe rule can fire at all, and on which field. A
  // zero means the rule is switched on and reads a field this account never sends.
  let stageField = 0;
  let timeframeField = 0;
  const fieldNames = {};
  for (const person of peopleById.values()) {
    if (profileTouchAt(person, STAGE_UPDATED_FIELDS) !== null) stageField++;
    if (profileTouchAt(person, TIMEFRAME_UPDATED_FIELDS) !== null) timeframeField++;
    for (const f of [...STAGE_UPDATED_FIELDS, ...TIMEFRAME_UPDATED_FIELDS]) {
      if (person[f] !== undefined && person[f] !== null && person[f] !== "") fieldNames[f] = (fieldNames[f] ?? 0) + 1;
    }
  }

  // The other direction: leads Battr stamped in the last few nights. Battr
  // writes that stamp itself, so this is Battr's own verdict read straight off
  // Follow Up Boss — no forwarding of emails needed. Where we call such a lead
  // worked, the channel that set our last touch is what we count and Battr
  // does not.
  const resultsById = new Map(results.map((r) => [r.id, r]));
  const battrFlagged = [];
  for (const person of peopleById.values()) {
    const stampAt = ms(person[stampKey]);
    if (!Number.isFinite(stampAt) || now - stampAt > recentDays * DAY) continue;
    const r = resultsById.get(person.id);
    const status = r ? r.status : "not on our list";
    const touch = lastTouchOf(touchIndex.get(person.id), person);
    battrFlagged.push({
      id: person.id,
      owner: person.assignedTo ?? r?.owner ?? "",
      stamped: String(person[stampKey]).slice(0, 10),
      status,
      via: touch.via,
      daysAgo: touch.at ? Math.floor((now - touch.at) / DAY) : null,
      reason: r?.reason ?? null,
    });
  }
  battrFlagged.sort((a, b) => b.stamped.localeCompare(a.stamped) || a.id - b.id);

  return {
    total: atRisk.length,
    signals,
    split,
    byList: [...byList.values()].sort((a, b) => b.count - a.count),
    byAgent: [...byAgent.values()].sort((a, b) => b.atRisk - a.atRisk),
    profileFields: { people: peopleById.size, stageField, timeframeField, fieldNames },
    battrFlagged,
    recentDays,
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
    `| An automated (drip) email went out inside the window — not work, by your rule of 28 Sep | ${gap.signals.automatedEmail} | ${pct(gap.signals.automatedEmail)} |`,
    `| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | ${gap.signals.recordEdited} | ${pct(gap.signals.recordEdited)} |`,
    `| From \`my +plus leads\` or \`Steve Hawks\` — swept by choice, excluded by Battr | ${gap.signals.divergentSource} | ${pct(gap.signals.divergentSource)} |`,
    `| **None of the above** — Battr should be flagging these too | **${gap.signals.unexplained}** | ${pct(gap.signals.unexplained)} |`,
    "",
    `**${gap.signals.byRule ?? 0} of ${gap.total}** are expected differences — a drip-only lead or a divergent source, both by ` +
      `your choice. **${gap.total - (gap.signals.byRule ?? 0)}** are not explained by a rule you set; that is the number that has ` +
      `to reach about Battr's before going live.`,
    "",
  ];
  const { people, stageField, timeframeField, fieldNames = {} } = gap.profileFields;
  const named = Object.entries(fieldNames).map(([f, n]) => `\`${f}\` ${n}`).join(", ");
  lines.push(
    stageField + timeframeField === 0
      ? `- **The stage/timeframe rule is reading nothing.** Of ${people} FUB records pulled, none carries a stage-changed ` +
          `or timeframe-changed timestamp under any name we look for. Battr counts those changes as work; we currently cannot see them.`
      : `- Stage-change timestamps on **${stageField}**, timeframe-change timestamps on **${timeframeField}**, of ${people} FUB records` +
          (named ? ` (${named})` : "") +
          (stageField === 0 ? `. **Stage changes are invisible to us** — FUB sends no stage-changed date on the record.` : "."),
    ""
  );

  // The control group — the test that tells the hypotheses apart.
  const { battrAgrees: a, onlyUs: o } = gap.split ?? {};
  if (a && o) {
    const rate = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "—");
    lines.push(
      `| At-risk leads | Leads | Automated email in window | Divergent source |`,
      `| --- | ---: | ---: | ---: |`,
      `| Battr stamped them too (Battr agrees) | ${a.leads} | ${a.automatedEmail} (${rate(a.automatedEmail, a.leads)}) | ${a.divergentSource} |`,
      `| Only we flag them | ${o.leads} | ${o.automatedEmail} (${rate(o.automatedEmail, o.leads)}) | ${o.divergentSource} |`,
      "",
      `If automated email is about as common in the first row as the second, Battr does NOT count it as work and it is ` +
        `not the difference. If the first row is near zero, Battr is counting action-plan email despite its playbook.`,
      ""
    );
  }

  lines.push(`| Agent | At risk | Automated email | Record edited | Divergent source | Unexplained |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const a of gap.byAgent.slice(0, 12)) {
    lines.push(`| ${a.agent} | ${a.atRisk} | ${a.automatedEmail} | ${a.recordEdited} | ${a.divergentSource} | ${a.unexplained} |`);
  }
  lines.push("", `| Judged by list | Window | At risk |`, `| --- | ---: | ---: |`);
  for (const l of gap.byList) lines.push(`| ${l.list} | ${l.days ?? "?"}d | ${l.count} |`);
  lines.push("");
  lines.push(...renderBattrFlagged(gap));
  return lines;
}

/**
 * Leads Battr stamped in the last few nights, and what we make of each.
 * FUB ids and agent names only — the id links to the lead for anyone with
 * access, and no lead name is printed.
 */
export function renderBattrFlagged(gap) {
  const rows = gap?.battrFlagged ?? [];
  if (!rows.length) return [];
  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  const agree = (byStatus.at_risk ?? 0) + (byStatus.neglected ?? 0);
  const lines = [
    `### Leads Battr flagged in the last ${gap.recentDays} days — do we agree?`,
    "",
    `Battr stamped **${rows.length}** lead(s). We agree on **${agree}** ` +
      `(${byStatus.at_risk ?? 0} at risk, ${byStatus.neglected ?? 0} neglected); ` +
      Object.entries(byStatus)
        .filter(([s]) => s !== "at_risk" && s !== "neglected")
        .map(([s, n]) => `${n} ${s.replace("_", " ")}`)
        .join(", ") +
      `. For a lead we call worked, "our last touch" is the thing we count that Battr does not.`,
    "",
    `| FUB ID | Agent | Battr stamped | Our verdict | Our last touch |`,
    `| ---: | --- | --- | --- | --- |`,
  ];
  for (const r of rows) {
    const verdict = r.status === "excluded" && r.reason ? `excluded — ${r.reason}` : r.status.replace("_", " ");
    const touch = r.daysAgo === null ? r.via : `${r.via}, ${r.daysAgo}d ago`;
    lines.push(`| ${r.id} | ${r.owner} | ${r.stamped} | ${verdict} | ${touch} |`);
  }
  lines.push("");
  return lines;
}
