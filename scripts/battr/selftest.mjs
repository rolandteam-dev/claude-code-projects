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

import { classify, buildTouchIndex, DAY_MS } from "./classify.mjs";
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
