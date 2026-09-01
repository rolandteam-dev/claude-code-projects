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
 * ── Discovering sources ─────────────────────────────────────────────────────
 *   Actions tab → Battr audit → Run workflow → discover-lead-sources
 * Prints every distinct source with a lead count and its current bucket.
 */

/** Buckets. `excludeFromSweeps` is what takes a bucket's leads out of the audit. */
export const leadBuckets = [
  { id: 82, name: "Never swept", excludeFromSweeps: true },
  { id: 1, name: "Zillow", excludeFromSweeps: false },
  { id: 2, name: "Portals & aggregators", excludeFromSweeps: false },
  { id: 3, name: "Paid search & social", excludeFromSweeps: false },
  { id: 4, name: "Website & organic", excludeFromSweeps: false },
  { id: 5, name: "Seller & valuation", excludeFromSweeps: false },
  { id: 6, name: "Signs & mailers", excludeFromSweeps: false },
  { id: 7, name: "Team & internal", excludeFromSweeps: false },
];

/**
 * Source string → bucket id. Matching is case- and whitespace-insensitive.
 *
 * Anything NOT listed here is unmapped, and `unmappedPolicy` below decides what
 * that means. Five groups of sources are deliberately left unmapped pending a
 * decision: the Schneider family, self-sourced prospecting, offline/sign
 * capture, inbound phone, and a set of unidentified vendors.
 */
export const sourceBuckets = {
  // ── 82: never swept ───────────────────────────────────────────────────────
  // Relationship business and records nobody can work. Taking these from an
  // agent on a day counter is how a sweep system loses the room.
  SOI: 82,
  Import: 82,
  Imported: 82,
  Referral: 82,
  "Barrett Financial Referral": 82,
  Sphere: 82,
  "Past Client": 82,
  Recruiting: 82,
  Lender: 82,
  Commercial: 82,
  "<unspecified>": 82,
  // Open-house capture: protected per Mike, 2026-09-01. Whoever sat the open
  // house owns the relationship, whatever vendor recorded it — so the rule
  // applies across vendors, including the Ylopo and Schneider variants.
  "Open House": 82,
  "Open House Signs": 82,
  "Open House (Ylopo)": 82,

  // ── 1: Zillow family ──────────────────────────────────────────────────────
  Zillow: 1,
  "Zillow.com": 1,
  "Zillow Preferred": 1,
  "Zillow Home Loans": 1,
  "Zillow-Long Form": 1,
  Zillowpropertypreapproval: 1,
  "zbuyer.com": 1,
  zBuyer: 1,
  // Not currently present in the database, but named in the live 180-day Zillow
  // conversion KPI — mapped so they are classified the day they reappear rather
  // than silently landing unmapped.
  "Zillow Flex": 1,
  "Zillow Preferred (migration)": 1,
  Zillowlongform: 1,

  // ── 2: portals & aggregators ──────────────────────────────────────────────
  Ylopo: 2,
  "Ylopo Seller": 2,
  "Ylopo LSA": 2,
  "Ylopo Adwords": 2,
  "Realtor.com": 2,
  "Realtor.com Lf": 2,
  Redfin: 2,
  Trulia: 2,
  "Trulia.com": 2,
  "Homes.com": 2,
  Homesnap: 2,
  Hotpads: 2,
  Opcity: 2,
  OJO: 2,
  HomeLight: 2,
  Upnest: 2,
  Clever: 2,
  "Sold.com": 2,
  "Myagentfinder.com": 2,
  "Rocket Agents": 2,
  ReferralExchange: 2,
  "Citywide Long Form": 2,
  "Real Geeks": 2,
  "Lead Findr": 2,

  // ── 3: paid search & social ───────────────────────────────────────────────
  "Google PPC": 3,
  "Bing PPC": 3,
  PPC: 3,
  "Google Lsa": 3,
  "Leadpops - Google Ads": 3,
  "Leadpops - Rentvsbuy": 3,
  leadPops: 3,
  "Direct Connect PPC": 3,
  "Direct Connect FB": 3,
  Facebook: 3,
  "Facebook/Instagram": 3,
  "Facebook New Construction Buyer Rebate": 3,
  Instagram: 3,
  YouTube: 3,
  Yahoo: 3,
  Duckduckgo: 3,

  // ── 4: website & organic ──────────────────────────────────────────────────
  "TheRolandTeam.com": 4,
  "Company Websites": 4,
  "Branded Website": 4,
  Website: 4,
  "Direct Traffic": 4,
  "Google Organic": 4,
  "Luxury Website": 4, // this site's own lead intake

  // ── 5: seller & valuation ─────────────────────────────────────────────────
  "Fidelity - Seller Leads": 5,
  "Easy Street Offers": 5,
  Zoodealio: 5,
  "Zoodealio Seller Source": 5,
  "Guaranteed Sale": 5,
  "Noah Cash Offer": 5,
  Fello: 5,
  "Fello Connect": 5,
  "Fello CRM": 5,
  "Fello Widget": 5,
  "Fello Landing Page": 5,
  "Fhaloans.com": 5,
  "Usdaloans.com": 5,
  "Eligibility.org": 5,

  // ── 6: signs & mailers ────────────────────────────────────────────────────
  // Swept per Mike, 2026-09-01: team-generated offline demand, unlike open
  // houses where an agent was physically in the room.
  "Sign Calls/Mailers": 6,
  "Listing Sign Call": 6,
  "For Sale Signs": 6,
  Mailers: 6,
  Billboard: 6,
  "Foothill Yearbook/Banner": 6,
  "CallAction > Riders": 6,
  "CallAction > Mike Roland": 6,
  "CallAction > SlyDial": 6,
  "CallAction > Cash Offer Mailers": 6,

  // ── 7: team & internal ────────────────────────────────────────────────────
  // Moved out of "never swept" per Mike, 2026-09-01: these are team-owned leads
  // and should be worked like any other. Note that an exempt AGENT still keeps
  // their leads regardless of source — see rules.exemptAgents.
  "Jeffery Dragovich": 7,
  "Mike Roland Direct Lead": 7,
  "Chris Casiello": 7,
  "Kyle Nicholas McCray Referral": 7,
  "The Roland Team": 7,
  "Andrew the Home Buyer": 7,
  "Charles Power": 7,
  "Steve Hawks": 7,
  "Jeff Petrick": 7,
  "ISA Transfer": 7,
  Company: 7,
  "Office Walk In": 7,
  API: 7,
  Zapier: 7,
  "Website Registration": 7,
  "Fello File Import": 7,
};

/**
 * What happens to a source that isn't mapped above.
 *
 * "exclude" — an unclassified source is NOT audited. A new lead source starts
 * protected and has to be added here deliberately. This is the safe direction
 * for a system that takes leads away from people: the failure mode is a source
 * going unaudited until someone notices, not a source being swept before anyone
 * decided it should be.
 *
 * "include" is what the live Battr config does today. Switching to it would put
 * all 53 currently-undecided sources into scope immediately.
 */
export const unmappedPolicy = "exclude";

/**
 * Source-name prefixes that are protected outright, whatever follows.
 *
 * "Schneider" covers Bruce's own lead flow — protected per Mike, 2026-09-01.
 * A prefix rather than a list because that family keeps growing: Schneider
 * Ylopo, Schneider zBuyer, Schneider Google LSA and a dozen more, with new ones
 * appearing over time. Enumerating them would leave each new variant
 * unprotected until someone noticed.
 */
export const protectedSourcePrefixes = ["Schneider"];

const norm = (s) => String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const BUCKET_BY_SOURCE = new Map(Object.entries(sourceBuckets).map(([source, id]) => [norm(source), id]));
const BUCKET_BY_ID = new Map(leadBuckets.map((b) => [b.id, b]));

/** Does this source match one of the protected prefixes? */
export function hasProtectedPrefix(source) {
  const n = norm(source);
  return protectedSourcePrefixes.some((p) => n.startsWith(`${norm(p)} `) || n === norm(p));
}

/** Resolve a raw CRM source string to a bucket id, or null when unmapped. */
export function bucketForSource(source) {
  if (!source) return null;
  if (hasProtectedPrefix(source)) return 82;
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
  const audited = rows.filter(([s]) => isSourceAudited(s));
  const unmapped = rows.filter(([s]) => bucketForSource(s) === null);

  console.log(`\n${rows.length} distinct sources across ${people.length} contacts\n`);
  console.log("SOURCE".padEnd(42), "LEADS".padStart(7), "  BUCKET".padEnd(24), "AUDITED");
  console.log("-".repeat(88));
  for (const [source, count] of rows) {
    const id = bucketForSource(source);
    console.log(
      source.slice(0, 41).padEnd(42),
      String(count).padStart(7),
      `  ${(id === null ? "UNMAPPED" : bucketName(id)).padEnd(22)}`,
      isSourceAudited(source) ? "sweep" : "protected"
    );
  }

  const sum = (list) => list.reduce((n, [, c]) => n + c, 0);
  console.log(`\n${audited.length} sources in scope (${sum(audited)} leads), ${rows.length - audited.length} protected (${sum(rows) - sum(audited)} leads).`);
  console.log(`${unmapped.length} sources unmapped — with unmappedPolicy "${unmappedPolicy}" they are ${unmappedPolicy === "include" ? "INCLUDED in" : "EXCLUDED from"} the audit.\n`);

  if (unmapped.length) {
    console.log("Unmapped — paste into sourceBuckets with a bucket id (82 = never sweep):\n");
    for (const [source, count] of unmapped) console.log(`  ${JSON.stringify(source)}: 0, // ${count} leads`);
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
