#!/usr/bin/env node
/**
 * Self-test for the Seller Engine's pure logic (parsing, DNC reading, scoring).
 * No database or Follow Up Boss key needed.
 *
 *   npm run distress:test
 *
 * Every name, address, APN and phone below is MADE UP. This repo is public:
 * never paste a real export row into a fixture.
 */
import assert from "node:assert/strict";
import {
  normalizeApn,
  normalizePhone,
  normalizeAddress,
  normalizeDate,
  parseCsv,
  mapHeaders,
  mapRow,
  readDnc,
  parcelKey,
  isAbsentee,
  yearsSince,
} from "../../src/lib/distress/parse.ts";
import { scoreParcel, looksInstitutional, liveSignals, WEIGHTS, STACK_BONUS } from "../../src/lib/distress/score.ts";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL ${name}\n`, e);
    process.exitCode = 1;
  }
}

const NOW = new Date("2026-11-15T12:00:00Z");

/* --------------------------------------------------------------- normalize */
test("APN forms", () => {
  assert.equal(normalizeApn("123-45-678-901"), "12345678901");
  assert.equal(normalizeApn(12345678901), "12345678901");
  assert.equal(normalizeApn("12345678901.0"), "12345678901");
  assert.equal(normalizeApn("1.2345678901E10"), "12345678901");
  assert.equal(normalizeApn("2345678901"), "02345678901"); // dropped leading zero
  assert.equal(normalizeApn("123"), null);
  assert.equal(normalizeApn(""), null);
});

test("phones", () => {
  assert.equal(normalizePhone("(702) 555-0142"), "7025550142");
  assert.equal(normalizePhone("1-702-555-0142"), "7025550142");
  assert.equal(normalizePhone("555-0142"), null);
  assert.equal(normalizePhone("0125550142"), null); // area code can't start 0/1
  assert.equal(normalizePhone("7021550142"), null); // exchange can't start 0/1
});

test("addresses and dates", () => {
  assert.equal(normalizeAddress("123  Example Street"), normalizeAddress("123 EXAMPLE ST"));
  assert.equal(normalizeDate("3/4/2025"), "2025-03-04");
  assert.equal(normalizeDate("3/4/25"), "2025-03-04");
  assert.equal(normalizeDate("3/4/251"), undefined);
  assert.equal(normalizeDate("2025-03-04T00:00:00Z"), "2025-03-04");
  assert.equal(normalizeDate("nonsense"), undefined);
  assert.equal(yearsSince("2010-01-01", NOW), 16);
});

/* -------------------------------------------------------------------- CSV */
test("csv quoting, BOM, CRLF, blank rows", () => {
  const rows = parseCsv('﻿a,b,c\r\n"x, y","he said ""hi""",3\r\n\r\n,,\r\n4,5,6');
  assert.deepEqual(rows, [
    ["a", "b", "c"],
    ["x, y", 'he said "hi"', "3"],
    ["4", "5", "6"],
  ]);
});

/* -------------------------------------------------------------------- DNC */
test("DNC reading is cautious", () => {
  assert.equal(readDnc(["N"], true, "unknown"), "clear");
  assert.equal(readDnc(["Y"], true, "unknown"), "listed");
  assert.equal(readDnc(["N", "Y"], true, "unknown"), "listed"); // litigator wins
  assert.equal(readDnc([""], true, "unknown"), "unknown");
  assert.equal(readDnc([""], true, "clear"), "clear");
  assert.equal(readDnc(["", "N"], true, "unknown"), "unknown"); // blank own flag + clear litigator ≠ clear
  assert.equal(readDnc(["maybe"], true, "clear"), "unknown");
  assert.equal(readDnc([], false, "clear"), "unknown"); // no column = unscrubbed
});

const HEADERS = [
  "APN",
  "Property Address",
  "Property City",
  "Property Zip",
  "Owner 1 First Name",
  "Owner 1 Last Name",
  "Mailing Address",
  "Mailing Zip",
  "Last Sale Date",
  "Recording Date",
  "Phone 1",
  "Phone 1 DNC",
  "Phone 2",
  "Phone 2 DNC",
  "Litigator",
  "Some Vendor Column",
];

test("header mapping pairs phones with their DNC flags", () => {
  const m = mapHeaders(HEADERS);
  assert.equal(m.fields.apn, 0);
  assert.equal(m.fields.address, 1);
  assert.equal(m.phones.length, 2);
  assert.deepEqual(m.phones[0], { col: 10, dncCols: [11, 14] });
  assert.deepEqual(m.phones[1], { col: 12, dncCols: [13, 14] });
  assert.deepEqual(m.unmapped, ["Some Vendor Column"]);
});

test("row mapping", () => {
  const m = mapHeaders(HEADERS);
  const row = mapRow(
    [
      "999-99-999-001",
      "100 Sample Way",
      "Las Vegas",
      "89100-1234",
      "Pat",
      "Example",
      "PO Box 1",
      "90000",
      "1/2/2008",
      "10/1/2026",
      "702-555-0101",
      "N",
      "702-555-0102",
      "Y",
      "N",
      "ignored",
    ],
    m,
  );
  assert.equal(row.apn, "99999999001");
  assert.equal(row.zip, "89100");
  assert.equal(row.ownerName, "Pat Example");
  assert.equal(row.eventDate, "2026-10-01");
  assert.deepEqual(row.phones, [
    { phone: "7025550101", dnc: "clear" },
    { phone: "7025550102", dnc: "listed" },
  ]);
  assert.equal(isAbsentee(row), true);
  assert.equal(parcelKey(row), "99999999001");
});

test("same number twice keeps the most cautious status", () => {
  const m = mapHeaders(["Address", "Zip", "Phone 1", "Phone 1 DNC", "Phone 2", "Phone 2 DNC"]);
  const row = mapRow(["1 Test Rd", "89100", "7025550103", "N", "7025550103", "Y"], m);
  assert.deepEqual(row.phones, [{ phone: "7025550103", dnc: "listed" }]);
  assert.equal(parcelKey(row), `ADDR:${normalizeAddress("1 Test Rd")}|89100`);
});

test("no APN and no ZIP: no key", () => {
  assert.equal(parcelKey({ apn: null, address: "1 TEST RD", zip: "" }), null);
});

/* ---------------------------------------------------------------- scoring */
const sig = (type, eventDate, detail) => ({ type, source: "test", eventDate, detail });

test("single list", () => {
  const r = scoreParcel([sig("nod", "2026-10-01")], {}, NOW);
  assert.equal(r.score, WEIGHTS.nod);
  assert.deepEqual(r.lists, ["nod"]);
});

test("stacking, NOD + sale, absentee, long ownership", () => {
  const r = scoreParcel(
    [sig("nod", "2026-08-01"), sig("trustee_sale", "2026-11-01"), sig("tax_delinquent", "2026-06-01")],
    { absentee: true, yearsOwned: 18 },
    NOW,
  );
  const expected = WEIGHTS.nod + WEIGHTS.trustee_sale + WEIGHTS.tax_delinquent + 20 + STACK_BONUS * 2 + 10 + 10;
  assert.equal(r.score, expected);
  assert.ok(r.reasons.indexOf("On 3 distress lists") < r.reasons.indexOf("Absentee owner")); // biggest first
  assert.ok(r.reasons.includes("On 3 distress lists"));
});

test("stale signals age out", () => {
  assert.equal(liveSignals([sig("trustee_sale", "2026-01-01")], NOW).length, 0);
  assert.equal(scoreParcel([sig("fsbo", "2025-01-01")], {}, NOW).score, 0);
});

test("institutional owners excluded, trusts kept", () => {
  assert.equal(looksInstitutional("EXAMPLE BANK NA"), true);
  assert.equal(looksInstitutional("Federal National Mortgage Assn"), true);
  assert.equal(looksInstitutional("SAMPLE HOMEOWNERS ASSOCIATION"), true);
  assert.equal(looksInstitutional("EXAMPLE FAMILY TRUST"), false);
  assert.equal(looksInstitutional("SAMPLE HOLDINGS LLC"), false);
  const r = scoreParcel([sig("nod", "2026-10-01")], { institutional: true }, NOW);
  assert.equal(r.score, 0);
  assert.equal(r.excluded, "institutional owner");
});

test("several code violations", () => {
  const r = scoreParcel(
    [sig("code_violation", "2026-05-01", "WEEDS"), sig("code_violation", "2026-06-01", "TRASH")],
    {},
    NOW,
  );
  assert.equal(r.score, WEIGHTS.code_violation + 10);
});

console.log(`${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
