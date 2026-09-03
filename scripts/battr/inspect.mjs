#!/usr/bin/env node
/**
 * Report what a Follow Up Boss person record actually contains.
 *
 *   FUB_API_KEY=... node scripts/battr/inspect.mjs
 *
 * Several rules depend on fields whose real names were never confirmed —
 * timeframe, last communication, owner group ids, stage id. Each wrong guess
 * fails the same quiet way: the field reads as null, the condition still
 * evaluates, and the rule protects or flags nobody while looking healthy. We
 * have hit that three times already.
 *
 * This settles all of them at once by asking the API what it returns.
 *
 * PRIVACY: field NAMES are always printed; VALUES only for the non-identifying
 * fields on the allowlist below. Names, emails, phones and addresses are never
 * printed, because this output goes into a CI log.
 */
import { FubClient } from "./fub.mjs";
import { normalizeContact } from "./contact.mjs";

/** Non-identifying fields whose values are safe to show in a log. */
const SAFE_VALUES = new Set([
  "id",
  "created",
  "updated",
  "stage",
  "stageId",
  "source",
  "sourceId",
  "sourceUrl",
  "assignedTo",
  "assignedUserId",
  "assignedPondId",
  "assignedLenderId",
  "pondId",
  "timeframe",
  "timeframeId",
  "lastActivity",
  "lastCommunication",
  "lastCommunicationAt",
  "lastVisit",
  "tags",
  "groups",
  "groupIds",
  "assignedUserGroupIds",
  "contacted",
  "price",
  "claimed",
  "delayed",
]);

/** The mappings the rules depend on, and where each one lands if it is wrong. */
const CRITICAL = [
  ["timeframe", "four of the six audit lists branch on it — wrong means they return empty"],
  ["timeframeId", "the id form of the same field"],
  ["lastCommunication", "NOT used — it counts email and inbound; shown only to confirm we are right to ignore it"],
  ["stageId", "stage matching falls back to the stage name if absent"],
  ["assignedUserGroupIds", "the owner-group exclusion (52555) depends on it"],
  ["groupIds", "alternate spelling of the same"],
  ["assignedPondId", "leads already in a pond are skipped"],
];

const show = (v) => {
  if (v === null || v === undefined) return String(v);
  if (Array.isArray(v)) return `[${v.length}] ${JSON.stringify(v.slice(0, 6))}`;
  if (typeof v === "object") return `{${Object.keys(v).slice(0, 8).join(", ")}}`;
  return JSON.stringify(v);
};

async function main() {
  const fub = new FubClient(process.env.FUB_API_KEY, { dry: true });

  console.error("Fetching a sample of people...");
  const people = await fub.people({}, { max: 40 });
  if (!people.length) throw new Error("No people returned.");

  // Union across the sample: FUB omits keys that are null on a given record, so
  // one contact is not enough to tell whether a field exists at all.
  const keys = new Set();
  for (const p of people) for (const k of Object.keys(p)) keys.add(k);

  console.log(`\nSampled ${people.length} people. ${keys.size} distinct fields present.\n`);
  console.log("ALL FIELD NAMES");
  console.log("-".repeat(70));
  console.log([...keys].sort().join(", "));

  console.log("\n\nCRITICAL MAPPINGS — is the field there, and what does it look like?");
  console.log("-".repeat(70));
  for (const [field, why] of CRITICAL) {
    const present = people.filter((p) => p[field] !== undefined && p[field] !== null);
    const sample = present[0]?.[field];
    const verdict = present.length ? `PRESENT on ${present.length}/${people.length}` : "*** ABSENT ***";
    console.log(`${field.padEnd(24)} ${verdict}`);
    if (present.length) console.log(`${" ".repeat(24)} e.g. ${show(sample)}`);
    else console.log(`${" ".repeat(24)} ${why}`);
  }

  console.log("\n\nCUSTOM FIELDS ON THE PERSON (custom*)");
  console.log("-".repeat(70));
  const custom = [...keys].filter((k) => k.startsWith("custom")).sort();
  console.log(custom.length ? custom.join(", ") : "none");

  console.log("\n\nSAMPLE VALUES (non-identifying fields only)");
  console.log("-".repeat(70));
  for (const person of people.slice(0, 3)) {
    console.log(`\nperson ${person.id}`);
    for (const key of [...keys].sort()) {
      if (!SAFE_VALUES.has(key)) continue;
      if (person[key] === undefined) continue;
      console.log(`  ${key.padEnd(26)} ${show(person[key])}`);
    }
  }

  console.log("\n\nWHAT THE ENGINE MAKES OF THEM");
  console.log("-".repeat(70));
  for (const person of people.slice(0, 3)) {
    const c = normalizeContact(person, { lastOutbound: 0, lastInbound: 0 });
    console.log(
      `person ${String(c.id).padEnd(8)} stage=${JSON.stringify(c.stage_name)} exid=${c.crm_stage_exid} ` +
        `timeframe=${JSON.stringify(c.custom_fields.fub.system_timeframe)} ` +
        `lastComm=${JSON.stringify(c.custom_fields.fub.system_lastCommunication)} ` +
        `groups=${JSON.stringify(c.owner_group_ids)} pond=${c.crm_pond_id} bucket=${c.lead_bucket_id}`
    );
  }
  console.log("\nA null above is a rule that is silently doing nothing. That is what to fix.\n");

  // The reply reprieve depends on two things nobody has confirmed: that FUB
  // serves /v1/emails filtered to one person, and that the rows say which way
  // the email went. If either is wrong, no lead can ever be swept — loudly, by
  // design, but better to find out here than on the first live run.
  console.log("\nREPLY REPRIEVE — can we tell a reply from a blast?");
  console.log("-".repeat(70));
  try {
    const sample = await fub.emailsForPerson(people[0].id, new Date(Date.now() - 365 * 86400000).toISOString());
    console.log(`/emails?personId=… returned ${sample.length} rows for one person (bulk is refused; per-person is not).`);
    const keys = new Set();
    for (const row of sample) for (const k of Object.keys(row)) keys.add(k);
    console.log(`fields: ${[...keys].sort().join(", ") || "(no rows to inspect — try a person with email history)"}`);
    const directional = sample.filter((r) => r.isIncoming !== undefined || r.direction !== undefined).length;
    console.log(
      directional === sample.length && sample.length
        ? "direction: PRESENT on every row — the reprieve can tell a reply from a blast."
        : `direction: present on ${directional}/${sample.length} rows *** the rest count as neither ***`
    );
  } catch (err) {
    console.log(`*** /emails per-person FAILED: ${err.message}`);
    console.log("    Until this works the engine holds every sweep rather than sweeping blind.");
  }
  console.log("");

  // ------------------------------------------------------------- At Bats
  //
  // Battr's UI has no CSV export — searched and confirmed absent, not just not
  // found. So the At Bats history it holds is unrecoverable through Battr.
  //
  // But the history is not only in Battr. Every sweep it performed left a note
  // on the lead in Follow Up Boss, and those notes are ours. If /v1/notes can be
  // read in bulk, that trail can be replayed into the ledger.
  //
  // This probes whether that is possible before anyone writes a parser for it.
  //
  // PRIVACY: only note SUBJECTS are printed, and only those seen five or more
  // times. A subject repeated five times is a template, not a person.
  console.log("\nAT BATS RECONSTRUCTION — can we replay Battr's sweeps out of FUB's notes?");
  console.log("-".repeat(70));
  try {
    const notes = await fub.paginate("/notes", {}, { max: 500 });
    console.log(`/notes returned ${notes.length} rows (asked for up to 500). Bulk read: WORKS.`);

    const subjects = new Map();
    for (const note of notes) {
      const subject = String(note.subject ?? "(none)").slice(0, 80);
      subjects.set(subject, (subjects.get(subject) ?? 0) + 1);
    }
    const templates = [...subjects.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);

    console.log(`\n${templates.length} repeated subjects (5+ occurrences) — these are automation templates:`);
    for (const [subject, n] of templates.slice(0, 25)) {
      console.log(`  ${String(n).padStart(5)}  ${subject}`);
    }
    if (!templates.length) console.log("  none — every subject is unique, so no automation trail to mine.");

    const fields = new Set();
    for (const note of notes.slice(0, 50)) for (const k of Object.keys(note)) fields.add(k);
    console.log(`\nnote fields: ${[...fields].sort().join(", ")}`);
    console.log("\nIf a Battr sweep subject appears above, its history is recoverable and cancelling loses nothing.");
  } catch (err) {
    console.log(`/notes bulk read FAILED: ${err.message}`);
    console.log("Then Battr's At Bats history is not recoverable, and the ledger starts from today.");
    console.log("That costs scoreboard depth, nothing operational.");
  }
  console.log("");
}

main().catch((err) => {
  console.error(`Inspect failed: ${err.message}`);
  process.exit(1);
});
