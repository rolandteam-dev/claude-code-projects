#!/usr/bin/env node
/**
 * Self-test for the Offer Machine's pure logic: input validation, Slack request
 * verification, access rules, and the review message. No database, Slack or
 * TransactionDesk needed.
 *
 *   npm run offers:test
 *
 * Every name, address and price below is MADE UP. This repo is public: never
 * paste a real client or deal into a fixture.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  parseMoney,
  todayLasVegas,
  validateBuyerForm,
  parseJobType,
  parseJobResult,
} from "../../src/lib/offers/types.ts";
import { verifySlackSignature, jobMessage, readModalValues, esc } from "../../src/lib/offers/slack.ts";
import { isAllowedUser, canReview, safeEqual } from "../../src/lib/offers/config.ts";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL  ${name}\n`, e);
    process.exitCode = 1;
  }
}

const NOW = new Date("2026-11-17T20:00:00Z"); // 12:00 in Las Vegas

const good = {
  address: "1234 Example St, Las Vegas NV 89000",
  client_name: "Pat Example",
  list_price: "$850,000",
  offer_price: "835,000",
  financing: "conventional",
  earnest_money: "10000",
  close_date: "2026-12-30",
  contingencies: ["inspection", "appraisal", "loan"],
};

// --- money + dates ---------------------------------------------------------
test("parseMoney accepts $ , and cents; rejects junk", () => {
  assert.equal(parseMoney("$1,250,000"), 1250000);
  assert.equal(parseMoney("835000"), 835000);
  assert.equal(parseMoney("1,000.50"), 1000.5);
  assert.equal(parseMoney("12k"), null);
  assert.equal(parseMoney("-5"), null);
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney(undefined), null);
});

test("todayLasVegas reads the date in Pacific time, not UTC", () => {
  assert.equal(todayLasVegas(new Date("2026-11-18T03:00:00Z")), "2026-11-17"); // 7pm PST on the 17th
  assert.equal(todayLasVegas(new Date("2026-11-18T09:00:00Z")), "2026-11-18");
});

// --- buyer validation ------------------------------------------------------
test("a complete form validates and is normalised", () => {
  const r = validateBuyerForm(good, NOW);
  assert.equal(r.ok, true);
  assert.equal(r.inputs.offerPrice, 835000);
  assert.equal(r.inputs.listPrice, 850000);
  assert.equal(r.inputs.earnestMoney, 10000);
  assert.deepEqual(r.inputs.contingencies, ["inspection", "appraisal", "loan"]);
  assert.equal("notes" in r.inputs, false);
  assert.equal("fubPersonId" in r.inputs, false);
});

test("an empty form reports every required field and nothing else", () => {
  const r = validateBuyerForm({}, NOW);
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), [
    "address",
    "client_name",
    "close_date",
    "earnest_money",
    "financing",
    "list_price",
    "offer_price",
  ]);
});

test("an offer far from list is an error (a typo would end up in a contract)", () => {
  const r = validateBuyerForm({ ...good, offer_price: "83500" }, NOW);
  assert.equal(r.ok, false);
  assert.match(r.errors.offer_price, /10% of list/);
  assert.equal(validateBuyerForm({ ...good, offer_price: "8350000" }, NOW).ok, false); // extra zero
  assert.equal(validateBuyerForm({ ...good, offer_price: "600000" }, NOW).ok, true); // 70.6% of list: a real lowball, allowed
});

test("price ratio boundaries: 60% and 140% pass, outside fails", () => {
  assert.equal(validateBuyerForm({ ...good, list_price: "1000000", offer_price: "600000", earnest_money: "1" }, NOW).ok, true);
  assert.equal(validateBuyerForm({ ...good, list_price: "1000000", offer_price: "599999", earnest_money: "1" }, NOW).ok, false);
  assert.equal(validateBuyerForm({ ...good, list_price: "1000000", offer_price: "1400000", earnest_money: "1" }, NOW).ok, true);
  assert.equal(validateBuyerForm({ ...good, list_price: "1000000", offer_price: "1400001", earnest_money: "1" }, NOW).ok, false);
});

test("cash offers cannot carry a loan contingency", () => {
  const r = validateBuyerForm({ ...good, financing: "cash" }, NOW);
  assert.equal(r.ok, false);
  assert.ok(r.errors.contingencies);
  assert.equal(validateBuyerForm({ ...good, financing: "cash", contingencies: ["inspection"] }, NOW).ok, true);
});

test("earnest money cannot exceed the offer; zero is allowed", () => {
  assert.ok(validateBuyerForm({ ...good, earnest_money: "900000" }, NOW).errors.earnest_money);
  assert.equal(validateBuyerForm({ ...good, earnest_money: "0" }, NOW).ok, true);
});

test("close date must be a real date and not in the past; today is fine", () => {
  assert.ok(validateBuyerForm({ ...good, close_date: "2026-11-16" }, NOW).errors.close_date);
  assert.ok(validateBuyerForm({ ...good, close_date: "2026-02-31" }, NOW).errors.close_date);
  assert.ok(validateBuyerForm({ ...good, close_date: "12/30/2026" }, NOW).errors.close_date);
  assert.equal(validateBuyerForm({ ...good, close_date: "2026-11-17" }, NOW).ok, true);
});

test("unknown contingencies are dropped, not trusted", () => {
  const r = validateBuyerForm({ ...good, contingencies: ["inspection", "waive_everything"] }, NOW);
  assert.equal(r.ok, true);
  assert.deepEqual(r.inputs.contingencies, ["inspection"]);
});

test("FUB id must be digits; notes are capped", () => {
  assert.ok(validateBuyerForm({ ...good, fub_person_id: "12ab" }, NOW).errors.fub_person_id);
  assert.equal(validateBuyerForm({ ...good, fub_person_id: " 4821 " }, NOW).inputs.fubPersonId, "4821");
  assert.ok(validateBuyerForm({ ...good, notes: "x".repeat(1001) }, NOW).errors.notes);
});

// --- command text + worker result -----------------------------------------
test("parseJobType", () => {
  assert.equal(parseJobType(""), "buyer_offer");
  assert.equal(parseJobType(" Buyer "), "buyer_offer");
  assert.equal(parseJobType("counter"), "counter");
  assert.equal(parseJobType("review"), "seller_review");
  assert.equal(parseJobType("nonsense"), null);
  assert.equal(parseJobType(null), "buyer_offer");
});

test("parseJobResult requires a summary, validates shapes, caps sizes", () => {
  assert.equal(parseJobResult(null).ok, false);
  assert.equal(parseJobResult({}).ok, false);
  assert.equal(parseJobResult({ summary: "ok", flags: "no" }).ok, false);
  assert.equal(parseJobResult({ summary: "ok", mismatches: [1] }).ok, false);
  assert.equal(parseJobResult({ summary: "ok", tdUrl: "http://insecure" }).ok, false);
  assert.equal(parseJobResult({ summary: "ok", tdUrl: "javascript:alert(1)" }).ok, false);
  const r = parseJobResult({ summary: "Drafted.", tdUrl: "https://example.com/d/1", flags: ["a"], mismatches: [] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.result.flags, ["a"]);
  assert.deepEqual(r.result.mismatches, []);
  const big = parseJobResult({ summary: "s", flags: Array.from({ length: 60 }, () => "x".repeat(900)) });
  assert.equal(big.result.flags.length, 25);
  assert.equal(big.result.flags[0].length, 300);
});

// --- slack signature -------------------------------------------------------
const SECRET = "test-signing-secret";
const sign = (ts, body, secret = SECRET) => "v0=" + createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex");

test("verifySlackSignature accepts a good signature", () => {
  const ts = String(Math.floor(NOW.getTime() / 1000));
  assert.equal(verifySlackSignature(SECRET, ts, sign(ts, "a=1"), "a=1", NOW.getTime()), true);
});

test("verifySlackSignature rejects tampering, wrong secret, missing headers, replays", () => {
  const ts = String(Math.floor(NOW.getTime() / 1000));
  assert.equal(verifySlackSignature(SECRET, ts, sign(ts, "a=1"), "a=2", NOW.getTime()), false);
  assert.equal(verifySlackSignature(SECRET, ts, sign(ts, "a=1", "other"), "a=1", NOW.getTime()), false);
  assert.equal(verifySlackSignature(SECRET, null, sign(ts, "a=1"), "a=1", NOW.getTime()), false);
  assert.equal(verifySlackSignature(SECRET, ts, null, "a=1", NOW.getTime()), false);
  assert.equal(verifySlackSignature(SECRET, ts, "v0=short", "a=1", NOW.getTime()), false);
  assert.equal(verifySlackSignature(SECRET, "garbage", sign("garbage", "a=1"), "a=1", NOW.getTime()), false);
  // a captured, correctly signed request replayed 10 minutes later
  assert.equal(verifySlackSignature(SECRET, ts, sign(ts, "a=1"), "a=1", NOW.getTime() + 10 * 60 * 1000), false);
});

// --- access ---------------------------------------------------------------
test("access fails closed: empty allowlist means nobody", () => {
  delete process.env.OFFER_ALLOWED_SLACK_USERS;
  delete process.env.OFFER_REVIEWER_SLACK_USERS;
  assert.equal(isAllowedUser("U111"), false);
  assert.equal(isAllowedUser(""), false);
  assert.equal(isAllowedUser(null), false);
});

test("allowlist + reviewers: requester reviews own draft; listed reviewer reviews any; others cannot", () => {
  process.env.OFFER_ALLOWED_SLACK_USERS = "U111, U222,U333";
  process.env.OFFER_REVIEWER_SLACK_USERS = "U333";
  assert.equal(isAllowedUser("U111"), true);
  assert.equal(isAllowedUser("U999"), false);
  assert.equal(canReview("U111", "U111"), true); // own draft
  assert.equal(canReview("U111", "U333"), true); // reviewer
  assert.equal(canReview("U111", "U222"), false); // allowed user, not requester or reviewer
  assert.equal(canReview("U111", "U999"), false);
  // a reviewer who is removed from the allowlist loses access
  process.env.OFFER_ALLOWED_SLACK_USERS = "U111";
  assert.equal(canReview("U111", "U333"), false);
});

test("safeEqual", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

// --- modal values ---------------------------------------------------------
test("readModalValues reads text, select, date and checkbox elements", () => {
  const v = readModalValues({
    address: { v: { type: "plain_text_input", value: "1 Main" } },
    financing: { v: { type: "static_select", selected_option: { value: "cash" } } },
    close_date: { v: { type: "datepicker", selected_date: "2026-12-01" } },
    contingencies: { v: { type: "checkboxes", selected_options: [{ value: "inspection" }, { value: "loan" }] } },
    notes: { v: { type: "plain_text_input", value: null } },
  });
  assert.equal(v.address, "1 Main");
  assert.equal(v.financing, "cash");
  assert.equal(v.close_date, "2026-12-01");
  assert.deepEqual(v.contingencies, ["inspection", "loan"]);
  assert.equal(v.notes, undefined);
});

// --- review message -------------------------------------------------------
const baseJob = {
  id: "11111111-1111-4111-8111-111111111111",
  jobType: "buyer_offer",
  status: "needs_review",
  requestedBy: "U111",
  channelId: "C1",
  threadTs: "1.1",
  inputs: validateBuyerForm(good, NOW).inputs,
  result: { summary: "Drafted in TD.", tdUrl: "https://example.com/d/1", flags: [], mismatches: [] },
  error: null,
  reviewedBy: null,
  attempts: 1,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};
const buttons = (job) =>
  jobMessage(job)
    .blocks.filter((b) => b.type === "actions")
    .flatMap((b) => b.elements.map((e) => e.action_id));

test("a clean draft offers Approve and Request changes", () => {
  assert.deepEqual(buttons(baseJob), ["offer_approve", "offer_changes"]);
});

test("a draft that disagrees with the typed terms CANNOT be approved", () => {
  const job = { ...baseJob, result: { ...baseJob.result, mismatches: ["Offer price in TD is $853,000, typed $835,000"] } };
  assert.deepEqual(buttons(job), ["offer_changes"]);
  const text = JSON.stringify(jobMessage(job).blocks);
  assert.match(text, /can't be approved/);
  assert.match(text, /853,000/);
});

test("no buttons once decided, queued, working or failed", () => {
  for (const status of ["queued", "working", "approved", "changes_requested", "failed"]) {
    assert.deepEqual(buttons({ ...baseJob, status, reviewedBy: "U111" }), [], status);
  }
});

test("the message shows the TYPED terms, not the worker's claim", () => {
  const text = JSON.stringify(jobMessage(baseJob).blocks);
  assert.match(text, /\$835,000/);
  assert.match(text, /98\.2%/);
  assert.match(text, /2026-12-30/);
  assert.match(text, /Inspection, Appraisal, Loan/);
});

test("approved message says nothing was sent", () => {
  const text = JSON.stringify(jobMessage({ ...baseJob, status: "approved", reviewedBy: "U111" }).blocks);
  assert.match(text, /never sends/);
  assert.match(text, /<@U111>/);
});

test("user and worker text cannot inject mentions or links", () => {
  assert.equal(esc("<!channel> & <https://evil|click>"), "&lt;!channel&gt; &amp; &lt;https://evil|click&gt;");
  const evil = {
    ...baseJob,
    inputs: { ...baseJob.inputs, address: "<!channel> 1 Main", clientName: "<@UEVIL>" },
    result: { summary: "<!here> done", flags: ["<!everyone>"], mismatches: [] },
  };
  const text = JSON.stringify(jobMessage(evil).blocks);
  assert.doesNotMatch(text, /<!channel>|<!here>|<!everyone>|<@UEVIL>/);
});

console.log(`offers selftest: ${passed} passed${process.exitCode ? " (with failures)" : ""}`);
