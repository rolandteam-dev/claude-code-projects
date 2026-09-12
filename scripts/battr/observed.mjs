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

/**
 * A FOURTH observation, from the raw .eml of Fri 11 Sep 2026, 7:08–7:09 PM PT.
 * Both halves again, and this is the night that pins down the tier spacing.
 *
 *   At Risk email                        Neglected email
 *   Total records in audit    861        Total records in audit    861
 *   At Risk records            24        Neglected records          3
 *     already processed        12        Records moved              3
 *     new notes created        12        Records not moved          0
 *   Excluded bucket/group     0/0        Excluded bucket/group    0/0
 *
 * THE THREE-DAY SPREAD, MEASURED. All three leads swept tonight carry
 * `At Risk Since 9/8/2026` — flagged Tuesday, swept Friday.
 *
 * What makes that a measurement rather than a coincidence is the two sweep days
 * in between. Wednesday 9/9 and Thursday 9/10 were both sweep days, both ran,
 * and both passed over these three leads. So the neglected threshold was not
 * reached on 9/9 or 9/10; it was reached on 9/11 — exactly three days after the
 * at-risk stamp. Five of the six member lists carry a +3 spread in our config
 * (10/13, 16/19, 33/36, 93/96) and only Hot Leads differs at +2, so whichever
 * of the five these were, +3 is what our thresholds predict. This is the first
 * direct measurement of the gap rather than an inference from a rule screen.
 *
 * AND THE CARRY-OVER AGREES. The 12 already-flagged at-risk leads are dated
 * only 9/9 (5) and 9/10 (7). Nothing older survives in the tier: every lead
 * flagged on 9/8 either got worked or left tonight as neglected. The at-risk
 * tier has a three-day lifespan, and the record shows it draining on schedule.
 *
 * WHICH FORECASTS A LARGE TUESDAY. Sweeps run Tue–Fri, so a lead flagged
 * Wednesday comes due Saturday and waits until Tuesday; Thursday comes due
 * Sunday and waits; Friday comes due Monday and waits. The 5 + 7 + 12 leads
 * flagged 9/9, 9/10 and 9/11 all land on Tue 15 Sep, minus whoever gets worked
 * over the weekend. That is the mechanism behind Tuesday's 45, and it is the
 * clearest statement yet that OUR 30-sweep cap binds on Tuesdays by design.
 *
 * STILL NO MONEY TIME. Four nights, 59 observed sweeps, every one to
 * Pond / Shark Tank. `maxSweepsPerPond: 25` remains our invention and remains
 * unconfirmed — though note no single observed night has exceeded 25 sweeps in
 * a table we can read, so these nights cannot disprove it either. The 8 Sep
 * neglected email, with 45 rows, is still the only thing that would settle it.
 *
 * Names, FUB ids and per-lead links are deliberately not recorded.
 */
export const SEP_11 = {
  date: "2026-09-11",
  weekday: "Friday",
  total: 861,
  at_risk: 24,
  at_risk_new_notes: 12,
  at_risk_already_flagged: 12,
  neglected: 3,
  records_moved: 3,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  /** Every swept lead this night. Still no Money Time. */
  assignmentTargets: { Pond: { "Shark Tank": 3 } },
  /**
   * `At Risk Since` on the three swept leads — all one date, three days back.
   * This is the tier spacing, measured rather than inferred.
   */
  sweptAtRiskSince: { "2026-09-08": 3 },
  /** `At Risk Since` on the 12 carried-over at-risk leads. Nothing older than 9/9. */
  carriedAtRiskSince: { "2026-09-09": 5, "2026-09-10": 7 },
  /** Sources seen across the 24 at-risk rows. All already classified as audited. */
  sourcesSeen: [
    "Zillow Preferred",
    "TheRolandTeam.com",
    "zbuyer.com",
    "Citywide Long Form",
    "Company",
    "Company Websites",
    "Google PPC",
  ],
};

/**
 * WHAT FOLLOW UP BOSS ACTUALLY RETURNS — inspect-fub-fields, 12 Sep 2026,
 * run 28 against a 40-person sample plus four lookup endpoints.
 *
 * This is the run that closed the population gap. Recorded here because every
 * number in the parity document now depends on it.
 */
export const FUB_FIELDS = {
  date: "2026-09-12",
  sample: 40,
  distinctFields: 44,

  /** The lookup table, verbatim from GET /v1/timeframes. Ids 1-4 are the nurture bands. */
  timeframes: { 1: "0-3 Months", 2: "3-6 Months", 3: "6-12 Months", 4: "12+ Months", 5: "No Plans" },

  present: {
    timeframeId: "12/40",
    stageId: "40/40",
    assignedPondId: "26/40",
    lastActivity: "40/40",
  },

  absent: [
    // The bug. Four nurture lists match on the NAME and the name is never sent.
    "timeframe",
    // Not used by policy anyway — it counts email — so its absence costs nothing.
    "lastCommunication",
    // The owner-group exclusion (52555) cannot fire. Known, warned about every
    // run, and worked around by exempting those agents by name instead.
    "assignedUserGroupIds",
    "groupIds",
  ],

  /**
   * A SECOND timeframe field exists on the account: `customTimeframe`, label
   * "Timeframe", type text. It is not returned on the person payload in this
   * sample. If the People screen column is bound to it, that is the remaining
   * explanation for the UI's 514 against Battr's 1,262 — explanation A of the
   * three the census was built to separate. It does not affect the mapping,
   * which reads the built-in id.
   */
  secondTimeframeField: { name: "customTimeframe", label: "Timeframe", type: "text" },

  /**
   * NO custom fields at all came back on the person payload ("custom*: none").
   *
   * Expected rather than alarming: the sample is 40 pond leads that have never
   * been nudged, and FUB omits a custom field that has no value. But it means
   * the warn-first interlock — which reads `customBattrAtRiskSince` off the
   * person — is UNVERIFIED against live data. It fails safe (a null stamp means
   * no sweep, so nothing moves), but it has to be confirmed on a real nudged
   * lead before anyone trusts the sweep tier. That is a go-live step, not a
   * code change.
   */
  personCustomFields: "none in sample — interlock unverified against live data",

  /**
   * THE REPLY REPRIEVE IS CURRENTLY SPARING NOBODY.
   *
   * `/emails?personId=` works and returned 51 rows for one person. But neither
   * `direction` nor `isIncoming` is on ANY of them — 0/51 — so every row counts
   * as neither and the reprieve never fires.
   *
   * This one fails in the WRONG direction: a lead who wrote back can still be
   * swept. Unlike the texts gap, it does not disable sweeping, because the
   * reprieve is a bonus protection layered on top of the tiers rather than an
   * input to them.
   *
   * Row fields available: actionPlanId, addresses, archived, attachments,
   * bodyExcerpt, bodyHtmlHiddenClean, bodyHtmlVisibleClean, bounced,
   * campaignOrigin, created, date, emailAccountId, emailTemplateId,
   * hasAttachments, hasEmailDraft, id, read, relatedPeople, sharedInboxId,
   * showContent, status, subject, threadId, unsubscribed, userId.
   *
   * `userId` is the likely direction flag — set when an agent sent it, empty
   * when the lead wrote in — but that is a guess and a wrong reading spares the
   * wrong leads. inspect-fub-fields now prints which of those fields are
   * populated and the distinct values of the enum-shaped ones, so one more run
   * settles it without anyone having to guess.
   */
  emailDirection: { rows: 51, directional: 0, verdict: "reprieve inert until a direction field is identified" },

  /** Bulk /notes WORKS — 500 rows. Battr's sweep history is recoverable from FUB. */
  notesBulk: { works: true, rows: 500 },
};

/** The four observations in order, for anything that wants the trend. */
export const TIMELINE = [
  { date: "2026-09-02", weekday: "Wed", total: 866, at_risk: 17, neglected: 7 },
  { date: "2026-09-08", weekday: "Tue", total: 903, at_risk: 23, neglected: 45 },
  { date: "2026-09-10", weekday: "Thu", total: 862, at_risk: 20, neglected: 4 },
  { date: "2026-09-11", weekday: "Fri", total: 861, at_risk: 24, neglected: 3 },
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
