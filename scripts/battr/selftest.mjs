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
import { rmSync } from "node:fs";
import assert from "node:assert/strict";

import { classify, buildTouchIndex, classifyForList, runCombinedList, DAY_MS } from "./classify.mjs";
import { evaluateCondition, evaluateSet } from "./filters.mjs";
import { normalizeContact } from "./contact.mjs";
import { isDayAllowed } from "./schedule.mjs";
import { lists, listById } from "./lists.mjs";
import { rules } from "./rules.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

const NOW = Date.UTC(2026, 8, 1, 12, 0, 0); // 2026-09-01, fixed so tests don't drift
const daysAgo = (n) => new Date(NOW - n * DAY_MS).toISOString();

let passed = 0;
const check = (label, fn) => {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${label}`);
  } catch (err) {
    console.error(`  ✗ ${label}\n    ${err.message}`);
    process.exitCode = 1;
  }
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

check("inbound activity alone is not an agent touch", () => {
  const index = buildTouchIndex({ texts: [{ personId: 1, created: daysAgo(1), isIncoming: true }] });
  const r = classify(lead({ created: daysAgo(40) }), index, rules, NOW);
  assert.equal(r.status, "neglected", "a lead texting us is not the agent working the lead");
});

check("the most recent touch across channels wins", () => {
  const index = buildTouchIndex({
    calls: [{ personId: 1, created: daysAgo(30), isIncoming: false }],
    emails: [{ personId: 1, created: daysAgo(1), isIncoming: false }],
  });
  assert.equal(classify(lead(), index, rules, NOW).daysSinceTouch, 1);
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
const activeLeads = listById(1104);

const hotLead = (over = {}) =>
  normalizeContact(
    { id: 1, name: "Hot One", created: daysAgo(3), stageId: 2, tags: [], assignedUserId: 5, assignedTo: "Jason Shawver", ...over },
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
  const base = { id: 2, created: daysAgo(40), stageId: 98, tags: [], assignedUserId: 5, lastVisit: daysAgo(2) };
  const at = normalizeContact(base, { lastOutbound: 0 });
  at.custom_fields.fub.system_lastCommunication = daysAgo(7);
  assert.equal(classifyForList(at, activeLeads, NOW), "at_risk", "7 days is past 6 but short of 9");

  const neg = normalizeContact(base, { lastOutbound: 0 });
  neg.custom_fields.fub.system_lastCommunication = daysAgo(10);
  assert.equal(classifyForList(neg, activeLeads, NOW), "neglected");
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

check("missing member lists are reported, not silently ignored", () => {
  const { missingMemberLists } = runCombinedList([], teamLeads, NOW);
  assert.deepEqual(missingMemberLists, [1106, 1107, 1108, 1109]);
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

// ------------------------------------------------------------------ end-to-end

/** A stand-in FUB API serving fixtures, so the real client code is exercised. */
function fixtureServer() {
  const people = [
    // compliant
    lead({ id: 101, name: "Fresh Contact", assignedTo: "Nicole Miller", assignedUserId: 11 }),
    // at risk
    lead({ id: 102, name: "Going Quiet", assignedTo: "Nicole Miller", assignedUserId: 11 }),
    // neglected
    lead({ id: 103, name: "Long Gone", assignedTo: "Brett Smith", assignedUserId: 12 }),
    // neglected, but unworkable — report only
    lead({ id: 104, name: "Bad Number", assignedTo: "Brett Smith", assignedUserId: 12, tags: ["BAD_PHONE"] }),
    // excluded
    lead({ id: 105, name: "In Escrow", assignedTo: "Brett Smith", assignedUserId: 12, stage: "Under Contract" }),
  ];

  const calls = [
    { personId: 101, created: daysAgo(1), isIncoming: false },
    { personId: 102, created: daysAgo(9), isIncoming: false },
    { personId: 103, created: daysAgo(40), isIncoming: false },
    { personId: 104, created: daysAgo(40), isIncoming: false },
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
      { cwd: ROOT, env: { ...process.env, ...env } },
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
