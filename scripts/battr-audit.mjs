#!/usr/bin/env node
/**
 * Roland Team — internal Battr: daily lead-neglect audit for Follow Up Boss.
 *
 * Mirrors the Battr (Sisu) product the team currently pays for: audit the
 * database daily, leave a nudge note on leads the assigned agent has gone quiet
 * on ("At Risk"), and sweep leads to a pond once they cross the neglect line.
 *
 * Usage:
 *   FUB_API_KEY=... node scripts/battr-audit.mjs --dry          # report only, writes nothing
 *   FUB_API_KEY=... BATTR_LIVE=true node scripts/battr-audit.mjs
 *
 * Flags:
 *   --dry                 force a read-only run (default unless BATTR_LIVE=true)
 *   --stage=at-risk|neglected|both   which rules to act on (default: both)
 *   --max-sweeps=N        override the per-run sweep cap
 *   --smart-list=N        audit a specific FUB smart list (Battr's audit list)
 *   --undo=<run-id>       put every lead swept in that run back where it was
 *
 * Tune behavior in scripts/battr/rules.mjs — not here.
 */
import { writeFileSync, mkdirSync, readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FubClient } from "./battr/fub.mjs";
import { rules } from "./battr/rules.mjs";
import { DAY_MS, ptDate, buildTouchIndex, classifySimple, runCombinedList, isExemptAgent, lower, hasAny, daysBetween, readInboundEmails, findUnansweredInbound, runReportOnlyLists, foldTouches } from "./battr/classify.mjs";
import { normalizeContact } from "./battr/contact.mjs";
import { resolvePausedOwners } from "./battr/paused.mjs";
import { pondForLead } from "./battr/ponds.mjs";
import { foldEmailTouches, describeEmailOrigin } from "./battr/communication.mjs";
import { isDayAllowed } from "./battr/schedule.mjs";
import { lists, reportOnlyLists } from "./battr/lists.mjs";
import { bucketName, isSourceAudited } from "./battr/sources.mjs";
import { needsRules, unseenCount, OBSERVED_DATE } from "./battr/observed.mjs";
import {
  loadOwnership,
  saveOwnership,
  appendAtBats,
  loadAtBats,
  detectAtBats,
  summarizeAgents,
  DEFAULT_CONVERTED_STAGES,
} from "./battr/atbats.mjs";
import { buildAgentDigests, deliverDigests, renderAtBatsSection } from "./battr/alerts.mjs";
import { sendMail, mailConfigured } from "./battr/email.mjs";
import { appendComparisons, readComparisons, drift } from "./battr/compare.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * Overridable so the self-test can point a run at a scratch directory.
 *
 * It used to be a constant, and the e2e test cleaned up afterwards by removing
 * `battr-logs` wholesale — which deletes the committed audit trail and, worse,
 * `state/ownership.csv`. Losing that snapshot is not a tidy-up: the next run
 * then sees no baseline, and before the cold-start guard that meant minting a
 * brand_new_lead for all fifty-odd thousand contacts. Running the tests must
 * not be able to do that.
 */
const LOG_DIR = process.env.BATTR_LOG_DIR || join(ROOT, "battr-logs");
/** The running record of our numbers against Battr's. See compare.mjs. */
const COMPARISON_PATH = join(LOG_DIR, "comparison.csv");

// ---------------------------------------------------------------------- args

function parseArgs(argv) {
  const a = { stage: "both" };
  for (const arg of argv) {
    if (arg === "--dry") a.dry = true;
    else if (arg.startsWith("--stage=")) a.stage = arg.slice(8);
    else if (arg.startsWith("--max-sweeps=")) a.maxSweeps = Number(arg.slice(13));
    else if (arg.startsWith("--smart-list=")) a.smartListId = arg.slice(13);
    else if (arg.startsWith("--undo=")) a.undo = arg.slice(7);
  }
  return a;
}

// ---------------------------------------------------------------- custom fields

const FIELD_LABELS = {
  atRiskSince: "Battr At Risk Since",
  lastNudged: "Battr Last Nudged",
  lastSwept: "Battr Last Swept",
  lastTouch: "Battr Last Touch",
};

/**
 * Resolve our state fields to FUB's API field names, creating any that are
 * missing. If the account can't create custom fields, we degrade to notes and
 * tags rather than failing the run.
 */
async function resolveCustomFields(fub, log) {
  const map = {};
  let existing = [];
  try {
    existing = await fub.customFields();
  } catch (err) {
    log(`  custom fields unavailable (${err.message}) — falling back to notes/tags only`);
    return map;
  }

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const match = existing.find((f) => lower(f.label) === lower(label) || lower(f.name) === lower(label));
    if (match?.name) {
      map[key] = match.name;
      continue;
    }
    try {
      const created = await fub.request("POST", "/customFields", { body: { label, type: "date" } });
      if (created?.name) map[key] = created.name;
      else if (created?.dry) log(`  [dry] would create custom field "${label}"`);
    } catch (err) {
      log(`  could not create custom field "${label}": ${err.message}`);
    }
  }
  return map;
}

// ------------------------------------------------------------ reply reprieve

/**
 * Has this lead written back? If so it is spared the sweep.
 *
 * Failure is treated as "spared", not "sweep anyway". A lead left in place today
 * is swept tomorrow once the lookup works; a lead swept mid-conversation is a
 * client relationship handed to a stranger. The count of unchecked leads goes in
 * the report so a broken lookup is loud rather than invisible.
 */
async function replyReprieve(fub, personId, sinceIso, diag) {
  if (diag.checks >= rules.maxEmailChecksPerRun) {
    diag.budgetSpent++;
    return { spared: true, reason: `email check budget (${rules.maxEmailChecksPerRun}) spent` };
  }

  diag.checks++;
  try {
    const { latest, undirected } = readInboundEmails(await fub.emailsForPerson(personId, sinceIso));
    diag.undirected += undirected;
    if (!latest) return { spared: false };
    return { spared: true, reason: `lead replied by email ${daysBetween(latest)}d ago` };
  } catch (err) {
    diag.failures.push(err.message);
    return { spared: true, reason: `could not check for a reply (${err.message})` };
  }
}

// ---------------------------------------------------------------------- report

function buildReport({ runId, dry, population, results, actions, ponds, agentStats = [], alerts = { delivered: [], failed: [] }, replyDiag = null, unanswered = [], reportLists = [], touchIncomplete = [], unenforceable = [], comparisonDrift = [], passedOver = { beforeList: 0, pausedAgents: 0, pausedLeads: 0 }, emailBackfill = null }) {
  const byAgent = new Map();
  for (const r of results) {
    if (r.status === "excluded" || !r.owner) continue;
    const row = byAgent.get(r.owner) ?? { agent: r.owner, assigned: 0, compliant: 0, atRisk: 0, neglected: 0, swept: 0 };
    row.assigned++;
    if (r.status === "compliant") row.compliant++;
    if (r.status === "at_risk") row.atRisk++;
    if (r.status === "neglected") row.neglected++;
    byAgent.set(r.owner, row);
  }
  for (const s of actions.swept) {
    const row = byAgent.get(s.previousOwner);
    if (row) row.swept++;
  }

  // Worst first — this is the ordering that makes the report worth opening.
  const scoreboard = [...byAgent.values()].sort(
    (a, b) => b.neglected + b.atRisk - (a.neglected + a.atRisk) || b.assigned - a.assigned
  );

  const lines = [];
  lines.push(`# Battr audit — ${ptDate()}${dry ? " (DRY RUN — nothing was written)" : ""}`);
  lines.push("");
  // "53786 leads audited" was the raw database pull, not the audit list. The
  // audited population is what the combined list actually holds — Battr's
  // equivalent number is 866 — and conflating the two makes every rate in this
  // report look sixty times better than it is.
  const audited = results.filter((r) => r.status !== "excluded").length;
  // In list mode every member list carries its own pair of thresholds, so the
  // single global pair is not what judged anybody — printing it here read as
  // "this run used 7/14" when Hot Leads used 2/4 and Quarterly Nurture 93/96.
  const thresholdNote =
    rules.mode === "lists"
      ? "thresholds: per list (2/4 Hot … 93/96 Quarterly)"
      : `thresholds: at risk ${rules.atRiskDays}d, neglected ${rules.neglectedDays}d`;
  lines.push(
    `Run \`${runId}\` · **${audited} leads audited** of ${population} pulled from Follow Up Boss · ${thresholdNote}`
  );
  if (touchIncomplete.length) {
    lines.push("");
    lines.push("> ## ⚠ THIS AUDIT IS NOT COMPLETE — DO NOT ACT ON THE NEGLECTED COUNTS");
    lines.push(">");
    for (const gap of touchIncomplete) {
      lines.push(`> Follow Up Boss would not serve **${gap.channel}** in bulk: \`${gap.reason}\``);
    }
    lines.push(">");
    lines.push(
      "> Every lead below is judged on the channels that *could* be read. A lead an agent has only " +
        "ever texted therefore reads as never contacted. **Sweeps are disabled for this run** — the " +
        "engine will not take a lead off an agent on evidence it knows is partial."
    );
    lines.push("");
  }

  // An exclusion that cannot fire is more dangerous than one that is absent.
  // Absent, nobody relies on it. Present-but-inert, someone puts an agent in
  // the group, reasonably expects their leads to stop being swept, and nothing
  // anywhere says otherwise — their leads get swept anyway. This used to be a
  // stderr line in a CI log nobody opens; it belongs above the counts, in the
  // report the decision gets made from.
  if (unenforceable.length) {
    lines.push("");
    lines.push("> ## ⚠ AN EXCLUSION IN THIS CONFIG PROTECTS NOBODY");
    lines.push(">");
    for (const gap of unenforceable) {
      lines.push(`> **${gap.rule}** — ${gap.why}`);
    }
    lines.push(">");
    lines.push(
      `> The exemption that DOES work is \`rules.exemptAgents\`, matched on the assigned agent's name. ` +
        `Currently: ${rules.exemptAgents.length ? rules.exemptAgents.join(", ") : "(nobody)"}. ` +
        `Putting an agent in a Follow Up Boss group or team will not protect their leads.`
    );
    lines.push("");
  }

  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(
    `- At Risk: **${actions.atRisk.length}** (${actions.nudged.length} new notes, ${actions.alreadyFlagged.length} already flagged)`
  );
  lines.push(
    `- Neglected: **${actions.neglected.length}** (${actions.swept.length} swept, ${actions.heldBack.length} held back)`
  );
  // Both halves, because they moved between each other once already and the
  // total is the only thing that stayed honest through it.
  const excludedAfterList = results.filter((r) => r.status === "excluded").length;
  lines.push(
    `- Excluded: **${excludedAfterList + passedOver.beforeList}** ` +
      `(${passedOver.beforeList} never entered the audit list, ${excludedAfterList} removed after it)`
  );
  if (emailBackfill && emailBackfill.manual !== undefined) {
    // Reported, not logged. The point of this pass is to learn which field
    // Follow Up Boss uses to mark an email as machine-sent, and the answer
    // going to stderr is the fourth time on this project a load-bearing number
    // has gone somewhere nobody reads.
    const { manual, automated, unknown, origin } = emailBackfill;
    lines.push(
      `- Email counted as work: **${manual} manual**, ${automated} automated (ignored), ${unknown} undetermined` +
        (emailBackfill.rows !== undefined ? ` — of ${emailBackfill.rows} row(s) read, ${emailBackfill.skipped ?? 0} unusable` : "")
    );
    const fields = Object.keys(origin?.fields ?? {});
    lines.push(
      `  - origin fields present on the sample: ${fields.length ? `\`${fields.join("`, `")}\`` : "**none — FUB marks these rows no way we can read**"}`
    );
    if (unknown) {
      lines.push(
        `  - ${unknown} email(s) could not be classified, so sweeps are held. Counting them would let one batch ` +
          `send mark a lead as worked; ignoring them would sweep a lead an agent wrote to by hand.`
      );
    }
  }

  if (passedOver.pausedAgents) {
    // Reported, not logged. The last two times a number like this went to
    // stderr only, it took days to notice it was wrong.
    lines.push(
      `- Paused agents: **${passedOver.pausedAgents}** on \`${rules.excludeOwnerTeamNames.join(", ")}\`, ` +
        `holding ${passedOver.pausedLeads} lead(s) back from nudges and sweeps`
    );
  }

  // A bound cap means the run did NOT do what the rules say it should — it did
  // less, deliberately. That is the brake working, but it has to be visible:
  // Battr processed 45 neglected on Tuesday 8 Sep against 7 on Wednesday 2 Sep,
  // because sweeps run Tue–Fri and Tuesday clears three days of backlog. A cap
  // of 30 clips a Tuesday and nothing else, so the day it binds is exactly the
  // day someone should be told rather than left to infer it from a long list.
  const cappedOut = actions.heldBack.filter((h) => /sweep cap/.test(h.holdReason ?? "")).length;
  if (cappedOut) {
    lines.push(
      `- ⚠ **The per-run sweep cap held back ${cappedOut} lead${cappedOut === 1 ? "" : "s"}.** ` +
        `They are still neglected and will be reconsidered on the next eligible run. ` +
        `Battr's own Tuesday volume has reached 45, so a cap of ${rules.maxSweepsPerRun} binds on Tuesdays by design — ` +
        `raise it in rules.mjs only deliberately.`
    );
  }
  for (const s of actions.skipped ?? []) {
    lines.push(`- **${s.count} ${s.what} skipped today** — ${s.reason}`);
  }
  lines.push("");

  lines.push("## Agent scoreboard (worst first)");
  lines.push("");
  lines.push("| Agent | Assigned | At risk | Neglected | Swept today |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  for (const row of scoreboard) {
    lines.push(`| ${row.agent} | ${row.assigned} | ${row.atRisk} | ${row.neglected} | ${row.swept} |`);
  }
  lines.push("");

  if (actions.swept.length) {
    lines.push(`## Swept to pond (${actions.swept.length})`);
    lines.push("");
    lines.push("| Lead | From | To | Days quiet | Source |");
    lines.push("| --- | --- | --- | ---: | --- |");
    for (const s of actions.swept) {
      lines.push(`| ${s.name} | ${s.previousOwner} | ${s.pondName} | ${s.daysSinceTouch} | ${s.source || "—"} |`);
    }
    lines.push("");
  }

  if (actions.heldBack.length) {
    lines.push(`## Neglected but not swept (${actions.heldBack.length})`);
    lines.push("");
    for (const h of actions.heldBack) lines.push(`- ${h.name} (${h.owner}) — ${h.holdReason}`);
    lines.push("");
  }

  // A reply lookup that quietly stops working would spare every lead forever and
  // the run would still look healthy. Say so on the face of the report instead.
  if (replyDiag?.failures?.length) {
    lines.push(
      `> **${replyDiag.failures.length} leads were not swept because the reply lookup failed** — ` +
        `e.g. \`${replyDiag.failures[0]}\`. Nothing was swept blind, but fix this: ` +
        `until it works, no lead can be swept.`
    );
    lines.push("");
  }
  if (replyDiag?.undirected) {
    lines.push(
      `> ${replyDiag.undirected} emails carried no direction field, so they counted as neither sent nor received. ` +
        `Check what \`/v1/emails\` returns before trusting the reply reprieve.`
    );
    lines.push("");
  }
  if (replyDiag?.budgetSpent) {
    lines.push(`> ${replyDiag.budgetSpent} leads were held back unchecked: the per-run reply-lookup budget was spent.`);
    lines.push("");
  }

  // Inbound resets the clock, so a lead who called in and was never called back
  // reads as compliant everywhere else in this report. That case is the most
  // expensive kind of neglect there is, so it gets its own section rather than
  // disappearing into the rule that spared it.
  if (unanswered.length) {
    lines.push(`## Inbound, never answered (${unanswered.length})`);
    lines.push("");
    lines.push("These leads called or texted us and nobody has called or texted back since.");
    lines.push("They are not swept for it — an inbound contact counts as a touch — but this is the list to work.");
    lines.push("");
    lines.push("| Lead | Owner | Days since they reached out | Source |");
    lines.push("| --- | --- | ---: | --- |");
    for (const u of unanswered.slice(0, 50)) {
      lines.push(`| ${u.name} | ${u.owner || "unassigned"} | ${u.waitingDays} | ${u.source || "—"} |`);
    }
    if (unanswered.length > 50) lines.push(`| …and ${unanswered.length - 50} more | | | |`);
    lines.push("");
  }

  // Which sources drive the sweeps — this is what tells you whether a source
  // belongs in the audit at all, or in the excluded bucket.
  const bySource = new Map();
  for (const r of results) {
    if (r.status !== "at_risk" && r.status !== "neglected") continue;
    const key = r.source || "(no source)";
    const row = bySource.get(key) ?? { source: key, atRisk: 0, neglected: 0, bucket: bucketName(r.contact?.lead_bucket_id ?? null) };
    if (r.status === "at_risk") row.atRisk++;
    else row.neglected++;
    bySource.set(key, row);
  }
  const sourceRows = [...bySource.values()].sort((a, b) => b.neglected + b.atRisk - (a.neglected + a.atRisk));
  if (sourceRows.length) {
    lines.push("## By lead source");
    lines.push("");
    lines.push("| Source | Bucket | At risk | Neglected |");
    lines.push("| --- | --- | ---: | ---: |");
    for (const s of sourceRows) lines.push(`| ${s.source} | ${s.bucket} | ${s.atRisk} | ${s.neglected} |`);
    const unmapped = sourceRows.filter((s) => s.bucket === "Unmapped");
    if (unmapped.length) {
      lines.push("");
      lines.push(`> ${unmapped.length} of these sources are unmapped. Map them in \`scripts/battr/sources.mjs\` — run \`npm run battr:sources\` to list every source in the database.`);
    }
    lines.push("");
  }

  // Every list Battr runs, ours beside theirs. None of these act — they are here
  // so a rule we have modelled wrongly shows up as a number that disagrees,
  // rather than as silence.
  // The running record, as opposed to the frozen snapshot below. A rule that is
  // wrong today shows up in the snapshot; a rule that DRIFTS shows up here, and
  // only here — and only while the subscription that produces Battr's numbers
  // is still being paid for.
  if (comparisonDrift.length) {
    lines.push("## Side by side with Battr — the running record");
    lines.push("");
    lines.push("| List | Ours | Battr | Drift | Battr's row read |");
    lines.push("| --- | ---: | ---: | ---: | --- |");
    for (const d of comparisonDrift) {
      const sign = d.driftPct > 0 ? "+" : "";
      // A drift figure is only a disagreement when both sides are the same
      // night. Marked inline, not footnoted: the footnote was already there on
      // 20 Sep and the −7.8% was still read as the engine falling behind.
      const age = d.comparable ? d.battrDate : `${d.battrDate} ⚠ ${d.staleDays}d older`;
      const pct = d.comparable ? `${sign}${d.driftPct.toFixed(1)}%` : `(${sign}${d.driftPct.toFixed(1)}%)`;
      lines.push(`| ${d.listName} | ${d.ours} | ${d.battr} | ${pct} | ${age} |`);
    }
    lines.push("");

    const stale = comparisonDrift.filter((d) => !d.comparable);
    if (stale.length) {
      lines.push(
        `> **${stale.length} of ${comparisonDrift.length} rows compare against a Battr count from a different day**, ` +
          "shown in brackets. Battr's audit list moves on its own — it ran 880 on 15 Sep and 777 on 20 Sep — so a " +
          "drift figure spanning several days is measuring that movement, not a disagreement with us. " +
          "Transcribe the current night before trusting a bracketed number."
      );
      lines.push("");
    }

    lines.push(
      "Worst drift first. Battr's rows are typed in by hand from its Aida Audits screen, which has no " +
        "export — so a stale date in the last column means nobody has transcribed lately, not that Battr " +
        "stopped changing. `battr-logs/comparison.csv` is the file to add them to."
    );
    lines.push("");
  }

  if (reportLists.length) {
    lines.push("## Reconciliation — other lists Battr runs (reported, never actioned)");
    lines.push("");
    lines.push(`| List | Ours | Battr ${OBSERVED_DATE} | Ours: C / AR / N | Battr: C / AR / N |`);
    lines.push("| --- | ---: | ---: | --- | --- |");
    for (const r of reportLists) {
      const o = r.observed;
      const mine = `${r.compliant} / ${r.at_risk} / ${r.neglected}`;
      const theirs = o ? `${o.compliant} / ${o.at_risk} / ${o.neglected}` : "—";
      const flag = r.thresholdsInferred ? " ⚠︎" : "";
      lines.push(`| ${r.name}${flag} | ${r.total} | ${o?.total ?? "—"} | ${mine} | ${theirs} |`);
    }
    lines.push("");
    lines.push("⚠︎ = thresholds inferred from Battr's compliance split, not read off its rule screen. A wide miss on that row means the threshold is wrong, not the data.");
    lines.push("");

    const gaps = needsRules();
    if (gaps.length || unseenCount() > 0) {
      lines.push("**Still unmodelled:**");
      for (const g of gaps) lines.push(`- ${g.name} — ${g.total.toLocaleString()} records on ${OBSERVED_DATE}. ${g.note}`);
      if (unseenCount() > 0) {
        lines.push(`- ${unseenCount()} further scheduled audits ran that day and have not been captured.`);
      }
      lines.push("");
    }
  }

  lines.push(renderAtBatsSection(agentStats));

  if (alerts.delivered.length || alerts.failed.length) {
    // On a dry run nothing left the building. Saying "sent" here is how a
    // shadow report gets mistaken for a live one.
    const verb = dry ? "would send" : "sent";
    lines.push(`## Agent alerts (${alerts.delivered.length} ${verb}, ${alerts.failed.length} failed)`);
    lines.push("");
    for (const d of alerts.delivered) {
      const waiting = d.unanswered?.length ? `, ${d.unanswered.length} waiting on a call back` : "";
      lines.push(`- ${d.agent}: ${d.atRisk.length} at risk, ${d.neglected.length} sweeping${waiting} — ${d.via}`);
    }
    for (const f of alerts.failed) lines.push(`- ${f.agent}: FAILED — ${f.reason}`);
    lines.push("");
  }

  const pondNames = ponds.map((p) => p.name).join(", ");
  lines.push("---");
  lines.push(
    `Ponds available: ${pondNames || "none resolved"}. Undo this run: \`node scripts/battr-audit.mjs --undo=${runId}\``
  );

  return lines.join("\n");
}

/**
 * Deliver the report. Always writes the file and the CI job summary; email and
 * Slack are opt-in via env so the script has no hard dependency on either.
 */
async function deliverReport(markdown, { runId, dry }) {
  mkdirSync(LOG_DIR, { recursive: true });
  const path = join(LOG_DIR, `${runId}-report.md`);
  writeFileSync(path, markdown);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }

  const subject = `Battr audit — ${ptDate()}${dry ? " (dry run)" : ""}`;

  if (mailConfigured() && process.env.BATTR_REPORT_TO) {
    try {
      await sendMail({ to: process.env.BATTR_REPORT_TO, subject, text: markdown });
    } catch (err) {
      // Never fatal: the report is already on disk and in the job summary, and
      // failing the run over a mail problem would hide a clean audit.
      console.error(`  report email failed: ${err.message}`);
    }
  } else if (process.env.BATTR_REPORT_TO && !mailConfigured()) {
    console.error("  report email skipped: BATTR_REPORT_TO is set but RESEND_API_KEY is not");
  }

  if (process.env.BATTR_WEBHOOK_URL) {
    try {
      await fetch(process.env.BATTR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `*${subject}*\n\n${markdown}` }),
      });
    } catch (err) {
      console.error(`  webhook delivery failed: ${err.message}`);
    }
  }

  return path;
}

// ------------------------------------------------------------------------ undo

/**
 * Put every lead swept in one run back where it was.
 *
 * This is the emergency brake, and it gets reached on the worst morning anyone
 * will have with this system. Two things it therefore must not do:
 *
 * 1. REVERSE A DRY RUN'S LOG. A dry run still records the sweeps it WOULD have
 *    made — that is what makes a shadow run worth reading. Those leads were
 *    never moved. "Undoing" them would reassign live leads to owners they were
 *    never taken from, from a list of moves that only ever existed on paper,
 *    and the undo would be the first thing all night to actually touch the CRM.
 *
 * 2. CLAIM SUCCESS IT DID NOT HAVE. The client short-circuits writes in dry
 *    mode and returns `{dry:true}` rather than throwing, so a dry undo counted
 *    every lead as restored and printed "Restored 12/12 leads" having done
 *    nothing. A false all-clear is worse than a crash here: a crash sends
 *    someone looking, an all-clear sends them to lunch while the leads sit in
 *    the pond.
 *
 * So undo always writes. It is a corrective action reversing writes that
 * already happened, and gating it behind BATTR_LIVE would be backwards —
 * someone who switches the system off after a bad night would find the undo
 * switched off with it.
 */
async function undo(apiKey, runId, log) {
  const path = join(LOG_DIR, `${runId}.json`);
  if (!existsSync(path)) throw new Error(`No sweep log found for run ${runId} (looked in ${path})`);

  const entry = JSON.parse(readFileSync(path, "utf8"));

  if (entry.dry) {
    throw new Error(
      `Run ${runId} was a DRY RUN — those ${entry.sweeps.length} sweeps never happened, so there is nothing to undo. ` +
        `Reversing them would move live leads to owners they were never taken from. Refusing.`
    );
  }
  if (!entry.sweeps.length) {
    log(`Run ${runId} swept nothing. Nothing to undo.`);
    return;
  }

  // Deliberately NOT the caller's client: undo writes, whatever mode the run
  // that invoked it is in.
  const fub = new FubClient(apiKey, { dry: false, log });

  log(`Undoing ${entry.sweeps.length} sweeps from run ${runId} — THIS WRITES TO FOLLOW UP BOSS.`);

  let restored = 0;
  const failed = [];
  for (const sweep of entry.sweeps) {
    try {
      await fub.assign(sweep.personId, { userId: sweep.fromUserId, pondId: null });
      await fub.note(sweep.personId, `Battr: sweep reversed — restored to ${sweep.fromUserName}.`);
      restored++;
    } catch (err) {
      failed.push(`${sweep.name} (#${sweep.personId}): ${err.message}`);
    }
  }
  log(`Restored ${restored}/${entry.sweeps.length} leads.`);

  // A partial undo leaves the database half-reversed. That has to be an error
  // exit, not a line in the middle of a log nobody scrolls back through.
  if (failed.length) {
    throw new Error(`${failed.length} lead(s) could not be restored and are still in the pond:\n  ${failed.join("\n  ")}`);
  }
}

// ------------------------------------------------------------------------ main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const log = console.error;

  // Writing requires an explicit opt-in. Everything else is a dry run.
  const dry = args.dry === true || process.env.BATTR_LIVE !== "true";
  const runId = `${ptDate()}-${Date.now().toString(36).slice(-4)}`;

  const fub = new FubClient(process.env.FUB_API_KEY, { dry, log });

  if (args.undo) return undo(process.env.FUB_API_KEY, args.undo, log);

  log(`Battr audit ${runId} — ${dry ? "DRY RUN (no writes)" : "LIVE"}`);

  // 1. roster
  const [users, ponds] = await Promise.all([fub.users(), fub.ponds()]);
  log(`  ${users.length} users, ${ponds.length} ponds`);

  const pondByName = (name) => ponds.find((p) => lower(p.name) === lower(name));
  const primaryPond = pondByName(rules.sweepPond);
  if (!primaryPond && !dry) throw new Error(`Sweep pond "${rules.sweepPond}" not found in FUB.`);

  // 2. population
  const smartListId = args.smartListId || process.env.BATTR_SMART_LIST_ID;
  const people = await fub.people({ smartListId });
  log(`  ${people.length} leads in the audit population`);

  // 3. activity → last touch
  const since = new Date(Date.now() - rules.activityLookbackDays * DAY_MS).toISOString();
  const activity = await fub.activity(since);
  const touchIndex = buildTouchIndex(activity);
  log(
    `  ${activity.calls.length} calls, ${activity.texts.length} texts, ${activity.emails.length} emails since ${since.slice(0, 10)}`
  );

  // A channel FUB will not serve in bulk leaves the touch index incomplete, and
  // an incomplete touch index is the one state in which sweeping does real
  // damage: a lead an agent has only ever texted reads as never contacted, and
  // gets taken off the agent who actually worked it. Report, never sweep.
  const touchIncomplete = activity.unavailable ?? [];
  if (touchIncomplete.length) {
    for (const gap of touchIncomplete) {
      log(`  WARNING: ${gap.channel} could not be read — last-touch is incomplete`);
    }
    log("  SWEEPS DISABLED for this run: an incomplete touch index would sweep leads that were worked.");
  }

  // 4. classify
  //
  // Custom fields are resolved BEFORE classification, not after: list mode reads
  // `customBattrAtRiskSince` off each contact to enforce the warn-first
  // interlock, so the field's API name has to be known while normalizing.
  const fields = await resolveCustomFields(fub, log);
  // Classification is a closure because it reads the touch index, and the
  // backfill below can move last-touch forward for the leads that matter.
  // Running it again is cheaper and less error-prone than patching results.
  let contacts = [];
  // Rules that are configured but cannot fire against this account's data.
  // Collected during classification, surfaced at the top of the report.
  const unenforceable = [];

  /**
   * Leads the combined list never admitted, and why.
   *
   * These used to be invisible and then, worse, misleadingly visible. Before
   * the paused-agent fix, a lead owned by an exempt agent entered the list and
   * was marked "excluded" after the union, so the report's Excluded line
   * counted it. After the fix the same lead carries the paused marker and is
   * filtered at MEMBERSHIP, so it never reaches that line: the 22 Sep run
   * printed "Excluded: 10" where the night before printed 823, while auditing
   * exactly the same 813 leads.
   *
   * Nothing had changed about who was protected. The number that said so had
   * simply stopped counting most of them, which is the kind of silent drop this
   * report exists to prevent.
   */
  const passedOver = { beforeList: 0, pausedAgents: 0, pausedLeads: 0 };

  // Who is on a paused team. Roster data, resolved ONCE from /v1/teams rather
  // than read off each lead — Follow Up Boss returns no team membership on a
  // person, which is why this exclusion protected nobody for as long as it did.
  const paused = await resolvePausedOwners(fub, rules.excludeOwnerTeamNames, log);
  log(
    paused.enforceable
      ? `  paused teams: ${paused.matched.join(", ")} → ${paused.userIds.size} agent(s)`
      : `  paused teams: NOT RESOLVED (${rules.excludeOwnerTeamNames.join(", ") || "none configured"})`
  );

  const classifyPopulation = ({ quiet = false } = {}) => {
    const say = quiet ? () => {} : log;
    contacts = people.map((p) =>
      normalizeContact(p, touchIndex.get(p.id), fields, { pausedOwnerIds: paused.userIds })
    );

    let results;
    if (rules.mode === "lists") {
      const combined = lists.find((l) => l.audit_type === "combined_contact_lists");
      if (!combined) throw new Error("mode is 'lists' but no combined list is configured.");

      const run = runCombinedList(contacts, combined, Date.now());
      if (run.missingMemberLists.length) {
        say(`  WARNING: member lists ${run.missingMemberLists.join(", ")} have no rule JSON — population is narrower than the live audit.`);
      }

      // Four of the six member lists branch on FUB timeframe. If we can't read it,
      // those lists silently come back empty rather than erroring — so say so.
      const unresolved = contacts.filter((c) => c.timeframeUnresolved).length;
      if (unresolved) {
        say(`  ${unresolved} nurture-stage contacts have no timeframe set — they fall to CLEAN UP (1145), which reports and never sweeps.`);
      }

      // An id FUB returns that our table does not cover. Distinct from "blank":
      // blank is a data gap someone can fill in, an unmapped id means FUB added
      // a band and four lists are now quietly narrower than Battr's.
      const unknownIds = [...new Set(contacts.filter((c) => c.timeframeIdUnknown).map((c) => c.custom_fields.fub.system_timeframeId))];
      if (unknownIds.length) {
        say(`  WARNING: timeframe ids not in TIMEFRAME_IDS: ${unknownIds.join(", ")} — run inspect-fub-fields and extend the map, or those leads are audited by nothing.`);
      }

      // The combined list excludes an owner group, but that condition reads a
      // field FUB may not return on a person. If nobody has any group ids, the
      // exclusion cannot fire and the protection it implies does not exist.
      // THE INTERLOCK HAS TO BE READABLE, or it silently empties the sweep.
      //
      // Since 16 Sep every member list's neglected tier requires
      // `customBattrAtRiskSince` to be set — Battr's own rule. That makes an
      // unreadable stamp far more dangerous than it used to be: before, a null
      // stamp only skipped the sweep loop's second check; now it makes the
      // neglected tier unreachable for EVERY lead, and the run reports zero
      // neglected and looks like the healthiest night on record.
      //
      // Battr has been stamping leads daily for weeks, so a population with no
      // stamps at all is a read failure, not a clean database.
      const stamped = contacts.filter((c) => c.custom_fields.fub.customBattrAtRiskSince).length;
      if (!stamped && !unenforceable.some((u) => u.rule.startsWith("Warn-first"))) {
        // On 16 Sep this fired correctly and nobody saw it, because it went to
        // stderr while the report said "Neglected: 0" — the same log-only
        // mistake the owner-group warning had just been fixed for. A zero that
        // should be impossible belongs above the counts, not in a CI log.
        unenforceable.push({
          rule: "Warn-first interlock (At Risk Since)",
          why:
            "Not one contact carries the stamp, so no lead can reach the neglected tier and the zero below is a " +
            "READ FAILURE, not a clean database. Every neglected count in this report is meaningless until it is fixed.",
        });
      }
      if (!stamped) {
        say(
          `  WARNING: not one contact carries ${fields.atRiskSince || "customBattrAtRiskSince"} — the warn-first interlock ` +
            `cannot fire, so NO lead can reach the neglected tier and a zero here is a read failure, not a clean database. ` +
            `Check the field's API name with inspect-fub-fields before trusting tonight's neglected count.`
        );
      } else {
        say(`  ${stamped} contacts carry an At Risk Since stamp — the interlock is readable.`);
      }

      // Three distinct states, and collapsing them is what hid this for weeks.
      // "Nobody is on the paused team" and "the exclusion cannot fire" both
      // produce zero protected leads, but only the second is a defect.
      const markedLeads = contacts.filter((c) => (c.owner_group_ids ?? []).length).length;
      if (!paused.enforceable && !unenforceable.some((u) => u.rule.startsWith("Owner-group"))) {
        unenforceable.push({
          rule: `Owner-group exclusion (“${rules.excludeOwnerTeamNames.join(", ") || "none configured"}”)`,
          why: paused.missing.length
            ? `No Follow Up Boss team is named ${paused.missing.map((n) => `“${n}”`).join(" or ")}. ` +
              "A team name that matches nothing protects nobody, and it reads on the rule screen exactly " +
              "like a team that is simply empty."
            : "No paused team is configured, so no agent's leads are held back by team membership.",
        });
      } else if (paused.enforceable) {
        say(
          paused.userIds.size
            ? `  paused-agent exclusion ENFORCED: ${paused.userIds.size} agent(s), ${markedLeads} lead(s) held back`
            : `  paused-agent exclusion is enforceable but the team is empty — it holds back nobody today. ` +
              `That is a roster fact, not a fault; add an agent to “${paused.matched.join(", ")}” to use it.`
        );
      }
      passedOver.beforeList = run.excluded.length;
      passedOver.pausedAgents = paused.userIds.size;
      passedOver.pausedLeads = markedLeads;
      say(`  ${run.records.length} in the combined list, ${run.excluded.length} excluded by bucket/group`);

      // Two exclusions applied after the union, both surfaced as "excluded" in the
      // report rather than quietly vanishing from the counts.
      //
      // The source check cannot be left to the combined list's `lead_bucket_id !=
      // 82` condition: an unmapped source has a null bucket, and `null != 82` is
      // true, so an unclassified source would sail through regardless of
      // unmappedPolicy. isSourceAudited is the only thing that honours it.
      results = run.records.map((r) => {
        if (isExemptAgent(r.owner, rules)) {
          return { ...r, status: "excluded", reason: `exempt agent (${r.owner})` };
        }
        if (!isSourceAudited(r.source)) {
          return { ...r, status: "excluded", reason: `protected source (${r.source || "none"})` };
        }
        return r;
      });
    } else {
      results = contacts.map((c) => classifySimple(c, touchIndex, rules));
    }
    return results;
  };

  let results = classifyPopulation();

  // 4b. BACKFILL THE CHANNEL FUB WOULD NOT SERVE IN BULK
  //
  // `/v1/textMessages` refuses a whole-database read, so the touch index above
  // is calls-only and the run will not sweep on it. But FUB serves one person's
  // thread happily, and only a few dozen leads are ever actionable — so ask
  // about those, per person, and fold the answers in.
  //
  // Folding is monotonic: it moves last-touch forward, never back. So a text
  // found here can only move a lead from neglected toward compliant. The pass
  // cannot make anyone newly sweepable, which is why it is safe to run before
  // the sweep decision rather than after.
  let textBackfill = null;
  const missingTexts = touchIncomplete.find((g) => g.channel === "texts");
  if (missingTexts && rules.perPersonTextBackfill) {
    const candidates = results.filter((r) => r.status === "at_risk" || r.status === "neglected");
    if (candidates.length > rules.maxTextBackfill) {
      // Abandoned, not half-done. A partial backfill is the one genuinely
      // dangerous outcome here: it looks like a complete touch index.
      log(`  text backfill SKIPPED: ${candidates.length} actionable leads exceeds maxTextBackfill (${rules.maxTextBackfill}).`);
      textBackfill = { attempted: candidates.length, complete: false, reason: "over the cap" };
    } else {
      log(`  backfilling texts for ${candidates.length} actionable leads (FUB serves these per person)...`);
      const before = { atRisk: results.filter((r) => r.status === "at_risk").length, neglected: results.filter((r) => r.status === "neglected").length };
      let rows = 0;
      let failed = 0;
      for (const cand of candidates) {
        try {
          const texts = await fub.textsForPerson(cand.id, since);
          rows += texts.length;
          foldTouches(touchIndex, texts);
        } catch (err) {
          // One lead's thread failing leaves the index incomplete for that
          // lead, and there is no way to tell a "no texts" from a "could not
          // read". So the whole pass is incomplete, and sweeps stay off.
          failed++;
          log(`  text backfill failed for one lead: ${err.message}`);
        }
      }
      results = classifyPopulation({ quiet: true });
      const after = { atRisk: results.filter((r) => r.status === "at_risk").length, neglected: results.filter((r) => r.status === "neglected").length };
      textBackfill = { attempted: candidates.length, rows, failed, complete: failed === 0, before, after };
      log(
        `  text backfill: ${rows} messages over ${candidates.length} leads` +
          (failed ? `, ${failed} FAILED — touch index still incomplete` : "") +
          ` — at risk ${before.atRisk} → ${after.atRisk}, neglected ${before.neglected} → ${after.neglected}`
      );
    }
  }

  // 4c. EMAIL, WHICH BATTR COUNTS AND WE DID NOT
  //
  // Battr's playbook counts a manual email as working a lead and ignores an
  // automated one. We excluded the channel outright, because a FUB batch send
  // is one click for five hundred leads — right reasoning, too blunt a fix,
  // and it cost 281 at risk against Battr's 15 on 22 Sep.
  //
  // Same shape as the text backfill above and safe for the same reason:
  // folding only moves last-touch forward, so an email found here can move a
  // lead from neglected toward compliant and never the other way.
  //
  // The new risk is different. A text either exists or does not; an email has
  // to be JUDGED, and if its origin cannot be read then counting it reopens
  // the blast hole and ignoring it sweeps a lead the agent wrote to. So an
  // unreadable origin marks the touch index incomplete, which turns sweeps off
  // for the run — the same brake the missing text channel pulls.
  let emailBackfill = null;
  if (rules.emailCountsAsTouch) {
    const candidates = results.filter((r) => r.status === "at_risk" || r.status === "neglected");
    if (candidates.length > rules.maxEmailBackfill) {
      log(`  email backfill SKIPPED: ${candidates.length} actionable leads exceeds maxEmailBackfill (${rules.maxEmailBackfill}).`);
      emailBackfill = { attempted: candidates.length, complete: false, reason: "over the cap" };
      touchIncomplete.push({ channel: "emails", reason: `backfill skipped — ${candidates.length} leads over the cap` });
    } else {
      log(`  backfilling emails for ${candidates.length} actionable leads (manual only — automated does not count)...`);
      const before = { atRisk: results.filter((r) => r.status === "at_risk").length, neglected: results.filter((r) => r.status === "neglected").length };
      const tally = { manual: 0, automated: 0, unknown: 0, skipped: 0, rows: 0 };
      let failed = 0;
      let sample = [];
      for (const cand of candidates) {
        try {
          const rows = await fub.emailsForPerson(cand.id, since);
          if (sample.length < 40) sample = sample.concat(rows).slice(0, 40);
          const t = foldEmailTouches(touchIndex, rows, { personId: cand.id });
          tally.manual += t.manual;
          tally.automated += t.automated;
          tally.unknown += t.unknown;
          tally.skipped += t.skipped;
          tally.rows += rows.length;
        } catch (err) {
          failed++;
          log(`  email backfill failed for one lead: ${err.message}`);
        }
      }
      results = classifyPopulation({ quiet: true });
      const after = { atRisk: results.filter((r) => r.status === "at_risk").length, neglected: results.filter((r) => r.status === "neglected").length };
      emailBackfill = {
        attempted: candidates.length,
        ...tally,
        failed,
        complete: failed === 0 && tally.unknown === 0,
        before,
        after,
        origin: describeEmailOrigin(sample),
      };
      log(
        `  email backfill: ${tally.manual} manual, ${tally.automated} automated, ${tally.unknown} undetermined` +
          (failed ? `, ${failed} FAILED` : "") +
          ` — at risk ${before.atRisk} → ${after.atRisk}, neglected ${before.neglected} → ${after.neglected}`
      );
      // Rows read and none usable is the failure this pass has already had
      // once: it reports zeroes that read exactly like "nobody emailed anyone".
      // It is a shape problem with the rows, and it must say so.
      if (tally.rows && tally.manual + tally.automated + tally.unknown === 0) {
        touchIncomplete.push({
          channel: "emails",
          reason:
            `${tally.rows} email row(s) were read and NONE could be used — every one lacked a person id or a ` +
            `timestamp we recognise. This is a row-shape problem, not an empty inbox. ` +
            `Fields seen: ${JSON.stringify(emailBackfill.origin.fields)}`,
        });
      }
      if (tally.unknown) {
        touchIncomplete.push({
          channel: "emails",
          reason:
            `${tally.unknown} email(s) carried no field identifying them as manual or automated. ` +
            `Counting them would let one batch send mark a lead as worked; ignoring them would sweep a lead an ` +
            `agent wrote to. Origin fields actually present: ${JSON.stringify(emailBackfill.origin.fields)}`,
        });
      }
      if (failed) {
        touchIncomplete.push({ channel: "emails", reason: `${failed} lead(s) whose email thread could not be read` });
      }
    }
  }

  const atRisk = results.filter((r) => r.status === "at_risk");
  const neglected = results.filter((r) => r.status === "neglected");
  log(`  ${atRisk.length} at risk, ${neglected.length} neglected`);

  const today = ptDate();
  const actions = { atRisk, neglected, nudged: [], alreadyFlagged: [], swept: [], heldBack: [], skipped: [] };

  const peopleById = new Map(people.map((p) => [p.id, p]));

  // Day filters gate each action independently. A blocked day is logged as a
  // skip with its reason — never silently dropped.
  // An incomplete touch signal blocks BOTH tiers, not just the sweep.
  //
  // Run 2026-09-04-e1vs held all 55 sweeps for exactly this reason and still
  // wrote 8 nudges. That is the wrong half to hold. A nudge stamps
  // `Battr At Risk Since`, and that stamp is the whole of the warn-first
  // interlock: a wrong nudge tonight is what arms a wrong sweep tomorrow, on a
  // night when the run has already decided it cannot trust its own evidence.
  //
  // The backfill above can restore a complete touch index for every lead an
  // action would touch. That removes the REASON sweeps are disabled, but not
  // the decision: acting on a backfilled index takes the number of leads that
  // can be swept from zero to non-zero, so it waits on an explicit opt-in
  // (`rules.sweepOnBackfilledTexts`) rather than switching itself on. Until
  // then the counts in the report are correct and nothing moves — which is the
  // state that makes the report comparable to Battr's nightly emails.
  // EVERY backfill has to be complete, not just the text one.
  //
  // This read `textBackfill?.complete === true` alone, which meant an email
  // pass that could not tell a manual send from an action-plan send pushed its
  // gap onto `touchIncomplete` and was then overruled by texts having gone
  // fine. The brake the email pass exists to pull did not reach the pedal.
  //
  // It cost nothing tonight because sweeps are off for an unrelated reason —
  // which is exactly how a fault like this survives to the day the flag flips.
  const backfills = [textBackfill, emailBackfill].filter(Boolean);
  const backfillsComplete = backfills.length > 0 && backfills.every((b) => b.complete === true);
  const touchComplete = touchIncomplete.length === 0 || backfillsComplete;
  const touchUsable = touchIncomplete.length === 0 || (backfillsComplete && rules.sweepOnBackfilledTexts === true);
  const touchReason = touchComplete
    ? "last-touch complete via per-person backfill, but rules.sweepOnBackfilledTexts is off"
    : "last-touch incomplete";
  const nudgesAllowedToday = isDayAllowed(rules.nudgeDayFilter, new Date(), rules.timezone) && touchUsable;
  const sweepsAllowedToday = isDayAllowed(rules.sweepDayFilter, new Date(), rules.timezone) && touchUsable;
  if (!nudgesAllowedToday) log(`  nudges skipped: ${touchUsable ? `day filter "${rules.nudgeDayFilter}"` : touchReason}`);
  if (!sweepsAllowedToday) log(`  sweeps skipped: ${touchUsable ? `day filter "${rules.sweepDayFilter}"` : touchReason}`);

  // 5a. nudge
  if ((args.stage === "both" || args.stage === "at-risk") && nudgesAllowedToday) {
    for (const lead of atRisk) {
      const person = peopleById.get(lead.id);
      const alreadyFlagged = fields.atRiskSince ? Boolean(person?.[fields.atRiskSince]) : false;

      if (alreadyFlagged) {
        actions.alreadyFlagged.push(lead);
        continue;
      }
      try {
        await fub.note(lead.id, rules.nudgeNote(lead));
        if (fields.atRiskSince) {
          await fub.updateFields(lead.id, {
            [fields.atRiskSince]: today,
            ...(fields.lastNudged ? { [fields.lastNudged]: today } : {}),
          });
        }
        actions.nudged.push(lead);
      } catch (err) {
        log(`  nudge failed for ${lead.name} (#${lead.id}): ${err.message}`);
      }
    }
  }

  // 5b. sweep
  const sweepLog = { runId, timestamp: new Date().toISOString(), dry, sweeps: [] };
  const replyDiag = { checks: 0, undirected: 0, budgetSpent: 0, spared: 0, failures: [] };
  if ((args.stage === "both" || args.stage === "neglected") && sweepsAllowedToday) {
    const cap = args.maxSweeps ?? rules.maxSweepsPerRun;
    const replyWindow = new Date(Date.now() - rules.inboundEmailWindowDays * DAY_MS).toISOString();
    /** Sweeps issued to each pond this run, for the cap below. */
    const sweptPerPond = new Map();

    for (const lead of neglected) {
      if (actions.swept.length >= cap) {
        actions.heldBack.push({ ...lead, holdReason: `per-run sweep cap (${cap}) reached` });
        continue;
      }
      if (hasAny(lead.tags, rules.reportOnlyTags)) {
        actions.heldBack.push({ ...lead, holdReason: "report-only tag (unworkable contact info)" });
        continue;
      }

      // Second, independent checks on the agent exemption and the source policy.
      // Classification already removes these; this guarantees no future change
      // to classification can let a sweep through.
      if (isExemptAgent(lead.owner, rules)) {
        actions.heldBack.push({ ...lead, holdReason: `exempt agent (${lead.owner})` });
        continue;
      }
      if (!isSourceAudited(lead.source)) {
        actions.heldBack.push({ ...lead, holdReason: `protected source (${lead.source || "none"})` });
        continue;
      }

      // The warn-first interlock: no sweep unless a previous run already warned
      // the agent and stamped the lead. Without this, a lead that has simply
      // been quiet a long time is taken away with no warning ever issued.
      if (rules.requireWarningBeforeSweep) {
        const person = peopleById.get(lead.id);
        const warned = fields.atRiskSince ? Boolean(person?.[fields.atRiskSince]) : false;
        if (!warned) {
          actions.heldBack.push({ ...lead, holdReason: "never warned — interlock held the sweep" });
          continue;
        }
      }

      // Last gate before the lead moves: did the lead write back? An agent can
      // batch-email thirty people in one click, so outbound email never counts
      // as working a lead — but a reply cannot be sent in bulk, and sweeping a
      // live conversation away from the agent holding it is the one mistake
      // this engine must not make.
      if (rules.inboundEmailSparesSweep) {
        const reprieve = await replyReprieve(fub, lead.id, replyWindow, replyDiag);
        if (reprieve.spared) {
          replyDiag.spared++;
          actions.heldBack.push({ ...lead, holdReason: reprieve.reason });
          continue;
        }
      }

      // Battr's "Pond Assignments" rule set, read off the screen on 23 Sep:
      // 10 days old or newer to Money Time, older to Shark Tank. Lead age, and
      // nothing else.
      const routed = pondForLead(lead.contact?.crm_created_at ?? lead.contact?._raw?.created, rules);
      const pond = pondByName(routed.pondName);
      if (!pond) {
        actions.heldBack.push({ ...lead, holdReason: `sweep pond "${routed.pondName}" not found in FUB` });
        continue;
      }

      // The cap is ours, not Battr's, and it now HOLDS rather than redirects.
      // Redirecting a lead to a different pond once a count was hit was the
      // overflow model, and that model is dead — sending a stale lead into the
      // pond reserved for fresh ones would be worse than not moving it tonight.
      const alreadyToThisPond = sweptPerPond.get(pond.id) ?? 0;
      if (alreadyToThisPond >= rules.maxSweepsPerPond) {
        actions.heldBack.push({
          ...lead,
          holdReason: `per-pond cap reached (${rules.maxSweepsPerPond} to ${pond.name} this run)`,
        });
        continue;
      }

      const person = peopleById.get(lead.id);
      const record = {
        personId: lead.id,
        name: lead.name,
        previousOwner: lead.owner,
        fromUserId: lead.ownerId,
        fromUserName: lead.owner,
        toPondId: pond.id,
        pondName: pond.name,
        daysSinceTouch: lead.daysSinceTouch,
        source: lead.source,
        atRiskSince: fields.atRiskSince ? person?.[fields.atRiskSince] : null,
      };

      try {
        await fub.note(lead.id, rules.sweepNote(record));
        await fub.assign(lead.id, {
          userId: null,
          pondId: pond.id,
          fields: fields.lastSwept ? { [fields.lastSwept]: today } : {},
        });
        actions.swept.push(record);
        sweepLog.sweeps.push(record);
        sweptPerPond.set(pond.id, (sweptPerPond.get(pond.id) ?? 0) + 1);
      } catch (err) {
        log(`  sweep failed for ${lead.name} (#${lead.id}): ${err.message}`);
        actions.heldBack.push({ ...lead, holdReason: `sweep failed: ${err.message}` });
      }
    }
  }

  // A blocked day is a recorded skip, not a silent no-op.
  const incompleteReason = () =>
    (touchComplete
      ? `${touchIncomplete.map((g) => g.channel).join(", ")} backfilled per person and complete — ` +
        `set rules.sweepOnBackfilledTexts to act on it`
      : `last-touch incomplete — ${touchIncomplete.map((g) => g.channel).join(", ")} could not be read in bulk`);
  if (!nudgesAllowedToday && atRisk.length) {
    actions.skipped.push({
      what: "nudges",
      count: atRisk.length,
      reason: touchUsable ? `day filter "${rules.nudgeDayFilter}"` : incompleteReason(),
    });
  }
  if (!sweepsAllowedToday && neglected.length) {
    actions.skipped.push({
      what: "sweeps",
      count: neglected.length,
      reason: touchUsable ? `day filter "${rules.sweepDayFilter}"` : incompleteReason(),
    });
  }

  // 6. At Bats — ownership-change tracking.
  //
  // This runs in dry mode too. The ledger is local bookkeeping, not a CRM write,
  // and letting it accrue through the shadow period means there's real history
  // on the day we go live instead of starting from zero.
  const statePath = join(LOG_DIR, "state", "ownership.csv");
  const ledgerPath = join(LOG_DIR, "at-bats.jsonl");

  const sweptIds = new Set(actions.swept.map((s) => s.personId));
  const priorOwnership = loadOwnership(statePath);
  const newAtBats = detectAtBats(priorOwnership, contacts, { sweptIds });
  appendAtBats(ledgerPath, newAtBats);
  saveOwnership(statePath, contacts);
  if (!priorOwnership || priorOwnership.size === 0) {
    log(`  ownership baseline recorded for ${contacts.length} contacts — no at bats from a cold start`);
  } else if (newAtBats.length) {
    log(`  ${newAtBats.length} new at bats recorded`);
  }

  const stageList = await fub.stages().catch(() => []);
  const convertedStageExids = stageList
    .filter((s) => DEFAULT_CONVERTED_STAGES.some((n) => lower(n) === lower(s.name)))
    .map((s) => s.id);

  const contactsById = new Map(contacts.map((c) => [c.id, c]));
  const usersById = new Map(users.map((u) => [u.id, u]));
  const agentStats = summarizeAgents(loadAtBats(ledgerPath), contactsById, {
    convertedStageExids,
    userNames: new Map(users.map((u) => [u.id, u.name])),
  });

  // 7. Per-agent alerts — what tells the AGENT, as opposed to the note on the lead.
  // Email, matching what Battr did: each agent gets their own list. Override
  // with the BATTR_ALERT_CHANNEL repository variable (report_only | fub_task).
  const channel = process.env.BATTR_ALERT_CHANNEL || "email";
  // The lists Battr runs that never act. Counted every night so a wrong rule
  // surfaces as a number, not as silence.
  const reportLists = rules.mode === "lists" ? runReportOnlyLists(contacts, reportOnlyLists(), Date.now()) : [];
  for (const r of reportLists) {
    const drift = r.observed && r.observed.total ? Math.abs(r.total - r.observed.total) / r.observed.total : 0;
    if (drift > 0.25) {
      log(`  ${r.name}: ${r.total} vs Battr's ${r.observed.total} on ${OBSERVED_DATE} — off by ${Math.round(drift * 100)}%`);
    }
  }

  // The overlap with Battr is the only window in which these numbers can be
  // checked against a known-good system, and it closes when the subscription
  // does. Record tonight's rows while there is still something to compare to.
  // Our rows only — anything attributed to Battr in that file was typed in from
  // its own screen by a person, because an engine inventing them would make the
  // comparison circular.
  const auditedNow = results.filter((r) => r.status !== "excluded").length;
  const comparisonRows = [
    {
      date: today,
      source: "ours",
      listId: 0,
      listName: "⭐️ Team Leads (combined)",
      total: auditedNow,
      compliant: auditedNow - atRisk.length - neglected.length,
      at_risk: atRisk.length,
      neglected: neglected.length,
    },
    ...reportLists.map((r) => ({
      date: today,
      source: "ours",
      listId: r.id,
      listName: r.name,
      total: r.total,
      compliant: r.compliant,
      at_risk: r.at_risk,
      neglected: r.neglected,
    })),
  ];
  try {
    appendComparisons(COMPARISON_PATH, comparisonRows);
  } catch (err) {
    log(`  could not record tonight's comparison row: ${err.message}`);
  }
  let comparisonDrift = [];
  try {
    comparisonDrift = drift(readComparisons(COMPARISON_PATH));
  } catch (err) {
    log(`  could not read the comparison history: ${err.message}`);
  }

  const unanswered = findUnansweredInbound(results, rules.unansweredInboundDays);
  if (unanswered.length) log(`  ${unanswered.length} leads reached out with no call or text back`);

  // Digests are withheld on an unusable touch signal, for the same reason the
  // actions are. Run 2026-09-04-e1vs would have emailed thirteen agents that
  // their leads were "sweeping" — Quetza Adame that eighteen of hers were going
  // — on a night the engine swept nothing and had already said in its own report
  // that it could not trust the counts. Telling thirty agents their book is
  // being taken, wrongly, is not a smaller mistake than taking it.
  const digests = touchUsable
    ? buildAgentDigests(results, {
        excludeGroupIds: rules.excludeOwnerGroupIds,
        sweepDays: rules.neglectedDays,
        unanswered,
        // Built AFTER the sweep loop, so the digest can tell an agent which
        // leads they can still save from the ones already gone.
        sweptIds,
      })
    : [];

  if (!touchUsable) {
    const wouldHave = buildAgentDigests(results, { excludeGroupIds: rules.excludeOwnerGroupIds, unanswered, sweptIds }).length;
    log(`  ${wouldHave} agent digests WITHHELD — ${incompleteReason()}`);
    actions.skipped.push({ what: "agent alerts", count: wouldHave, reason: incompleteReason() });
  }

  const alerts = await deliverDigests(digests, { channel, fub, usersById, dry, log });
  if (digests.length) log(`  ${digests.length} agent digests (${channel}${dry ? ", dry" : ""})`);

  // 8. report + undo trail
  mkdirSync(LOG_DIR, { recursive: true });
  if (sweepLog.sweeps.length) writeFileSync(join(LOG_DIR, `${runId}.json`), JSON.stringify(sweepLog, null, 2));

  const markdown = buildReport({ runId, dry, population: people.length, results, actions, ponds, agentStats, alerts, replyDiag, unanswered, reportLists, touchIncomplete, unenforceable, comparisonDrift, passedOver, emailBackfill });
  const reportPath = await deliverReport(markdown, { runId, dry });

  console.log(markdown);
  log(`\n  report → ${reportPath}`);
  log(`  ${fub.reads} reads, ${fub.writes} writes${dry ? " (dry run — no writes issued)" : ""}`);
}

main().catch((err) => {
  console.error(`\nBattr audit failed: ${err.message}`);
  process.exit(1);
});
