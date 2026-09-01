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
  ["lastCommunication", "the fallback that makes email-only outreach visible"],
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
}

main().catch((err) => {
  console.error(`Inspect failed: ${err.message}`);
  process.exit(1);
});
