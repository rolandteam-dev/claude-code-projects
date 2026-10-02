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
import { STAGE_UPDATED_FIELDS, TIMEFRAME_UPDATED_FIELDS, FUB_EMAIL_FIELDS, profileTouchAt, latestProfileTouchAt } from "./communication.mjs";

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
 * Coarse, privacy-safe facts about a lead: categorical values and which person
 * fields carry a value. Names and counts only — never a name, number or address.
 */
export function factsOf(person = {}, record = null, now = Date.now()) {
  const facts = new Set();
  if (person.stage) facts.add(`stage: ${person.stage}`);
  if (person.source) facts.add(`source: ${person.source}`);
  facts.add(`timeframe id: ${person.timeframeId ?? "none"}`);
  for (const t of Array.isArray(person.tags) ? person.tags : []) {
    const tag = String(t);
    // Tags are labels, but a few teams type names into them. Keep the label-shaped ones.
    if (tag.length <= 40 && !/@|\d{7,}/.test(tag)) facts.add(`tag: ${tag}`);
  }
  for (const id of record?.source_list_ids ?? []) facts.add(`list: ${listById(id)?.name ?? id}`);
  const created = ms(person.created);
  if (Number.isFinite(created)) {
    const d = (now - created) / DAY;
    facts.add(`lead age: ${d < 30 ? "under 30d" : d < 90 ? "30-90d" : d < 180 ? "90-180d" : d < 365 ? "180-365d" : "over a year"}`);
  }
  for (const [key, value] of Object.entries(person)) {
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) continue;
    facts.add(`has field: ${key}`);
  }
  return facts;
}

/**
 * Which facts are much commoner in group B than in group A (and the reverse).
 * With small groups this is a pointer, not a proof — the report says so.
 */
export function liftBetween(groupB, groupA, { minCount = 4, minDiff = 0.25, top = 12 } = {}) {
  const tally = (group) => {
    const m = new Map();
    for (const facts of group) for (const f of facts) m.set(f, (m.get(f) ?? 0) + 1);
    return m;
  };
  const b = tally(groupB);
  const a = tally(groupA);
  const rows = [];
  for (const f of new Set([...b.keys(), ...a.keys()])) {
    const cb = b.get(f) ?? 0;
    const ca = a.get(f) ?? 0;
    const diff = (groupB.length ? cb / groupB.length : 0) - (groupA.length ? ca / groupA.length : 0);
    if (Math.max(cb, ca) >= minCount) rows.push({ fact: f, b: cb, a: ca, diff });
  }
  return {
    sizeB: groupB.length,
    sizeA: groupA.length,
    moreInB: rows.filter((r) => r.diff >= minDiff).sort((x, y) => y.diff - x.diff).slice(0, top),
    moreInA: rows.filter((r) => r.diff <= -minDiff).sort((x, y) => x.diff - y.diff).slice(0, 6),
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
// Battr's own bookkeeping and the creation date say nothing about communication.
const NOT_COMMUNICATION = /^(custom|created$)/i;

/**
 * Which FUB date fields sit INSIDE a lead's window, for each group.
 *
 * Battr reads "Last Communication Days Ago" from somewhere on the Follow Up Boss
 * record, and which field that is has never been confirmed. The record carries
 * a handful of date fields (last email, last inbox message, last marketing
 * text, …). Battr says the leads only we flag are fine, so for most of them
 * Battr's field must be newer than the lead's window; and for the leads Battr
 * flagged it must be older. A field that separates the two groups that cleanly
 * is the candidate. Dates only — nothing from a message.
 *
 * @param {{person: object, window: number|null}[]} groupB  leads only we flag
 * @param {{person: object, window: number|null}[]} groupA  leads Battr flagged
 */
export function dateFieldWindows(groupB, groupA, now, { minCount = 4, minDiff = 0.3, minShare = 0.5, top = 10 } = {}) {
  const tally = (group) => {
    const m = new Map();
    for (const { person, window } of group) {
      if (window === null || window === undefined) continue;
      for (const [key, value] of Object.entries(person)) {
        if (NOT_COMMUNICATION.test(key) || typeof value !== "string" || !ISO_DATE.test(value)) continue;
        const at = Date.parse(value);
        if (Number.isFinite(at) && (now - at) / DAY <= window) m.set(key, (m.get(key) ?? 0) + 1);
      }
    }
    return m;
  };
  const sizeB = groupB.filter((g) => g.window != null).length;
  const sizeA = groupA.filter((g) => g.window != null).length;
  const b = tally(groupB);
  const a = tally(groupA);
  const rows = [];
  for (const field of b.keys()) {
    const cb = b.get(field);
    const ca = a.get(field) ?? 0;
    const shareB = sizeB ? cb / sizeB : 0;
    const diff = shareB - (sizeA ? ca / sizeA : 0);
    if (cb >= minCount && shareB >= minShare && diff >= minDiff) rows.push({ field, b: cb, a: ca, diff });
  }
  return { sizeB, sizeA, fields: rows.sort((x, y) => y.diff - x.diff).slice(0, top) };
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
    // Expected by a rule Mike chose: the two divergent sources are swept on
    // purpose. A drip is NOT an expected difference: on 28 Sep the control
    // group showed Battr ignores drips too (58% of the leads it agrees on had
    // one, against 59% of the rest), so a drip explains nothing between us.
    hit.byRule = hit.divergentSource;

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
      // Exact, to one decimal: the 28 Sep run had all four disagreements
      // sitting on the same 33-day line, which points at how the two systems
      // count days. The decimal is what settles the formula.
      elapsed: touch.at ? Math.round(((now - touch.at) / DAY) * 10) / 10 : null,
      window: r ? windowDaysFor(r) : null,
      reason: r?.reason ?? null,
      stage: person.stage ?? "",
      timeframe: person.timeframeId ?? null,
      source: person.source ?? "",
    });
  }
  battrFlagged.sort((a, b) => b.stamped.localeCompare(a.stamped) || a.id - b.id);

  // The open question, lead by lead: at-risk here, never stamped by Battr, and
  // not from a source Mike chose to sweep. Opening a few of these in Follow Up
  // Boss shows what Battr is counting that we are not.
  const onlyUsSample = atRisk
    .filter((r) => {
      const person = peopleById.get(r.id) ?? {};
      return !person[stampKey] && !DIVERGENT_SOURCES.includes(r.source);
    })
    .map((r) => {
      const person = peopleById.get(r.id) ?? r.contact?._raw ?? {};
      const touch = lastTouchOf(touchIndex.get(r.id), person);
      return {
        id: r.id,
        owner: r.owner ?? "",
        list: (r.source_list_ids ?? []).map((id) => listById(id)?.name ?? `list ${id}`).join(" + "),
        window: windowDaysFor(r),
        stage: person.stage ?? "",
        source: person.source ?? "",
        via: touch.via,
        elapsed: touch.at ? Math.round(((now - touch.at) / DAY) * 10) / 10 : null,
      };
    })
    .sort((a, b) => a.owner.localeCompare(b.owner) || a.id - b.id);

  // What is different about the leads only we flag? Compare them with every
  // lead Battr stamped in the last week, on stage, source, timeframe, tags,
  // list, age and which person fields carry a value.
  const controlDays = 7;
  // Still with an agent. A lead Battr already swept sits in a pond, carries pond
  // fields and has been through a different life; compared against leads that
  // are still assigned it makes every "has field" difference look real.
  const flaggedPeople = [...peopleById.values()].filter((p) => {
    const at = ms(p[stampKey]);
    return Number.isFinite(at) && now - at <= controlDays * DAY && p.assignedUserId && !p.assignedPondId;
  });
  const lift = liftBetween(
    onlyUsSample.map((x) => factsOf(peopleById.get(x.id) ?? {}, resultsById.get(x.id), now)),
    flaggedPeople.map((p) => factsOf(p, resultsById.get(p.id), now))
  );

  const windowOf = (id) => (resultsById.get(id) ? windowDaysFor(resultsById.get(id)) : null);
  const dateFields = dateFieldWindows(
    onlyUsSample.map((x) => ({ person: peopleById.get(x.id) ?? {}, window: x.window })),
    flaggedPeople.map((p) => ({ person: p, window: windowOf(p.id) })),
    now
  );

  // The evidence the email-date rule rests on, re-checked every run. Leads Battr
  // flagged must NOT have one of FUB's last-email dates inside their window; if one
  // does, those fields have started counting emails Battr ignores.
  let emailCheckLeads = 0;
  let emailCheckInWindow = 0;
  for (const p of flaggedPeople) {
    const w = windowOf(p.id);
    if (w === null || w === undefined) continue;
    emailCheckLeads++;
    const at = latestProfileTouchAt(p, FUB_EMAIL_FIELDS);
    if (at !== null && within(at, w, now)) emailCheckInWindow++;
  }

  return {
    total: atRisk.length,
    signals,
    split,
    lift,
    dateFields,
    emailCheck: { leads: emailCheckLeads, inWindow: emailCheckInWindow },
    controlDays,
    byList: [...byList.values()].sort((a, b) => b.count - a.count),
    byAgent: [...byAgent.values()].sort((a, b) => b.atRisk - a.atRisk),
    profileFields: { people: peopleById.size, stageField, timeframeField, fieldNames },
    battrFlagged,
    onlyUsSample,
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
    `| An automated (drip) email went out inside the window — Battr ignores these too, so this is not the difference | ${gap.signals.automatedEmail} | ${pct(gap.signals.automatedEmail)} |`,
    `| The FUB record was edited inside the window (upper bound on a stage/timeframe change) | ${gap.signals.recordEdited} | ${pct(gap.signals.recordEdited)} |`,
    `| From \`my +plus leads\` or \`Steve Hawks\` — swept by choice, excluded by Battr | ${gap.signals.divergentSource} | ${pct(gap.signals.divergentSource)} |`,
    `| **None of the above** — Battr should be flagging these too | **${gap.signals.unexplained}** | ${pct(gap.signals.unexplained)} |`,
    "",
    `**${gap.signals.byRule ?? 0} of ${gap.total}** are expected differences — the two sources you chose to sweep. ` +
      `**${gap.total - (gap.signals.byRule ?? 0)}** are not explained by a rule you set; that is the number that has ` +
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
          (stageField === 0
            ? `. FUB sends no stage-changed date on the record, so this system dates stage changes itself by comparing each night's stages with the last (see the summary) — none recorded yet.`
            : "."),
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
  lines.push(...renderEmailCheck(gap));
  lines.push(...renderDateFields(gap));
  lines.push(...renderLift(gap));
  lines.push(...renderOnlyUs(gap));
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
    `| FUB ID | Agent | Battr stamped | Our verdict | Our last touch | Window | Stage · timeframe id · source |`,
    `| ---: | --- | --- | --- | --- | ---: | --- |`,
  ];
  for (const r of rows) {
    const verdict = r.status === "excluded" && r.reason ? `excluded — ${r.reason}` : r.status.replace("_", " ");
    const touch = r.elapsed === null || r.elapsed === undefined ? r.via : `${r.via}, ${r.elapsed}d ago`;
    lines.push(
      `| ${r.id} | ${r.owner} | ${r.stamped} | ${verdict} | ${touch} | ${r.window ?? "—"}d | ` +
        `${r.stage || "—"} · ${r.timeframe ?? "none"} · ${r.source || "—"} |`
    );
  }
  lines.push("");
  return lines;
}

/**
 * Leads only we flag (not from a divergent source), for spot-checking in FUB.
 * FUB ids and agent names only.
 */
export function renderOnlyUs(gap, { limit = 80 } = {}) {
  const rows = gap?.onlyUsSample ?? [];
  if (!rows.length) return [];
  const lines = [
    `### At risk here, not flagged by Battr — ${rows.length} lead(s)`,
    "",
    `Open a few of these in Follow Up Boss. Whatever activity is newer than "our last touch" is what Battr counts and we do not.`,
    "",
    `| FUB ID | Agent | List | Window | Stage | Source | Our last touch |`,
    `| ---: | --- | --- | ---: | --- | --- | --- |`,
  ];
  for (const r of rows.slice(0, limit)) {
    const touch = r.elapsed === null ? r.via : `${r.via}, ${r.elapsed}d ago`;
    lines.push(`| ${r.id} | ${r.owner} | ${r.list} | ${r.window ?? "—"}d | ${r.stage || "—"} | ${r.source || "—"} | ${touch} |`);
  }
  if (rows.length > limit) lines.push(`| … | ${rows.length - limit} more | | | | | |`);
  lines.push("");
  return lines;
}

/** The standing check on the email-date rule. Empty when there are no Battr-flagged leads to test it on. */
export function renderEmailCheck(gap) {
  const c = gap?.emailCheck;
  if (!c || !c.leads) return [];
  return c.inWindow === 0
    ? [`- Email-date rule check: **0 of ${c.leads}** leads Battr flagged have a Follow Up Boss last-email date inside their window, as the rule assumes.`, ""]
    : [
        `- ⚠ **Email-date rule check FAILED: ${c.inWindow} of ${c.leads}** leads Battr flagged have a Follow Up Boss last-email date inside their window. ` +
          `Those fields may now be counting emails Battr ignores — see rules.fubEmailActivityCountsAsTouch before trusting tonight's counts.`,
        "",
      ];
}

/** The FUB date field that best separates the two groups — a candidate for Battr's "last communication". */
export function renderDateFields(gap) {
  const d = gap?.dateFields;
  if (!d || !d.sizeB || !d.sizeA) return [];
  const pct = (n, t) => `${Math.round((n / t) * 100)}%`;
  const lines = [
    `### Which Follow Up Boss date field is Battr's "last communication"?`,
    "",
    `Battr calls the ${d.sizeB} leads only we flag fine, so for most of them its field must be newer than the lead's window — ` +
      `and older for the ${d.sizeA} leads it flagged. A date field on the FUB record that does that is the candidate. Dates only.`,
    "",
  ];
  if (!d.fields.length) {
    lines.push(`No date field separates the two groups: nothing on the record explains the difference, so what Battr counts is not stored there.`, "");
    return lines;
  }
  lines.push(`| FUB date field | Inside window — only us | Inside window — Battr-flagged |`, `| --- | ---: | ---: |`);
  for (const r of d.fields) lines.push(`| \`${r.field}\` | ${r.b} of ${d.sizeB} (${pct(r.b, d.sizeB)}) | ${r.a} of ${d.sizeA} (${pct(r.a, d.sizeA)}) |`);
  lines.push("");
  return lines;
}

/** What sets the leads only we flag apart from the leads Battr flagged. */
export function renderLift(gap) {
  const lift = gap?.lift;
  if (!lift || !lift.sizeB || !lift.sizeA) return [];
  const pct = (n, d) => `${Math.round((n / d) * 100)}%`;
  const lines = [
    `### What sets the ${lift.sizeB} leads only we flag apart from the ${lift.sizeA} Battr stamped in the last ${gap.controlDays} days`,
    "",
    `A pointer, not a proof — the groups are small. Something far commoner on our side is a candidate for what Battr treats as work, or as out of scope.`,
    "",
  ];
  if (lift.moreInB.length) {
    lines.push(`| More common among leads only we flag | Only us | Battr-flagged |`, `| --- | ---: | ---: |`);
    for (const r of lift.moreInB) lines.push(`| ${r.fact} | ${r.b} (${pct(r.b, lift.sizeB)}) | ${r.a} (${pct(r.a, lift.sizeA)}) |`);
    lines.push("");
  } else {
    lines.push(`Nothing is markedly commoner among the leads only we flag.`, "");
  }
  if (lift.moreInA.length) {
    lines.push(`| More common among leads Battr flagged | Only us | Battr-flagged |`, `| --- | ---: | ---: |`);
    for (const r of lift.moreInA) lines.push(`| ${r.fact} | ${r.b} (${pct(r.b, lift.sizeB)}) | ${r.a} (${pct(r.a, lift.sizeA)}) |`);
    lines.push("");
  }
  return lines;
}
