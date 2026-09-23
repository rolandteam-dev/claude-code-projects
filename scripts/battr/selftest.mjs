#!/usr/bin/env node
/**
 * Self-test for the Battr audit. No Follow Up Boss key required.
 *
 *   node scripts/battr/selftest.mjs
 *
 * Two layers:
 *   1. Unit — fixtures through the pure classifier, asserting each rule.
 *   2. End-to-end — a local fixture server standing in for the FUB API, with
 *      the real engine run against it as a subprocess, asserting the report and
 *      that a dry run issues no writes.
 */
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";

import { classify, buildTouchIndex, classifyForList, runCombinedList, isExemptAgent, readInboundEmails, findUnansweredInbound, runReportOnlyLists, foldTouches, DAY_MS } from "./classify.mjs";
import { evaluateCondition, evaluateSet } from "./filters.mjs";
import { normalizeContact } from "./contact.mjs";
import { isDayAllowed } from "./schedule.mjs";
import { lists, listById, memberListsOf, reportOnlyLists, TIMEFRAMES, TIMEFRAME_IDS } from "./lists.mjs";
import { detectAtBats, summarizeAgents, formatRate } from "./atbats.mjs";
import { buildAgentDigests, deliverDigests, renderDigestText, digestSubject } from "./alerts.mjs";
import { describeError, fromAddress, mailConfigured } from "./email.mjs";
import { parseCsv, findColumn, mapRows } from "./import-atbats.mjs";
import { bucketForSource, bucketName, isSourceAudited, leadBuckets, unmappedPolicy } from "./sources.mjs";
import { pondForLead, ageInDays } from "./ponds.mjs";
import { FubClient } from "./fub.mjs";
import { appendComparisons, readComparisons, drift } from "./compare.mjs";
import { rules } from "./rules.mjs";
import { TIMELINE, SEP_8, SEP_10, SEP_11, SEP_12, SEP_13, SEP_15, SEP_16, FUB_FIELDS, SOURCE_COUNTS, observedLists } from "./observed.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

/** Where the end-to-end run writes. Never the repository's own battr-logs. */
const SCRATCH_LOGS = join(tmpdir(), `battr-selftest-${process.pid}`);

const NOW = Date.UTC(2026, 8, 1, 12, 0, 0); // 2026-09-01, fixed so tests don't drift
const daysAgo = (n) => new Date(NOW - n * DAY_MS).toISOString();

let passed = 0;
const check = (label, fn) => {
  const ok = () => {
    passed++;
    console.log(`  ✓ ${label}`);
  };
  const fail = (err) => {
    console.error(`  ✗ ${label}\n    ${err.message}`);
    process.exitCode = 1;
  };
  try {
    const out = fn();
    // Some checks are async; a rejected promise must fail the run, not vanish.
    if (out && typeof out.then === "function") return out.then(ok, fail);
    ok();
  } catch (err) {
    fail(err);
  }
  return undefined;
};

// --------------------------------------------------------------- unit fixtures

const lead = (over = {}) => ({
  id: 1,
  name: "Test Lead",
  created: daysAgo(60),
  assignedUserId: 10,
  assignedTo: "Jason Shawver",
  stage: "Nurture",
  source: "Zillow Preferred",
  tags: [],
  ...over,
});

const touched = (id, daysSince, { inboundDaysSince } = {}) =>
  buildTouchIndex({
    calls: [{ personId: id, created: daysAgo(daysSince), isIncoming: false }],
    texts: inboundDaysSince ? [{ personId: id, created: daysAgo(inboundDaysSince), isIncoming: true }] : [],
    emails: [],
  });

console.log("\nUnit — classification rules");

check("recent touch is compliant", () => {
  const r = classify(lead(), touched(1, 2), rules, NOW);
  assert.equal(r.status, "compliant");
  assert.equal(r.daysSinceTouch, 2);
});

check(`${rules.atRiskDays}d without a touch is at risk`, () => {
  const r = classify(lead(), touched(1, rules.atRiskDays), rules, NOW);
  assert.equal(r.status, "at_risk");
});

check("one day short of the threshold is still compliant", () => {
  const r = classify(lead(), touched(1, rules.atRiskDays - 1), rules, NOW);
  assert.equal(r.status, "compliant");
});

check(`${rules.neglectedDays}d without a touch is neglected`, () => {
  const r = classify(lead(), touched(1, rules.neglectedDays), rules, NOW);
  assert.equal(r.status, "neglected");
});

check("a never-touched lead runs its clock from creation", () => {
  const r = classify(lead({ created: daysAgo(30) }), new Map(), rules, NOW);
  assert.equal(r.status, "neglected");
  assert.equal(r.neverTouched, true);
  assert.equal(r.daysSinceTouch, 30);
});

check("a brand-new lead is exempt", () => {
  const r = classify(lead({ created: daysAgo(1) }), new Map(), rules, NOW);
  assert.equal(r.status, "excluded");
  assert.match(r.reason, /too new/);
});

check("a protected stage is never swept", () => {
  const r = classify(lead({ stage: "Under Contract" }), touched(1, 90), rules, NOW);
  assert.equal(r.status, "excluded");
  assert.match(r.reason, /protected stage/);
});

check("a NOCONTACT lead is excluded", () => {
  const r = classify(lead({ tags: ["NOCONTACT"] }), touched(1, 90), rules, NOW);
  assert.equal(r.status, "excluded");
});

check("NOTEXT alone does NOT exempt — the phone still works", () => {
  const r = classify(lead({ tags: ["NOTEXT"] }), touched(1, 90), rules, NOW);
  assert.equal(r.status, "neglected");
});

check("a lead already in a pond is excluded", () => {
  const r = classify(lead({ assignedUserId: null, assignedPondId: 5 }), new Map(), rules, NOW);
  assert.equal(r.status, "excluded");
  assert.match(r.reason, /pond/);
});

check("an exempt agent's leads are excluded", () => {
  const r = classify(lead({ assignedTo: "Mike Roland" }), touched(1, 90), rules, NOW);
  assert.equal(r.status, "excluded");
  assert.match(r.reason, /exempt agent/);
});

check("unanswered inbound is flagged but does not escalate by default", () => {
  const r = classify(lead(), touched(1, 5, { inboundDaysSince: 1 }), rules, NOW);
  assert.equal(r.unanswered, true);
  assert.equal(r.status, "compliant", "escalateUnanswered is off by default — mirrors Battr");
});

check("escalateUnanswered halves the at-risk clock when enabled", () => {
  const escalating = { ...rules, escalateUnanswered: true };
  const r = classify(lead(), touched(1, 4, { inboundDaysSince: 1 }), escalating, NOW);
  assert.equal(r.status, "at_risk");
});

check("email never counts as working a lead", () => {
  // FUB makes mass email one click, so counting it would let a single blast
  // mark the whole database as worked. Calls and texts only.
  const emailed = normalizeContact(
    { id: 77, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [], lastCommunication: daysAgo(1) },
    { lastOutbound: 0, lastInbound: 0 }
  );
  assert.equal(
    emailed.custom_fields.fub.system_lastCommunication,
    null,
    "FUB's own lastCommunication counts email and inbound, so it is not a fallback"
  );

  const called = normalizeContact(
    { id: 78, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [] },
    { lastOutbound: new Date(daysAgo(2)).getTime(), lastInbound: 0 }
  );
  assert.ok(called.custom_fields.fub.system_lastCommunication, "a call or text does count");
});

check("an email-only lead reads as neglected — intended, not a bug", () => {
  const c = normalizeContact(
    { id: 79, stage: "Lead", created: daysAgo(60), assignedUserId: 5, assignedTo: "Some Agent", tags: [], lastCommunication: daysAgo(1) },
    { lastOutbound: 0, lastInbound: 0 }
  );
  // Warned already, so the interlock is satisfied and the tier is reachable.
  c.custom_fields.fub.customBattrAtRiskSince = daysAgo(3);
  assert.equal(classifyForList(c, listById(1104), NOW), "neglected");
});

check("a lead calling or texting us counts as a touch", () => {
  // Mike's rule. A live two-way conversation is not a neglected lead, whichever
  // side started it — the same reasoning that spares a lead who replies by email.
  const called = normalizeContact(
    { id: 90, stage: "Lead", created: daysAgo(60), assignedUserId: 5, assignedTo: "Some Agent", tags: [] },
    { lastOutbound: 0, lastInbound: new Date(daysAgo(1)).getTime() }
  );
  assert.equal(called.custom_fields.fub.system_lastCommunication, daysAgo(1));
  assert.equal(classifyForList(called, listById(1104), NOW), "compliant");
});

check("inbound can be switched back off without touching the engine", () => {
  const ignored = normalizeContact(
    { id: 91, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [] },
    { lastOutbound: 0, lastInbound: new Date(daysAgo(1)).getTime() },
    {},
    { inboundCountsAsTouch: false }
  );
  assert.equal(ignored.custom_fields.fub.system_lastCommunication, null);
});

check("the most recent contact wins, whichever direction it came from", () => {
  const c = normalizeContact(
    { id: 92, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [] },
    { lastOutbound: new Date(daysAgo(9)).getTime(), lastInbound: new Date(daysAgo(2)).getTime() }
  );
  assert.equal(c.custom_fields.fub.system_lastCommunication, daysAgo(2));
});

check("a lead who called in and was never called back is still findable", () => {
  // This is what inboundCountsAsTouch costs: the lead reads as compliant. It
  // must not therefore be invisible — the report's unanswered-inbound section
  // is keyed on exactly this shape, so assert the shape holds.
  const c = normalizeContact(
    { id: 93, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [] },
    { lastOutbound: new Date(daysAgo(20)).getTime(), lastInbound: new Date(daysAgo(5)).getTime() }
  );
  assert.equal(classifyForList(c, listById(1104), NOW), "compliant", "not swept — that is the point");
  assert.ok(
    c._touch.lastInbound > c._touch.lastOutbound,
    "and this is what puts it in 'Inbound, never answered'"
  );
  assert.ok(rules.unansweredInboundDays > 0, "the section has a threshold to fire on");
});

check("calls and texts fold into one touch index, in both directions", () => {
  const index = buildTouchIndex({
    calls: [{ personId: 1, created: daysAgo(30), isIncoming: false }],
    texts: [{ personId: 1, created: daysAgo(3), isIncoming: true }],
  });
  assert.equal(index.get(1).lastOutbound, new Date(daysAgo(30)).getTime());
  assert.equal(index.get(1).lastInbound, new Date(daysAgo(3)).getTime());
});

check("a reply from the lead is found, a blast to the lead is not", () => {
  // The whole asymmetry in one test. An agent batch-emails thirty leads in a
  // click; not one of them can batch-reply.
  const { latest, undirected } = readInboundEmails([
    { created: daysAgo(9), isIncoming: false }, // the blast — ignored
    { created: daysAgo(3), isIncoming: true }, // the reply — this is what counts
    { created: daysAgo(1), isIncoming: false },
  ]);
  assert.equal(new Date(latest).toISOString(), daysAgo(3));
  assert.equal(undirected, 0);
});

check("outbound-only email earns no reprieve", () => {
  const { latest } = readInboundEmails([
    { created: daysAgo(1), isIncoming: false },
    { created: daysAgo(2), direction: "outbound" },
  ]);
  assert.equal(latest, 0, "a mass email must never spare a lead from the sweep");
});

check("an email with no direction is counted, never guessed", () => {
  // Guessing inbound reopens the mass-email hole; guessing outbound sweeps live
  // conversations. Neither — count it and put it in the report.
  const { latest, undirected } = readInboundEmails([{ created: daysAgo(1) }]);
  assert.equal(latest, 0);
  assert.equal(undirected, 1);
});

check("undated and malformed email rows are skipped, not thrown on", () => {
  // A row with no usable timestamp says nothing about when the lead replied, so
  // it is dropped before direction is even considered — it is not an unreadable
  // row worth reporting.
  const { latest, undirected } = readInboundEmails([{ isIncoming: true }, {}, null, { created: "not a date", isIncoming: true }]);
  assert.equal(latest, 0);
  assert.equal(undirected, 0);
});

check("the reply window is what decides, and it is configurable", () => {
  assert.equal(rules.inboundEmailSparesSweep, true, "Mike's rule: a reply stops the sweep");
  assert.ok(rules.inboundEmailWindowDays > 0);
  assert.ok(rules.maxEmailChecksPerRun >= rules.maxSweepsPerRun, "the budget must not be tighter than the sweep cap");
});

// ------------------------------------------------------------ filter DSL

console.log("\nUnit — filter DSL");

const c = (over) => ({ crm_pond_id: null, tags_array: ["Buyer"], owner_group_ids: [10, 20], stage: 2, ...over });

check("empty groups mean no constraint", () => {
  assert.equal(evaluateSet({ groups: [] }, c({})), true);
  assert.equal(evaluateSet({ groups: [[]] }, c({})), true);
});

check("OR of ANDs", () => {
  const set = {
    groups: [
      [{ field: "stage", operator: "=", value: 99, value_data_type: "int" }],
      [{ field: "stage", operator: "=", value: 2, value_data_type: "int" }],
    ],
  };
  assert.equal(evaluateSet(set, c({})), true);
});

check("value:null with '=' means IS NULL (not in a pond)", () => {
  assert.equal(evaluateCondition({ field: "crm_pond_id", operator: "=", value: null }, c({})), true);
  assert.equal(evaluateCondition({ field: "crm_pond_id", operator: "=", value: null }, c({ crm_pond_id: 900 })), false);
});

check("value:null with '!=' means IS NOT NULL (the interlock check)", () => {
  const cond = { field: "stamp", operator: "!=", value: null, value_data_type: "text" };
  assert.equal(evaluateCondition(cond, { stamp: "2026-09-01" }), true);
  assert.equal(evaluateCondition(cond, { stamp: null }), false);
});

check("a null timestamp with days_since is infinitely old", () => {
  const overdue = { field: "t", operator: ">", value: 6, transform: { type: "days_since" }, value_data_type: "int" };
  const recent = { field: "t", operator: "<", value: 6, transform: { type: "days_since" }, value_data_type: "int" };
  assert.equal(evaluateCondition(overdue, { t: null }, NOW), true, "never contacted = maximally overdue");
  assert.equal(evaluateCondition(recent, { t: null }, NOW), false);
});

check("days_since compares whole days", () => {
  const cond = { field: "t", operator: ">", value: 6, transform: { type: "days_since" }, value_data_type: "int" };
  assert.equal(evaluateCondition(cond, { t: daysAgo(7) }, NOW), true);
  assert.equal(evaluateCondition(cond, { t: daysAgo(6) }, NOW), false);
});

check("string and number values both coerce for int fields", () => {
  const asString = { field: "stage", operator: "=", value: "2", value_data_type: "int" };
  const asNumber = { field: "stage", operator: "=", value: 2, value_data_type: "int" };
  assert.equal(evaluateCondition(asString, c({})), true);
  assert.equal(evaluateCondition(asNumber, c({})), true);
});

check("IS ANY OF / IS NONE OF", () => {
  assert.equal(evaluateCondition({ field: "stage", operator: "IS ANY OF", value: [2, 98], value_data_type: "int" }, c({})), true);
  assert.equal(evaluateCondition({ field: "stage", operator: "IS NONE OF", value: [2, 98], value_data_type: "int" }, c({})), false);
});

check("CONTAINS ANY / DOES NOT CONTAIN ANY on array columns", () => {
  const excludeImports = { field: "tags_array", operator: "DOES NOT CONTAIN ANY", value: ["Import"], value_data_type: "text" };
  assert.equal(evaluateCondition(excludeImports, c({})), true);
  assert.equal(evaluateCondition(excludeImports, c({ tags_array: ["Import"] })), false);

  const pausedGroup = { field: "owner_group_ids", operator: "DOES NOT CONTAIN ANY", value: [52555], value_data_type: "integer" };
  assert.equal(evaluateCondition(pausedGroup, c({})), true);
  assert.equal(evaluateCondition(pausedGroup, c({ owner_group_ids: [10, 52555] })), false);
});

check("dotted paths resolve into custom_fields", () => {
  const contact = { custom_fields: { fub: { system_lastCommunication: daysAgo(9) } } };
  const cond = {
    field: "custom_fields.fub.system_lastCommunication",
    operator: ">",
    value: 6,
    transform: { type: "days_since" },
    value_data_type: "int",
  };
  assert.equal(evaluateCondition(cond, contact, NOW), true);
});

// --------------------------------------------------- real list rules + interlock

console.log("\nUnit — real list rules");

const hotLeads = listById(1144);
const activeLeads = listById(1105);

const hotLead = (over = {}) =>
  normalizeContact(
    { id: 1, name: "Hot One", created: daysAgo(3), stage: "Lead", tags: [], assignedUserId: 5, assignedTo: "Jason Shawver", ...over },
    { lastOutbound: 0, lastInbound: 0 }
  );

/** Build a contact whose last agent communication was N days ago. */
const quietFor = (days, over = {}) => {
  const contact = hotLead(over);
  contact.custom_fields.fub.system_lastCommunication = daysAgo(days);
  return contact;
};

check("Hot Leads: quiet 3 days is At Risk (threshold is 2, not 7)", () => {
  assert.equal(classifyForList(quietFor(3), hotLeads, NOW), "at_risk");
});

check("Hot Leads: quiet 5 days but never warned is only At Risk", () => {
  const contact = quietFor(5);
  contact.custom_fields.fub.customBattrAtRiskSince = null;
  assert.equal(classifyForList(contact, hotLeads, NOW), "at_risk", "the interlock blocks escalation");
});

check("Hot Leads: quiet 5 days AND previously warned is Neglected", () => {
  const contact = quietFor(5);
  contact.custom_fields.fub.customBattrAtRiskSince = "2026-08-28";
  assert.equal(classifyForList(contact, hotLeads, NOW), "neglected");
});

check("Hot Leads: an imported lead is not in the list at all", () => {
  assert.equal(classifyForList(quietFor(5, { tags: ["Import"] }), hotLeads, NOW), null);
});

check("Hot Leads: a lead already in a pond is not in the list", () => {
  assert.equal(classifyForList(quietFor(5, { assignedPondId: 900 }), hotLeads, NOW), null);
});

check("Active Leads uses its own 6/9 thresholds, not Hot Leads' 2/4", () => {
  const base = { id: 2, created: daysAgo(40), stage: "Lead", tags: [], assignedUserId: 5, lastVisit: daysAgo(2) };
  const at = normalizeContact(base, { lastOutbound: 0 });
  at.custom_fields.fub.system_lastCommunication = daysAgo(7);
  assert.equal(classifyForList(at, activeLeads, NOW), "at_risk", "7 days is past 6 but short of 9");

  const neg = normalizeContact(base, { lastOutbound: 0 });
  neg.custom_fields.fub.system_lastCommunication = daysAgo(10);
  assert.equal(classifyForList(neg, activeLeads, NOW), "neglected");
});

check("only Battr's six lists feed the sweep", () => {
  const { ids, resolved } = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"));
  assert.equal(ids.length, 6);
  assert.deepEqual(
    resolved.map((l) => l.name).sort(),
    ["😎 Bi-Weekly Nurture", "🌤️ Warm Back Up", "🌱 Monthly Nurture", "🌶️ Hot Leads", "🔥 Weekly Nurture", "👀 Quarterly Nurture"].sort()
  );
});

check("no report-only list can ever reach the sweep", () => {
  // The guarantee, stated once: Team Leads is the only list that acts, and none
  // of the monitoring lists is a member of it. Battr's CLEAN UP list holds 4,200
  // records against Team Leads' 866 — adding it would sweep 3,860 leads Battr
  // has never touched.
  const { ids } = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"));
  for (const list of reportOnlyLists()) {
    assert.ok(!ids.includes(list.id), `${list.name} must never feed the sweep list`);
  }
  assert.ok(reportOnlyLists().length >= 5, "all of Battr's monitoring lists are modelled");
});

check("the CLEAN UP list matches Battr's rule: at risk >15 days, neglected >30", () => {
  // Read off Battr's rule screen, not inferred.
  const at = (days) =>
    classifyForList(
      normalizeContact(
        { id: 500, stage: "Nurture", created: daysAgo(400), assignedUserId: 5, assignedTo: "Some Agent", tags: [] },
        { lastOutbound: new Date(daysAgo(days)).getTime(), lastInbound: 0 }
      ),
      listById(1145),
      NOW
    );
  assert.equal(at(14), "compliant");
  assert.equal(at(16), "at_risk");
  assert.equal(at(29), "at_risk");
  assert.equal(at(31), "neglected");
});

check("a neglected CLEAN UP lead is reported and nothing else happens to it", () => {
  // Every action bucket on Battr's rule is empty — no note, no sweep, no alert.
  // Ours is the same: the list is not a member of the combined list, so nothing
  // in the action path ever sees it.
  const list = listById(1145);
  assert.equal(list.report_only, true);
  assert.equal(list.at_risk_actions, undefined);
  assert.equal(list.neglected_actions, undefined);
  assert.equal(list.list_level_actions, undefined);
});

check("a lead with a real timeframe is not in the CLEAN UP list", () => {
  const known = normalizeContact(
    { id: 502, stage: "Nurture", timeframe: "0-3 months", created: daysAgo(200), assignedUserId: 5, tags: [] },
    { lastOutbound: new Date(daysAgo(45)).getTime(), lastInbound: 0 }
  );
  assert.equal(classifyForList(known, listById(1145), NOW), null);
  known.custom_fields.fub.customBattrAtRiskSince = daysAgo(2);
  assert.equal(classifyForList(known, listById(1106), NOW), "neglected");
});

check("a channel FUB refuses in bulk is reported, not thrown and not skipped", async () => {
  // Confirmed live: FUB answers GET /v1/textMessages with 400 unless a person,
  // thread or number is named. Throwing loses the whole audit; skipping is
  // worse — every lead an agent has only ever texted then reads as never
  // contacted, and the sweep takes it off the agent who worked it.
  const client = new FubClient("k", { dry: true, log: () => {} });
  client.paginate = async (path) => {
    if (path === "/textMessages") {
      throw new Error('FUB GET /textMessages → 400: {"errorMessage":"personId, threadId, phone ... must be specified"}');
    }
    return [{ personId: 1, created: new Date().toISOString(), isIncoming: false }];
  };

  const activity = await client.activity(new Date().toISOString());
  assert.equal(activity.calls.length, 1, "the channel that works still comes back");
  assert.equal(activity.texts.length, 0);
  assert.equal(activity.unavailable.length, 1);
  assert.equal(activity.unavailable[0].channel, "texts");
  assert.match(activity.unavailable[0].reason, /must be specified/);
});

check("an unusable touch signal holds the NUDGE, not just the sweep", () => {
  // Run 2026-09-04-e1vs held all 55 sweeps for this reason and still wrote 8
  // nudges. Wrong half. A nudge stamps `Battr At Risk Since`, and that stamp is
  // the whole of the warn-first interlock — a wrong nudge tonight arms a wrong
  // sweep tomorrow. Asserted on the engine source because the gate is a single
  // expression there and nothing else can prove it stayed correct.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(
    src,
    /const touchUsable =\s*touchIncomplete\.length === 0 \|\|\s*\(textBackfill\?\.complete === true && rules\.sweepOnBackfilledTexts === true\);/,
    "acting is allowed only with no gaps at all, or a COMPLETE backfill plus an explicit opt-in"
  );
  assert.match(
    src,
    /const nudgesAllowedToday = isDayAllowed\(rules\.nudgeDayFilter[^)]*\)[^;]*&& touchUsable;/,
    "the nudge gate must carry the same touchUsable condition as the sweep gate"
  );
  assert.match(src, /const sweepsAllowedToday = isDayAllowed\(rules\.sweepDayFilter[^)]*\)[^;]*&& touchUsable;/);
});

check("the backfill cap cannot ration a normal night", () => {
  // The 14 Sep run skipped its backfill because 420 actionable leads exceeded
  // a cap of 200 — and there were 420 precisely BECAUSE texts were unreadable.
  // The cap blocked its own fix. It is a runaway guard, so it must sit above
  // any audit list we have ever seen, derived from the record rather than
  // eyeballed.
  const biggestNight = Math.max(...TIMELINE.map((n) => n.total));
  assert.ok(
    rules.maxTextBackfill > biggestNight,
    `maxTextBackfill (${rules.maxTextBackfill}) must exceed the largest observed audit list (${biggestNight}) — ` +
      `below that it rations normal operation instead of catching a broken membership rule`
  );
  // And our own run audited 909, more than any Battr night on record.
  assert.ok(rules.maxTextBackfill >= 909, "our own 14 Sep run audited 909; the cap must clear that too");
});

check("a per-person backfill cannot switch sweeping on by itself", () => {
  // The backfill restores a complete touch index, which removes the REASON
  // sweeps are held. Turning that into permission to sweep takes the number of
  // leads that can move from zero to non-zero, so it is a human's call. This
  // asserts the opt-in is off and that a complete backfill alone is not enough.
  assert.equal(rules.sweepOnBackfilledTexts, false, "the opt-in must ship off");

  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");

  // `touchComplete` (diagnostics) and `touchUsable` (permission) must be
  // different expressions — collapsing them is exactly the mistake this guards.
  const complete = src.match(/const touchComplete = (.+);/)?.[1];
  const usable = src.match(/const touchUsable =\s*([\s\S]+?);\n/)?.[1];
  assert.ok(complete && usable, "both conditions must exist to be compared");
  assert.notEqual(
    complete.replace(/\s+/g, " ").trim(),
    usable.replace(/\s+/g, " ").trim(),
    "reporting the gap as closed is not the same as permission to act on it"
  );
  assert.ok(
    !complete.includes("sweepOnBackfilledTexts"),
    "the diagnostic must not depend on the opt-in, or the report goes quiet when it is off"
  );
  assert.ok(usable.includes("sweepOnBackfilledTexts"), "permission must depend on the opt-in");

  // A partial backfill must never read as complete. `failed === 0` is the only
  // thing that sets it, because a lead whose thread could not be read is
  // indistinguishable from a lead with no texts.
  assert.match(src, /complete: failed === 0/, "any failed lead makes the whole pass incomplete");
});

check("folding touches only ever moves last-touch forward", () => {
  // This is the property that makes the backfill safe to run before the sweep
  // decision: it can move a lead from neglected toward compliant, never the
  // reverse, so no lead becomes newly sweepable because of it.
  const index = new Map();
  const t2 = new Date("2026-09-10T12:00:00Z").getTime();
  const t1 = new Date("2026-09-02T12:00:00Z").getTime();

  foldTouches(index, [{ personId: 7, created: new Date(t2).toISOString(), isIncoming: false }]);
  assert.equal(index.get(7).lastOutbound, t2);

  // An OLDER row must not drag the timestamp back.
  foldTouches(index, [{ personId: 7, created: new Date(t1).toISOString(), isIncoming: false }]);
  assert.equal(index.get(7).lastOutbound, t2, "an older message cannot un-touch a lead");

  // Inbound and outbound are tracked apart, and both only advance.
  foldTouches(index, [{ personId: 7, created: new Date(t1).toISOString(), isIncoming: true }]);
  assert.equal(index.get(7).lastInbound, t1);
  assert.equal(index.get(7).lastOutbound, t2, "an inbound row must not disturb the outbound clock");

  // Undated and id-less rows are skipped rather than counted as "now".
  foldTouches(index, [{ personId: 7 }, { created: new Date().toISOString() }]);
  assert.equal(index.get(7).lastOutbound, t2);
  assert.equal(index.size, 1, "a row with no person is not a touch");
});

check("an unusable touch signal WITHHOLDS the agent digests", () => {
  // The same run would have emailed thirteen agents that their leads were
  // "sweeping" — one of them that eighteen of hers were going — on a night it
  // swept nothing and had already printed that it could not trust the counts.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(src, /const digests = touchUsable\s*\?\s*buildAgentDigests\(/);
  assert.match(src, /agent digests WITHHELD/);
  assert.match(src, /what: "agent alerts"/, "and the withholding is recorded as a skip, not silent");
});

check("sweeps route by lead age, as Battr's rule screen says", () => {
  // "Pond Assignments", read off the screen 23 Sep 2026:
  //     Money Time (Leads No More than 10 Days Old)   Created Days Ago < 11
  //     Shark Tank (>10 Days)                         Created Days Ago > 10
  // Confirmed in words by Battr's account manager the same day.
  assert.deepEqual(rules.sweepPondRules, [
    { pond: "Money Time", maxCreatedDaysAgo: 10 },
    { pond: "Shark Tank", minCreatedDaysAgo: 11 },
  ]);

  const at = (days) => Date.now() - days * 86400000;
  for (const [days, expected] of [[0, "Money Time"], [1, "Money Time"], [10, "Money Time"], [11, "Shark Tank"], [400, "Shark Tank"]]) {
    assert.equal(pondForLead(new Date(at(days)).toISOString(), rules).pondName, expected, `${days}d old`);
  }

  // The boundary is the whole point: "no more than 10 days old" includes day
  // 10 and excludes day 11. Off by one here puts a fresh lead in the pond of
  // 26,900 stale ones, where nobody will look at it again.
  assert.equal(pondForLead(new Date(at(10)).toISOString(), rules).pondName, "Money Time");
  assert.equal(pondForLead(new Date(at(11)).toISOString(), rules).pondName, "Shark Tank");
});

check("lead age counts whole elapsed days, and never runs negative", () => {
  // The rule reads "Created Days Ago", so a lead created 10 days and 23 hours
  // ago is 10 days old, not 11 — flooring, not rounding. Rounding would push
  // leads across the boundary a day early and into the wrong pond.
  const now = Date.parse("2026-09-23T12:00:00Z");
  assert.equal(ageInDays("2026-09-23T11:00:00Z", now), 0, "an hour old is day 0");
  assert.equal(ageInDays("2026-09-13T13:00:00Z", now), 9, "10 days minus an hour is still day 9");
  assert.equal(ageInDays("2026-09-13T11:00:00Z", now), 10, "10 days and an hour is day 10");
  assert.equal(ageInDays("2026-09-12T11:00:00Z", now), 11, "and 11 days crosses into Shark Tank");

  // FUB has returned future-dated records before. A negative age must not wrap
  // into a huge number and route a brand-new lead to the stale pond.
  assert.equal(ageInDays("2026-09-24T12:00:00Z", now), 0, "a future date clamps to 0");
  assert.equal(pondForLead("2026-09-24T12:00:00Z", rules, now).pondName, "Money Time");
});

check("a lead with no readable creation date is not assumed to be new", () => {
  // An age rule cannot match a lead with no age. Guessing "new" would route a
  // stale lead into the pond reserved for fresh ones, which is the one
  // direction this mistake actually costs something.
  for (const bad of [null, undefined, "", "not a date"]) {
    const routed = pondForLead(bad, rules);
    assert.equal(routed.pondName, rules.sweepPond, `${JSON.stringify(bad)} falls back`);
    assert.equal(routed.ageDays, null);
    assert.match(routed.fallback, /no readable created date/, "and says why, rather than looking deliberate");
  }
  assert.equal(rules.sweepPond, "Shark Tank", "the fallback is the pond stale leads already go to");
});

check("a bound sweep cap is reported in the summary, not buried", () => {
  // Battr processed 45 neglected on Tuesday 8 Sep against 7 on Wednesday 2 Sep:
  // sweeps run Tue-Fri, so Tuesday clears three days of backlog. A cap of 30
  // therefore binds on Tuesdays, and the day it binds is the day to say so.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(src, /const cappedOut = actions\.heldBack\.filter\(\(h\) => \/sweep cap\/\.test/);
  assert.match(src, /per-run sweep cap held back/);
  assert.equal(rules.maxSweepsPerRun, 30, "unchanged — raising it widens what can be swept");
});

check("the report header separates the audited population from the raw pull", () => {
  // The committed report said "53786 leads audited". That was the database, not
  // the audit list — Battr's equivalent number is 866.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(src, /const audited = results\.filter\(\(r\) => r\.status !== "excluded"\)\.length;/);
  assert.match(src, /leads audited\*\* of \$\{population\} pulled/);
});

check("a real error still fails the run", async () => {
  // Only a 400 means "this endpoint needs a filter". Anything else is a genuine
  // failure and must not be swallowed as a missing channel.
  const client = new FubClient("k", { dry: true, log: () => {} });
  client.paginate = async () => {
    throw new Error("FUB GET /calls failed after 5 retries (503)");
  };
  await assert.rejects(() => client.activity(new Date().toISOString()), /503/);
});

check("a sample read stops at the sample size", async () => {
  // people() used to ignore its options argument, so inspect.mjs asking for 40
  // contacts pulled all fifty-odd thousand — hundreds of API calls for a
  // three-record printout, and slow enough to look like a hang.
  const rows = Array.from({ length: 250 }, (_, i) => ({ id: i }));
  let pages = 0;
  const fake = {
    paginate: FubClient.prototype.paginate,
    request: async () => {
      pages++;
      return { people: rows.slice(0, 100), _metadata: { nextLink: "https://x/next", total: 250 } };
    },
    log: () => {},
  };
  const out = await fake.paginate.call(fake, "/people", {}, { max: 40 });
  assert.equal(out.length, 40);
  assert.equal(pages, 1, "one page was enough for 40 rows");
});

check("a substring match is a substring match, and array membership is not", () => {
  // The bug this replaced: CONTAINS ANY compares WHOLE values, so
  // CONTAINS ANY ["Ylopo"] against a source named "Ylopo Seller" is false, and
  // the list reports zero without erroring. MATCHES ANY is the substring test.
  const c = { source_normalized: "Ylopo Seller" };
  const cond = (operator, value) => ({ field: "source_normalized", operator, value, value_data_type: "text" });

  assert.equal(evaluateCondition(cond("CONTAINS ANY", ["Ylopo"]), c), false, "array membership, by design");
  assert.equal(evaluateCondition(cond("MATCHES ANY", ["Ylopo"]), c), true);
  assert.equal(evaluateCondition(cond("MATCHES ANY", ["ylopo"]), c), true, "case-insensitive");
  assert.equal(evaluateCondition(cond("MATCHES ANY", ["Zillow"]), c), false);
  assert.equal(evaluateCondition(cond("DOES NOT MATCH ANY", ["Zillow"]), c), true);
  assert.equal(evaluateCondition(cond("MATCHES ANY", ["Ylopo"]), { source_normalized: "" }), false, "a missing source matches nothing");
  assert.equal(evaluateCondition(cond("DOES NOT MATCH ANY", ["Ylopo"]), { source_normalized: "" }), true);
});

check("NO LIST IS SILENTLY EMPTY — every list matches a contact it should", () => {
  // The failure this project keeps hitting is a rule that returns nothing while
  // looking healthy: a mis-guessed field name, a wrong operator, an id that
  // matches nobody. Each list gets one contact built to fall inside it. If a
  // rule stops selecting anyone, this fails instead of the list quietly
  // reporting zero forever.
  const build = (over, quietDays) =>
    normalizeContact(
      { id: 900, assignedUserId: 5, assignedTo: "Some Agent", tags: [], created: daysAgo(400), ...over },
      { lastOutbound: new Date(daysAgo(quietDays)).getTime(), lastInbound: 0 }
    );

  const cases = [
    [1144, build({ stage: "Lead", created: daysAgo(3), source: "Zillow Flex" }, 5), "Hot Leads"],
    [1104, build({ stage: "Attempted Contact", source: "Realtor.com" }, 20), "Warm Back Up"],
    [1106, build({ stage: "Nurture", timeframe: "0-3 months" }, 20), "Weekly Nurture"],
    [1107, build({ stage: "Nurture", timeframe: "3-6 months" }, 25), "Bi-Weekly"],
    [1108, build({ stage: "Nurture", timeframe: "6-12 months" }, 40), "Monthly"],
    [1109, build({ stage: "Nurture", timeframe: "12+ months" }, 100), "Quarterly"],
    [1145, build({ stage: "Nurture" }, 40), "CLEAN UP: Nurtures No Timeframe"],
    // Corrected 3 Sep 2026 from Battr's rule screens: 1146 is a STAGE list, and
    // 1147 / 1148 are INTENT TAG lists rather than the source lists we had. The
    // fixtures move with the rules, which is the point of this check — each one
    // is a contact built to fall inside the list as it is actually defined.
    [1146, build({ stage: "Sphere" }, 200), "Sphere & Past Clients"],
    [1147, build({ stage: "Lead", tags: ["HANDRAISER"] }, 40), "YLOPO IMPORTANT"],
    [1148, build({ stage: "Lead", tags: ["Zillow High Intent Buyer"], lastActivity: daysAgo(2) }, 20), "Zillow Important"],
    [1150, build({ stage: "Lead", tags: ["AI_ENGAGED"] }, 40), "AI TEXT REPLIES"],
    [1105, build({ stage: "Spoke with Customer", lastVisit: daysAgo(2) }, 20), "Active Leads"],
    [1149, build({ stage: "Under Contract" }, 40), "Current & Upcoming Clients"],
  ];

  for (const [id, contact, label] of cases) {
    const status = classifyForList(contact, listById(id), NOW);
    assert.ok(status !== null, `${label} (${id}) selected nobody — its rule matches no contact`);
    assert.notEqual(status, "compliant", `${label} (${id}) never flags — check its thresholds`);
  }
});

// Hot Leads and Warm Back Up are near-mirrors — same stages, differing only on
// lead age — but their thresholds are worlds apart: 2/4 against 10/13. Swap the
// two ids and nothing errors. Every list still behaves correctly; the wrong list
// just answers to the wrong number, and ten thousand Warm Back Up leads inherit
// a 4-day sweep line that would empty the database into a pond in one night.
//
// The ids also key into observed.mjs, where Battr's own counts live, so a
// transposition there silently changes which list we are being measured against.
// No behavioural test can catch either, which is why these pin the pairing
// everywhere it is written down.

check("list ids are unique", () => {
  const ids = lists.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate list id in lists.mjs: ${ids.join(", ")}`);
});

check("1144 is Hot Leads and 1104 is Warm Back Up, not the other way round", () => {
  assert.match(listById(1144).name, /Hot Leads/);
  assert.match(listById(1104).name, /Warm Back Up/);
});

check("each id carries the rules that belong to that list, not just the label", () => {
  // The label could be right while the rules are transposed, which is the case
  // a name check alone would wave through.
  const age = (list) => list.list_filters.groups[0].find((c) => c.field === "crm_created_at");
  assert.equal(age(listById(1144)).operator, "<", "1144 must be the new-lead side");
  assert.equal(age(listById(1104)).operator, ">", "1104 must be the aged side");

  const atRiskDays = (list) => list.at_risk_filters.groups[0][0].value;
  assert.equal(atRiskDays(listById(1144)), 2, "Hot Leads warns at 2 days");
  assert.equal(atRiskDays(listById(1104)), 10, "Warm Back Up warns at 10 days");
});

check("observed.mjs agrees with lists.mjs about which id is which", () => {
  for (const [id, row] of Object.entries(SOURCE_COUNTS.byList)) {
    const list = listById(Number(id));
    assert.ok(list, `SOURCE_COUNTS names list ${id}, which lists.mjs does not define`);
    assert.ok(
      list.name.includes(row.name) || row.name.includes(list.name.replace(/^[^\w]+\s*/, "")),
      `list ${id} is "${list.name}" in lists.mjs but "${row.name}" in SOURCE_COUNTS`
    );
  }
  for (const row of observedLists.filter((l) => l.listId)) {
    const list = listById(row.listId);
    assert.ok(list, `observed.mjs names list ${row.listId}, which lists.mjs does not define`);
    assert.equal(list.name, row.name, `list ${row.listId} is named differently in lists.mjs and observed.mjs`);
  }
});

check("the record counts corroborate the pairing", () => {
  // Independent of the names: Warm Back Up held 10,783 of the 12,064 pool and
  // Hot Leads 19. If those ever swap, the ids have been transposed somewhere
  // upstream of both files.
  const warm = SOURCE_COUNTS.byList[1104];
  const hot = SOURCE_COUNTS.byList[1144];
  assert.ok(warm.records > hot.records * 100, "Warm Back Up must dwarf Hot Leads — it is the whole aged database");
});

check("the undo brake has a door, and it is not gated on BATTR_LIVE", () => {
  // `--undo=<run-id>` existed and was printed at the bottom of every report,
  // but it was not a task in the workflow: the only way to reach it was a
  // laptop, a clone of this repo and a copy of the FUB key. That is not an
  // emergency brake. It is reached on the worst morning anyone will have with
  // this system, so it needs a route out of the dropdown.
  const wf = readFileSync(join(ROOT, ".github", "workflows", "battr-audit.yml"), "utf8");
  assert.match(wf, /^\s+- "undo"$/m, "undo must be a choice in the task dropdown");
  assert.match(wf, /undo_run_id:/, "and it needs somewhere to type the run id");
  assert.match(wf, /\|census\|test-email\|undo\)/, "the task guard must accept it, or the run is red before it starts");
  assert.match(wf, /name: Undo a run/, "and there must be a step that actually runs it");

  // Reversing a sweep undoes a write that already happened. Gating that behind
  // BATTR_LIVE is backwards: switch the system off after a bad night and the
  // undo goes off with it.
  const step = wf.slice(wf.indexOf("name: Undo a run"), wf.indexOf("name: Commit the audit trail"));
  assert.ok(!step.includes("BATTR_LIVE"), "the undo step must not depend on BATTR_LIVE");

  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(
    src,
    /const fub = new FubClient\(apiKey, \{ dry: false, log \}\);/,
    "undo must build its own writing client, not inherit the caller's dry one"
  );
});

check("undo refuses a dry run's log rather than inventing a reassignment", () => {
  // The sharpest edge in the whole engine. A dry run records the sweeps it
  // WOULD have made — that is what makes a shadow run worth reading — but those
  // leads never moved. Reversing them would assign live leads to owners they
  // were never taken from, and the undo would be the first thing all night to
  // actually touch the CRM.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  const fn = src.slice(src.indexOf("async function undo("), src.indexOf("// ---", src.indexOf("async function undo(")));

  assert.match(fn, /if \(entry\.dry\)/, "undo must check whether the run it is reversing was dry");
  assert.ok(
    fn.indexOf("if (entry.dry)") < fn.indexOf("new FubClient"),
    "the refusal must come BEFORE a writing client exists"
  );
  assert.match(fn, /Refusing\./);

  // And the sweep log has to carry the flag, or the check above reads undefined
  // and every run looks live.
  assert.match(src, /const sweepLog = \{ runId, timestamp: [^}]*dry, sweeps: \[\] \}/, "the log must record dry");

  // A partial undo leaves the database half-reversed; that is an error exit,
  // not a line in a log nobody scrolls back through.
  assert.match(fn, /could not be restored and are still in the pond/);
  assert.ok(fn.includes("throw new Error(`${failed.length}"), "a partial undo must throw, naming the leads left behind");
});

check("every sweeping list carries the warn-first interlock in its own rule", () => {
  // Read off Battr's rule screens 3 Sep 2026 and applied 16 Sep: each member
  // list's Neglected tier is `Last Communication > N AND At Risk Notified Is
  // Not Empty`. Ours had only the first half.
  //
  // This is also the proof that the correction NARROWED rather than widened.
  // Adding a condition to a conjunction can only ever remove leads from the
  // tier, so no lead became newly sweepable — and the interlock is now enforced
  // in two independent places, the rule and the sweep loop, so losing either
  // one still leaves a lead protected.
  const { ids, resolved } = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"));
  assert.ok(ids.length >= 6, "the combined list must still have its member lists");

  for (const list of resolved) {
    const groups = list.neglected_filters?.groups ?? [];
    assert.ok(groups.length > 0, `${list.name} has no neglected tier`);
    for (const group of groups) {
      assert.ok(
        group.some((c) => c.field.endsWith("customBattrAtRiskSince") && c.operator === "!=" && c.value === null),
        `${list.name}: a neglected group with no "At Risk Since is not empty" condition would sweep an unwarned lead`
      );
    }
  }
});

check("every operator used by a real list is one the evaluator implements", () => {
  // A typo'd operator throws at evaluation time, deep inside a run. Catch it here.
  const operators = new Set();
  for (const list of lists) {
    for (const key of ["list_filters", "at_risk_filters", "neglected_filters"]) {
      for (const group of list[key]?.groups ?? []) {
        for (const condition of group) operators.add(condition.operator);
      }
    }
  }
  assert.ok(operators.size > 0);
  for (const operator of operators) {
    assert.doesNotThrow(
      () => evaluateCondition({ field: "stage_name", operator, value: ["x"], value_data_type: "text" }, { stage_name: "y" }),
      `operator "${operator}" is used by a list but the evaluator rejects it`
    );
  }
});

check("a client under contract is protected twice over", () => {
  // Current & Upcoming Clients is the list it would be worst to get wrong. Two
  // independent guarantees, so no single change can put a live client in a pond.
  const list = listById(1149);
  assert.equal(list.report_only, true, "guarantee 1: the list cannot act");

  const { ids } = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"));
  assert.ok(!ids.includes(1149), "guarantee 1b: and it does not feed the list that can");

  for (const stage of ["Active Client", "Under Contract", "Pending"]) {
    assert.ok(
      rules.protectedStages.some((s) => s.toLowerCase() === stage.toLowerCase()),
      `guarantee 2: "${stage}" must also be excluded by stage, independently of any list`
    );
  }
});

// FUB returns timeframeId, not timeframe. These fix the mapping in place so a
// renumbering or a typo cannot quietly re-empty the four nurture lists.
const TIMEFRAME_BANDS = [
  { id: 1, band: "months0to3", list: 1106, name: "Weekly Nurture" },
  { id: 2, band: "months3to6", list: 1107, name: "Bi-Weekly Nurture" },
  { id: 3, band: "months6to12", list: 1108, name: "Monthly Nurture" },
  { id: 4, band: "months12plus", list: 1109, name: "Quarterly Nurture" },
];

check("the timeframe map matches what FUB actually returned", () => {
  // Two copies exist on purpose: FUB_FIELDS.timeframes is the transcript of the
  // run, TIMEFRAME_IDS is what the engine acts on. Editing the second without
  // the first is how a mapping drifts away from the thing it was read from.
  assert.deepEqual(
    Object.fromEntries(Object.entries(TIMEFRAME_IDS).map(([k, v]) => [String(k), v])),
    Object.fromEntries(Object.entries(FUB_FIELDS.timeframes).map(([k, v]) => [String(k), v])),
    "TIMEFRAME_IDS must equal GET /v1/timeframes as recorded on 12 Sep 2026"
  );
});

check("the fields FUB does not return are the ones we work around", () => {
  // `timeframe` absent is the whole population gap, and the fix is to resolve
  // the id instead. If a later run finds the name present, this is the check
  // that should be revisited rather than the resolution being left as dead code.
  assert.ok(FUB_FIELDS.absent.includes("timeframe"), "the name is not sent; the id is what we read");
  assert.ok(FUB_FIELDS.absent.includes("groupIds"), "the owner-group exclusion cannot fire on this account");
  assert.ok(
    rules.exemptAgents.length > 0,
    "with no group ids, exempting agents by name is the only thing standing in for group 52555"
  );

  // The reply reprieve is inert, and must be recorded as inert rather than
  // described as working anywhere.
  assert.equal(FUB_FIELDS.emailDirection.directional, 0);
  const parity = readFileSync(join(ROOT, "docs", "battr-parity.md"), "utf8");
  assert.ok(
    /reprieve|direction/i.test(parity),
    "a protection that currently spares nobody has to appear in the parity document"
  );
});

check("every timeframe id FUB returns maps onto the band its list matches on", () => {
  for (const { id, band } of TIMEFRAME_BANDS) {
    const name = TIMEFRAME_IDS[id];
    assert.ok(name, `id ${id} must resolve to a name`);
    assert.ok(
      TIMEFRAMES[band].includes(name),
      `TIMEFRAME_IDS[${id}] = "${name}" is not in TIMEFRAMES.${band} — the list would match nobody`
    );
  }
  // "No Plans" is in FUB's table and deliberately matches no band.
  assert.equal(TIMEFRAME_IDS[5], "No Plans");
  for (const key of Object.keys(TIMEFRAMES)) {
    assert.ok(!TIMEFRAMES[key].includes("No Plans"), `"No Plans" must not fall into ${key}`);
  }
});

for (const { id, list, name } of TIMEFRAME_BANDS) {
  check(`a nurture lead with timeframeId ${id} lands in ${name}`, () => {
    const c = normalizeContact(
      { id: 700 + id, stage: "Nurture", created: daysAgo(400), timeframeId: id, assignedUserId: 5, tags: [] },
      { lastOutbound: 0, lastInbound: 0 }
    );
    assert.equal(c.timeframeUnresolved, false, "the id must resolve");
    assert.equal(evaluateSet(listById(list).list_filters, c), true, `${name} must select it`);

    // And it must NOT also land in CLEAN UP, which selects on a blank timeframe.
    assert.equal(
      evaluateSet(listById(1145).list_filters, c),
      false,
      "a lead with a readable timeframe is not a no-timeframe lead"
    );
  });
}

check('timeframeId 5 ("No Plans") is audited by nothing, in ours as in Battr', () => {
  const c = normalizeContact(
    { id: 705, stage: "Nurture", created: daysAgo(400), timeframeId: 5, assignedUserId: 5, tags: [] },
    { lastOutbound: 0, lastInbound: 0 }
  );
  for (const { list, name } of TIMEFRAME_BANDS) {
    assert.equal(evaluateSet(listById(list).list_filters, c), false, `${name} must not claim it`);
  }
  assert.equal(evaluateSet(listById(1145).list_filters, c), false, "it has a timeframe, so it is not CLEAN UP either");
});

check("a blank timeframe still falls to CLEAN UP, which never sweeps", () => {
  const c = normalizeContact(
    { id: 706, stage: "Nurture", created: daysAgo(400), assignedUserId: 5, tags: [] },
    { lastOutbound: 0, lastInbound: 0 }
  );
  assert.equal(c.timeframeUnresolved, true);
  assert.equal(evaluateSet(listById(1145).list_filters, c), true);
  assert.equal(listById(1145).report_only, true, "and it cannot act");
});

check("an id FUB adds later is reported, never guessed into a band", () => {
  // The failure to avoid is a new band silently inheriting some other band's
  // cadence. An unmapped id resolves to nothing and raises a flag instead.
  const c = normalizeContact(
    { id: 707, stage: "Nurture", created: daysAgo(400), timeframeId: 99, assignedUserId: 5, tags: [] },
    { lastOutbound: 0, lastInbound: 0 }
  );
  assert.equal(c.timeframeIdUnknown, true, "an unknown id must be flagged");
  // Unset, not guessed. (`first()` yields undefined when nothing matches; the
  // evaluator treats that and null alike, which the CLEAN UP case above proves.)
  const resolved = c.custom_fields.fub.system_timeframe;
  assert.ok(resolved === null || resolved === undefined, `must not be invented, got ${JSON.stringify(resolved)}`);
  for (const band of Object.values(TIMEFRAMES)) {
    assert.ok(!band.includes(resolved), "an unmapped id must not resolve to any band name");
  }
  for (const { list, name } of TIMEFRAME_BANDS) {
    assert.equal(evaluateSet(listById(list).list_filters, c), false, `${name} must not claim an unmapped id`);
  }

  // A known id is not flagged, and neither is a lead with no id at all.
  const known = normalizeContact({ id: 708, stage: "Nurture", timeframeId: 2, tags: [] }, { lastOutbound: 0 });
  assert.equal(known.timeframeIdUnknown, false);
  const none = normalizeContact({ id: 709, stage: "Nurture", tags: [] }, { lastOutbound: 0 });
  assert.equal(none.timeframeIdUnknown, false, "absent is a data gap, not an unknown id");
});

check("the day filter plus the three-day spread explain every observed night", () => {
  // Measured on 11 Sep: three leads flagged 9/8 swept 9/11, exactly three days
  // apart. Five of the six member lists carry a +3 gap; Hot Leads carries +2.
  // If anyone widens a spread, this fails and says which list.
  // The day counts live in the filter DSL, so read them back out of it rather
  // than trusting a second copy that could drift.
  const dayCount = (set, label) => {
    const conds = (set?.groups ?? []).flat().filter((c) => c.transform?.type === "days_since");
    const comm = conds.find((c) => c.field.endsWith("system_lastCommunication"));
    assert.ok(comm, `${label}: no days-since-last-communication condition to read`);
    return comm.value;
  };
  const spreads = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"))
    .ids.map((id) => {
      const l = listById(id);
      return {
        id,
        name: l.name,
        gap: dayCount(l.neglected_filters, `${l.name} neglected`) - dayCount(l.at_risk_filters, `${l.name} at risk`),
      };
    });
  for (const { id, name, gap } of spreads) {
    const expected = id === 1144 ? 2 : 3;
    assert.equal(gap, expected, `${name}: Battr's observed spread is ${expected} days, not ${gap}`);
  }

  // And the spread interacts with the sweep day filter to pile leads onto
  // Tuesday: flagged Wed/Thu/Fri all come due Sat/Sun/Mon, none a sweep day.
  const tz = rules.timezone;
  const dueDates = ["2026-09-12", "2026-09-13", "2026-09-14"]; // Sat, Sun, Mon
  for (const day of dueDates) {
    assert.equal(
      isDayAllowed(rules.sweepDayFilter, new Date(`${day}T19:00:00-07:00`), tz),
      false,
      `${day} must not be a sweep day — this is why Tuesday carried 45`
    );
  }
  assert.equal(
    isDayAllowed(rules.sweepDayFilter, new Date("2026-09-15T19:00:00-07:00"), tz),
    true,
    "and Tuesday must be, or the backlog never clears"
  );
});

check("every observed night reconciles with the self-draining population", () => {
  // Derived, not a literal: adding a night's export without adding it to the
  // timeline (or the reverse) fails here instead of needing a number bumped.
  const fullNights = [SEP_8, SEP_10, SEP_11, SEP_12, SEP_13, SEP_15, SEP_16];
  const byDate = Object.fromEntries(fullNights.map((n) => [n.date, n]));
  for (const night of fullNights) {
    assert.ok(
      TIMELINE.some((t) => t.date === night.date),
      `${night.date} has a full record but is missing from TIMELINE`
    );
  }
  assert.ok(TIMELINE.length >= fullNights.length, "the timeline cannot be shorter than the nights recorded");

  for (const night of TIMELINE) {
    const full = byDate[night.date];
    if (!full) continue;
    assert.equal(night.total, full.total, `${night.date}: timeline disagrees with the record`);
    assert.equal(night.at_risk, full.at_risk, `${night.date}: at-risk disagrees`);
  }

  // A swept lead enters a pond, every member list requires notInAPond, so it
  // leaves the audit list the same night. The list shrinks by its own sweeps
  // and regrows by arrivals — it is never a backlog that only accumulates.
  //
  // Sweeps are not the ONLY exit, though, and assuming they were is what this
  // check originally got wrong: 11 Sep closed at 861 with 3 swept, and 12 Sep
  // opened at 856, two below what sweeps alone explain. Leads also leave by
  // changing stage, being moved to a pond by hand, or being trashed. So the
  // invariant is not "never shrinks faster than it sweeps" — it is that the
  // unexplained churn stays small. A model error large enough to matter (a
  // list that halves overnight, a membership rule that stops matching) blows
  // through this; ordinary CRM housekeeping does not.
  // Only ADJACENT nights can be checked this way. Between 2 Sep and 8 Sep there
  // are five unobserved runs whose sweeps are not in this table, so the
  // arithmetic has nothing to say about that pair — checking it anyway would
  // need a tolerance so wide it asserted nothing.
  const CHURN_TOLERANCE = 0.02;
  let pairsChecked = 0;
  for (let i = 1; i < TIMELINE.length; i++) {
    const prev = TIMELINE[i - 1];
    const cur = TIMELINE[i];
    const gapDays = Math.round((new Date(cur.date) - new Date(prev.date)) / DAY_MS);
    if (gapDays !== 1) continue;
    // A night somebody moved leads in bulk has an explanation the arithmetic
    // cannot see. Skipping it by name keeps the bound tight for every other
    // night; widening the tolerance to absorb it would not.
    if (byDate[cur.date]?.bulkMoveObserved || byDate[prev.date]?.bulkMoveObserved) continue;

    pairsChecked++;
    const churn = Math.abs(cur.total - (prev.total - prev.neglected));
    assert.ok(
      churn <= prev.total * CHURN_TOLERANCE,
      `${cur.date}: ${churn} leads unaccounted for between ${prev.total} − ${prev.neglected} swept ` +
        `and ${cur.total} — beyond ${CHURN_TOLERANCE * 100}% that is a modelling error, not housekeeping`
    );
  }
  assert.ok(pairsChecked >= 2, "at least two consecutive-night pairs must actually be exercised");

  // The at-risk tier drains on the same three-day clock. Nothing carried into
  // 11 Sep is older than 9/9, and the 9/8 cohort left as neglected.
  assert.deepEqual(Object.keys(SEP_11.carriedAtRiskSince).sort(), ["2026-09-09", "2026-09-10"]);
  assert.deepEqual(Object.keys(SEP_11.sweptAtRiskSince), ["2026-09-08"]);
  const carried = Object.values(SEP_11.carriedAtRiskSince).reduce((a, b) => a + b, 0);
  assert.equal(carried, SEP_11.at_risk_already_flagged, "the dated rows must account for the count");
  assert.equal(
    SEP_11.at_risk_already_flagged + SEP_11.at_risk_new_notes,
    SEP_11.at_risk,
    "new notes plus carry-over is the at-risk total"
  );
});

check("the At Risk Since stamp survives a lead going compliant", () => {
  // Observed 13 Sep: a lead reads Previous Status "compliant", Status "At Risk",
  // At Risk Since 9/07, and Battr wrote no new note. Three behaviours in one row,
  // all of which our engine must match exactly.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");

  // 1. Idempotency keys on the stamp EXISTING, never on the previous status.
  assert.match(
    src,
    /const alreadyFlagged = fields\.atRiskSince \? Boolean\(person\?\.\[fields\.atRiskSince\]\) : false;/,
    "already-flagged must be a presence test on the field"
  );

  // 2. The stamp is written only when absent, so a returning lead keeps its
  //    original date rather than being re-dated to today.
  const nudge = src.slice(src.indexOf("// 5a. nudge"), src.indexOf("// 5b"));
  assert.ok(nudge.includes("if (alreadyFlagged)"), "the nudge must short-circuit on the stamp");
  assert.ok(
    nudge.indexOf("if (alreadyFlagged)") < nudge.indexOf("[fields.atRiskSince]: today"),
    "the stamp must be written only after the already-flagged branch returns"
  );

  // 3. Nothing anywhere clears it. Battr does not, and a lead whose stamp was
  //    cleared would need a fresh three-day warn cycle before it could ever be
  //    swept — quietly more lenient than the product we are mirroring.
  // Only object-literal WRITES count. `person?.[fields.atRiskSince] : null` is a
  // ternary READ for the report and must not be mistaken for a clearing write,
  // which is why this matches `]:` with no space rather than anything looser.
  const writes = [...src.matchAll(/\[fields\.atRiskSince\]:\s*([A-Za-z0-9_."]+)/g)].map((m) => m[1]);
  assert.ok(writes.length > 0, "the stamp must be written somewhere, or the interlock never arms");
  for (const value of writes) {
    assert.equal(value, "today", `At Risk Since is assigned ${value} — nothing may clear or back-date it`);
  }

  assert.equal(SEP_13.stampSurvivedCompliance.previousStatus, "compliant");
  assert.equal(SEP_13.stampSurvivedCompliance.action, "already taken");
});

check("the sweep interlock is 'ever warned', not 'recently warned'", () => {
  // The consequence of the stamp being sticky, stated as a test because it is
  // the sharpest edge in the whole engine: a lead warned once in the past can
  // be swept the moment it next goes neglected, with no fresh warning. Battr
  // works this way, we mirror it, and the mirroring must not drift into
  // something more lenient by accident.
  const warm = listById(1104);
  const build = (quietDays, stampAgeDays) => {
    const c = normalizeContact(
      { id: 88, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [] },
      { lastOutbound: 0 }
    );
    c.custom_fields.fub.system_lastCommunication = daysAgo(quietDays);
    c.custom_fields.fub.customBattrAtRiskSince = stampAgeDays === null ? null : daysAgo(stampAgeDays);
    return c;
  };

  // Hot Leads is the list that carries the interlock in its own filter, so it
  // is the one that can prove a stale stamp still satisfies it.
  const hot = listById(1144);
  const hotLead = (quietDays, stampAgeDays) => {
    const c = normalizeContact(
      { id: 89, stage: "Lead", created: daysAgo(5), assignedUserId: 5, tags: [] },
      { lastOutbound: 0 }
    );
    c.custom_fields.fub.system_lastCommunication = daysAgo(quietDays);
    c.custom_fields.fub.customBattrAtRiskSince = stampAgeDays === null ? null : daysAgo(stampAgeDays);
    return c;
  };

  assert.equal(classifyForList(hotLead(6, null), hot, NOW), "at_risk", "no stamp: warned, never swept");
  assert.equal(classifyForList(hotLead(6, 1), hot, NOW), "neglected", "a fresh stamp arms the sweep");
  assert.equal(
    classifyForList(hotLead(6, 60), hot, NOW),
    "neglected",
    "and so does a stamp two months old — the interlock asks whether, not when"
  );

  // Warm Back Up reaches the same place through the engine rather than the
  // filter, so a stale stamp must not spare it either.
  assert.equal(classifyForList(build(14, 90), warm, NOW), "neglected");
});

check("a lead past the neglected line is neglected, sweep day or not", () => {
  // The 12 Sep correction, pinned. Saturday is not a sweep day, and the entire
  // cohort flagged on 9/9 still left the at-risk list that night. A lead leaves
  // at-risk by AGEING past the neglected threshold, not by being swept — the
  // sweep is an action taken on the neglected state, not the thing that
  // produces it. Conflating the two is what made the earlier note wrong.
  const warm = listById(1104); // 10 days to warn, 13 to sweep
  const build = (quietDays) => {
    const c = normalizeContact(
      { id: 42, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [] },
      { lastOutbound: 0 }
    );
    c.custom_fields.fub.system_lastCommunication = daysAgo(quietDays);
    c.custom_fields.fub.customBattrAtRiskSince = daysAgo(quietDays - 10);
    return c;
  };

  assert.equal(classifyForList(build(11), warm, NOW), "at_risk", "inside the band");
  assert.equal(classifyForList(build(14), warm, NOW), "neglected", "past the band — regardless of the calendar");

  // The two tiers are exclusive: nothing is ever both, so a lead that becomes
  // neglected necessarily stops being reported as at-risk that same night.
  for (const days of [9, 11, 14, 40]) {
    const status = classifyForList(build(days), warm, NOW);
    assert.ok(["compliant", "at_risk", "neglected"].includes(status), `${days}d produced ${status}`);
  }

  // And the day filter governs the ACTION only. Saturday sweeps nothing…
  const tz = rules.timezone;
  assert.equal(isDayAllowed(rules.sweepDayFilter, new Date("2026-09-12T19:00:00-07:00"), tz), false);
  // …while the nudge runs every day, which is why one email arrived and not two.
  assert.equal(isDayAllowed(rules.nudgeDayFilter, new Date("2026-09-12T19:00:00-07:00"), tz), true);
  assert.equal(SEP_12.neglected_email_sent, false, "the absent email is the confirmation");
});

check("Battr's exclusion counters are action-time, on every night observed", () => {
  // Both read zero even on a night when the combined list held 903 of a 12,000
  // pool. They cannot be counting selection, which is why we do that work in
  // the list filters rather than as a post-hoc subtraction.
  for (const night of [SEP_8, SEP_10, SEP_11, SEP_12, SEP_13, SEP_15, SEP_16]) {
    assert.equal(night.excluded_lead_bucket, 0, `${night.date}: bucket counter`);
    assert.equal(night.excluded_agent_group, 0, `${night.date}: agent-group counter`);
  }
});

console.log("\nUnit — the running comparison with Battr");

check("a list name with a comma or a quote cannot corrupt the file", () => {
  // This file has to be editable six months from now by a person with a
  // spreadsheet and no tooling. One unquoted comma in a list name shifts every
  // column after it and the drift table starts lying quietly.
  const path = join(SCRATCH_LOGS, `cmp-${Date.now()}.csv`);
  const rows = [
    { date: "2026-09-16", source: "ours", listId: 1, listName: 'Sphere, Past Clients & "VIP"', total: 10, compliant: 5, at_risk: 2, neglected: 3 },
  ];
  appendComparisons(path, rows);
  const back = readComparisons(path);
  assert.equal(back.length, 1);
  assert.equal(back[0].listName, 'Sphere, Past Clients & "VIP"', "the name must survive a round trip intact");
  assert.equal(back[0].total, 10);
  assert.equal(back[0].neglected, 3);
});

check("the header is written once, and appending never duplicates it", () => {
  const path = join(SCRATCH_LOGS, `cmp2-${Date.now()}.csv`);
  const row = (date) => ({ date, source: "ours", listId: 7, listName: "X", total: 1, compliant: 1, at_risk: 0, neglected: 0 });
  appendComparisons(path, [row("2026-09-16")]);
  appendComparisons(path, [row("2026-09-17")]);
  const text = readFileSync(path, "utf8");
  assert.equal(text.split("\n").filter((l) => l.startsWith("date,")).length, 1, "exactly one header");
  assert.equal(readComparisons(path).length, 2, "and both nights are kept — the file is append-only");
});

check("drift compares our latest against Battr's latest, worst first", () => {
  // Battr's rows are transcribed by hand and will usually lag ours. Comparing
  // same-date-only would leave the table empty on every night nobody typed one
  // in, which is most nights.
  const rows = [
    { date: "2026-09-10", source: "battr", listId: 1, listName: "Close", total: 100, compliant: 0, at_risk: 0, neglected: 0 },
    { date: "2026-09-16", source: "ours", listId: 1, listName: "Close", total: 105, compliant: 0, at_risk: 0, neglected: 0 },
    { date: "2026-09-10", source: "battr", listId: 2, listName: "Miles off", total: 100, compliant: 0, at_risk: 0, neglected: 0 },
    { date: "2026-09-16", source: "ours", listId: 2, listName: "Miles off", total: 300, compliant: 0, at_risk: 0, neglected: 0 },
    // No Battr row at all — excluded rather than shown as infinite drift.
    { date: "2026-09-16", source: "ours", listId: 3, listName: "Untranscribed", total: 50, compliant: 0, at_risk: 0, neglected: 0 },
  ];
  const d = drift(rows);
  assert.equal(d.length, 2, "a list with no Battr row is not a 100% drift, it is unknown");
  assert.equal(d[0].listId, 2, "worst drift first");
  assert.equal(Math.round(d[0].driftPct), 200);
  assert.equal(Math.round(d[1].driftPct), 5);
  assert.equal(d[0].battrDate, "2026-09-10", "the staleness of Battr's row has to be visible");
});

check("the engine records its own rows and never Battr's", () => {
  // An engine that writes Battr's side of the comparison is comparing itself
  // to itself. Every "battr" row in that file was read off Battr's screen by a
  // person.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  const block = src.slice(src.indexOf("const comparisonRows"), src.indexOf("appendComparisons(COMPARISON_PATH"));
  assert.ok(block.includes('source: "ours"'), "the engine writes its own rows");
  assert.ok(!block.includes('source: "battr"'), "and must never write Battr's");
});

check("an exclusion that protects nobody says so in the report, not just the log", () => {
  // rules.excludeOwnerGroupIds is [52555] — "Battr Paused" in the live Battr
  // config — and inspect-fub-fields confirmed FUB returns neither
  // assignedUserGroupIds nor groupIds, so the condition is true for everyone
  // and excludes nobody.
  //
  // The rule not working is not the problem. The problem is that it READS as
  // though it does: someone puts an agent in the Battr Paused group, reasonably
  // expects their leads to stop being swept, and gets no signal otherwise. A
  // warning on stderr, in a CI log nobody opens, is not that signal.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(src, /AN EXCLUSION IN THIS CONFIG PROTECTS NOBODY/, "it must appear in the report body");

  // Above the counts, not buried under them — otherwise it is read after the
  // decision rather than before it.
  assert.ok(
    src.indexOf("AN EXCLUSION IN THIS CONFIG PROTECTS NOBODY") < src.indexOf('lines.push("## Summary")'),
    "the block must come before the Summary section"
  );

  // And it must name the exemption that DOES work, or it is a complaint rather
  // than an instruction.
  const block = src.slice(src.indexOf("AN EXCLUSION IN THIS CONFIG"), src.indexOf('lines.push("## Summary")'));
  assert.match(block, /rules\.exemptAgents/, "it must point at the mechanism that works");
  assert.match(block, /will not protect their leads/);

  // The rule itself stays in place: it documents what the live Battr config
  // does, and deleting it would erase the only record of why we know this.
  assert.ok(rules.excludeOwnerGroupIds.length > 0, "the rule is kept as documentation, not deleted");
  assert.ok(rules.exemptAgents.length > 0, "and something must actually be protecting someone");
});

check("the person read asks for custom fields, or the interlock reads null forever", () => {
  // Follow Up Boss returns a DEFAULT field set from /v1/people and custom
  // fields are not in it. Without `fields: allFields` the At Risk Since stamp
  // is absent from every record — not because no lead has it, but because we
  // never asked. That produced "0 neglected" on 16 Sep, which looked healthier
  // than the 392 it replaced.
  const src = readFileSync(join(ROOT, "scripts", "battr", "fub.mjs"), "utf8");
  const fn = src.slice(src.indexOf("people({ smartListId }"), src.indexOf("activity(sinceIso)"));
  assert.match(fn, /fields: "allFields"/, "the people read must request custom fields");

  // Naming the fields we use instead would drop whatever someone forgets to
  // add — the same failure one field further along.
  assert.ok(!/fields: \[/.test(fn), "an explicit field list is how this breaks again");
});

check("a website visit is a website visit, not any activity", () => {
  // The fallback to lastActivity made "visited the site in the last 10 days"
  // mean "did anything at all in the last 10 days". Active Leads came back
  // 8,083 against Battr's 131 — a sixty-fold overcount from one plausible
  // fallback. A lead with activity but no visit must not be in the list.
  const withActivityOnly = normalizeContact(
    { id: 601, stage: "Lead", created: daysAgo(400), lastActivity: daysAgo(1), assignedUserId: 5, tags: [] },
    { lastOutbound: 0 }
  );
  // `first()` yields undefined when nothing matches; the evaluator treats that
  // and null alike, which the list check below is the real proof of.
  assert.ok(withActivityOnly.last_website_visit == null, "activity is not a visit");
  assert.equal(
    // NOW, explicitly: this list has a days-since condition in its MEMBERSHIP
    // filter, and evaluateSet falls back to the real clock while the fixture is
    // built from the tests' frozen instant. That mismatch is what made the
    // end-to-end suite rot a day at a time back in September.
    evaluateSet(listById(1105).list_filters, withActivityOnly, NOW),
    false,
    "Active Leads must not claim a lead that never visited the site"
  );

  // And a real visit still selects.
  const visited = normalizeContact(
    { id: 602, stage: "Lead", created: daysAgo(400), lastVisit: daysAgo(2), assignedUserId: 5, tags: [] },
    { lastOutbound: 0 }
  );
  assert.equal(evaluateSet(listById(1105).list_filters, visited, NOW), true);
});

check("an unreadable interlock stamp is loud, not a quiet zero", () => {
  // Putting the interlock into the rules (16 Sep) changed what a null stamp
  // costs. Before, it only skipped the sweep loop's second check. Now it makes
  // the neglected tier unreachable for every lead in every member list — so a
  // wrong field name would produce "0 neglected" and read as the best night the
  // system has ever had. This is the exact failure shape this project keeps
  // hitting, so it gets a guard rather than a comment.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(src, /const stamped = contacts\.filter\(\(c\) => c\.custom_fields\.fub\.customBattrAtRiskSince\)\.length;/);
  assert.match(src, /the warn-first interlock ./, "the warning has to name the interlock");
  assert.match(src, /a read failure, not a clean database/, "and say which of the two a zero means");

  // Proof the exposure is real: a lead past the neglected line with no stamp is
  // NOT neglected on any member list. That is correct behaviour and exactly why
  // the diagnostic is needed.
  const { resolved } = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"));
  const unstamped = normalizeContact(
    { id: 77, stage: "Attempted Contact", created: daysAgo(400), assignedUserId: 5, tags: [] },
    { lastOutbound: 0 }
  );
  unstamped.custom_fields.fub.system_lastCommunication = daysAgo(400);
  unstamped.custom_fields.fub.customBattrAtRiskSince = null;
  for (const list of resolved) {
    assert.notEqual(
      classifyForList(unstamped, list, NOW),
      "neglected",
      `${list.name}: an unstamped lead must not be neglected — which is why a database with no stamps sweeps nobody`
    );
  }
});

check("both inferred pond models are gone, not just annotated", () => {
  // Two models died here and both were mine. Overflow — Shark Tank until it
  // fills, then Money Time — refuted 15 Sep by a 19-sweep night that sent one
  // lead to Money Time well under the cap. Source — direct to Money Time,
  // portals to Shark Tank — refuted 22 Sep when Money Time took a Zillow
  // Preferred lead. Both were plausible readings of Battr's outcomes; neither
  // was the rule.
  //
  // Annotating a wrong model as wrong was the right call while the screen was
  // unread. Now that it has been read, the model has to be GONE, or the next
  // person finds two explanations and picks one.
  const src = readFileSync(join(ROOT, "scripts", "battr", "rules.mjs"), "utf8");
  assert.ok(!/overflowPond/.test(src), "the overflow pond setting must be removed, not deprecated");
  assert.match(src, /READ OFF BATTR'S RULE SCREEN/, "and the replacement must say where it came from");

  const engine = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.ok(!/usingOverflow/.test(engine), "and the engine must not still branch on it");
  assert.match(engine, /pondForLead\(/, "routing goes through the one tested function");

  // The cap survives as a brake, but it may only HOLD a sweep, never redirect
  // it — redirecting was the overflow model.
  assert.equal(rules.maxSweepsPerPond, 25, "unchanged — raising it widens what can be swept");
  assert.match(engine, /per-pond cap reached/, "the cap holds the lead back");

  // Every night on record still has to be explicable by the age rule, or the
  // screen has been misread.
  assert.equal(SEP_15.assignmentTargets.Pond["Money Time"], 1, "15 Sep sent one lead to Money Time");
  for (const night of [SEP_10, SEP_11]) {
    assert.deepEqual(Object.keys(night.assignmentTargets.Pond), ["Shark Tank"], `${night.date}`);
  }
});

check("every modelled list carries Battr's observed numbers to check itself against", () => {
  for (const list of reportOnlyLists()) {
    if (list.id === 1149) continue; // count not captured yet — recorded as such in observed.mjs
    assert.ok(list.observed?.total > 0, `${list.name} needs an observed baseline`);
  }
  const combined = lists.find((l) => l.audit_type === "combined_contact_lists");
  assert.equal(combined.observed.total, 866, "the reconciliation number");
});

check("the report-only lists are counted, not actioned", () => {
  const blank = normalizeContact(
    { id: 503, stage: "Nurture", created: daysAgo(400), assignedUserId: 5, assignedTo: "Some Agent", tags: [] },
    { lastOutbound: new Date(daysAgo(60)).getTime(), lastInbound: 0 }
  );
  const rows = runReportOnlyLists([blank], reportOnlyLists(), NOW);
  const cleanup = rows.find((r) => r.id === 1145);
  assert.equal(cleanup.neglected, 1);
  assert.equal(cleanup.observed.total, 4200, "Battr's number rides along for comparison");
});



// Every member list's graduated thresholds, checked at each boundary.
const NURTURE_CADENCE = [
  { list: 1106, name: "Weekly Nurture", timeframe: "0-3 months", atRisk: 10, neglected: 13 },
  { list: 1107, name: "Bi-Weekly Nurture", timeframe: "3-6 months", atRisk: 16, neglected: 19 },
  { list: 1108, name: "Monthly Nurture", timeframe: "6-12 months", atRisk: 33, neglected: 36 },
  { list: 1109, name: "Quarterly Nurture", timeframe: "12+ months", atRisk: 93, neglected: 96 },
];

for (const { list, name, timeframe, atRisk, neglected } of NURTURE_CADENCE) {
  check(`${name}: compliant below ${atRisk}d, at risk past it, neglected past ${neglected}d`, () => {
    // `warned` is the At Risk Notified stamp. Battr's Neglected tier on every
    // nurture list requires it, so a lead past the line that was never warned
    // stays at risk — the warn-first interlock, in the rule rather than only in
    // the sweep loop.
    const build = (quietDays, warned = true) => {
      const c = normalizeContact(
        { id: 3, stage: "Nurture", timeframe, created: daysAgo(200), assignedUserId: 5, tags: [] },
        { lastOutbound: 0 }
      );
      c.custom_fields.fub.system_lastCommunication = daysAgo(quietDays);
      c.custom_fields.fub.customBattrAtRiskSince = warned ? daysAgo(quietDays - atRisk) : null;
      return c;
    };
    assert.equal(classifyForList(build(atRisk - 1), listById(list), NOW), "compliant");
    assert.equal(classifyForList(build(atRisk + 1), listById(list), NOW), "at_risk");
    assert.equal(classifyForList(build(neglected + 1), listById(list), NOW), "neglected");
    assert.equal(
      classifyForList(build(neglected + 1, false), listById(list), NOW),
      "at_risk",
      "never warned: past the line but not yet neglected"
    );
  });
}

check("a nurture lead lands in exactly one cadence list, by timeframe", () => {
  const c = normalizeContact(
    { id: 4, stage: "Nurture", timeframe: "6-12 months", created: daysAgo(200), assignedUserId: 5, tags: [] },
    { lastOutbound: 0 }
  );
  c.custom_fields.fub.system_lastCommunication = daysAgo(40);
  const matched = NURTURE_CADENCE.filter(({ list }) => classifyForList(c, listById(list), NOW) !== null);
  assert.deepEqual(matched.map((m) => m.name), ["Monthly Nurture"]);
});

check("Warm Back Up picks up early-stage leads older than 10 days", () => {
  const warm = listById(1104);
  const build = (age, quiet, warned = true) => {
    const c = normalizeContact({ id: 5, stage: "Attempted Contact", created: daysAgo(age), assignedUserId: 5, tags: [] }, { lastOutbound: 0 });
    c.custom_fields.fub.system_lastCommunication = daysAgo(quiet);
    c.custom_fields.fub.customBattrAtRiskSince = warned ? daysAgo(1) : null;
    return c;
  };
  assert.equal(classifyForList(build(30, 14), warm, NOW), "neglected");
  assert.equal(classifyForList(build(30, 14, false), warm, NOW), "at_risk", "Warm Back Up carries the interlock too");
  assert.equal(classifyForList(build(30, 11), warm, NOW), "at_risk");
  assert.equal(classifyForList(build(5, 14), warm, NOW), null, "younger than 10 days belongs to Hot Leads");
});

check("Hot Leads and Warm Back Up partition early-stage leads at the 10-day line", () => {
  const build = (age) => normalizeContact({ id: 6, stage: "Lead", created: daysAgo(age), assignedUserId: 5, tags: [] }, { lastOutbound: 0 });
  const inHot = (c) => classifyForList(c, listById(1144), NOW) !== null;
  const inWarm = (c) => classifyForList(c, listById(1104), NOW) !== null;

  assert.ok(inHot(build(3)) && !inWarm(build(3)), "a 3-day-old lead is Hot only");
  assert.ok(!inHot(build(30)) && inWarm(build(30)), "a 30-day-old lead is Warm only");
});

check("neglected beats at_risk — evaluated first", () => {
  const contact = quietFor(30);
  contact.custom_fields.fub.customBattrAtRiskSince = "2026-08-01";
  assert.equal(classifyForList(contact, hotLeads, NOW), "neglected");
});

// ------------------------------------------------------------ combined lists

console.log("\nUnit — combined list");

const teamLeads = lists.find((l) => l.audit_type === "combined_contact_lists");

check("a contact matching two member lists appears once, worst status wins", () => {
  const contact = quietFor(10, { created: daysAgo(5), stageId: 2, lastVisit: daysAgo(1) });
  contact.custom_fields.fub.customBattrAtRiskSince = "2026-08-20";
  const { records } = runCombinedList([contact], teamLeads, NOW);
  assert.equal(records.length, 1, "deduped by contact");
  assert.equal(records[0].status, "neglected");
  assert.ok(records[0].source_list_ids.length >= 1);
});

check("the paused owner-group is excluded from the combined list", () => {
  const contact = quietFor(10, { created: daysAgo(5), groupIds: [52555] });
  const { records, excluded } = runCombinedList([contact], teamLeads, NOW);
  assert.equal(records.length, 0);
  assert.equal(excluded.length, 1);
});

check("the excluded lead bucket is dropped from the combined list", () => {
  const contact = quietFor(10, { created: daysAgo(5), leadBucketId: 82 });
  const { records } = runCombinedList([contact], teamLeads, NOW);
  assert.equal(records.length, 0);
});

check("every member list now has rule JSON — nothing is silently missing", () => {
  const { missingMemberLists } = runCombinedList([], teamLeads, NOW);
  assert.deepEqual(missingMemberLists, [], "an unresolved member list narrows the audited population");
});

// ---------------------------------------------------------------- day filters

console.log("\nUnit — action day filters");

// 2026-09-01 is a Tuesday; walk a full week from the preceding Sunday.
const dayAt = (iso) => new Date(`${iso}T19:00:00-07:00`);

check("sweeps run Tue-Fri only", () => {
  const allowed = {
    "2026-08-30": false, // Sunday
    "2026-08-31": false, // Monday
    "2026-09-01": true, // Tuesday
    "2026-09-02": true, // Wednesday
    "2026-09-03": true, // Thursday
    "2026-09-04": true, // Friday
    "2026-09-05": false, // Saturday
  };
  for (const [date, expected] of Object.entries(allowed)) {
    assert.equal(
      isDayAllowed("Weekdays Excluding Monday", dayAt(date)),
      expected,
      `${date} should be ${expected ? "allowed" : "blocked"}`
    );
  }
});

check("nudges run every day", () => {
  assert.equal(isDayAllowed("Every Day", dayAt("2026-08-31")), true);
  assert.equal(isDayAllowed("Every Day", dayAt("2026-09-05")), true);
});

check("an unknown day filter fails closed", () => {
  assert.equal(isDayAllowed("Whenever", dayAt("2026-09-01")), false);
});

// --------------------------------------------------------------- pagination

console.log("\nUnit — FUB pagination");

// FUB rejects offset paging past the first page with
// "Deep pagination disabled, use 'nextLink' url", so the client must follow the
// cursor it hands back. This serves two pages and fails any offset request the
// way FUB does.
await (async () => {
  const { FubClient } = await import("./fub.mjs");
  const seen = [];

  const pager = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    seen.push(url.pathname + url.search);

    if (url.searchParams.has("offset")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ errorMessage: "Deep pagination disabled, use 'nextLink' url" }));
    }

    const page = url.searchParams.get("page");
    const body =
      page === "2"
        ? { people: [{ id: 3 }], _metadata: {} }
        : { people: [{ id: 1 }, { id: 2 }], _metadata: { nextLink: `http://127.0.0.1:${pager.address().port}/people?page=2` } };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });

  await new Promise((r) => pager.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${pager.address().port}`;

  try {
    const fub = new FubClient("k", { dry: true, log: () => {} });
    process.env.FUB_API_BASE = base;
    // Re-import with the base applied; the module reads it at load time.
    const { FubClient: Fresh } = await import(`./fub.mjs?base=${pager.address().port}`);
    const client = new Fresh("k", { dry: true, log: () => {} });
    void fub;

    const rows = await client.paginate("/people");

    check("every page is fetched by following nextLink", () => {
      assert.deepEqual(rows.map((r) => r.id), [1, 2, 3]);
    });

    check("no request uses an offset — FUB rejects those", () => {
      assert.ok(!seen.some((u) => u.includes("offset=")), `offset request made: ${seen.join(", ")}`);
    });

    await check("a collection that never exhausts throws rather than truncating", async () => {
      // A server that always returns a cursor used to stop silently at the page
      // cap, which reads downstream as a small database rather than a short read.
      const endless = createServer((req, res) => {
        const port = endless.address().port;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ people: [{ id: 1 }], _metadata: { nextLink: `http://127.0.0.1:${port}/people?p=x` } }));
      });
      await new Promise((r) => endless.listen(0, "127.0.0.1", r));
      try {
        process.env.FUB_API_BASE = `http://127.0.0.1:${endless.address().port}`;
        const { FubClient: Endless } = await import(`./fub.mjs?endless=${endless.address().port}`);
        await assert.rejects(
          () => new Endless("k", { dry: true, log: () => {} }).paginate("/people", {}, { max: 12000 }),
          /page cap|do not trust a truncated audit/
        );
      } finally {
        endless.close();
      }
    });

    check("the cursor is followed verbatim, not rebuilt", () => {
      assert.ok(seen.some((u) => u.includes("page=2")), `never followed the cursor: ${seen.join(", ")}`);
    });
  } finally {
    pager.close();
    delete process.env.FUB_API_BASE;
  }
})();

// ------------------------------------------------------------ lead sources

console.log("\nUnit — lead source buckets");

check("the Zillow family collapses into one bucket", () => {
  const family = ["Zillow", "Zillow.com", "Zillow Flex", "Zillow Preferred", "Zillow-Long Form", "zbuyer.com"];
  const buckets = new Set(family.map(bucketForSource));
  assert.equal(buckets.size, 1, "one bucket for every Zillow spelling");
  assert.equal([...buckets][0], 1);
});

check("source matching ignores case and surrounding whitespace", () => {
  assert.equal(bucketForSource("  zillow preferred  "), bucketForSource("Zillow Preferred"));
});

check("an unknown source is unmapped, not misfiled", () => {
  assert.equal(bucketForSource("Some New Portal"), null);
  assert.equal(bucketName(null), "Unmapped");
});

check("a bucket flagged excludeFromSweeps takes its sources out of the audit", () => {
  const excluded = leadBuckets.find((b) => b.excludeFromSweeps);
  assert.equal(excluded.id, 82, "82 is the id the live combined list excludes");
});

check("unmapped sources follow the stated policy", () => {
  assert.equal(isSourceAudited("Some New Portal"), unmappedPolicy === "include");
});

check("a new, unclassified source is protected by default", () => {
  assert.equal(unmappedPolicy, "exclude", "new sources must not enroll themselves in sweeping");
  assert.equal(isSourceAudited("Brand New Vendor 2027"), false);
});

check("relationship sources are protected", () => {
  for (const s of ["SOI", "Sphere", "Past Client", "Referral", "Import", "Imported"]) {
    assert.equal(isSourceAudited(s), false, `${s} must never be swept`);
  }
});

check("open-house capture is protected across every vendor", () => {
  for (const s of ["Open House", "Open House Signs", "Open House (Ylopo)", "Schneider Open House"]) {
    assert.equal(isSourceAudited(s), false, `${s} must never be swept`);
  }
});

check("signs and mailers are swept", () => {
  for (const s of ["Sign Calls/Mailers", "Listing Sign Call", "For Sale Signs", "Mailers", "Billboard"]) {
    assert.equal(isSourceAudited(s), true, `${s} should be in scope`);
  }
});

check("every Schneider source is protected, including ones not yet created", () => {
  for (const s of ["Schneider Ylopo", "Schneider zBuyer", "Schneider Lender", "Schneider Google LSA"]) {
    assert.equal(isSourceAudited(s), false, `${s} must never be swept`);
  }
  // A prefix rule, not a list, so a new variant is protected the day it appears.
  assert.equal(isSourceAudited("Schneider Some Vendor Invented Later"), false);
});

check("the Schneider prefix stops at a word boundary", () => {
  // "Schneiderman Leads" is a different source and must not inherit protection
  // just because it shares a prefix.
  assert.equal(bucketForSource("Schneiderman Leads"), null);
});

check("self-sourced prospecting is protected", () => {
  for (const src of ["FSBO", "Redx", "Mojo", "Mojo FSBO", "Expireds", "ileads-Purchase", "speculo_buyer"]) {
    assert.equal(isSourceAudited(src), false, `${src} was prospected by the agent, not bought`);
  }
});

check("inbound phone and the remaining vendors are swept", () => {
  // `my +plus leads` was in this list until 23 Sep, on our own reading of which
  // sources looked like lead flow. Battr's live configuration says it is
  // excluded, so it moved to the never-swept bucket and out of this check.
  // Our reading was the thing that was wrong, not Battr's.
  for (const src of ["my +plus leads", "Direct Call", "Inbound Call", "Sierra", "Revaluate", "LPT Rider"]) {
    assert.equal(isSourceAudited(src), true, `${src} should be in scope`);
  }
});

check("stray double spaces in a FUB source string still match", () => {
  // FUB really does store "CallAction  > Riders" with two spaces.
  assert.equal(bucketForSource("CallAction  > Riders"), bucketForSource("CallAction > Riders"));
  assert.equal(isSourceAudited("CallAction  > Riders"), true);
});

check("team-owned sources are swept, but an exempt agent still keeps them", () => {
  assert.equal(isSourceAudited("Mike Roland Direct Lead"), true, "the source itself is in scope");
  const owned = { owner_name: "Mike Roland" };
  assert.equal(isExemptAgent(owned.owner_name, rules), true, "the agent exemption overrides the source");
});

check("a mapped, non-excluded source is audited", () => {
  assert.equal(isSourceAudited("Zillow Preferred"), true);
});

check("the bucket is resolved onto the contact, so the exclusion can fire", () => {
  const c = normalizeContact({ id: 9, source: "Zillow Preferred", assignedUserId: 5, created: daysAgo(30) }, {});
  assert.equal(c.lead_bucket_id, 1, "null here would silently disable the combined list's bucket exclusion");
});

check("a bucket-82 lead is dropped from the combined list", () => {
  const c = normalizeContact(
    { id: 10, stage: "Lead", created: daysAgo(60), assignedUserId: 5, tags: [], leadBucketId: 82 },
    { lastOutbound: 0 }
  );
  c.custom_fields.fub.system_lastCommunication = daysAgo(40);
  assert.equal(runCombinedList([c], teamLeads, NOW).records.length, 0);
});

// ---------------------------------------------------------------- at bats

console.log("\nUnit — At Bats detection");

const owned = (id, ownerUserId, pondId = null) =>
  normalizeContact({ id, name: `Lead ${id}`, created: daysAgo(30), assignedUserId: ownerUserId, assignedPondId: pondId }, {});

/** An established database: one contact already known, so this is not a cold start. */
const baseline = (id = 99, ownerUserId = 11) => new Map([[id, { ownerUserId, pondId: null }]]);

check("a newly seen owned lead is a brand new lead", () => {
  // Against an EXISTING baseline. Passing an empty map here used to pass too,
  // which is precisely what let the first run mint 53,786 of these.
  const events = detectAtBats(baseline(), [owned(99, 11), owned(1, 11)], { now: NOW });
  assert.equal(events.length, 1);
  assert.equal(events[0].at_bat_type, "brand_new_lead");
  assert.equal(events[0].new_owner_id, 11);
  assert.equal(events[0].contact_id, 1, "only the lead that is actually new");
});

check("a newly seen lead sitting in a pond is not an at bat yet", () => {
  const events = detectAtBats(baseline(), [owned(99, 11), owned(1, null, 900)], { now: NOW });
  assert.equal(events.length, 0, "nobody has been given a chance yet");
});

check("A COLD START MINTS NOTHING — a database is a baseline, not a stampede", () => {
  // The first real run wrote 53,786 brand_new_lead rows stamped the same
  // instant, and credited one agent with 29,195 at bats at 100% retention.
  // A database that already exists is not a stream of leads arriving at once.
  const wholeDatabase = Array.from({ length: 500 }, (_, i) => owned(i + 1, 11 + (i % 3)));
  assert.equal(detectAtBats(new Map(), wholeDatabase, { now: NOW }).length, 0);
  assert.equal(detectAtBats(null, wholeDatabase, { now: NOW }).length, 0, "a missing file reads the same as an empty one");
});

check("and the guard stands down once a baseline exists", () => {
  // It must not suppress real history forever — one known contact is enough for
  // the next run to detect genuine changes normally.
  const events = detectAtBats(baseline(99, 11), [owned(99, 12)], { now: NOW });
  assert.equal(events.length, 1, "a real owner change is still an at bat");
  assert.equal(events[0].at_bat_type, "other_transfer");
});

check("pond to owner is a pond claim", () => {
  const previous = new Map([[1, { ownerUserId: null, pondId: 900 }]]);
  const events = detectAtBats(previous, [owned(1, 11)], { now: NOW });
  assert.equal(events[0].at_bat_type, "pond_claim");
  assert.equal(events[0].previous_pond_id, 900);
});

check("agent to agent is a transfer", () => {
  const previous = new Map([[1, { ownerUserId: 11, pondId: null }]]);
  const events = detectAtBats(previous, [owned(1, 12)], { now: NOW });
  assert.equal(events[0].at_bat_type, "other_transfer");
  assert.equal(events[0].previous_owner_id, 11);
});

check("unchanged ownership produces no event", () => {
  const previous = new Map([[1, { ownerUserId: 11, pondId: null }]]);
  assert.equal(detectAtBats(previous, [owned(1, 11)], { now: NOW }).length, 0);
});

check("our own sweep is flagged so it isn't credited as a chance", () => {
  const previous = new Map([[1, { ownerUserId: 11, pondId: null }]]);
  const events = detectAtBats(previous, [owned(1, null, 900)], { sweptIds: new Set([1]), now: NOW });
  assert.equal(events[0].is_battr_sweep, true);
});

console.log("\nUnit — At Bats metrics");

check("conversion and retention are computed per agent", () => {
  const atBats = [
    { contact_id: 1, at_bat_type: "brand_new_lead", at_bat_timestamp: daysAgo(30), new_owner_id: 11, is_battr_sweep: false },
    { contact_id: 2, at_bat_type: "pond_claim", at_bat_timestamp: daysAgo(20), new_owner_id: 11, is_battr_sweep: false },
  ];
  const contacts = new Map([
    [1, { crm_stage_exid: 8, owner_user_id: 11 }], // converted, retained
    [2, { crm_stage_exid: 2, owner_user_id: 12 }], // neither
  ]);
  const [row] = summarizeAgents(atBats, contacts, { convertedStageExids: [8, 106], userNames: new Map([[11, "Nicole Miller"]]), now: NOW });
  assert.equal(row.agent, "Nicole Miller");
  assert.equal(row.atBats, 2);
  assert.equal(row.converted, 1);
  assert.equal(row.retained, 1);
  assert.equal(formatRate(row.conversionRate), "50.0%");
  assert.equal(row.pondClaims, 1);
});

check("swept leads are excluded from an agent's denominator", () => {
  const atBats = [{ contact_id: 1, at_bat_type: "other_transfer", at_bat_timestamp: daysAgo(5), new_owner_id: 11, is_battr_sweep: true }];
  assert.equal(summarizeAgents(atBats, new Map(), { now: NOW }).length, 0);
});

check("an agent with no at bats renders -- , never 0%", () => {
  assert.equal(formatRate(null), "--");
  assert.equal(formatRate(0), "0.0%");
});

check("at bats outside the window are ignored", () => {
  const atBats = [{ contact_id: 1, at_bat_type: "brand_new_lead", at_bat_timestamp: daysAgo(400), new_owner_id: 11, is_battr_sweep: false }];
  assert.equal(summarizeAgents(atBats, new Map(), { windowDays: 180, now: NOW }).length, 0);
});

// ------------------------------------------------------------- agent alerts

console.log("\nUnit — per-agent alerts");

const record = (over) => ({ id: 1, name: "A Lead", ownerId: 11, owner: "Nicole Miller", status: "at_risk", daysSinceTouch: 8, contact: { owner_group_ids: [] }, ...over });

check("digests group non-compliant leads by owning agent", () => {
  const digests = buildAgentDigests([
    record({ id: 1 }),
    record({ id: 2, status: "neglected" }),
    record({ id: 3, ownerId: 12, owner: "Brett Smith" }),
    record({ id: 4, status: "compliant" }),
  ]);
  assert.equal(digests.length, 2);
  const nicole = digests.find((d) => d.agentId === 11);
  assert.equal(nicole.atRisk.length, 1);
  assert.equal(nicole.neglected.length, 1);
});

check("an agent with a clean board gets no digest", () => {
  assert.equal(buildAgentDigests([record({ status: "compliant" })]).length, 0);
});

check("an exempt agent's leads are excluded in list mode too", () => {
  // This lived only in classifySimple, so once "lists" became the default the
  // exemption silently stopped applying.
  assert.equal(isExemptAgent("Mike Roland", rules), true);
  assert.equal(isExemptAgent("mike roland", rules), true, "matching is case-insensitive");
  assert.equal(isExemptAgent("Nicole Miller", rules), false);
  assert.equal(isExemptAgent(null, rules), false);
});

check("the paused owner-group gets no alerts", () => {
  const digests = buildAgentDigests([record({ contact: { owner_group_ids: [52555] } })], { excludeGroupIds: [52555] });
  assert.equal(digests.length, 0);
});

check("the digest leads with the admin message and flags what is sweeping", () => {
  const [digest] = buildAgentDigests([record({ status: "neglected", name: "Long Gone" })]);
  const text = renderDigestText(digest);
  assert.match(text, /At risk leads need to be worked ASAP/);
  assert.match(text, /SWEEPING NEXT RUN \(1\)/);
  assert.match(text, /Long Gone/);
  assert.match(text, /only swept after it has been flagged at risk first/);
});

check("a lead already swept tonight is never listed as still savable", () => {
  // The digest is built after the sweep loop, so a neglected record may be a
  // lead the agent still holds or one that just left. Telling them to "reach
  // out today to keep" a lead that is already in the pond is how an alert
  // stops being read.
  const [digest] = buildAgentDigests(
    [record({ id: 7, status: "neglected", name: "Already Gone" }), record({ id: 8, status: "neglected", name: "Still Yours" })],
    { sweptIds: new Set([7]) }
  );
  assert.equal(digest.swept.length, 1);
  assert.equal(digest.neglected.length, 1);

  const text = renderDigestText(digest);
  assert.match(text, /SWEEPING NEXT RUN \(1\)[\s\S]*Still Yours/);
  assert.match(text, /MOVED TO THE POND TONIGHT \(1\)[\s\S]*Already Gone/);
  assert.ok(
    text.indexOf("Still Yours") < text.indexOf("Already Gone"),
    "what the agent can still act on comes first"
  );
});

check("an agent whose leads were all swept gets no task to work", async () => {
  const digests = buildAgentDigests([record({ id: 7, status: "neglected" })], { sweptIds: new Set([7]) });
  assert.equal(digests.length, 1, "they still get a record of what left");
  const { delivered } = await deliverDigests(digests, { channel: "fub_task", dry: true, log: () => {} });
  assert.equal(delivered.length, 0, "there is nothing left for them to do");
});

check("the fub_task anchors on a lead the agent still owns", async () => {
  const digests = buildAgentDigests(
    [record({ id: 7, status: "neglected", daysSinceTouch: 40 }), record({ id: 8, status: "at_risk", daysSinceTouch: 9 })],
    { sweptIds: new Set([7]) }
  );
  const { delivered } = await deliverDigests(digests, { channel: "fub_task", dry: true, log: () => {} });
  assert.equal(delivered[0].via, "fub_task:8", "never anchor a task on a lead sitting in a pond");
});

check("a lead who reached out and heard nothing back is found", () => {
  const withTouch = (over) => ({ ...record({}), contact: { owner_group_ids: [], _touch: over } });
  const found = findUnansweredInbound(
    [
      withTouch({ lastInbound: NOW - 6 * DAY_MS, lastOutbound: NOW - 20 * DAY_MS }), // waiting 6 days
      withTouch({ lastInbound: NOW - 30 * DAY_MS, lastOutbound: NOW - 20 * DAY_MS }), // answered since
      withTouch({ lastInbound: 0, lastOutbound: NOW - 20 * DAY_MS }), // never reached out
      withTouch({ lastInbound: NOW - 1 * DAY_MS, lastOutbound: 0 }), // called an hour ago, give them a day
    ],
    2,
    NOW
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].waitingDays, 6);
});

check("the longest wait is listed first", () => {
  const withTouch = (days) => ({ ...record({}), contact: { owner_group_ids: [], _touch: { lastInbound: NOW - days * DAY_MS, lastOutbound: 0 } } });
  const found = findUnansweredInbound([withTouch(4), withTouch(19), withTouch(9)], 2, NOW);
  assert.deepEqual(found.map((f) => f.waitingDays), [19, 9, 4]);
});

check("an unanswered lead earns an agent an email on its own", () => {
  // They are compliant on the clock — inbound reset it — so without this they
  // would generate no alert at all, which is the opposite of what we want.
  const waiting = { ...record({ id: 60, status: "compliant" }), waitingDays: 5 };
  const [digest] = buildAgentDigests([], { unanswered: [waiting] });
  assert.equal(digest.unanswered.length, 1);
  assert.equal(digest.atRisk.length, 0);

  const text = renderDigestText(digest);
  assert.match(text, /THEY CONTACTED YOU, NOBODY CAME BACK \(1\)/);
  assert.match(text, /waiting 5 days for a call back/);
});

check("the unanswered come first — before what is about to be swept", () => {
  const waiting = { ...record({ id: 61, name: "Called Us", status: "compliant" }), waitingDays: 3 };
  const [digest] = buildAgentDigests([record({ id: 62, name: "Going Soon", status: "neglected" })], {
    unanswered: [waiting],
  });
  const text = renderDigestText(digest);
  assert.ok(text.indexOf("Called Us") < text.indexOf("Going Soon"), "someone waiting on us outranks everything else");
});

check("an exempt agent's unanswered leads still generate no alert", () => {
  const waiting = { ...record({ id: 63 }), contact: { owner_group_ids: [52555] }, waitingDays: 5 };
  assert.equal(buildAgentDigests([], { unanswered: [waiting], excludeGroupIds: [52555] }).length, 0);
});

check("a dry delivery sends nothing but still reports what it would send", async () => {
  const digests = buildAgentDigests([record({})]);
  const { delivered, failed } = await deliverDigests(digests, { channel: "fub_task", dry: true, log: () => {} });
  assert.equal(delivered.length, 1);
  assert.equal(failed.length, 0);
  assert.match(delivered[0].via, /^fub_task:/);
});

check("a missing Resend key is one setup failure, not thirty agent failures", async () => {
  const before = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const digests = buildAgentDigests([record({ id: 1 }), record({ id: 2, ownerId: 12, owner: "Brett Smith" })]);
    const { delivered, failed } = await deliverDigests(digests, { channel: "email", dry: false, log: () => {} });
    assert.equal(delivered.length, 0);
    assert.equal(failed.length, 1, "one failure naming the real cause, not one per agent");
    assert.match(failed[0].reason, /RESEND_API_KEY/);
  } finally {
    if (before !== undefined) process.env.RESEND_API_KEY = before;
  }
});

check("a dry run never tries to send, key or no key", async () => {
  const before = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const digests = buildAgentDigests([record({})]);
    const usersById = new Map([[11, { id: 11, email: "agent@example.com" }]]);
    const { delivered, failed } = await deliverDigests(digests, { channel: "email", usersById, dry: true, log: () => {} });
    assert.equal(failed.length, 0);
    assert.equal(delivered[0].via, "email:agent@example.com", "the shadow run shows who would get one");
  } finally {
    if (before !== undefined) process.env.RESEND_API_KEY = before;
  }
});

check("email is the configured channel", () => {
  // Battr emailed each agent; report_only would be a downgrade from what agents
  // get today, so the engine defaults to email rather than silence.
  const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(src, /BATTR_ALERT_CHANNEL \|\| "email"/);
});

check("email delivery fails loudly when an agent has no address on file", async () => {
  const digests = buildAgentDigests([record({})]);
  const { delivered, failed } = await deliverDigests(digests, { channel: "email", usersById: new Map(), dry: true, log: () => {} });
  assert.equal(delivered.length, 0);
  assert.match(failed[0].reason, /no email address/);
});

// --------------------------------------------------------------- email setup

console.log("\nUnit — email setup");

check("an unverified sending domain is named in words, not a status code", () => {
  // The most likely first-run failure, and the least self-explanatory one.
  const msg = describeError(403, '{"message":"The domain is not verified. Please verify a domain"}');
  assert.match(msg, /not verified/);
  assert.match(msg, /Verify it under Domains/);
  assert.ok(msg.includes(fromAddress()), "it has to say which address was refused");
});

check("a bad key reads as a key problem", () => {
  assert.match(describeError(401, '{"message":"Invalid API key"}'), /RESEND_API_KEY repository secret/);
});

check("an unrecognized failure still carries the status and body", () => {
  assert.match(describeError(500, "upstream exploded"), /Resend 500: upstream exploded/);
});

check("the from address falls back to the site's verified sender", () => {
  const before = { from: process.env.BATTR_REPORT_FROM, home: process.env.HOMEOWNER_FROM_EMAIL };
  try {
    delete process.env.BATTR_REPORT_FROM;
    process.env.HOMEOWNER_FROM_EMAIL = "The Roland Team <home@therolandteam.com>";
    assert.equal(fromAddress(), "The Roland Team <home@therolandteam.com>");

    process.env.BATTR_REPORT_FROM = "Battr <battr@therolandteam.com>";
    assert.equal(fromAddress(), "Battr <battr@therolandteam.com>", "an explicit setting wins");
  } finally {
    if (before.from === undefined) delete process.env.BATTR_REPORT_FROM;
    else process.env.BATTR_REPORT_FROM = before.from;
    if (before.home === undefined) delete process.env.HOMEOWNER_FROM_EMAIL;
    else process.env.HOMEOWNER_FROM_EMAIL = before.home;
  }
});

check("mailConfigured is what gates every send", () => {
  const before = process.env.RESEND_API_KEY;
  try {
    delete process.env.RESEND_API_KEY;
    assert.equal(mailConfigured(), false);
    process.env.RESEND_API_KEY = "re_test";
    assert.equal(mailConfigured(), true);
  } finally {
    if (before === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = before;
  }
});

check("the subject leads with whoever is waiting on a call back", () => {
  const waiting = digestSubject({ atRisk: [1], neglected: [1], unanswered: [1] });
  assert.match(waiting, /^1 lead waiting on a call back, 3 need outreach$/);

  const plain = digestSubject({ atRisk: [1, 2], neglected: [1], unanswered: [] });
  assert.equal(plain, "3 of your leads need outreach");
});

// ------------------------------------------------------------- CSV importer

console.log("\nUnit — At Bats CSV import");

check("the CSV parser handles quoted fields with commas", () => {
  const rows = parseCsv('Name,Source\n"Smith, John",Zillow\n');
  assert.deepEqual(rows[1], ["Smith, John", "Zillow"]);
});

check("column names are matched loosely", () => {
  const headers = ["FUB ID", "Changed At", "At Bat Type", "To"];
  assert.equal(findColumn(headers, ["fub id", "contact id"]), 0);
  assert.equal(findColumn(headers, ["at bat timestamp", "changed at"]), 1);
  assert.equal(findColumn(headers, ["nonexistent"]), -1);
});

check("export rows map onto ledger events", () => {
  const rows = parseCsv('FUB ID,Name,At Bat Type,Changed At,To,Source\n41460,Javier Martinez,Pond Claim,2026-08-01,Quetza Adame,Ylopo\n');
  const { events } = mapRows(rows);
  assert.equal(events.length, 1);
  assert.equal(events[0].contact_id, 41460);
  assert.equal(events[0].at_bat_type, "pond_claim");
  assert.equal(events[0].imported, true);
  assert.match(events[0].at_bat_timestamp, /^2026-08-01/);
});

check("rows without a usable id or date are dropped, not guessed at", () => {
  const rows = parseCsv("FUB ID,Changed At\n,2026-08-01\nabc,2026-08-01\n41460,\n");
  assert.equal(mapRows(rows).events.length, 0);
});

// ------------------------------------------------------------------ end-to-end

/** A stand-in FUB API serving fixtures, so the real client code is exercised. */
function fixtureServer() {
  // Dates here are relative to the REAL clock, not the frozen NOW the unit tests
  // use. The end-to-end run is a subprocess with its own Date.now(), so fixtures
  // built from a fixed date drift a day further from their intended tier every
  // day — this suite passed on the 3rd and failed on the 4th for no other
  // reason. A test that rots on the calendar is worse than no test.
  const ago = (n) => new Date(Date.now() - n * DAY_MS).toISOString();

  // Early-stage leads older than 10 days land in Warm Back Up (at risk >10d,
  // neglected >13d), which is what these fixtures exercise.
  const warm = (over) => lead({ stage: "Lead", created: ago(60), ...over });
  const people = [
    // compliant
    warm({ id: 101, name: "Fresh Contact", assignedTo: "Nicole Miller", assignedUserId: 11 }),
    // at risk
    warm({ id: 102, name: "Going Quiet", assignedTo: "Nicole Miller", assignedUserId: 11 }),
    // neglected — warned four days ago, so the interlock is satisfied
    warm({ id: 103, name: "Long Gone", assignedTo: "Brett Smith", assignedUserId: 12, customBattrAtRiskSince: ago(4) }),
    // neglected, but unworkable — report only
    warm({ id: 104, name: "Bad Number", assignedTo: "Brett Smith", assignedUserId: 12, tags: ["BAD_PHONE"], customBattrAtRiskSince: ago(4) }),
    // excluded: no list covers a contract stage
    warm({ id: 105, name: "In Escrow", assignedTo: "Brett Smith", assignedUserId: 12, stage: "Under Contract" }),
    // NEGLECTED ON CALLS, but texted three days ago. FUB will not serve texts
    // in bulk, so the first pass cannot see that and reads this lead as
    // abandoned. The per-person backfill is the only thing that saves it, and
    // saving it is the whole point: this is a lead an agent actually worked.
    warm({ id: 106, name: "Texted Recently", assignedTo: "Brett Smith", assignedUserId: 12, customBattrAtRiskSince: ago(4) }),
  ];

  // Each one sits in the middle of its tier, not on a boundary, so a run at any
  // hour of any day lands in the same place: compliant <10d, at risk 10-13d,
  // neglected >13d.
  const calls = [
    { personId: 101, created: ago(2), isIncoming: false },
    { personId: 102, created: ago(12), isIncoming: false },
    { personId: 103, created: ago(40), isIncoming: false },
    { personId: 104, created: ago(40), isIncoming: false },
    { personId: 106, created: ago(40), isIncoming: false },
  ];

  // Served ONLY per person, exactly as FUB does it.
  const textsByPerson = { 106: [{ personId: 106, created: ago(3), isIncoming: false }] };

  const routes = {
    "/users": { users: [{ id: 11, name: "Nicole Miller" }, { id: 12, name: "Brett Smith" }] },
    "/ponds": { ponds: [{ id: 900, name: "Shark Tank" }, { id: 901, name: "Money Time" }] },
    "/people": { people },
    "/calls": { calls },
    // NOT listed: /textMessages. The handler below answers it the way FUB does
    // — 400 in bulk, the thread when a personId is given.
    "/emails": { emails: [] },
    // The interlock field, as FUB returns it once Battr has created it. Without
    // this the stamp can never be read, and before the rule carried the
    // interlock that silently did not matter — the fixture was passing for the
    // wrong reason.
    "/customFields": {
      customfields: [{ id: 1, name: "customBattrAtRiskSince", label: "Battr At Risk Since", type: "date" }],
    },
  };

  const writes = [];
  const server = createServer((req, res) => {
    if (req.method !== "GET") {
      writes.push(`${req.method} ${req.url}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end("{}");
    }
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;

    // Confirmed live: FUB refuses a bulk text read and serves one person's
    // thread. Reproducing both halves is what makes the backfill path testable;
    // a fixture that answers the bulk read with [] tests the opposite of
    // production and reports success.
    if (path === "/textMessages") {
      const personId = url.searchParams.get("personId");
      if (!personId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ errorMessage: "personId, threadId, phone ... must be specified" }));
      }
      const textmessages = textsByPerson[personId] ?? [];
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ textmessages, _metadata: { total: textmessages.length } }));
    }

    const body = routes[path] ?? {};
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...body, _metadata: { total: Object.values(body)[0]?.length ?? 0 } }));
  });

  return { server, writes };
}

const run = (env) =>
  new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [join(ROOT, "scripts", "battr-audit.mjs"), "--dry"],
      // GITHUB_STEP_SUMMARY is blanked deliberately: the engine appends its
      // report there when set, and a fixture run must never write test data
      // into the real job summary where it reads as live output.
      // BATTR_LOG_DIR sends the run's reports, undo logs, at-bats ledger and
      // ownership snapshot to a scratch directory. Without it a test run writes
      // into the real battr-logs and the cleanup below deletes it — audit trail,
      // ownership baseline and all.
      { cwd: ROOT, env: { ...process.env, GITHUB_STEP_SUMMARY: "", BATTR_LOG_DIR: SCRATCH_LOGS, ...env } },
      (err, stdout, stderr) => (err ? reject(new Error(`${err.message}\n${stderr}`)) : resolve({ stdout, stderr }))
    );
  });

console.log("\nEnd-to-end — engine against a fixture API");

const { server, writes } = fixtureServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

try {
  const { stdout, stderr } = await run({
    FUB_API_KEY: "test-key",
    FUB_API_BASE: `http://127.0.0.1:${port}`,
    BATTR_LIVE: "",
  });

  check("the run completes and prints a report", () => {
    assert.match(stdout, /# Battr audit/);
    assert.match(stdout, /DRY RUN/);
  });

  check("it audits the full population", () => {
    assert.match(stderr, /6 leads in the audit population/);
  });

  check("a lead worked only by text is rescued from the sweep", () => {
    // The end of the texts problem, proved against a fixture that refuses the
    // bulk read exactly as FUB does. Lead 106's last call was 40 days ago and
    // its last text 3 days ago: neglected on the first pass, compliant after
    // the backfill. Without this the sweep takes it off the agent who worked it.
    assert.match(stderr, /texts: NOT available in bulk/, "the fixture must reproduce FUB's 400");
    assert.match(stderr, /backfilling texts for 4 actionable leads/, "only actionable leads are queried");
    assert.match(
      stderr,
      /text backfill: 1 messages over 4 leads — at risk 1 → 1, neglected 3 → 2/,
      "one text moved one lead out of neglected, and moved nobody in"
    );
  });

  check("a complete backfill reports the gap closed and still refuses to act", () => {
    // Both halves matter. Reporting it closed is what makes the nightly counts
    // comparable to Battr's; refusing to act on it is what keeps the decision
    // to start sweeping a human one.
    assert.match(stderr, /sweeps skipped: last-touch complete via per-person backfill, but rules\.sweepOnBackfilledTexts is off/);
    assert.match(stderr, /nudges skipped: last-touch complete via per-person backfill/, "the nudge is held on the same terms");
    assert.doesNotMatch(stdout, /Successfully swept/, "nothing may move");
  });

  check("it separates at-risk from neglected", () => {
    assert.match(stderr, /1 at risk, 2 neglected/);
  });

  check("the scoreboard names the agents", () => {
    assert.match(stdout, /Brett Smith/);
    assert.match(stdout, /Nicole Miller/);
  });

  check("a dry run issues zero writes to FUB", () => {
    assert.equal(writes.length, 0, `expected no writes, got: ${writes.join(", ")}`);
    assert.match(stderr, /no writes issued/);
  });

  check("the report offers an undo command", () => {
    assert.match(stdout, /--undo=/);
  });

  check("the excluded count says where the exclusions happened", () => {
    // The 22 Sep regression. Before the paused-agent fix, a lead owned by an
    // exempt agent entered the combined list and was marked excluded after the
    // union, so the Excluded line counted it. After the fix the same lead
    // carries the paused marker and is filtered at membership, so it never
    // reaches that line — the run printed "Excluded: 10" where the night
    // before printed 823, while auditing exactly the same 813 leads.
    //
    // Nothing had changed about who was protected. The number that said so had
    // stopped counting most of them. A single figure that can halve because a
    // lead was filtered one step earlier is not reporting an exclusion, it is
    // reporting an implementation detail.
    assert.match(stdout, /- Excluded: \*\*\d+\*\*/, "the total must be the bold number");
    assert.match(stdout, /never entered the audit list/, "and it must break down by where");
    assert.match(stdout, /removed after it/);
  });
} finally {
  server.close();
  // Only ever the scratch directory. Removing ROOT/battr-logs here destroyed the
  // committed audit trail and state/ownership.csv every time the suite ran.
  rmSync(SCRATCH_LOGS, { recursive: true, force: true });
}

check("the suite cannot delete the real audit trail", () => {
  // The guard for the bug above: if the e2e run is ever pointed back at the
  // repository's own battr-logs, the cleanup takes the ownership baseline with
  // it, and a run with no baseline used to mint an at bat for every contact in
  // the database.
  const src = readFileSync(join(HERE, "selftest.mjs"), "utf8");
  assert.ok(!/rmSync\(join\(ROOT, "battr-logs"\)/.test(src), "cleanup must never target the repo's battr-logs");
  assert.match(src, /BATTR_LOG_DIR: SCRATCH_LOGS/, "the e2e run must write to scratch");

  const engine = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
  assert.match(engine, /process\.env\.BATTR_LOG_DIR \|\| join\(ROOT, "battr-logs"\)/, "and the engine must honour it");
});

// ─── Reading FUB's own lists, rather than reimplementing them ───────────────
//
// The screenshots of 19 Sep showed the six audit lists living in Follow Up Boss
// as ordinary smart lists on Mike's account. That makes FUB's own membership
// readable, and FUB's answer is the answer: it is the list the agent opens.
// These cover the probe that establishes whether that route works.

await (async () => {
  const { normalize, baseName, isPondSide } = await import("./smartlists.mjs");

  // The module reads FUB_API_BASE once, at load. So the fixture is stood up
  // first, the env var set, and the client re-imported behind a cache-busting
  // query — the same dance the nextLink test above does. Awaiting the HTTP work
  // out here rather than inside check() keeps the pass tally honest: an async
  // check body resolves after the total has already been printed.
  {
    let calls = 0;
    let seen = null;
    const counter = createServer((req, res) => {
      calls++;
      seen = new URL(req.url, "http://127.0.0.1").searchParams;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ people: [{ id: 1 }], _metadata: { total: 26412 } }));
    });
    await new Promise((r) => counter.listen(0, "127.0.0.1", r));

    const totalless = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ people: [] }));
    });
    await new Promise((r) => totalless.listen(0, "127.0.0.1", r));

    const previous = process.env.FUB_API_BASE;
    let counted;
    let totallessError = null;
    try {
      process.env.FUB_API_BASE = `http://127.0.0.1:${counter.address().port}`;
      const { FubClient: Counting } = await import(`./fub.mjs?count=${counter.address().port}`);
      counted = await new Counting("k", { dry: true, log: () => {} }).countPeople({ smartListId: 1105 });

      process.env.FUB_API_BASE = `http://127.0.0.1:${totalless.address().port}`;
      const { FubClient: Totalless } = await import(`./fub.mjs?count=${totalless.address().port}`);
      await new Totalless("k", { dry: true, log: () => {} })
        .countPeople({ smartListId: 7 })
        .catch((err) => {
          totallessError = err;
        });
    } finally {
      counter.close();
      totalless.close();
      if (previous === undefined) delete process.env.FUB_API_BASE;
      else process.env.FUB_API_BASE = previous;
    }

    check("a list size is read from the total, not counted by paging", () => {
      // A 26,000-lead pond must cost the same single call as a twelve-lead
      // list, or probing every list in one run is unaffordable and nobody runs
      // it. Counting returned rows instead would also report the cap as the
      // size — silent truncation wearing a number.
      assert.equal(counted, 26412);
      assert.equal(calls, 1, "one request, whatever the list's size");
      assert.equal(seen.get("limit"), "1", "and it must not pull a page of people");
      assert.equal(seen.get("smartListId"), "1105", "the list has to actually be selected");
    });

    check("a count with no total is an error, not a zero", () => {
      // The quiet failure this guards: a missing total read as 0 makes every
      // list look empty and the engine look finished.
      assert.ok(totallessError, "a response without a total must not resolve");
      assert.match(totallessError.message, /no _metadata\.total/);
    });
  }

  check("the agent-side and pond-side halves are told apart", () => {
    // Two queues, two sets of people working them. Only the agent side can be
    // swept — sweeping moves a lead INTO a pond, so a lead already in one has
    // nowhere to go. Reading a pair's sum as the target makes a correct filter
    // look far short of Battr and invites "fixing" it.
    for (const name of ["❗Active Leads - Ponds", "🏹 Zillow Important - Ponds", "‼️ YLOPO IMPORTANT - Ponds"]) {
      assert.ok(isPondSide(name), `${name} is the pond half`);
    }
    for (const name of ["❗Active Leads", "🏹 Zillow Important", "💛 Sphere & Past Clients"]) {
      assert.ok(!isPondSide(name), `${name} is the agent half`);
    }
    // "Fish the Pond" is a COLLECTION name, not a list suffix — it must not be
    // mistaken for the pond half of some pair.
    assert.ok(!isPondSide("Fish the Pond"), "a collection called Fish the Pond is not a -Ponds list");

    assert.equal(baseName("❗Active Leads"), baseName("❗Active Leads - Ponds"), "the halves pair up");
    assert.equal(normalize("❗Active Leads"), normalize("Active Leads"), "emoji are decoration, not identity");
  });

  check("every list the engine audits is agent-side", () => {
    // The invariant behind the split: our filters carry `notInAPond`, so the
    // engine never audits — and so can never sweep — a lead that is already in
    // a pond. If a list ever loses that condition, it starts auditing the queue
    // swept leads land in, and a lead could be swept twice.
    const audited = lists.filter((l) => l.is_active && l.audit_type === "contact_list");
    assert.ok(audited.length >= 6, "there should be lists to check");
    for (const list of audited) {
      const conditions = (list.list_filters?.groups ?? []).flat();
      const excludesPonds = conditions.some((c) => /pond/i.test(String(c.field ?? "")));
      assert.ok(excludesPonds, `${list.name} must exclude leads already in a pond`);
      assert.ok(!isPondSide(list.name), `${list.name} must not be a pond-side list`);
    }
  });

  check("the smart list probe cannot write to Follow Up Boss", () => {
    const src = readFileSync(join(HERE, "smartlists.mjs"), "utf8");
    assert.match(src, /new FubClient\(process\.env\.FUB_API_KEY, \{ dry: true \}\)/, "dry mode, explicitly");
    for (const write of ["\\.assign\\(", "\\.note\\(", "\\.updateFields\\(", "\\.addTag\\("]) {
      assert.ok(!new RegExp(write).test(src), `a probe must not call ${write}`);
    }
  });

  check("the smart list probe keeps client PII out of the CI log", () => {
    // Its output goes into a GitHub Actions summary that is readable by anyone
    // with repo access. List names are Mike's configuration; lead names, emails
    // and phone numbers are clients'.
    const src = readFileSync(join(HERE, "smartlists.mjs"), "utf8");
    for (const field of ["emails", "phones", "addresses", "firstName", "lastName"]) {
      assert.ok(!new RegExp(`\\b${field}\\b`).test(src), `${field} must never reach the log`);
    }
    // It prints per-field DATE COVERAGE — counts and the newest timestamp — and
    // never a field's value for an identified person.
    assert.ok(!/console\.log\([^)]*p\[key\]/.test(src), "a raw field value must not be printed");
  });
})();

// ─── The paused-agent exclusion, which protected nobody for weeks ──────────
//
// Battr's rule screen reads "Agent's Assigned FUB Teams DOES NOT CONTAIN ANY
// [Battr Paused]". We modelled it against `person.assignedUserGroupIds ??
// person.groupIds`; FUB returns neither, so the field was [] on every lead and
// "not in that group" was true for everyone. These checks are the guard.

await (async () => {
  const { resolvePausedOwners, PAUSED_GROUP_MARKER } = await import("./paused.mjs");

  /** A stand-in for FubClient carrying only what the resolver touches. */
  const fakeFub = (teams) => ({ teams: async () => (typeof teams === "function" ? teams() : teams) });

  const twoTeamsSameName = await resolvePausedOwners(
    fakeFub([
      { id: 1, name: "Battr Paused", users: [{ id: 11 }, { id: 12 }] },
      { id: 2, name: "battr paused", users: [{ id: 13 }] },
      { id: 3, name: "The Roland Team", users: [{ id: 99 }] },
    ]),
    ["Battr Paused"]
  );

  check("every team of that name is unioned, not just the first", () => {
    // This account really does carry two teams named "The Roland Team". Taking
    // the first match would silently drop half a roster, and the agents it
    // dropped would be the ones who look protected on the rule screen.
    assert.deepEqual([...twoTeamsSameName.userIds].sort((a, b) => a - b), [11, 12, 13]);
    assert.ok(twoTeamsSameName.enforceable);
    assert.deepEqual(twoTeamsSameName.missing, []);
    assert.ok(!twoTeamsSameName.userIds.has(99), "a different team's members are not paused");
  });

  const typo = await resolvePausedOwners(fakeFub([{ id: 1, name: "Battr Paused", users: [{ id: 11 }] }]), ["Batter Paused"]);

  check("a team name matching nothing is reported, not read as an empty team", () => {
    // The whole failure mode in one line: a typo and a genuinely empty team
    // both protect zero leads, but only one of them is a defect, and the run
    // has to be able to say which.
    assert.equal(typo.enforceable, false);
    assert.deepEqual(typo.missing, ["Batter Paused"]);
    assert.equal(typo.userIds.size, 0);
  });

  const emptyTeam = await resolvePausedOwners(fakeFub([{ id: 1, name: "Battr Paused", users: [] }]), ["Battr Paused"]);

  check("an empty paused team is enforceable, just unused", () => {
    // Kate Frihse was taken off the team on 7 Sep, leaving only Mike — who is
    // already exempt by name. So this is today's real state, and it must not
    // read as a broken rule.
    assert.equal(emptyTeam.enforceable, true, "the team exists, so the rule can fire");
    assert.equal(emptyTeam.userIds.size, 0, "it just holds nobody");
    assert.deepEqual(emptyTeam.missing, []);
  });

  const unreadable = await resolvePausedOwners(
    { teams: async () => { throw new Error("FUB GET /teams → 403: forbidden"); } },
    ["Battr Paused"],
    () => {}
  );

  check("an unreadable roster fails closed, loudly", () => {
    assert.equal(unreadable.enforceable, false);
    assert.deepEqual(unreadable.missing, ["Battr Paused"]);
  });

  check("the marker lands on a paused agent's leads and nobody else's", () => {
    const pausedOwnerIds = new Set([11]);
    const held = normalizeContact(
      { id: 900, stage: "Lead", created: daysAgo(400), assignedUserId: 11, tags: [] },
      { lastOutbound: 0 },
      {},
      { pausedOwnerIds }
    );
    const ordinary = normalizeContact(
      { id: 901, stage: "Lead", created: daysAgo(400), assignedUserId: 22, tags: [] },
      { lastOutbound: 0 },
      {},
      { pausedOwnerIds }
    );
    assert.deepEqual(held.owner_group_ids, [PAUSED_GROUP_MARKER], "the pasted rule JSON matches without being rewritten");
    assert.deepEqual(ordinary.owner_group_ids, [], "and it does not spray onto everyone");
  });

  check("with no roster resolved, the exclusion still protects nobody", () => {
    // The negative control. If this ever passes an empty set and still finds a
    // marked lead, the marker is coming from somewhere it should not.
    const c = normalizeContact(
      { id: 902, stage: "Lead", created: daysAgo(400), assignedUserId: 11, tags: [] },
      { lastOutbound: 0 },
      {},
      { pausedOwnerIds: new Set() }
    );
    assert.deepEqual(c.owner_group_ids, []);
  });

  check("the exclusion is driven by a team NAME, not a Battr-internal id", () => {
    // 52555 is a Battr id no FUB endpoint returns. Keeping it as the marker is
    // deliberate — the rule JSON is pasted verbatim from Battr's screen — but
    // nothing may look it up against Follow Up Boss.
    assert.ok(Array.isArray(rules.excludeOwnerTeamNames), "the team names are the configuration surface");
    assert.ok(rules.excludeOwnerTeamNames.length > 0, "and at least one team must be named");
    assert.equal(PAUSED_GROUP_MARKER, rules.excludeOwnerGroupIds[0], "the marker must match the pasted rule");

    const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
    assert.match(src, /resolvePausedOwners\(fub, rules\.excludeOwnerTeamNames/, "resolved from the roster, once per run");
    // Resolving per lead would be 54,000 calls to /teams.
    assert.ok(
      src.indexOf("resolvePausedOwners(fub") < src.indexOf("people.map((p) =>"),
      "the roster is resolved before the population is normalized, not inside the loop"
    );
  });
})();

// ─── The transcription record, which is only as good as its freshness ──────

await (async () => {
  const observed = await import("./observed.mjs");
  const nights = Object.entries(observed)
    .filter(([name, v]) => /^SEP_\d+$/.test(name) && v && typeof v === "object" && v.date)
    .map(([, v]) => v);

  check("every sweep is accounted for by a destination", () => {
    // If the pond breakdown does not add up to the records moved, a sweep went
    // somewhere nobody wrote down — and pond routing is reconstructed from
    // exactly these tallies.
    let checked = 0;
    for (const night of nights) {
      if (!night.assignmentTargets || night.records_moved === undefined) continue;
      const routed = Object.values(night.assignmentTargets)
        .flatMap((byName) => Object.values(byName))
        .reduce((a, b) => a + b, 0);
      assert.equal(routed, night.records_moved, `${night.date}: ${routed} routed vs ${night.records_moved} moved`);
      checked++;
    }
    assert.ok(checked >= 3, `only ${checked} nights carry a pond breakdown`);
  });

  check("the timeline agrees with the night it was taken from", () => {
    // Two places hold the same numbers; a typo in one is invisible until
    // something reconciles against the wrong copy.
    const byDate = new Map(nights.map((n) => [n.date, n]));
    let matched = 0;
    for (const row of observed.TIMELINE) {
      const night = byDate.get(row.date);
      if (!night) continue;
      assert.equal(row.total, night.total, `${row.date} total`);
      assert.equal(row.at_risk, night.at_risk, `${row.date} at risk`);
      if (night.neglected === undefined) {
        // A night with no Neglected email recorded nothing, which is NOT the
        // same claim as "nothing was swept". Saturday and Sunday are not sweep
        // days, so Battr sends no such email at all — the timeline's 0 means
        // nothing moved, and the observation's silence means nobody was told.
        // Collapsing the two would turn "we did not look" into "we looked and
        // it was empty".
        assert.equal(night.neglected_email_sent, false, `${row.date} has no neglected count and no reason given`);
        assert.equal(row.neglected, 0, `${row.date}: no sweep email means nothing moved`);
      } else {
        assert.equal(row.neglected, night.neglected, `${row.date} neglected`);
      }
      matched++;
    }
    assert.ok(matched >= 5, `only ${matched} timeline rows could be cross-checked`);
  });

  check("the comparison file agrees with the nights we recorded", () => {
    // The stale-baseline bug: the drift table compared 18 Sep against Battr's
    // 15 Sep total of 880 and printed −8.1%, because 880 was the newest row
    // anyone had transcribed. Battr's actual 18 Sep total was 790 and the real
    // drift was +2.4%. The engine was never short; the baseline was three days
    // old. This guards the copy that the report reads.
    const rows = readFileSync(join(ROOT, "battr-logs", "comparison.csv"), "utf8")
      .split("\n")
      .slice(1)
      .filter(Boolean)
      .map((line) => line.split(","))
      .filter((cells) => cells[1] === "battr" && cells[2] === "0");

    const byDate = new Map(nights.map((n) => [n.date, n]));
    let matched = 0;
    for (const cells of rows) {
      const night = byDate.get(cells[0]);
      if (!night) continue;
      assert.equal(Number(cells[4]), night.total, `${cells[0]} total in comparison.csv`);
      assert.equal(Number(cells[6]), night.at_risk, `${cells[0]} at risk in comparison.csv`);
      if (night.neglected !== undefined) {
        assert.equal(Number(cells[7]), night.neglected, `${cells[0]} neglected in comparison.csv`);
      }
      matched++;
    }
    assert.ok(matched >= 2, `only ${matched} Battr rows could be cross-checked against an observation`);
  });

  check("the warned cohort is followed honestly", () => {
    // The recovery figure — four of eight warned leads acted on within two
    // days — is the single most useful number these emails have yielded, and
    // it is also the easiest to overstate. These assertions are what keep it
    // from quietly becoming a better story than the evidence supports.
    const warned = observed.SEP_20.warnedOn18Sep;
    const still = observed.SEP_20.stillAtRiskOn20Sep;
    const left = observed.SEP_20.leftTierWithoutSweep;

    assert.equal(warned.length, observed.SEP_18.at_risk_new_notes, "the cohort is exactly that night's new warnings");
    assert.equal(new Set(warned).size, warned.length, "no lead counted twice");
    assert.deepEqual(
      [...still, ...left].sort((a, b) => a - b),
      [...warned].sort((a, b) => a - b),
      "every warned lead is accounted for as either still at risk or gone"
    );
    assert.equal(still.filter((id) => left.includes(id)).length, 0, "a lead cannot be in both");

    // The load-bearing claim: they left WITHOUT being swept.
    //
    // The first version of this checked only SEP_18's sweep list, and passed
    // while the claim was wrong. Lead 101122 was swept four nights later, on
    // 22 Sep, still carrying its 18 Sep stamp — it had aged from at-risk into
    // neglected and waited out three non-sweep days. A cohort claim has to be
    // checked against EVERY sweep we know about, not the one night it was
    // written on, or it only ever confirms itself.
    const everSwept = new Map();
    for (const night of nights) {
      for (const id of night.sweptIds ?? []) if (!everSwept.has(id)) everSwept.set(id, night.date);
    }
    const laterSwept = new Set(observed.SEP_20.laterSwept ?? []);
    for (const id of left) {
      if (everSwept.has(id)) {
        assert.ok(
          laterSwept.has(id),
          `${id} was swept on ${everSwept.get(id)} but is not recorded in SEP_20.laterSwept — ` +
            "the recovery figure is counting a lead that aged through instead"
        );
      }
    }

    // And the headline must move when the evidence does.
    assert.equal(
      observed.SEP_20.recoveredUpperBound,
      left.length - laterSwept.size,
      "the recovery bound must exclude every lead later found in a sweep list"
    );
    assert.ok(/aged past|neglected tier/i.test(observed.SEP_20.leftTierReading), "and ageing out must be one of the readings");

    for (const night of nights) {
      if (night.sweptIds === undefined || night.records_moved === undefined) continue;
      assert.equal(night.sweptIds.length, night.records_moved, `${night.date}: the sweep list is complete`);
    }

    // And the alternative reading must stay written down. A measurement that
    // records only its flattering interpretation is not a measurement.
    assert.match(observed.SEP_20.leftTierReading, /stage change|cannot distinguish/i);
  });

  check("Money Time is a destination, not an overflow", () => {
    // Sweeps stayed far below maxSweepsPerPond on every night we have, yet
    // Money Time still took leads. The overflow model cannot explain that.
    let checked = 0;
    for (const night of nights) {
      const { assignmentTargets, moneyTimeIds, sweptIds } = night;
      if (!assignmentTargets?.Pond?.["Money Time"]) continue;
      // Earlier nights were transcribed as tallies only, before per-lead ids
      // were worth keeping. Their cap assertion still holds; the id crosscheck
      // simply has nothing to check.
      if (!moneyTimeIds || !sweptIds) {
        assert.ok(
          Object.values(assignmentTargets.Pond).reduce((a, b) => a + b, 0) < rules.maxSweepsPerPond,
          `${night.date}: sweeps stayed under the ${rules.maxSweepsPerPond} cap`
        );
        continue;
      }
      assert.equal(moneyTimeIds.length, assignmentTargets.Pond["Money Time"], `${night.date}: ids match the tally`);
      assert.ok(moneyTimeIds.every((id) => sweptIds.includes(id)), `${night.date}: every Money Time lead was swept`);
      assert.ok(
        sweptIds.length < rules.maxSweepsPerPond,
        `${night.date}: ${sweptIds.length} sweeps is below the ${rules.maxSweepsPerPond} cap, so nothing overflowed`
      );
      checked++;
    }
    assert.ok(checked >= 2, `only ${checked} nights sent anything to Money Time`);
  });

  check("pond routing is not explained by lead source", () => {
    // Proposed 20 Sep from a single night — direct and organic to Money Time,
    // portals to Shark Tank — and refuted on 22 Sep, when Money Time took a
    // Zillow Preferred lead on a night Shark Tank took Zillow Preferred too.
    //
    // Nothing was implemented on the hypothesis, which is the only reason it
    // cost a comment rather than a rollback. This check exists so the idea
    // cannot quietly return: pond routing waits on Battr's rule screen.
    assert.equal(observed.SEP_22.pondRoutingBySourceRefuted, true);
    assert.equal(observed.SEP_22.sharkTankWasPortalOnly, false, "the 18 Sep pattern did not hold");
    assert.ok(
      observed.SEP_22.moneyTimeSources.some((src) => /zillow/i.test(src)),
      "a portal source reached Money Time, which is what breaks the rule"
    );

    // And the config must still route by name, not by anything inferred.
    const src = readFileSync(join(HERE, "rules.mjs"), "utf8");
    assert.match(src, /sweepPond: "Shark Tank"/);
    assert.ok(!/moneyTimeSources|routeBySource/.test(src), "no source-based routing may have been wired in");
  });

  check("Battr's audit list is not pinned at its September peak", () => {
    // 880 was a single Tuesday, not a ceiling. Anything that treats it as the
    // target reads a shrinking list as our engine falling behind.
    const latest = observed.TIMELINE[observed.TIMELINE.length - 1];
    const peak = Math.max(...observed.TIMELINE.map((r) => r.total));
    assert.ok(latest.total < peak, "the most recent night is below the peak, so the peak is not the target");

    // Ordering, not a pinned date. The first version of this check asserted the
    // last row was 2026-09-18 and failed the moment the next night was
    // transcribed — a test that has to be edited every time the data it guards
    // is updated trains people to edit it without reading it.
    const dates = observed.TIMELINE.map((r) => r.date);
    assert.deepEqual(dates, [...dates].sort(), "the timeline must be in date order");
    const newestNight = nights.map((n) => n.date).sort().pop();
    assert.ok(
      latest.date >= newestNight,
      `the timeline ends at ${latest.date} but ${newestNight} has been observed — transcribe it or the drift table compares against a stale row`
    );
  });
})();

// ─── A drift figure is only a disagreement when both sides are the same night ──

await (async () => {
  const { drift } = await import("./compare.mjs");

  const row = (date, source, total) => ({ date, source, listId: 0, listName: "⭐️ Team Leads (combined)", total });

  check("a drift spanning days is marked as not comparable", () => {
    // The real case, with the real numbers. On 20 Sep the report printed −7.8%
    // for the combined list and it read as the engine falling behind. It was
    // our 20 Sep count against Battr's 15 Sep count, and Battr's own list had
    // gone 880 → 777 in between. The engine had not moved; the baseline had.
    const [d] = drift([row("2026-09-15", "battr", 880), row("2026-09-20", "ours", 811)]);
    assert.equal(d.staleDays, 5);
    assert.equal(d.comparable, false, "five days apart is not a like-for-like comparison");
    assert.ok(d.driftPct < -7 && d.driftPct > -8, `expected about −7.8%, got ${d.driftPct.toFixed(1)}%`);
  });

  check("the same night reads as a real disagreement", () => {
    const [d] = drift([row("2026-09-20", "battr", 777), row("2026-09-20", "ours", 811)]);
    assert.equal(d.staleDays, 0);
    assert.equal(d.comparable, true);
    assert.ok(d.driftPct > 4 && d.driftPct < 5, `expected about +4.4%, got ${d.driftPct.toFixed(1)}%`);
  });

  check("one night either way still counts as comparable", () => {
    // The two systems run hours apart and roll the date differently — Battr
    // stamps the run at ~02:00 UTC, which is the previous evening in Las Vegas.
    // Demanding an exact date match would mark almost every honest comparison
    // stale and train people to ignore the marker.
    const [d] = drift([row("2026-09-19", "battr", 780), row("2026-09-20", "ours", 811)]);
    assert.equal(d.comparable, true);
  });

  check("the report marks a stale comparison where the number is", () => {
    // The footnote explaining stale rows was already in the report on 20 Sep,
    // under the table, and the −7.8% was still read as a regression. A caveat
    // that sits below the number it qualifies gets read after the conclusion
    // has been drawn.
    const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
    assert.match(src, /d\.comparable \? d\.battrDate/, "the row itself must show the staleness");
    assert.match(src, /rows compare against a Battr count from a different day/, "and the block must say how many");
    assert.ok(
      src.indexOf("rows compare against a Battr count from a different day") <
        src.indexOf("Worst drift first."),
      "the warning must come before the old footnote, not after it"
    );
  });
})();

// ─── Battr's own exclusion list, no longer reverse-engineered ──────────────

check("every source Battr excludes is excluded here", () => {
  // Transcribed 23 Sep 2026 from the "Lead Sources With Battr Action
  // Exclusions" page of Battr's playbook, which is generated from the live
  // configuration. Pinned as data so a future edit to sources.mjs has to
  // disagree with Battr explicitly rather than by omission.
  const BATTR_EXCLUDES = [
    "<unspecified>", "Import", "Imported", "Lender", "Mojo", "Mojo FSBO", "my +plus leads",
    "Open House", "Open House (Ylopo)", "Recruiting", "Redx", "Referral",
    "Schneider Branded Website", "Schneider Company", "Schneider Facebook", "Schneider Google LSA",
    "Schneider Lender", "Schneider Open House", "Schneider Open House (Ylopo)", "Schneider PPC",
    "Schneider Real Geeks", "Schneider Realtor.com", "Schneider Unspecified", "Schneider Ylopo",
    "Schneider Ylopo Seller", "Schneider zBuyer", "Schneider Zillow", "SOI", "Sphere", "Steve Hawks",
  ];
  // Two of them we deliberately DO sweep, on Mike's instruction of 23 Sep.
  // Listed by name so the divergence is a decision someone made, not a gap
  // someone left — and so that reverting it is one line, not an archaeology
  // exercise.
  const SWEPT_ANYWAY = ["my +plus leads", "Steve Hawks"];

  for (const source of BATTR_EXCLUDES) {
    if (SWEPT_ANYWAY.includes(source)) {
      assert.equal(isSourceAudited(source), true, `${source} is swept by our choice, against Battr's config`);
      continue;
    }
    assert.equal(bucketForSource(source), 82, `${source} must map to the never-swept bucket`);
    assert.equal(isSourceAudited(source), false, `${source} must not be audited`);
  }

  // And the divergence must be stated where the decision lives.
  const src = readFileSync(join(HERE, "sources.mjs"), "utf8");
  assert.match(src, /DELIBERATE DIVERGENCE FROM BATTR/, "a chosen difference must say it is chosen");
  assert.match(src, /35 of 55/, "and must carry the size of it, or it reads as a detail");
});

check("our neglected count runs high against Battr, and on purpose", () => {
  // `my +plus leads` and `Steve Hawks` are on Battr's exclusion list and we
  // sweep them anyway. That is a decision, not a defect, and it means the one
  // number this project is judged on — neglected — is expected to sit ABOVE
  // Battr's rather than converge on it.
  //
  // Worth pinning: the next person to see our 17 against Battr's 16 and go
  // hunting for the extra lead should find this first.
  for (const source of ["my +plus leads", "Steve Hawks"]) {
    assert.equal(isSourceAudited(source), true, `${source} is swept on Mike's instruction`);
    assert.notEqual(bucketForSource(source), 82, `${source} must not be in the never-swept bucket`);
  }
});

check("protecting a source by accident is not the same as protecting it", () => {
  // The fifteen "Schneider …" sources were excluded only because nobody had
  // named them, via unmappedPolicy: "exclude". That is protection by accident,
  // and an edit to the policy would have silently removed it from all fifteen
  // at once. They are now named.
  const src = readFileSync(join(HERE, "sources.mjs"), "utf8");
  for (const source of ["Schneider Zillow", "Schneider PPC", "Schneider Realtor.com"]) {
    assert.ok(src.includes(`"${source}": 82`), `${source} must be listed explicitly, not left to the fallback`);
  }
  // And the fallback stays, for the source nobody has seen yet.
  assert.equal(unmappedPolicy, "exclude", "an unknown source is still never swept");
});

check("the sweeping sources are still swept", () => {
  // The guard on the other side: this change must not quietly widen the
  // exclusion list into the portals the audit exists to police.
  for (const source of ["Zillow Preferred", "Ylopo", "zbuyer.com", "Google PPC", "TheRolandTeam.com"]) {
    assert.equal(isSourceAudited(source), true, `${source} must still be audited`);
  }
});

// ─── What counts as working a lead, per Battr's playbook ───────────────────

await (async () => {
  const { emailOrigin, foldEmailTouches, describeEmailOrigin, profileTouchAt, STAGE_UPDATED_FIELDS } =
    await import("./communication.mjs");

  const when = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

  check("an action-plan email does not count as working the lead", () => {
    // The whole reason email was excluded for three weeks: a FUB batch send is
    // one click for five hundred leads. Battr's line is manual vs automated,
    // not email vs no email — and an automated send still carries the agent's
    // user id, so "has a userId" alone cannot mean hand-written.
    assert.equal(emailOrigin({ userId: 7, actionPlanId: 22 }), "automated", "automation wins over a sender id");
    assert.equal(emailOrigin({ userId: 7, campaignOrigin: "drip" }), "automated");
    assert.equal(emailOrigin({ emailTemplateId: 3 }), "automated");
    assert.equal(emailOrigin({ userId: 7 }), "manual", "an agent typed this one");
    assert.equal(emailOrigin({}), "unknown", "and an unreadable row is never guessed at");
    assert.equal(emailOrigin({ userId: null, actionPlanId: "" }), "unknown", "empty is not present");
  });

  check("only manual email moves the clock, and only forward", () => {
    const index = new Map();
    const tally = foldEmailTouches(index, [
      { personId: 1, created: when(2), userId: 9 },                    // manual, 2 days ago
      { personId: 1, created: when(0), actionPlanId: 4, userId: 9 },   // automated, today
      { personId: 2, created: when(1) },                               // unknown
    ]);
    assert.deepEqual(tally, { manual: 1, automated: 1, unknown: 1 });

    // Lead 1's clock reads the MANUAL email, not the newer automated one.
    const lead1 = index.get(1);
    const age = Math.round((Date.now() - lead1.lastOutbound) / DAY_MS);
    assert.equal(age, 2, "the blast must not reset the clock to today");
    assert.ok(!index.has(2), "an undetermined row touches nothing");
  });

  check("folding email is monotonic, like every other channel", () => {
    // The property that makes a backfill safe to run before the sweep decision:
    // it can move a lead toward compliant and never toward neglected.
    const index = new Map([[1, { lastOutbound: Date.parse(when(1)), lastInbound: 0 }]]);
    const beforeMs = index.get(1).lastOutbound;
    foldEmailTouches(index, [{ personId: 1, created: when(30), userId: 9 }]);
    assert.equal(index.get(1).lastOutbound, beforeMs, "an older email must not move last-touch backwards");
  });

  check("an inbound email is a reply, not outreach", () => {
    const index = new Map();
    foldEmailTouches(index, [{ personId: 5, created: when(1), userId: 9, isIncoming: true }]);
    assert.equal(index.get(5).lastOutbound, 0, "the agent did not do this");
    assert.ok(index.get(5).lastInbound > 0, "but the lead is alive and it counts");
  });

  check("the origin diagnostic reports field names and counts, never content", () => {
    const d = describeEmailOrigin([{ userId: 1, subject: "x" }, { actionPlanId: 2 }, {}]);
    assert.equal(d.rows, 3);
    assert.deepEqual(d.fields, { actionPlanId: 1, userId: 1 });
    const src = readFileSync(join(HERE, "communication.mjs"), "utf8");
    assert.ok(!/row\.subject|row\.body|row\.to\b/.test(src), "no message content may reach the diagnostic");
  });

  check("a stage or timeframe update is working the lead", () => {
    // Battr counts both. Neither is a message, so neither appears in any
    // communication endpoint — they are timestamps on the person record.
    assert.ok(profileTouchAt({ stageUpdated: when(1) }, STAGE_UPDATED_FIELDS) > 0);
    assert.equal(profileTouchAt({ stageUpdated: "not a date" }, STAGE_UPDATED_FIELDS), null);
    assert.equal(profileTouchAt({}, STAGE_UPDATED_FIELDS), null, "absent is null, not zero");

    // And it reaches the classifier: a lead with no calls and no texts, whose
    // agent advanced the stage yesterday, is not neglected.
    const advanced = normalizeContact(
      { id: 700, stage: "Spoke with Customer", created: daysAgo(400), assignedUserId: 5, tags: [], stageUpdated: when(1) },
      { lastOutbound: 0, lastInbound: 0 }
    );
    assert.ok(advanced.last_communication_at, "the stage advance is the touch");
    const untouched = normalizeContact(
      { id: 701, stage: "Spoke with Customer", created: daysAgo(400), assignedUserId: 5, tags: [] },
      { lastOutbound: 0, lastInbound: 0 }
    );
    assert.equal(untouched.last_communication_at, null, "and a lead with neither is still untouched");
  });

  check("an email we cannot classify turns sweeps off rather than picking a side", () => {
    // The one genuinely dangerous outcome. Counting an unreadable row reopens
    // the batch-email hole; ignoring it sweeps a lead the agent wrote to. The
    // engine does neither — it marks the touch index incomplete, which is the
    // same brake the missing text channel pulls.
    const src = readFileSync(join(ROOT, "scripts", "battr-audit.mjs"), "utf8");
    assert.match(src, /if \(tally\.unknown\) \{/, "an undetermined origin must be acted on");
    const block = src.slice(src.indexOf("if (tally.unknown) {"), src.indexOf("if (failed) {"));
    assert.match(block, /touchIncomplete\.push/, "and the action is to mark the index incomplete");
    assert.match(block, /manual or automated/, "and to say what could not be read");
    assert.match(block, /Origin fields actually present/, "with the evidence needed to narrow the field list");
  });

  check("the policy reversal is written down where the policy lives", () => {
    // Email was excluded here from day one for a stated reason. Reversing that
    // silently would leave the next person unable to tell a decision from a
    // drift.
    const src = readFileSync(join(HERE, "rules.mjs"), "utf8");
    assert.equal(rules.emailCountsAsTouch, true);
    assert.equal(rules.stageOrTimeframeUpdateCountsAsTouch, true);
    const block = src.slice(src.indexOf("emailCountsAsTouch") - 2000, src.indexOf("emailCountsAsTouch"));
    assert.match(block, /Automated emails do NOT count/, "it must quote the rule it now follows");
    assert.match(block, /281 at risk against Battr's 15/, "and carry what the old policy cost");
  });
})();

console.log(`\n${passed} checks passed${process.exitCode ? " — with failures above" : ""}\n`);
