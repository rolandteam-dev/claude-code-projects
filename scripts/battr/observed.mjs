/**
 * Every list Battr actually runs, as seen on the Aida Audits screen.
 *
 * Source: app.battr.ai/aida/audits?date=2026-09-02, scope "The Roland Team",
 * scheduled. The screen reported **15 audits**, and all 15 are now accounted
 * for. A list we know exists but cannot yet model is recorded here as a NAMED
 * GAP rather than left out: a gap you can see is a decision waiting, one you
 * can't is a surprise on go-live night.
 *
 * `status` is the honest state of each one:
 *
 *   "modeled"      we have a rule in lists.mjs and it is reconciled here
 *   "needs-rules"  we know it exists and what it counted, but not what it selects
 *   "unseen"       known to exist from the audit count, not yet captured
 *
 * Nothing in this file causes an action. It drives the reconciliation table in
 * the nightly report: our numbers against Battr's, side by side, so a rule that
 * is wrong shows up as a number that is wrong.
 */

export const OBSERVED_DATE = "2026-09-02";

/** The screen said 15 scheduled audits ran that day. All 15 are listed below. */
export const OBSERVED_AUDIT_COUNT = 15;

/**
 * THE RECONCILIATION NUMBER, and the reason the model can be trusted or not.
 *
 * The "View source counts (6)" dropdown on the Team Leads row, read 2 Sep 2026:
 *
 *   Warm Back Up        10,783   89.4% of the pool
 *   Quarterly Nurture      537
 *   Monthly Nurture        355
 *   Bi-Weekly Nurture      226
 *   Weekly Nurture         144
 *   Hot Leads               19
 *   ─────────────────────────
 *   pooled              12,064
 *   audited                866   <- the combined list keeps 7.2%
 *
 * So Battr's combined list SHEDS 92.8% of its own members. Its audit emails
 * reported "Excluded due to lead bucket: 0" and "Excluded due to agent group:
 * 0", which cannot both be true of membership — those counters must report
 * records excluded at ACTION time, not at selection time. The exclusions are
 * doing enormous work.
 *
 * In our model the same reduction comes from `lead_bucket_id != 82` plus the
 * protected-source check, and Warm Back Up is where it has to happen: 10,783 of
 * the 12,064 sit there, and that list is early-pipeline leads older than ten
 * days — exactly where a bulk import lands.
 *
 * A dry run that pools ~12,000 and audits ~866 means the model is right.
 * One that audits ~12,000 means the exclusions are not firing.
 */
export const SOURCE_COUNTS = {
  date: "2026-09-02",
  pooled: 12064,
  audited: 866,
  byList: {
    1104: { name: "Warm Back Up", records: 10783 },
    1109: { name: "Quarterly Nurture", records: 537 },
    1108: { name: "Monthly Nurture", records: 355 },
    1107: { name: "Bi-Weekly Nurture", records: 226 },
    1106: { name: "Weekly Nurture", records: 144 },
    1144: { name: "Hot Leads", records: 19 },
  },
};

/**
 * A SECOND observation, six days after the first — from Battr's own audit
 * emails of Tue 8 Sep 2026, 7:08 PM.
 *
 *   Total records in audit          903    (866 on 2 Sep — the list grows ~6/day)
 *   At Risk records                  23
 *     already processed previously   10
 *     new notes created              13
 *   Neglected records processed      45
 *   Excluded due to lead bucket       0
 *   Excluded due to agent group       0
 *
 * Two things this pins down that a single observation could not.
 *
 * 1. THE EXCLUSION COUNTERS ARE ZERO AGAIN, on a day the combined list held 903
 *    of a 12,000-strong member pool. They cannot be reporting membership. They
 *    report records excluded at ACTION time, which is what the 2 Sep numbers
 *    already implied and this confirms.
 *
 * 2. SWEEP VOLUME IS WILDLY DAY-DEPENDENT. 45 neglected on Tuesday 8 Sep
 *    against 7 on Wednesday 2 Sep. That is the day filter at work: sweeps run
 *    Tue-Fri, so Tuesday clears three days of backlog while Wednesday clears
 *    one. Any cap has to survive a Tuesday, not an average day.
 *
 * The at-risk rows also confirm the interlock's mechanics directly: the 13 new
 * ones show `At Risk Since: None` and `Previous Status: compliant`, while the
 * 10 repeats show a date and "Action already taken in previous audit".
 *
 * Names and FUB ids from those emails are deliberately NOT recorded here. The
 * counts are what reconcile; the people are client PII.
 */
export const SEP_8 = {
  date: "2026-09-08",
  weekday: "Tuesday",
  total: 903,
  at_risk: 23,
  at_risk_new_notes: 13,
  at_risk_already_flagged: 10,
  neglected_processed: 45,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  /** Sources seen across the 23 at-risk rows — all already classified as audited. */
  sourcesSeen: [
    "Google PPC",
    "Zillow Preferred",
    "zbuyer.com",
    "Ylopo",
    "TheRolandTeam.com",
    "Citywide Long Form",
    "ISA Transfer",
    "CallAction > Riders",
    "YouTube",
  ],
};

/**
 * A THIRD observation, from the raw .eml of Thu 10 Sep 2026, 7:08–7:09 PM PT.
 * Both halves of the same night, with full headers and complete tables.
 *
 *   At Risk email                        Neglected email
 *   Total records in audit    862        Total records in audit    862
 *   At Risk records            20        Neglected records          4
 *     already processed         9        Records moved              4
 *     new notes created        11        Records not moved          0
 *   Excluded bucket/group     0/0        Excluded bucket/group    0/0
 *
 * THE POPULATION SELF-DRAINS, and the arithmetic closes:
 *
 *   903 (8 Sep)  −  45 swept  =  858  +  new arrivals  →  862 observed
 *
 * A swept lead lands in a pond, every member list requires `notInAPond`, so it
 * leaves the audit list the same night. The list is not a backlog that grows;
 * it is drained by its own sweeps. That is why 8 Sep could carry 45 neglected
 * and 10 Sep only 4 — Tuesday cleared the weekend, Thursday had two days of
 * accumulation to work with.
 *
 * THE INTERLOCK, OBSERVED ACROSS DAYS. Three of the four leads swept on
 * Thursday 10 Sep carry `At Risk Since 9/7` — flagged on Monday, taken on
 * Thursday. Monday is a nudge day and not a sweep day, Thursday is both. The
 * warn-first rule is not just configured, it is visible in the record.
 *
 * THE SWEEP TARGET, AND AN ASSUMPTION IT UNDERMINES. The neglected email
 * carries two columns the screenshots did not show: `Assignment Target Type`
 * and `Assignment Target Name`. All four read **Pond / Shark Tank**. Not one
 * went to Money Time.
 *
 * Our rules.mjs sends the first 25 of a run to Shark Tank and overflows the
 * rest to Money Time. `maxSweepsPerPond: 25` is OUR invention — it was inferred
 * from Money Time appearing in older audit mail, never read off Battr's rule
 * screen. If Battr sent all 45 of Tuesday's sweeps to Shark Tank, then on a
 * Tuesday our engine would route 20 leads to a pond Battr never sends them to.
 * The 8 Sep neglected email would settle it; until then this is a known,
 * unconfirmed departure and is recorded as one rather than left as a default
 * that looks deliberate.
 *
 * Names, FUB ids and the per-lead FUB links in these emails are deliberately
 * not recorded. The counts reconcile; the people are client PII.
 */
export const SEP_10 = {
  date: "2026-09-10",
  weekday: "Thursday",
  total: 862,
  at_risk: 20,
  at_risk_new_notes: 11,
  at_risk_already_flagged: 9,
  neglected: 4,
  records_moved: 4,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  /** Every swept lead this night. No Money Time. */
  assignmentTargets: { Pond: { "Shark Tank": 4 } },
  /** Sources seen across the 20 at-risk rows. "Redfin", "Company Websites" and "Company" are new. */
  sourcesSeen: [
    "Redfin",
    "Citywide Long Form",
    "Ylopo",
    "Zillow Preferred",
    "TheRolandTeam.com",
    "Company Websites",
    "Company",
    "Google PPC",
  ],
};

/** The three observations in order, for anything that wants the trend. */
export const TIMELINE = [
  { date: "2026-09-02", weekday: "Wed", total: 866, at_risk: 17, neglected: 7 },
  { date: "2026-09-08", weekday: "Tue", total: 903, at_risk: 23, neglected: 45 },
  { date: "2026-09-10", weekday: "Thu", total: 862, at_risk: 20, neglected: 4 },
];

export const observedLists = [
  {
    name: "📊 Database Health Score",
    type: "combined",
    sources: 13,
    total: 20099,
    compliant: 1773,
    at_risk: 10577,
    neglected: 7749,
    status: "needs-rules",
    listId: null,
    note: "A combined list over 13 source lists. Cannot be modeled without knowing which 13. Reporting roll-up — it is not the sweep list.",
  },
  {
    name: "⭐️ Team Leads (Nudges & Sweeps)",
    type: "combined",
    sources: 6,
    total: 866,
    compliant: 842,
    at_risk: 17,
    neglected: 7,
    status: "modeled",
    listId: 9001,
    note: "THE sweep list, and the only one that acts. Its six members are CONFIRMED and are exactly the six we model. They pool 12,064 records; the combined list audits 866, shedding 92.8%. See SOURCE_COUNTS.",
  },
  {
    name: "🌤️ Warm Back Up",
    type: "contact",
    total: 10783,
    compliant: 108,
    at_risk: 10120,
    neglected: 555,
    status: "modeled",
    listId: 1104,
    note: "Member of Team Leads, and 89.4% of the pooled 12,064 — this is the list the exclusions have to cut down. The 94% at-risk / 5% neglected split is the warn-first interlock at work: a lead cannot be counted neglected until an earlier run stamped it.",
  },
  {
    name: "🗓️ CLEAN UP: Nurtures No Timeframe",
    type: "contact",
    total: 4200,
    compliant: 211,
    at_risk: 129,
    neglected: 3860,
    status: "modeled",
    listId: 1145,
    note: "Not a member of Team Leads — 4,200 records could not feed an 866-record list. Rule confirmed: at risk >15 days, neglected >30, and every action bucket empty. Monitoring only in Battr, monitoring only here.",
  },
  {
    name: "💛 Sphere & Past Clients",
    type: "contact",
    total: 3333,
    compliant: 356,
    at_risk: 2,
    neglected: 2975,
    status: "modeled",
    listId: 1146,
    note: "Reported, never swept — these sources are on our protected list and 89% neglected would be a catastrophe if it acted. The 0% at-risk band means a long threshold with a narrow gap.",
  },
  {
    name: "❗Active Leads",
    type: "contact",
    total: 135,
    compliant: 65,
    at_risk: 21,
    neglected: 49,
    status: "modeled",
    listId: 1105,
    note: "Feeds Database Health Score, not Team Leads. Reported, never swept.",
  },
  {
    name: "🎤 AI TEXT REPLIES",
    type: "contact",
    total: 9,
    compliant: 7,
    at_risk: 0,
    neglected: 2,
    status: "needs-rules",
    listId: null,
    note: "Nine records. Almost certainly leads an AI texter has replied to, but the selector is a guess and nine records is not worth guessing at.",
  },
  {
    name: "‼️ YLOPO IMPORTANT",
    type: "contact",
    total: 127,
    compliant: 74,
    at_risk: 7,
    neglected: 46,
    status: "modeled",
    listId: 1147,
    note: "Reported, never swept. Population modeled from the Ylopo sources; thresholds inferred from the 58/6/36 split.",
  },
  {
    name: "🏹 Zillow Important",
    type: "contact",
    total: 43,
    compliant: 14,
    at_risk: 5,
    neglected: 24,
    status: "modeled",
    listId: 1148,
    note: "Reported, never swept. Population modeled from the Zillow sources; thresholds inferred.",
  },
  // ─── The six rows below the fold, captured 3 Sep ──────────────────────────
  // Five are member lists audited in their own right; only one was new.
  { name: "🔥 Weekly Nurture", type: "contact", total: 144, status: "modeled", listId: 1106, note: "Member of Team Leads. Count from the source-counts dropdown." },
  { name: "😎 Bi-Weekly Nurture", type: "contact", total: 226, status: "modeled", listId: 1107, note: "Member of Team Leads." },
  { name: "🌱 Monthly Nurture", type: "contact", total: 355, status: "modeled", listId: 1108, note: "Member of Team Leads." },
  { name: "👀 Quarterly Nurture", type: "contact", total: 537, status: "modeled", listId: 1109, note: "Member of Team Leads." },
  { name: "🌶️ Hot Leads", type: "contact", total: 19, status: "modeled", listId: 1144, note: "Member of Team Leads. Nineteen records — the tightest list, and the one carrying the 2/4 day thresholds." },
  {
    name: "Current & Upcoming Clients",
    type: "contact",
    status: "modeled",
    listId: 1149,
    note: "The only genuinely new list on the screen. Not a member of Team Leads, so it cannot sweep. Modelled as the live-business stages, every one of which is already on protectedStages — so its leads are doubly protected. Record count and thresholds not yet captured.",
  },
];

/**
 * Lists known to exist but never captured. Now zero: all 15 scheduled audits
 * are accounted for. Two still need their RULES (status "needs-rules"), which
 * is a different thing from not knowing they exist.
 */
export const unseenCount = () => Math.max(0, OBSERVED_AUDIT_COUNT - observedLists.length);

export const observedFor = (listId) => observedLists.find((l) => l.listId === listId) ?? null;

export const needsRules = () => observedLists.filter((l) => l.status === "needs-rules");

/** Percentage split, for printing next to ours. */
export function split(row) {
  const pct = (n) => (row.total ? `${Math.round((n / row.total) * 100)}%` : "—");
  return { compliant: pct(row.compliant), at_risk: pct(row.at_risk), neglected: pct(row.neglected) };
}
