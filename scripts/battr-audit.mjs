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
import { DAY_MS, ptDate, buildTouchIndex, classifySimple, runCombinedList, isExemptAgent, lower, hasAny, daysBetween, readInboundEmails, findUnansweredInbound, runReportOnlyLists } from "./battr/classify.mjs";
import { normalizeContact } from "./battr/contact.mjs";
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOG_DIR = join(ROOT, "battr-logs");

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

function buildReport({ runId, dry, population, results, actions, ponds, agentStats = [], alerts = { delivered: [], failed: [] }, replyDiag = null, unanswered = [], reportLists = [], touchIncomplete = [] }) {
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
  lines.push(
    `Run \`${runId}\` · **${audited} leads audited** of ${population} pulled from Follow Up Boss · ` +
      `thresholds: at risk ${rules.atRiskDays}d, neglected ${rules.neglectedDays}d`
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

  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(
    `- At Risk: **${actions.atRisk.length}** (${actions.nudged.length} new notes, ${actions.alreadyFlagged.length} already flagged)`
  );
  lines.push(
    `- Neglected: **${actions.neglected.length}** (${actions.swept.length} swept, ${actions.heldBack.length} held back)`
  );
  lines.push(`- Excluded: ${results.filter((r) => r.status === "excluded").length}`);
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

async function undo(fub, runId, log) {
  const path = join(LOG_DIR, `${runId}.json`);
  if (!existsSync(path)) throw new Error(`No sweep log found for run ${runId} (looked in ${path})`);

  const entry = JSON.parse(readFileSync(path, "utf8"));
  log(`Undoing ${entry.sweeps.length} sweeps from run ${runId}...`);

  let restored = 0;
  for (const sweep of entry.sweeps) {
    try {
      await fub.assign(sweep.personId, { userId: sweep.fromUserId, pondId: null });
      await fub.note(sweep.personId, `Battr: sweep reversed — restored to ${sweep.fromUserName}.`);
      restored++;
    } catch (err) {
      log(`  failed to restore ${sweep.name} (#${sweep.personId}): ${err.message}`);
    }
  }
  log(`Restored ${restored}/${entry.sweeps.length} leads.`);
}

// ------------------------------------------------------------------------ main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const log = console.error;

  // Writing requires an explicit opt-in. Everything else is a dry run.
  const dry = args.dry === true || process.env.BATTR_LIVE !== "true";
  const runId = `${ptDate()}-${Date.now().toString(36).slice(-4)}`;

  const fub = new FubClient(process.env.FUB_API_KEY, { dry, log });

  if (args.undo) return undo(fub, args.undo, log);

  log(`Battr audit ${runId} — ${dry ? "DRY RUN (no writes)" : "LIVE"}`);

  // 1. roster
  const [users, ponds] = await Promise.all([fub.users(), fub.ponds()]);
  log(`  ${users.length} users, ${ponds.length} ponds`);

  const pondByName = (name) => ponds.find((p) => lower(p.name) === lower(name));
  const primaryPond = pondByName(rules.sweepPond);
  const overflowPond = pondByName(rules.overflowPond);
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
  const contacts = people.map((p) => normalizeContact(p, touchIndex.get(p.id), fields));

  let results;
  if (rules.mode === "lists") {
    const combined = lists.find((l) => l.audit_type === "combined_contact_lists");
    if (!combined) throw new Error("mode is 'lists' but no combined list is configured.");

    const run = runCombinedList(contacts, combined, Date.now());
    if (run.missingMemberLists.length) {
      log(`  WARNING: member lists ${run.missingMemberLists.join(", ")} have no rule JSON — population is narrower than the live audit.`);
    }

    // Four of the six member lists branch on FUB timeframe. If we can't read it,
    // those lists silently come back empty rather than erroring — so say so.
    const unresolved = contacts.filter((c) => c.timeframeUnresolved).length;
    if (unresolved) {
      log(`  WARNING: ${unresolved} nurture-stage contacts have no readable timeframe — the four nurture lists will under-report. Check the timeframe field name on a FUB contact.`);
    }

    // The combined list excludes an owner group, but that condition reads a
    // field FUB may not return on a person. If nobody has any group ids, the
    // exclusion cannot fire and the protection it implies does not exist.
    if (!contacts.some((c) => (c.owner_group_ids ?? []).length)) {
      log(`  WARNING: no contact carries owner_group_ids — the owner-group exclusion (${rules.excludeOwnerGroupIds.join(", ")}) is NOT being enforced. Exempt those agents by name in rules.exemptAgents instead.`);
    }
    log(`  ${run.records.length} in the combined list, ${run.excluded.length} excluded by bucket/group`);

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
  const touchUsable = touchIncomplete.length === 0;
  const nudgesAllowedToday = isDayAllowed(rules.nudgeDayFilter, new Date(), rules.timezone) && touchUsable;
  const sweepsAllowedToday = isDayAllowed(rules.sweepDayFilter, new Date(), rules.timezone) && touchUsable;
  if (!nudgesAllowedToday) log(`  nudges skipped: ${touchUsable ? `day filter "${rules.nudgeDayFilter}"` : "last-touch incomplete"}`);
  if (!sweepsAllowedToday) log(`  sweeps skipped: ${touchUsable ? `day filter "${rules.sweepDayFilter}"` : "last-touch incomplete"}`);

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
    let primaryCount = 0;

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

      // Primary pond fills first, then overflow — matching the observed
      // Shark Tank majority / Money Time minority split.
      const usingOverflow = primaryCount >= rules.maxSweepsPerPond && overflowPond;
      const pond = usingOverflow ? overflowPond : primaryPond;
      if (!pond) {
        actions.heldBack.push({ ...lead, holdReason: "no sweep pond resolved" });
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
        if (!usingOverflow) primaryCount++;
      } catch (err) {
        log(`  sweep failed for ${lead.name} (#${lead.id}): ${err.message}`);
        actions.heldBack.push({ ...lead, holdReason: `sweep failed: ${err.message}` });
      }
    }
  }

  // A blocked day is a recorded skip, not a silent no-op.
  const incompleteReason = () =>
    `last-touch incomplete — ${touchIncomplete.map((g) => g.channel).join(", ")} could not be read in bulk`;
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

  const markdown = buildReport({ runId, dry, population: people.length, results, actions, ponds, agentStats, alerts, replyDiag, unanswered, reportLists, touchIncomplete });
  const reportPath = await deliverReport(markdown, { runId, dry });

  console.log(markdown);
  log(`\n  report → ${reportPath}`);
  log(`  ${fub.reads} reads, ${fub.writes} writes${dry ? " (dry run — no writes issued)" : ""}`);
}

main().catch((err) => {
  console.error(`\nBattr audit failed: ${err.message}`);
  process.exit(1);
});
