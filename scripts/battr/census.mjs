#!/usr/bin/env node
/**
 * Stage and timeframe census of the Follow Up Boss database.
 *
 *   FUB_API_KEY=... node scripts/battr/census.mjs
 *
 * Answers one question Battr could never answer: how many leads fall through
 * the audit entirely?
 *
 * Battr's four nurture lists select leads BY timeframe (0-3 months, 3-6, 6-12,
 * 12+). A lead sitting in Nurture with that field blank matched none of them,
 * so it was never in the audit list, never reported on, and never counted —
 * invisible rather than compliant. Battr's daily emails only ever reported what
 * was inside the list, so there is no history of the gap. This measures it
 * directly instead.
 *
 * Also reports how each of the seven lists would be populated, which is the
 * sanity check to run before going live: if the timeframe field name is wrong,
 * the four nurture lists come back near-empty and 1145 comes back enormous.
 *
 * PRIVACY: counts only. No names, emails, phones or addresses are printed —
 * this output goes into a CI log.
 */
import { FubClient } from "./fub.mjs";
import { normalizeContact } from "./contact.mjs";
import { lists, STAGES } from "./lists.mjs";
import { evaluateSet } from "./filters.mjs";
import { lower } from "./classify.mjs";
import { isSourceAudited } from "./sources.mjs";

const NURTURE = new Set(STAGES.nurture.map(lower));

const pct = (n, total) => (total ? `${((n / total) * 100).toFixed(1)}%` : "—");
const bar = (n, max, width = 28) => "█".repeat(Math.max(n > 0 ? 1 : 0, Math.round((n / (max || 1)) * width)));

function tally(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/** Sorted [key, count] pairs, biggest first. */
const ranked = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);

async function main() {
  const fub = new FubClient(process.env.FUB_API_KEY, { dry: true });

  console.error("Reading the database (this takes a few minutes)...");
  const people = await fub.people({});
  const contacts = people.map((p) => normalizeContact(p, { lastOutbound: 0, lastInbound: 0 }));
  const total = contacts.length;

  console.log(`\n${total.toLocaleString()} contacts read.\n`);

  // ------------------------------------------------------------- by stage
  const byStage = new Map();
  for (const c of contacts) tally(byStage, c.stage_name || "(no stage)");

  console.log("BY STAGE");
  console.log("-".repeat(72));
  const stageRows = ranked(byStage);
  const stageMax = stageRows[0]?.[1] ?? 0;
  for (const [stage, n] of stageRows) {
    console.log(`${String(stage).padEnd(26)} ${String(n).padStart(7)}  ${pct(n, total).padStart(6)}  ${bar(n, stageMax)}`);
  }

  // -------------------------------------------------- nurture by timeframe
  const nurture = contacts.filter((c) => NURTURE.has(lower(c.stage_name)));
  const byTimeframe = new Map();
  for (const c of nurture) tally(byTimeframe, c.custom_fields.fub.system_timeframe || "(blank)");

  console.log(`\n\nNURTURE STAGES, BY TIMEFRAME — ${nurture.length.toLocaleString()} contacts`);
  console.log("-".repeat(72));
  const tfRows = ranked(byTimeframe);
  const tfMax = tfRows[0]?.[1] ?? 0;
  for (const [tf, n] of tfRows) {
    console.log(`${String(tf).padEnd(26)} ${String(n).padStart(7)}  ${pct(n, nurture.length).padStart(6)}  ${bar(n, tfMax)}`);
  }

  const blank = byTimeframe.get("(blank)") ?? 0;
  console.log("");
  if (blank) {
    console.log(
      `*** ${blank.toLocaleString()} nurture contacts (${pct(blank, nurture.length)}) have NO timeframe.\n` +
        `    Under Battr these matched none of the four nurture lists and were never audited at all.\n` +
        `    They now land in list 1145, which warns at 30 days and never sweeps.`
    );
  } else {
    console.log("Every nurture contact has a timeframe. Nothing is falling through.");
  }

  // ------------------------------------------------ TIMEFRAME FORENSICS
  //
  // Follow Up Boss's People screen reports 514 contacts with a non-empty
  // Timeframe. Battr's four nurture lists claim 1,262 between them, and those
  // lists are a SUBSET of "has a timeframe" — they also require a nurture stage
  // and no pond. A subset cannot be larger than the set it comes from, so one of
  // the two numbers is measuring something else.
  //
  // Three explanations are testable from here, and this section distinguishes
  // them:
  //
  //   A. TWO FIELDS. FUB carries a built-in timeframe and a custom one; the
  //      People column shows one and Battr mirrors the other. Then the raw key
  //      list below shows more than one populated candidate.
  //   B. IDS, NOT NAMES. The field holds numeric ids, our name matching finds
  //      nobody, and Battr resolves them through a lookup. Then the distinct
  //      values below are numbers.
  //   C. THE UI COUNT IS NARROWER. The People screen filter was scoped — a
  //      saved view, an owner, trash excluded. Then our whole-database count
  //      lands near 1,262 and the 514 is the odd one out.
  //
  // Everything printed is a count or a field name. Timeframe values themselves
  // ("0-3 months", or an id) identify nobody.
  console.log("\n\nTIMEFRAME FORENSICS — why 514 on the People screen vs 1,262 in Battr's lists");
  console.log("=".repeat(72));

  const TF_KEY = /timeframe|time_frame|timeline|buying.?time|when.*(buy|move)/i;
  const rawKeys = new Set();
  for (const person of people) for (const k of Object.keys(person)) rawKeys.add(k);
  const candidates = [...rawKeys].filter((k) => TF_KEY.test(k)).sort();

  console.log("\nA. CANDIDATE FIELDS ON THE PERSON PAYLOAD");
  console.log("-".repeat(72));
  if (!candidates.length) {
    console.log("*** none. FUB returns no timeframe-like key at all, which would explain");
    console.log("    the nurture lists matching nobody — but not Battr's 1,262.");
  }
  for (const key of candidates) {
    const filled = people.filter((p) => p[key] !== null && p[key] !== undefined && p[key] !== "");
    const sample = filled[0]?.[key];
    console.log(
      `${key.padEnd(24)} populated on ${String(filled.length).padStart(6)} / ${people.length}   ` +
        `type=${typeof sample}   e.g. ${JSON.stringify(sample)}`
    );
  }
  if (candidates.length > 1) {
    console.log("\n>>> MORE THAN ONE candidate. Explanation A is live: confirm which one the");
    console.log("    People screen column is bound to before trusting either count.");
  }

  console.log("\n\nB. DISTINCT VALUES OF THE FIELD WE READ (are these names or ids?)");
  console.log("-".repeat(72));
  const rawValues = new Map();
  for (const c of contacts) {
    const v = c.custom_fields.fub.system_timeframe;
    if (v === null || v === undefined || v === "") continue;
    tally(rawValues, `${JSON.stringify(v)}  [${typeof v}]`);
  }
  if (!rawValues.size) {
    console.log("*** NO contact carries a readable timeframe. Our four nurture lists match");
    console.log("    nobody, which is a silent failure, not an empty database.");
  }
  for (const [value, n] of ranked(rawValues).slice(0, 30)) {
    console.log(`${String(n).padStart(7)}  ${value}`);
  }
  const numericLooking = [...rawValues.keys()].filter((k) => /^"?\d+"?\s/.test(k)).length;
  if (numericLooking && numericLooking === rawValues.size) {
    console.log("\n>>> Every value is NUMERIC. Explanation B: these are ids and our name");
    console.log("    matching cannot fire. The id -> name map is what is missing.");
  }

  console.log("\n\nC. THE FUNNEL — where 'has a timeframe' narrows to the nurture lists");
  console.log("-".repeat(72));
  const hasTf = contacts.filter((c) => {
    const v = c.custom_fields.fub.system_timeframe;
    return v !== null && v !== undefined && v !== "";
  });
  const tfNurture = hasTf.filter((c) => NURTURE.has(lower(c.stage_name)));
  const tfNurtureNoPond = tfNurture.filter((c) => !c.crm_pond_id);

  const row = (label, n) => console.log(`${label.padEnd(48)} ${String(n).padStart(7)}`);
  row("contacts in the database", contacts.length);
  row("…with any timeframe value", hasTf.length);
  row("…and in a Nurture / Spoke with Customer stage", tfNurture.length);
  row("…and not already in a pond", tfNurtureNoPond.length);
  console.log("-".repeat(72));
  row("Battr's four nurture lists, summed", 1262);
  row("FUB People screen, 'Timeframe is not empty'", 514);

  console.log("\nRead it like this:");
  console.log("  last funnel row ≈ 1,262  -> Battr is right and the 514 was a scoped view (C).");
  console.log("  last funnel row ≈   514  -> the People screen is right and Battr counts something wider.");
  console.log("  last funnel row ≈     0  -> we cannot read the field at all; neither number is ours yet.");

  // ------------------------------------------------- membership per list
  console.log("\n\nWHO LANDS IN EACH LIST (membership only — no day counts applied)");
  console.log("-".repeat(72));
  const memberIds = new Set([1104, 1106, 1107, 1108, 1109, 1144, 1145]);
  for (const list of lists) {
    if (!memberIds.has(list.id)) continue;
    const n = contacts.filter((c) => evaluateSet(list.list_filters, c)).length;
    const sweeps = (list.neglected_filters?.groups ?? []).length ? "sweeps" : "warn only";
    console.log(`${String(list.id).padEnd(6)} ${list.name.padEnd(30)} ${String(n).padStart(7)}   ${sweeps}`);
  }

  const inAnyList = contacts.filter((c) =>
    lists.some((l) => memberIds.has(l.id) && evaluateSet(l.list_filters, c))
  ).length;
  console.log("-".repeat(72));
  console.log(`${"".padEnd(6)} ${"in at least one list".padEnd(30)} ${String(inAnyList).padStart(7)}   ${pct(inAnyList, total)} of the database`);

  // ---------------------------------------------------- why the rest are out
  const outside = contacts.filter((c) => !lists.some((l) => memberIds.has(l.id) && evaluateSet(l.list_filters, c)));
  const reasons = new Map();
  for (const c of outside) {
    if (c.crm_pond_id) tally(reasons, "already in a pond");
    else if (!isSourceAudited(c.source_normalized)) tally(reasons, "protected lead source");
    else if (NURTURE.has(lower(c.stage_name))) tally(reasons, "nurture stage, unmatched timeframe value");
    else tally(reasons, `stage not audited: ${c.stage_name || "(no stage)"}`);
  }

  console.log(`\n\nWHY THE OTHER ${outside.length.toLocaleString()} ARE OUTSIDE THE AUDIT`);
  console.log("-".repeat(72));
  for (const [reason, n] of ranked(reasons)) {
    console.log(`${reason.padEnd(46)} ${String(n).padStart(7)}  ${pct(n, outside.length).padStart(6)}`);
  }

  console.log(
    "\nMost of that is correct and intended — closed business, protected sources, leads\n" +
      "already sitting in a pond. The line to look at is the nurture one: those are leads\n" +
      "nobody can hold to a cadence until the field is filled in.\n"
  );

  // -------------------------------------------------------------- canary
  const nurtureWithTimeframe = nurture.length - blank;
  if (nurture.length > 50 && nurtureWithTimeframe / nurture.length < 0.1) {
    console.log(
      "*** WARNING: almost no nurture contact has a readable timeframe. That is more likely\n" +
        "    a wrong field name than a data problem. Run the inspect-fub-fields task before\n" +
        "    trusting any of the numbers above.\n"
    );
  }
}

main().catch((err) => {
  console.error(`Census failed: ${err.message}`);
  process.exit(1);
});
