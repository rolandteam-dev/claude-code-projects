#!/usr/bin/env node
/**
 * Lead sources → lead buckets.
 *
 * A "lead bucket" is a Battr concept, not a Follow Up Boss one: an internal
 * grouping that many raw CRM source strings map onto, so a rule can say "not
 * bucket 82" instead of naming forty Zillow spellings. FUB has no such field, so
 * we resolve it ourselves from the contact's source string.
 *
 * This matters more than it looks. The combined sweep list carries
 * `lead_bucket_id != 82`, and until a source maps to a bucket that condition
 * excludes nothing at all.
 *
 * ── Discovering your real source list ───────────────────────────────────────
 *   FUB_API_KEY=... node scripts/battr/sources.mjs --discover
 *
 * Prints every distinct source in the database with a lead count and a
 * ready-to-paste mapping block. Beats hand-typing 175 source strings.
 */

/** Buckets. `excludeFromSweeps` is what takes a bucket's leads out of the audit. */
export const leadBuckets = [
  { id: 82, name: "Excluded from sweeps", excludeFromSweeps: true },
  { id: 1, name: "Zillow", excludeFromSweeps: false },
  { id: 2, name: "Portals & aggregators", excludeFromSweeps: false },
  { id: 3, name: "Paid search", excludeFromSweeps: false },
  { id: 4, name: "Website", excludeFromSweeps: false },
  { id: 5, name: "Referral", excludeFromSweeps: false },
  { id: 6, name: "Sphere & offline", excludeFromSweeps: false },
  { id: 7, name: "Internal / transfers", excludeFromSweeps: false },
];

/**
 * Source string → bucket id.
 *
 * Seeded from sources observed in the live audit history and from the Zillow
 * family enumerated in the 180-day conversion KPI. It is NOT the full list — the
 * database carries ~175 sources, most of them unmapped. Run --discover and fill
 * in the rest.
 *
 * Matching is case- and whitespace-insensitive.
 */
export const sourceBuckets = {
  // Zillow family, exactly as enumerated in the live KPI definition
  "Zillow": 1,
  "Zillow.com": 1,
  "Zillow Flex": 1,
  "Zillow Home Loans": 1,
  "Zillow Preferred": 1,
  "Zillow Preferred (migration)": 1,
  "Zillow-Long Form": 1,
  "Zillowlongform": 1,
  "Zillowpropertypreapproval": 1,
  "zbuyer.com": 1, // grouped with Zillow in the live KPI, kept consistent here

  "Ylopo": 2,
  "ReferralExchange": 2,
  "Citywide Long Form": 2,

  "Google PPC": 3,

  "TheRolandTeam.com": 4,
  "Luxury Website": 4, // the source this site's own lead intake posts

  "Sign Calls/Mailers": 6,

  "ISA Transfer": 7,
  "Company": 7,
};

/**
 * What happens to a source that isn't mapped.
 *
 * "include" matches the live behavior: an unmapped source has a null bucket, and
 * `lead_bucket_id != 82` is true for null, so those leads ARE swept. Worth
 * knowing — it means a brand-new lead source enrolls in sweeping the day it
 * appears, before anyone has decided it should.
 *
 * Set to "exclude" to make new sources opt-in instead.
 */
export const unmappedPolicy = "include";

const norm = (s) => String(s ?? "").trim().toLowerCase();

const BUCKET_BY_SOURCE = new Map(Object.entries(sourceBuckets).map(([source, id]) => [norm(source), id]));
const BUCKET_BY_ID = new Map(leadBuckets.map((b) => [b.id, b]));

/** Resolve a raw CRM source string to a bucket id, or null when unmapped. */
export function bucketForSource(source) {
  if (!source) return null;
  return BUCKET_BY_SOURCE.get(norm(source)) ?? null;
}

/**
 * Should this source be audited at all?
 *
 * Excluded when its bucket is flagged `excludeFromSweeps`, or when it is
 * unmapped and the policy says to exclude unmapped sources.
 */
export function isSourceAudited(source) {
  const bucketId = bucketForSource(source);
  if (bucketId === null) return unmappedPolicy === "include";
  return !BUCKET_BY_ID.get(bucketId)?.excludeFromSweeps;
}

export const bucketName = (id) => BUCKET_BY_ID.get(id)?.name ?? "Unmapped";

// ------------------------------------------------------------------ discovery

async function discover() {
  const { FubClient } = await import("./fub.mjs");
  const fub = new FubClient(process.env.FUB_API_KEY, { dry: true });

  console.error("Pulling contacts to tally lead sources...");
  const people = await fub.people({});

  const counts = new Map();
  for (const person of people) {
    const source = (person.source ?? person.sourceName ?? "").trim() || "(no source)";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const mapped = rows.filter(([s]) => bucketForSource(s) !== null);
  const unmapped = rows.filter(([s]) => bucketForSource(s) === null);

  console.log(`\n${rows.length} distinct sources across ${people.length} contacts\n`);
  console.log("SOURCE".padEnd(42), "LEADS".padStart(7), "  BUCKET");
  console.log("-".repeat(70));
  for (const [source, count] of rows) {
    const id = bucketForSource(source);
    console.log(source.slice(0, 41).padEnd(42), String(count).padStart(7), `  ${id === null ? "UNMAPPED" : bucketName(id)}`);
  }

  console.log(`\n${mapped.length} mapped, ${unmapped.length} unmapped.`);
  if (unmapped.length) {
    const affected = unmapped.reduce((n, [, c]) => n + c, 0);
    console.log(
      `${affected} contacts sit on unmapped sources — with unmappedPolicy "${unmappedPolicy}" they are ` +
        `${unmappedPolicy === "include" ? "INCLUDED in" : "EXCLUDED from"} the audit.\n`
    );
    console.log("Paste into sourceBuckets and set each bucket id (82 = never sweep):\n");
    for (const [source, count] of unmapped) {
      console.log(`  ${JSON.stringify(source)}: 0, // ${count} leads`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--discover")) {
    discover().catch((err) => {
      console.error(`Discovery failed: ${err.message}`);
      process.exit(1);
    });
  } else {
    console.error("Usage: FUB_API_KEY=... node scripts/battr/sources.mjs --discover");
    process.exit(1);
  }
}
