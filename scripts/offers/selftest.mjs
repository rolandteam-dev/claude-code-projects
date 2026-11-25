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
import { draftLink, verifyDraftLink } from "../../src/lib/offers/rpa/store.ts";
import { dollarsInWords, parseAddress } from "../../src/lib/offers/rpa/fill.ts";
import { verifySlackSignature, jobMessage, readModalValues, esc } from "../../src/lib/offers/slack.ts";
import { isAllowedUser, canReview, safeEqual } from "../../src/lib/offers/config.ts";
import {
  resolveTerms,
  mergeStated,
  matchPerson,
  sanitizeExtraction,
  sheetText,
  coverEmail,
  pickListing,
  questionText,
  addDays,
  joinNames,
} from "../../src/lib/offers/terms.ts";

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


// --- conversational core: terms.ts ----------------------------------------
const TODAY = "2026-11-17";
const CTX = { speakerName: "Mike Roland", today: TODAY };
// "write an offer for Mark Smith and Megan Smith, $500,000, 123 Main Street" and nothing else
const SAID = { buyerNames: ["Mark Smith", "Megan Smith"], address: "123 Main Street", offerPrice: 500000 };

test("the example sentence asks only for what it can't know", () => {
  const r = resolveTerms(SAID, CTX);
  assert.deepEqual(r.missing, ["the list price", "how they're paying (cash, conventional, FHA, VA)"]);
  assert.equal(r.inputs, null);
  assert.match(questionText(r.missing), /list price[\s\S]*how they're paying/);
});

test("the agent is the speaker unless they named someone", () => {
  const r = resolveTerms(SAID, CTX);
  assert.deepEqual(r.display.find((d) => d.label === "Agent"), { label: "Agent", value: "Mike Roland", source: "speaker" });
  const named = resolveTerms({ ...SAID, agentName: "Pat Example" }, CTX);
  assert.equal(named.display.find((d) => d.label === "Agent").value, "Pat Example");
  assert.equal(named.display.find((d) => d.label === "Agent").source, "stated");
});

test("with list price + financing, the rest comes from defaults and is labelled", () => {
  const r = resolveTerms({ ...SAID, listPrice: 520000, financing: "conventional", downPaymentPercent: 5 }, CTX);
  assert.deepEqual(r.missing, []);
  assert.equal(r.errors, null);
  assert.equal(r.inputs.earnestMoney, 5000); // 1% of 500k
  assert.equal(r.inputs.closeDate, addDays(TODAY, 30));
  assert.deepEqual(r.inputs.contingencies, ["inspection", "appraisal", "loan"]);
  assert.equal(r.inputs.inspectionDays, 10);
  assert.equal(r.inputs.loanDays, 21);
  assert.equal(r.inputs.clientName, "Mark Smith and Megan Smith");
  assert.equal(r.inputs.agentName, "Mike Roland");
  assert.deepEqual(r.defaulted, ["Earnest money", "Close of escrow", "Contingencies"]);
});

test("a cash offer drops the loan contingency by default", () => {
  const r = resolveTerms({ ...SAID, listPrice: 520000, financing: "cash" }, CTX);
  assert.deepEqual(r.inputs.contingencies, ["inspection", "appraisal"]);
  assert.equal("loanDays" in r.inputs, false);
});

test("stated terms beat defaults and are not labelled as defaults", () => {
  const r = resolveTerms(
    { ...SAID, listPrice: 520000, financing: "fha", downPaymentPercent: 3.5, earnestMoney: 10000, closeDate: "2026-12-30", contingencies: ["inspection"], inspectionDays: 7, sellerCredit: 5000 },
    CTX,
  );
  assert.equal(r.inputs.earnestMoney, 10000);
  assert.equal(r.inputs.closeDate, "2026-12-30");
  assert.deepEqual(r.inputs.contingencies, ["inspection"]);
  assert.equal(r.inputs.inspectionDays, 7);
  assert.equal("appraisalDays" in r.inputs, false);
  assert.equal(r.inputs.sellerCredit, 5000);
  assert.deepEqual(r.defaulted, []);
});

test('"no contingencies" is honoured, not overwritten by defaults', () => {
  const r = resolveTerms({ ...SAID, listPrice: 520000, financing: "cash", contingencies: [] }, CTX);
  assert.deepEqual(r.inputs.contingencies, []);
  assert.equal(r.display.find((d) => d.label === "Contingencies").value, "None");
});

test("the list price from the MLS lookup fills in, and is labelled as a lookup", () => {
  const r = resolveTerms({ ...SAID, financing: "va", downPaymentPercent: 0, lookup: { tried: true, listPrice: 520000, mlsNumber: "2512345" } }, CTX);
  assert.deepEqual(r.missing, []);
  assert.equal(r.inputs.listPrice, 520000);
  assert.equal(r.inputs.mlsNumber, "2512345");
  assert.equal(r.display.find((d) => d.label === "List price").source, "lookup");
  // an agent-stated list price beats the lookup
  const stated = resolveTerms({ ...SAID, listPrice: 530000, financing: "va", downPaymentPercent: 0, lookup: { tried: true, listPrice: 520000 } }, CTX);
  assert.equal(stated.inputs.listPrice, 530000);
});

test("a typo'd price is caught by validation and the offer is NOT produced", () => {
  const r = resolveTerms({ ...SAID, offerPrice: 50000, listPrice: 520000, financing: "cash" }, CTX);
  assert.equal(r.inputs, null);
  assert.ok(r.errors.offer_price);
  const past = resolveTerms({ ...SAID, listPrice: 520000, financing: "cash", closeDate: "2026-11-01" }, CTX);
  assert.equal(past.inputs, null);
  assert.ok(past.errors.close_date);
});

test("mergeStated: later statements win, arrays replace, a new address drops the old lookup", () => {
  const a = { ...SAID, contingencies: ["inspection", "loan"], lookup: { tried: true, listPrice: 520000 } };
  const b = mergeStated(a, { offerPrice: 510000, contingencies: ["appraisal"], buyerNames: undefined });
  assert.equal(b.offerPrice, 510000);
  assert.deepEqual(b.contingencies, ["appraisal"]);
  assert.deepEqual(b.buyerNames, ["Mark Smith", "Megan Smith"]); // untouched
  assert.deepEqual(b.lookup, { tried: true, listPrice: 520000 }); // same address: kept
  const c = mergeStated(a, { address: "456 Oak Ave" });
  assert.equal(c.lookup, undefined);
  assert.equal(mergeStated(a, { address: "123 Main Street" }).lookup.listPrice, 520000); // same address: kept
});

test("matchPerson catches the Rowland/Roland slip but never guesses", () => {
  const team = ["Mike Roland", "Mark Smith", "Kristi Example"];
  assert.deepEqual(matchPerson("Mike Rowland", team), { name: "Mike Roland", exact: false });
  assert.deepEqual(matchPerson("mike roland", team), { name: "Mike Roland", exact: true });
  assert.equal(matchPerson("Zed Zebra", team), null);
  assert.equal(matchPerson("Mo", team), null);
  assert.equal(matchPerson("Jun Smith", ["Jon Smith", "Jan Smith"]), null); // ambiguous
});

test("sanitizeExtraction never trusts the model", () => {
  const e = sanitizeExtraction({
    buyerNames: ["Mark Smith", "", 7, "Megan Smith"],
    address: "123 Main Street",
    offerPrice: 500, // implausible: dropped
    listPrice: "520000", // wrong type: dropped
    financing: "bitcoin",
    closeDate: "tomorrow",
    contingencies: ["inspection", "waive_everything"],
    inspectionDays: 400,
    appraisalDays: 17,
    sellerCredit: -5,
    earnestMoney: 0,
    isAdmin: true, // unknown key
    cancel: true,
  });
  assert.deepEqual(e.terms, {
    buyerNames: ["Mark Smith", "Megan Smith"],
    address: "123 Main Street",
    contingencies: ["inspection"],
    appraisalDays: 17,
    earnestMoney: 0,
  });
  assert.equal(e.cancel, true);
  assert.deepEqual(sanitizeExtraction(null), { terms: {}, cancel: false });
  assert.deepEqual(sanitizeExtraction("DROP TABLE"), { terms: {}, cancel: false });
  assert.deepEqual(sanitizeExtraction({ offerPrice: 500000, financing: "fha", closeDate: "2026-12-30" }).terms, {
    offerPrice: 500000,
    financing: "fha",
    closeDate: "2026-12-30",
  });
});

test("the terms sheet states the typed numbers and warns about placeholder defaults", () => {
  const r = resolveTerms({ ...SAID, listPrice: 520000, financing: "conventional", downPaymentPercent: 5, sellerCredit: 5000 }, CTX);
  const sheet = sheetText(r.inputs, r.defaulted);
  assert.match(sheet, /Purchase price:\s+\$500,000\s+\(list \$520,000, 96\.2%\)/);
  assert.match(sheet, /Earnest money:\s+\$5,000/);
  assert.match(sheet, /Seller credit:\s+\$5,000/);
  assert.match(sheet, /Down payment:\s+5% \(\$25,000\)/);
  assert.match(sheet, /Inspection \(10 days\), Appraisal \(17 days\), Loan \(21 days\)/);
  assert.match(sheet, /Filled from defaults, not stated: Earnest money, Close of escrow, Contingencies/);
  assert.match(sheet, /PLACEHOLDERS/);
  const allStated = resolveTerms(
    { ...SAID, listPrice: 520000, financing: "cash", earnestMoney: 10000, closeDate: "2026-12-30", contingencies: [] },
    CTX,
  );
  assert.doesNotMatch(sheetText(allStated.inputs, allStated.defaulted), /defaults/);
});

test("the cover email states only what the sheet states", () => {
  const r = resolveTerms({ ...SAID, listPrice: 520000, financing: "cash", sellerCredit: 3000 }, CTX);
  const mail = coverEmail(r.inputs);
  assert.equal(mail.subject, "Offer: 123 Main Street");
  assert.match(mail.body, /Mark Smith and Megan Smith/);
  assert.match(mail.body, /Purchase price: \$500,000/);
  assert.match(mail.body, /Financing: Cash/);
  assert.match(mail.body, /Seller credit: \$3,000/);
  assert.doesNotMatch(mail.body, /Loan/); // cash: no loan contingency
  assert.match(mail.body, /Mike Roland/);
  assert.match(mail.body, /\[Listing agent name\]/); // never invented
});

test("pickListing accepts only the exact street, never a near miss", () => {
  const l = (line1) => ({ address: { line1 }, listPrice: 1 });
  assert.equal(pickListing([l("123 Main St")], "123 Main Street, Las Vegas NV").address.line1, "123 Main St");
  assert.equal(pickListing([l("1230 Main St")], "123 Main St"), null);
  assert.equal(pickListing([l("123 Main St"), l("123 Main St")], "123 Main St"), null); // ambiguous (e.g. units)
  assert.equal(pickListing([l("123 Oak Ave")], "123 Main St"), null);
  assert.equal(pickListing([], "123 Main St"), null);
  assert.equal(pickListing([l("123 Main St")], ""), null);
});

test("validator: new optional fields are range-checked", () => {
  assert.ok(validateBuyerForm({ ...good, inspection_days: "0" }, NOW).errors.inspection_days);
  assert.ok(validateBuyerForm({ ...good, loan_days: "61" }, NOW).errors.loan_days);
  assert.ok(validateBuyerForm({ ...good, appraisal_days: "ten" }, NOW).errors.appraisal_days);
  assert.ok(validateBuyerForm({ ...good, seller_credit: "999999" }, NOW).errors.seller_credit);
  const ok = validateBuyerForm({ ...good, inspection_days: "10", seller_credit: "5,000", agent_name: "Pat", mls_number: "1" }, NOW);
  assert.equal(ok.ok, true);
  assert.equal(ok.inputs.inspectionDays, 10);
  assert.equal(ok.inputs.sellerCredit, 5000);
  assert.equal(joinNames(["A", "B", "C"]), "A, B, and C");
});


// --- your real sentence: 123 Main, FHA 3.5% down, credit, warranty, inclusions ---
const MEGAN = {
  buyerNames: ["Megan Smith"],
  address: "123 main st, henderson, nv 89014",
  offerPrice: 450000,
  listPrice: 425000, // supplied by the agent
  financing: "fha",
  downPaymentPercent: 3.5,
  sellerCredit: 10000,
  homeWarranty: "seller",
  inclusions: ["refrigerator", "washer", "dryer", "window coverings"],
  closeDate: "2026-12-15",
};

test("the 123 Main sentence resolves with every term as a real field", () => {
  const r = resolveTerms(MEGAN, { speakerName: "Mike Roland", today: "2026-11-19" });
  assert.deepEqual(r.missing, []);
  assert.equal(r.errors, null);
  const i = r.inputs;
  assert.equal(i.downPaymentPercent, 3.5);
  assert.equal(i.homeWarranty, "seller");
  assert.deepEqual(i.inclusions, ["refrigerator", "washer", "dryer", "window coverings"]);
  assert.equal(i.sellerCredit, 10000);
  assert.equal(i.closeDate, "2026-12-15");
  assert.equal(i.earnestMoney, 4500); // default 1%
  assert.deepEqual(r.defaulted, ["Earnest money", "Contingencies"]);
  assert.equal("notes" in i, false); // nothing is left stuck in free text
  const sheet = sheetText(i, r.defaulted);
  assert.match(sheet, /Purchase price:\s+\$450,000\s+\(list \$425,000, 105\.9%\)/);
  assert.match(sheet, /Financing:\s+FHA/);
  assert.match(sheet, /Down payment:\s+3\.5% \(\$15,750\)/);
  assert.match(sheet, /Seller credit:\s+\$10,000/);
  assert.match(sheet, /Home warranty:\s+Seller-paid/);
  assert.match(sheet, /Included:\s+Refrigerator, Washer, Dryer, Window coverings/);
  const mail = coverEmail(i).body;
  assert.match(mail, /Financing: FHA, 3\.5% down/);
  assert.match(mail, /Home warranty: Seller-paid/);
  assert.match(mail, /Included in the sale: refrigerator, washer, dryer, window coverings/);
});

test("FHA below 3.5% down is refused: 3% was the typo that started this", () => {
  const r = resolveTerms({ ...MEGAN, downPaymentPercent: 3 }, { speakerName: "Mike Roland", today: "2026-11-19" });
  assert.equal(r.inputs, null);
  assert.match(r.errors.down_payment_percent, /FHA requires at least 3\.5% down/);
});

test("down payment rules: never defaulted, asked for when financed, rejected for cash, zero-down VA allowed", () => {
  const c = { speakerName: "Mike Roland", today: "2026-11-19" };
  const noDown = { ...MEGAN };
  delete noDown.downPaymentPercent;
  assert.deepEqual(resolveTerms(noDown, c).missing, ["the down payment (percent)"]);
  assert.deepEqual(resolveTerms({ ...noDown, financing: "cash" }, c).missing, []); // cash: nothing to ask
  assert.ok(resolveTerms({ ...MEGAN, financing: "cash" }, c).errors.down_payment_percent); // cash + 3.5% down: contradiction
  assert.equal(resolveTerms({ ...MEGAN, financing: "va", downPaymentPercent: 0 }, c).inputs.downPaymentPercent, 0);
  assert.ok(validateBuyerForm({ ...good, down_payment_percent: "101" }, NOW).errors.down_payment_percent);
  assert.ok(validateBuyerForm({ ...good, down_payment_percent: "ten" }, NOW).errors.down_payment_percent);
});

test("warranty and inclusions are validated", () => {
  assert.ok(validateBuyerForm({ ...good, home_warranty: "title company" }, NOW).errors.home_warranty);
  assert.ok(validateBuyerForm({ ...good, inclusions: Array(21).fill("x") }, NOW).errors.inclusions);
  assert.ok(validateBuyerForm({ ...good, inclusions: ["y".repeat(61)] }, NOW).errors.inclusions);
  const ok = validateBuyerForm({ ...good, home_warranty: "buyer", inclusions: [" pool equipment ", ""] }, NOW);
  assert.equal(ok.inputs.homeWarranty, "buyer");
  assert.deepEqual(ok.inputs.inclusions, ["pool equipment"]);
});

test("sanitizeExtraction handles the new fields without trusting them", () => {
  const e = sanitizeExtraction({
    downPaymentPercent: 3.5,
    homeWarranty: "seller",
    inclusions: [" Refrigerator ", "refrigerator ", "", 7, "washer"],
  }).terms;
  assert.equal(e.downPaymentPercent, 3.5);
  assert.equal(e.homeWarranty, "seller");
  assert.deepEqual(e.inclusions, ["Refrigerator", "refrigerator", "washer"]); // exact duplicates only collapse
  assert.deepEqual(sanitizeExtraction({ downPaymentPercent: 150, homeWarranty: "title", inclusions: [] }).terms, {});
  assert.deepEqual(sanitizeExtraction({ downPaymentPercent: -1 }).terms, {});
  assert.equal(sanitizeExtraction({ downPaymentPercent: 0 }).terms.downPaymentPercent, 0);
  assert.equal(sanitizeExtraction({ inclusions: Array.from({ length: 30 }, (_, k) => `item ${k}`) }).terms.inclusions.length, 20);
});

test("RPA helpers: dollars in words and address parsing", () => {
  assert.equal(dollarsInWords(400000), "Four Hundred Thousand and 00/100");
  assert.equal(dollarsInWords(1250500.5), "One Million Two Hundred Fifty Thousand Five Hundred and 50/100");
  assert.equal(dollarsInWords(21), "Twenty-One and 00/100");
  assert.deepEqual(parseAddress("272 Helmsdale Dr., Henderson, NV 89014"), { city: "Henderson", zip: "89014", county: "Clark" });
  assert.deepEqual(parseAddress("12 Pine St, Pahrump, NV 89048"), { city: "Pahrump", zip: "89048", county: "" });
  assert.deepEqual(parseAddress("123 Main St"), { city: "", zip: "", county: "" });
});

test("RPA draft links are signed, expiring and tamper-proof", () => {
  process.env.SLACK_SIGNING_SECRET = "test-secret";
  const id = "a".repeat(32);
  const url = new URL(draftLink(id, "https://home.example.com", 1_800_000_000_000));
  const exp = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");
  assert.ok(url.pathname.endsWith(`/api/offers/rpa/${id}`));
  assert.ok(verifyDraftLink(id, exp, sig, 1_800_000_000_000));
  assert.ok(!verifyDraftLink("b".repeat(32), exp, sig, 1_800_000_000_000)); // other id
  assert.ok(!verifyDraftLink(id, String(Number(exp) + 1), sig, 1_800_000_000_000)); // extended expiry
  assert.ok(!verifyDraftLink(id, exp, "0".repeat(64), 1_800_000_000_000)); // forged signature
  assert.ok(!verifyDraftLink(id, exp, sig, (Number(exp) + 1) * 1000)); // expired
  assert.ok(!verifyDraftLink(id, null, null));
  delete process.env.SLACK_SIGNING_SECRET;
  assert.equal(draftLink(id, "https://home.example.com"), null); // no secret, no link
});

console.log(`offers selftest: ${passed} passed${process.exitCode ? " (with failures)" : ""}`);
