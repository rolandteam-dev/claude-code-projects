/**
 * The dry-run / parity sections of the nightly report — the part Mike reads.
 *
 * Pure: takes the night's results and plans and returns markdown lines, so what the
 * email says can be tested without a Follow Up Boss.
 *
 * WHAT IT ANSWERS, IN ORDER
 *   1. Is this night real or a dry run, and by which rules?
 *   2. How many leads do we flag, set beside Battr's last recorded count — and how
 *      old that count is. (Battr was cancelled after 9 Oct 2026; there is no live
 *      Battr number. Saying so beats printing a six-week-old figure as if it were
 *      last night's.)
 *   3. What the run WOULD nudge and sweep, per agent, with the caps applied.
 *   4. Which leads could not be verified, and why. They are held, never guessed at.
 *   5. EVERY lead we flag, with the exact rule that fired — list, stage, days quiet
 *      against the threshold, and what counted as the last agent touch — so each one
 *      can be checked against Battr's playbook and none is flagged for no reason.
 */
import { listById } from "./lists.mjs";
import { atRiskDaysOf } from "./gap.mjs";
import { daysBetween } from "./classify.mjs";

const esc = (v) => String(v ?? "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");
const agentOf = (r) => r.owner ?? "(unassigned)";
const byAgentThenQuiet = (a, b) => agentOf(a).localeCompare(agentOf(b)) || (b.daysSinceTouch ?? 0) - (a.daysSinceTouch ?? 0);

/** The one-line rule that put a lead on the list, in Battr's terms. */
export function ruleFor(record) {
  const list = (record.source_list_ids ?? []).map((id) => listById(id)).find(Boolean);
  const threshold = list ? atRiskDaysOf(list) : null;
  const via = record.contact?.touch_via;
  const touch = record.contact?.last_communication_at ? record.contact.last_communication_at.slice(0, 10) : "never";
  return {
    list: list?.name ?? "(no list)",
    threshold,
    days: record.daysSinceTouch,
    touch,
    via: via ? via : "call / text / manual email / reply",
    text:
      `${list?.name ?? "(no list)"}: ${record.stage || "no stage"} — ${record.daysSinceTouch ?? "?"} days since the last agent touch ` +
      `(${touch}) is over the ${threshold ?? "?"}-day window`,
  };
}

/** Days past the at-risk line: how OVERDUE a lead is, which is what ranks a backlog (98 days quiet on a 93-day list is 5 overdue; 30 on a 10-day list is 20). */
export function overdueDays(record) {
  const { threshold, days } = ruleFor(record);
  return Number.isFinite(days) && Number.isFinite(threshold) ? days - threshold : days ?? 0;
}

export function renderParitySections({
  results,
  actions,
  dry,
  forcedDry = false,
  profile,
  rules,
  battrAtRisk = null,
  battrDate = null,
  auditDay = new Date(),
}) {
  const lines = [];
  const atRisk = results.filter((r) => r.status === "at_risk");
  const neglected = results.filter((r) => r.status === "neglected");
  const unverified = results.filter((r) => r.status === "unverified");
  const nudgePlan = actions.nudgePlan ?? { send: [], held: [], tripped: false, total: 0 };
  const sweepPlan = actions.sweepPlan ?? { send: [], held: [], tripped: false, total: 0 };

  lines.push("## Tonight at a glance");
  lines.push("");
  lines.push(
    dry
      ? `- **DRY RUN** — nothing was written to Follow Up Boss and no agent was emailed.` +
          (forcedDry ? ` It is forced (\`rules.forceDryRun\`): BATTR_LIVE cannot turn it live; Mike does, by changing that one line.` : "")
      : `- **LIVE** — this run wrote to Follow Up Boss.`
  );
  lines.push(
    `- Rule set: **${profile === "extended" ? "extended (Battr's lists plus the stage lists added 17 Nov)" : "Battr's rules exactly"}** — see docs/battr-rules.md. ` +
      `Sweeping start date: ${rules.sweepsStartOn ?? "none"}${rules.sweepsStartOn && rules.sweepsStartOn > "2026-12-31" ? " (paused)" : ""}.`
  );

  let benchmark;
  if (battrAtRisk === null) {
    benchmark = "No Battr count is on record.";
  } else {
    const age = battrDate ? daysBetween(`${battrDate}T12:00:00Z`, auditDay.getTime()) : null;
    benchmark =
      `Battr's last recorded count was **${battrAtRisk}**${battrDate ? ` on ${battrDate}` : ""}` +
      (age !== null ? `, **${age} days ago**` : "") +
      `. Battr was cancelled after 9 Oct 2026, so there is no current Battr number — this is the last night it ran, not last night.`;
  }
  lines.push(`- **Our verified at-risk count: ${atRisk.length}** (neglected ${neglected.length}). ${benchmark}`);
  lines.push(
    `- Leads we could NOT verify (held, never guessed at): **${unverified.length}**. ` +
      `A lead is verified when its texts and emails were read person by person and nothing in the window reached it.`
  );
  const nightly = rules.maxNudgesPerNight;
  lines.push(
    `- Would-be nudges tonight: **${nudgePlan.tripped ? 0 : nudgePlan.send.length}** of ${nudgePlan.total} eligible ` +
      `(the backlog is warned ${nightly} a night, most overdue first, at most ${rules.maxNudgesPerAgentPerNight} per agent)` +
      (nudgePlan.tripped
        ? ` — **OVER THE SANITY CEILING of ${rules.maxNudgeBacklog}: nothing would go out; this list is what Mike would be emailed instead.**`
        : nudgePlan.held.length
          ? `. **${nudgePlan.held.length} more are waiting their turn — about ${nudgePlan.nightsToClear ?? "?"} night(s) to clear at this pace.**`
          : ".")
  );
  lines.push(
    `- Would-be sweeps tonight: **${sweepPlan.tripped ? 0 : actions.swept.length}** ` +
      `(limit ${rules.maxSweepsPerAgentPerNight} per agent, ${rules.maxSweepsPerNight} total)` +
      (sweepPlan.tripped ? ` — **OVER THE LIMIT: nothing would move; ${sweepPlan.total} were eligible.**` : ".")
  );
  lines.push("");

  // 3. would-be nudges
  const nudgeRows = [...nudgePlan.send, ...(nudgePlan.tripped ? nudgePlan.held : [])].sort(byAgentThenQuiet);
  if (nudgeRows.length) {
    lines.push(nudgePlan.tripped ? `### Nudges that WOULD have gone out, but the night is over the limit (${nudgePlan.total})` : `### Would-be nudges (${nudgeRows.length})`);
    lines.push("");
    lines.push("| Agent | Lead | Stage | Source | Days quiet |");
    lines.push("| --- | --- | --- | --- | ---: |");
    for (const r of nudgeRows) {
      lines.push(`| ${esc(agentOf(r))} | ${esc(r.name)} (#${r.id}) | ${esc(r.stage)} | ${esc(r.source)} | ${r.daysSinceTouch ?? "?"} |`);
    }
    lines.push("");
  }
  if (!nudgePlan.tripped && nudgePlan.held.length) {
    lines.push(`### Waiting their turn (${nudgePlan.held.length}) — warned on later nights`);
    lines.push("");
    const perAgent = new Map();
    for (const r of nudgePlan.held) perAgent.set(agentOf(r), (perAgent.get(agentOf(r)) ?? 0) + 1);
    lines.push(
      [...perAgent.entries()].sort((a, b) => b[1] - a[1]).map(([agent, n]) => `${esc(agent)} ${n}`).join(" · ") +
        `. Each night the next ${rules.maxNudgesPerNight} most overdue (at most ${rules.maxNudgesPerAgentPerNight} per agent) are warned; a lead already warned drops off this list.`
    );
    lines.push("");
  }

  // 4. unverified
  if (unverified.length) {
    lines.push(`### Unverified leads — held, not acted on (${unverified.length})`);
    lines.push("");
    lines.push("Each of these looked at risk on the bulk data, but its history could not be read cleanly, so it is held until it can be.");
    lines.push("");
    lines.push("| Agent | Lead | Stage | Why it is unverified |");
    lines.push("| --- | --- | --- | --- |");
    for (const r of [...unverified].sort(byAgentThenQuiet).slice(0, 200)) {
      lines.push(`| ${esc(agentOf(r))} | ${esc(r.name)} (#${r.id}) | ${esc(r.stage)} | ${esc(r.unverifiedReason)} |`);
    }
    if (unverified.length > 200) lines.push(`| … | ${unverified.length - 200} more | | |`);
    lines.push("");
  }

  // 5. every flagged lead with its rule
  if (atRisk.length) {
    lines.push(`### Every lead we flag, and the rule that flagged it (${atRisk.length})`);
    lines.push("");
    lines.push("| Agent | Lead | Rule that fired | Last agent touch | Battr's stamp |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const r of [...atRisk].sort(byAgentThenQuiet)) {
      const rule = ruleFor(r);
      const stamp = r.contact?.custom_fields?.fub?.customBattrAtRiskSince;
      lines.push(
        `| ${esc(agentOf(r))} | ${esc(r.name)} (#${r.id}) | ${esc(`${rule.list}: ${r.stage || "no stage"}, ${rule.days ?? "?"}d quiet > ${rule.threshold ?? "?"}d`)} | ${esc(rule.touch)} (${esc(rule.via)}) | ${stamp ? esc(String(stamp).slice(0, 10)) : "—"} |`
      );
    }
    lines.push("");
    lines.push("_Battr's stamp is `Battr At Risk Since`. Battr stopped writing it on 9 Oct 2026, so a lead with no stamp here is not evidence Battr would have skipped it._");
    lines.push("");
  }
  return lines;
}
