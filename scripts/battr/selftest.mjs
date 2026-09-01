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

import { classify, buildTouchIndex, classifyForList, runCombinedList, isExemptAgent, DAY_MS } from "./classify.mjs";
import { evaluateCondition, evaluateSet } from "./filters.mjs";
import { normalizeContact } from "./contact.mjs";
import { isDayAllowed } from "./schedule.mjs";
import { lists, listById, memberListsOf } from "./lists.mjs";
import { detectAtBats, summarizeAgents, formatRate } from "./atbats.mjs";
import { buildAgentDigests, deliverDigests, renderDigestText } from "./alerts.mjs";
import { parseCsv, findColumn, mapRows } from "./import-atbats.mjs";
import { bucketForSource, bucketName, isSourceAudited, leadBuckets, unmappedPolicy } from "./sources.mjs";
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

check("Active Leads is NOT one of the six that feed the sweep", () => {
  const { ids, resolved } = memberListsOf(lists.find((l) => l.audit_type === "combined_contact_lists"));
  assert.equal(ids.length, 6);
  assert.ok(!resolved.some((l) => l.name.includes("Active Leads")), "sweeping it would touch leads the live system never does");
  assert.deepEqual(
    resolved.map((l) => l.name).sort(),
    ["😎 Bi-Weekly Nurture", "🌤️ Warm Back Up", "🌱 Monthly Nurture", "🌶️ Hot Leads", "🔥 Weekly Nurture", "👀 Quarterly Nurture"].sort()
  );
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

check("a dry delivery sends nothing but still reports what it would send", async () => {
  const digests = buildAgentDigests([record({})]);
  const { delivered, failed } = await deliverDigests(digests, { channel: "fub_task", dry: true, log: () => {} });
  assert.equal(delivered.length, 1);
  assert.equal(failed.length, 0);
  assert.match(delivered[0].via, /^fub_task:/);
});

check("email delivery fails loudly when an agent has no address on file", async () => {
  const digests = buildAgentDigests([record({})]);
  const { delivered, failed } = await deliverDigests(digests, { channel: "email", usersById: new Map(), dry: true, log: () => {} });
  assert.equal(delivered.length, 0);
  assert.match(failed[0].reason, /no email address/);
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
  // Early-stage leads older than 10 days land in Warm Back Up (at risk >10d,
  // neglected >13d), which is what these fixtures exercise.
  const warm = (over) => lead({ stage: "Lead", created: daysAgo(60), ...over });
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

  const calls = [
    { personId: 101, created: daysAgo(1), isIncoming: false },
    { personId: 102, created: daysAgo(11), isIncoming: false },
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
