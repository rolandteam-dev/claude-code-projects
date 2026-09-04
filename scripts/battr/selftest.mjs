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
import assert from "node:assert/strict";

import { classify, buildTouchIndex, classifyForList, runCombinedList, isExemptAgent, readInboundEmails, findUnansweredInbound, runReportOnlyLists, DAY_MS } from "./classify.mjs";
import { evaluateCondition, evaluateSet } from "./filters.mjs";
import { normalizeContact } from "./contact.mjs";
import { isDayAllowed } from "./schedule.mjs";
import { lists, listById, memberListsOf, reportOnlyLists } from "./lists.mjs";
import { detectAtBats, summarizeAgents, formatRate } from "./atbats.mjs";
import { buildAgentDigests, deliverDigests, renderDigestText, digestSubject } from "./alerts.mjs";
import { describeError, fromAddress, mailConfigured } from "./email.mjs";
import { parseCsv, findColumn, mapRows } from "./import-atbats.mjs";
import { bucketForSource, bucketName, isSourceAudited, leadBuckets, unmappedPolicy } from "./sources.mjs";
import { FubClient } from "./fub.mjs";
import { rules } from "./rules.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

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
    [1146, build({ stage: "Lead", source: "SOI" }, 200), "Sphere & Past Clients"],
    [1147, build({ stage: "Lead", source: "Ylopo Seller" }, 20), "YLOPO IMPORTANT"],
    [1148, build({ stage: "Lead", source: "Zillow Flex" }, 20), "Zillow Important"],
    [1105, build({ stage: "Nurture", lastVisit: daysAgo(2) }, 20), "Active Leads"],
    [1149, build({ stage: "Under Contract" }, 40), "Current & Upcoming Clients"],
  ];

  for (const [id, contact, label] of cases) {
    const status = classifyForList(contact, listById(id), NOW);
    assert.ok(status !== null, `${label} (${id}) selected nobody — its rule matches no contact`);
    assert.notEqual(status, "compliant", `${label} (${id}) never flags — check its thresholds`);
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
    const build = (quietDays) => {
      const c = normalizeContact(
        { id: 3, stage: "Nurture", timeframe, created: daysAgo(200), assignedUserId: 5, tags: [] },
        { lastOutbound: 0 }
      );
      c.custom_fields.fub.system_lastCommunication = daysAgo(quietDays);
      return c;
    };
    assert.equal(classifyForList(build(atRisk - 1), listById(list), NOW), "compliant");
    assert.equal(classifyForList(build(atRisk + 1), listById(list), NOW), "at_risk");
    assert.equal(classifyForList(build(neglected + 1), listById(list), NOW), "neglected");
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
  const build = (age, quiet) => {
    const c = normalizeContact({ id: 5, stage: "Attempted Contact", created: daysAgo(age), assignedUserId: 5, tags: [] }, { lastOutbound: 0 });
    c.custom_fields.fub.system_lastCommunication = daysAgo(quiet);
    return c;
  };
  assert.equal(classifyForList(build(30, 14), warm, NOW), "neglected");
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

check("a newly seen owned lead is a brand new lead", () => {
  const events = detectAtBats(new Map(), [owned(1, 11)], { now: NOW });
  assert.equal(events.length, 1);
  assert.equal(events[0].at_bat_type, "brand_new_lead");
  assert.equal(events[0].new_owner_id, 11);
});

check("a newly seen lead sitting in a pond is not an at bat yet", () => {
  const events = detectAtBats(new Map(), [owned(1, null, 900)], { now: NOW });
  assert.equal(events.length, 0, "nobody has been given a chance yet");
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
    // neglected
    warm({ id: 103, name: "Long Gone", assignedTo: "Brett Smith", assignedUserId: 12 }),
    // neglected, but unworkable — report only
    warm({ id: 104, name: "Bad Number", assignedTo: "Brett Smith", assignedUserId: 12, tags: ["BAD_PHONE"] }),
    // excluded: no list covers a contract stage
    warm({ id: 105, name: "In Escrow", assignedTo: "Brett Smith", assignedUserId: 12, stage: "Under Contract" }),
  ];

  // Each one sits in the middle of its tier, not on a boundary, so a run at any
  // hour of any day lands in the same place: compliant <10d, at risk 10-13d,
  // neglected >13d.
  const calls = [
    { personId: 101, created: ago(2), isIncoming: false },
    { personId: 102, created: ago(12), isIncoming: false },
    { personId: 103, created: ago(40), isIncoming: false },
    { personId: 104, created: ago(40), isIncoming: false },
  ];

  const routes = {
    "/users": { users: [{ id: 11, name: "Nicole Miller" }, { id: 12, name: "Brett Smith" }] },
    "/ponds": { ponds: [{ id: 900, name: "Shark Tank" }, { id: 901, name: "Money Time" }] },
    "/people": { people },
    "/calls": { calls },
    "/textMessages": { textmessages: [] },
    "/emails": { emails: [] },
    "/customFields": { customfields: [] },
  };

  const writes = [];
  const server = createServer((req, res) => {
    if (req.method !== "GET") {
      writes.push(`${req.method} ${req.url}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end("{}");
    }
    const path = new URL(req.url, "http://localhost").pathname;
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
      { cwd: ROOT, env: { ...process.env, GITHUB_STEP_SUMMARY: "", ...env } },
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
    assert.match(stderr, /5 leads in the audit population/);
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
} finally {
  server.close();
  rmSync(join(ROOT, "battr-logs"), { recursive: true, force: true });
}

console.log(`\n${passed} checks passed${process.exitCode ? " — with failures above" : ""}\n`);
