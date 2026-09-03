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
