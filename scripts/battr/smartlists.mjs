#!/usr/bin/env node
/**
 * Ask Follow Up Boss what its own smart lists contain.
 *
 *   FUB_API_KEY=... node scripts/battr/smartlists.mjs
 *
 * WHY THIS EXISTS
 *
 * Every list in this engine is a REIMPLEMENTATION. We read Battr's rule
 * screens, wrote the conditions out in `lists.mjs`, and have spent weeks
 * reconciling our count against Battr's. That was the only option while the
 * rules lived inside Battr.
 *
 * It is not the only option any more. The screenshots of 19 Sep show the six
 * audit lists sitting in Follow Up Boss itself, under the collection
 * "WIN THE DAY. (Battr)" — they are FUB smart lists, on Mike's own account,
 * readable over the same API we already use. FUB's answer for "who is in
 * Active Leads" is the answer, by definition: it is the list the agent opens
 * and works.
 *
 * So before refining another filter by hand, this settles three questions:
 *
 *   1. Does `GET /people?smartListId=N` actually filter? If FUB ignores the
 *      parameter every list returns the full database, and the whole idea is
 *      dead. That failure is silent and looks like success, so it is checked
 *      explicitly rather than assumed.
 *   2. What does FUB say each list's size is, against what we compute? Name by
 *      name, one row each.
 *   3. Which person field is the "Last Visit" column? Two of our lists filter
 *      on it, we cannot find it, and one of them has read 0 for a fortnight.
 *      Members of a list that REQUIRES a visit in the last 10 days all have
 *      one — so the right field is the one populated, and recent, on nearly
 *      every member. That is a sharp enough test to identify it without a
 *      guess.
 *
 * PRIVACY: this prints list names, field names, counts and dates. It never
 * prints a person's name, email, phone or address — the output goes to a CI
 * log. List names are Mike's own configuration, not client data.
 *
 * READ-ONLY. The client is constructed in dry mode and this script calls no
 * write method.
 */
import { pathToFileURL } from "node:url";
import { FubClient } from "./fub.mjs";
import { lists } from "./lists.mjs";
import { rules } from "./rules.mjs";

/** "❗Active Leads" and "Active Leads" are the same list wearing two skins. */
export const normalize = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const DAY = 86400000;

/**
 * Is this the pond-side half of a pair?
 *
 * FUB's convention is a " - Ponds" suffix: "Active Leads" is the agent's queue,
 * "Active Leads - Ponds" is the same conditions over leads sitting in a pond.
 * The distinction decides which number our engine is measured against, so it is
 * a named, tested function rather than an inline regex — misreading one half as
 * the other makes a correct filter look 45% short.
 */
export const isPondSide = (name) => /-\s*ponds?\s*$/i.test(String(name ?? ""));

/** The shared identity of a pair: "Active Leads - Ponds" -> "activeleads". */
export const baseName = (name) => normalize(name).replace(/ponds?$/, "");

/** Parse anything date-shaped; reject the numbers that merely look like one. */
function asDate(value) {
  if (typeof value !== "string" || value.length < 8) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

async function main() {
  const fub = new FubClient(process.env.FUB_API_KEY, { dry: true });
  const now = Date.now();

  // ---------------------------------------------------------------- the lists
  console.log("SMART LISTS FOLLOW UP BOSS REPORTS");
  console.log("-".repeat(78));
  const smartLists = await fub.smartLists();
  console.log(`${smartLists.length} smart lists.\n`);

  const shape = new Set();
  for (const sl of smartLists) for (const k of Object.keys(sl)) shape.add(k);
  console.log(`fields on a smart list: ${[...shape].sort().join(", ")}\n`);

  // If FUB hands back the filter definition, we can stop transcribing rule
  // screens from screenshots and read the rules themselves. Worth knowing.
  const filterish = [...shape].filter((k) => /filter|criteria|condition|query|rule/i.test(k));
  console.log(
    filterish.length
      ? `>>> FUB EXPOSES THE FILTERS: ${filterish.join(", ")} — the rules can be read, not transcribed.\n`
      : ">>> No filter definition on the list object. Rules still have to come from the screen.\n"
  );

  // ------------------------------------------------------- does the filter work
  //
  // One call per list: limit=1, and read the total out of _metadata. Cheap
  // enough to run across every list, exact rather than capped.
  const totalEverything = await fub.countPeople({});
  console.log(`whole database (no smartListId): ${totalEverything}\n`);

  console.log("LIST SIZES — FUB's own count");
  console.log("-".repeat(78));
  console.log(`${"id".padStart(8)}  ${"name".padEnd(40)} ${"FUB".padStart(7)}  ${"ours".padStart(7)}  drift`);

  const ourByName = new Map(lists.map((l) => [normalize(l.name), l]));
  const sized = [];
  let ignoredParam = 0;

  for (const sl of smartLists) {
    let count;
    try {
      count = await fub.countPeople({ smartListId: sl.id });
    } catch (err) {
      console.log(`${String(sl.id).padStart(8)}  ${String(sl.name).slice(0, 40).padEnd(40)}  FAILED: ${err.message.slice(0, 60)}`);
      continue;
    }
    if (count === totalEverything) ignoredParam++;
    sized.push({ id: sl.id, name: sl.name, count });

    const ours = ourByName.get(normalize(sl.name));
    const oursNote = ours?.observed?.total;
    console.log(
      `${String(sl.id).padStart(8)}  ${String(sl.name).slice(0, 40).padEnd(40)} ${String(count).padStart(7)}  ` +
        `${(oursNote === undefined ? "—" : String(oursNote)).padStart(7)}  ${ours ? "modelled" : ""}`
    );
  }

  // The silent failure this whole script exists to rule out.
  if (sized.length && ignoredParam === sized.length) {
    console.log("\n*** EVERY list returned the full database. FUB is IGNORING smartListId.");
    console.log("    Do not read these counts as list sizes. The reimplementation stays.");
  } else if (ignoredParam) {
    console.log(`\n    ${ignoredParam} list(s) returned the full database — check those individually.`);
  } else {
    console.log("\n>>> smartListId FILTERS. FUB will tell us each list's membership directly,");
    console.log("    which means the lists can be READ rather than reimplemented.");
  }

  // --------------------------------------------------------------- the ponds
  //
  // Where swept leads land. Their ids are what pond routing needs, and reading
  // them here settles it without the Battr assignment-rule screen: `sweepPond`
  // and `overflowPond` are configured by NAME, and a name that matches no pond
  // would route nowhere.
  console.log("\n\nPONDS — the sweep destinations");
  console.log("-".repeat(78));
  try {
    const ponds = await fub.ponds();
    console.log(`${"id".padStart(8)}  ${"name".padEnd(34)} ${"people".padStart(8)}   role`);
    for (const pond of ponds) {
      let size = "?";
      try {
        size = String(await fub.countPeople({ pondId: pond.id }));
      } catch {
        size = "—";
      }
      // Pond Assignments routes by lead age, so a pond's role is the age band
      // it takes, not a fixed "primary / overflow" pair.
      const rule = (rules.sweepPondRules ?? []).find((r) => normalize(r.pond) === normalize(pond.name));
      const role = rule
        ? rule.maxCreatedDaysAgo !== undefined
          ? `<- leads ${rule.maxCreatedDaysAgo}d old or newer`
          : `<- leads older than ${rule.minCreatedDaysAgo - 1}d`
        : "";
      console.log(`${String(pond.id).padStart(8)}  ${String(pond.name).slice(0, 34).padEnd(34)} ${size.padStart(8)}   ${role}`);
    }
    const routed = [...(rules.sweepPondRules ?? []).map((r) => r.pond), rules.sweepPond];
    for (const name of new Set(routed)) {
      if (!ponds.some((p) => normalize(p.name) === normalize(name))) {
        console.log(`\n*** ${JSON.stringify(name)} is a routing target but matches NO pond. Those sweeps go nowhere.`);
      }
    }
  } catch (err) {
    console.log(`/ponds unreadable: ${err.message}`);
  }

  // ------------------------------------------------- Battr's own state, in FUB
  //
  // The "Battr Admin" collection holds Battr's verdicts as FUB lists: Battr At
  // Risk, Battr Neglected, Battr Recovered. This is the best ground truth the
  // project has had. Every reconciliation so far has compared our COUNT against
  // a count in a nightly email; these lists name the actual leads, so agreement
  // can be measured per lead — which leads we both flag, which we flag alone,
  // and which we miss. A count can match while the membership is wrong.
  //
  // "Recovered" is a state this engine does not model at all. We track
  // compliant / at_risk / neglected; Battr evidently also tracks the lead that
  // was flagged and then genuinely worked. That is the number a team lead wants
  // — the nudge landing is the point of the system — and we cannot report it.
  console.log("\n\nBATTR ADMIN — Battr's own verdicts, per lead");
  console.log("-".repeat(78));
  const stateLists = sized.filter((l) => /^battr\b/i.test(String(l.name).replace(/[^\w\s]/g, "").trim()));
  if (!stateLists.length) {
    console.log("No lists whose name begins \"Battr\". Check the names printed above.");
  } else {
    for (const l of stateLists) {
      console.log(`${String(l.id).padStart(8)}  ${String(l.name).slice(0, 34).padEnd(34)} ${String(l.count).padStart(8)}`);
    }
    console.log("\nThese are the acceptance test. Wire the engine to pull each list's member");
    console.log("ids and diff them against its own classification: agreement per lead, not a");
    console.log("count that happens to land in the same place.");
    if (!stateLists.some((l) => /recovered/i.test(l.name))) {
      console.log("\n(no \"Recovered\" list found — if it exists under another name, say so)");
    } else {
      console.log("\n*** \"Recovered\" is a state this engine does not have. A lead that was");
      console.log("    flagged and then worked is the outcome the whole system exists to");
      console.log("    produce, and our report cannot currently count it.");
    }
  }

  // ------------------------------------------------------------- the two halves
  //
  // Every intent list exists TWICE, and conflating them is how our numbers went
  // wrong. "Active Leads" (agent-assigned, Pond EXCLUDES a named set) is worked
  // by the agent who owns the lead. "Active Leads - Ponds" (Pond INCLUDES that
  // same set) is worked by whoever fishes the pond. Same conditions otherwise,
  // two different queues, two different people, two different collections —
  // "WIN THE DAY. (Battr)" and "Fish the Pond".
  //
  // Only the agent-side half can be swept: sweeping moves a lead INTO a pond,
  // so a lead already in one has nowhere to go and no owner to warn. That is
  // what `notInAPond` encodes in our list filters, and it is why our count
  // should be read against the agent-side number alone. Comparing against the
  // pair's sum would make the engine look 80% short and send someone
  // "correcting" a filter that was right.
  //
  // One caveat this probe is meant to expose: FUB excludes a NAMED SET of ponds,
  // not every pond. Our `notInAPond` excludes all of them. A lead sitting in a
  // pond outside that set belongs on the agent list and is missing from ours.
  console.log("\n\nTHE TWO HALVES — agent-side vs pond-side");
  console.log("-".repeat(78));
  const grouped = new Map();
  for (const l of sized) {
    const key = baseName(l.name);
    const half = isPondSide(l.name) ? "pond" : "agent";
    const entry = grouped.get(key) ?? { agent: null, pond: null };
    // Keep the first of each half; a third list sharing a base name is reported
    // rather than silently dropped.
    if (entry[half]) console.log(`  note: more than one ${half}-side list normalizes to "${key}"`);
    else entry[half] = l;
    grouped.set(key, entry);
  }

  const paired = [...grouped.values()].filter((g) => g.agent && g.pond);
  if (!paired.length) {
    console.log("No agent/pond pairs found by name. Check the naming above before relying on this.");
  } else {
    console.log(`${"list".padEnd(34)} ${"agent".padStart(7)} ${"pond".padStart(7)} ${"sum".padStart(7)}   ours compares to`);
    for (const { agent, pond } of paired) {
      console.log(
        `${String(agent.name).slice(0, 34).padEnd(34)} ${String(agent.count).padStart(7)} ` +
          `${String(pond.count).padStart(7)} ${String(agent.count + pond.count).padStart(7)}   ` +
          `${agent.count} (agent side only)`
      );
    }
    console.log("\nThe engine audits the agent side. The pond side is where swept leads LAND;");
    console.log("it is worked in FUB directly and must never be swept again.");
  }

  // ------------------------------------------------------ the Last Visit field
  //
  // Two lists filter on the People-screen column "Last Visit" and we have never
  // found its API name. `person.lastVisit` was the obvious guess and it comes
  // back empty, so ❗Active Leads has reported 0 against Battr's 131.
  //
  // The identification is structural, not a guess: a list whose membership
  // REQUIRES a visit inside 10 days contains only people who have one. So the
  // field is whichever one is populated, with a date inside that window, on
  // effectively every member. A field that is populated on half of them is not
  // it, and this prints enough to see the difference.
  console.log("\n\nWHICH FIELD IS \"LAST VISIT\"?");
  console.log("-".repeat(78));

  const visitList = sized.find((l) => /active\s*leads/i.test(l.name) && !/pond/i.test(l.name));
  if (!visitList) {
    console.log("No agent-side \"Active Leads\" list found. Names seen above; re-run naming one.");
  } else {
    console.log(`Sampling "${visitList.name}" (id ${visitList.id}) — every member visited within 10 days.\n`);
    const sample = await fub.people({ smartListId: visitList.id }, { max: 60 });
    console.log(`${sample.length} members sampled.\n`);

    const keys = new Set();
    for (const p of sample) for (const k of Object.keys(p)) keys.add(k);

    const scored = [];
    for (const key of keys) {
      let dated = 0;
      let within = 0;
      let newest = null;
      for (const p of sample) {
        const ms = asDate(p[key]);
        if (ms === null) continue;
        dated++;
        if (now - ms <= 10 * DAY) within++;
        if (newest === null || ms > newest) newest = ms;
      }
      if (dated) scored.push({ key, dated, within, newest });
    }

    scored.sort((a, b) => b.within - a.within || b.dated - a.dated);
    console.log(`${"field".padEnd(30)} ${"has a date".padStart(11)} ${"within 10d".padStart(11)}   newest`);
    for (const row of scored) {
      console.log(
        `${row.key.padEnd(30)} ${`${row.dated}/${sample.length}`.padStart(11)} ${`${row.within}/${sample.length}`.padStart(11)}   ` +
          `${new Date(row.newest).toISOString().slice(0, 10)}`
      );
    }

    const best = scored.filter((r) => sample.length && r.within >= sample.length * 0.9);
    console.log("");
    if (!best.length) {
      console.log("*** NO field is recent on 90%+ of members. The visit timestamp is not on the");
      console.log("    person record at all, and these two lists cannot be reimplemented — read");
      console.log("    them through smartListId instead.");
    } else {
      console.log(`>>> CANDIDATES: ${best.map((r) => r.key).join(", ")}`);
      console.log("    `created` and `updated` will also score high — ignore those two; the visit");
      console.log("    field is the remaining one. Map it in contact.mjs `last_website_visit`.");
    }
  }

  console.log("");
}

// Importing this module must not start a probe. The self-test imports the
// naming helpers above to check them against real list names, and a top-level
// main() would have that import demand an API key and exit the suite.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`Smart list probe failed: ${err.message}`);
    process.exit(1);
  });
}
