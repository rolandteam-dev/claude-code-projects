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
  // Was `neglected_processed` — the only night that spelled it differently, and
  // nothing read it under that name. A cross-check against TIMELINE found it,
  // which is the point of having two copies reconcile.
  neglected: 45,
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
 * CORRECTED BY 12 SEP — see SEP_12 below. The wording above implies a lead
 * leaves the at-risk tier by being SWEPT. It does not. It leaves by aging past
 * the neglected threshold, which happens on the clock whether or not that day
 * is a sweep day. On Saturday 12 Sep the whole 9/9 cohort left the at-risk list
 * with no sweep running at all. Our classifier already had this right —
 * `classifyForList` tests the neglected tier before the at-risk one — so the
 * error was in the description, not the code.
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

/**
 * A FIFTH observation, from the raw .eml of Sat 12 Sep 2026, 7:08 PM PT.
 *
 * ONE EMAIL, NOT TWO. The At Risk half arrived; no Neglected half did. Saturday
 * is not in `sweepDayFilter` ("Weekdays Excluding Monday") and IS covered by
 * `nudgeDayFilter` ("Every Day"). Both filters, confirmed in one night by what
 * did and did not arrive. This is the first weekend night observed.
 *
 *   Total records in audit    856
 *   At Risk records            19
 *     already processed        10   (dated 9/10 ×5, 9/11 ×5)
 *     new notes created         9
 *   Excluded bucket/group     0/0
 *
 * THE CORRECTION. Cross-referencing the carry-over against 11 Sep, three
 * cohorts moved:
 *
 *   flagged 9/09:  5 → 0     due 9/12 (Sat) — a NON-sweep day
 *   flagged 9/10:  7 → 5     due 9/13 (Sun)
 *   flagged 9/11: 12 → 5     due 9/14 (Mon)
 *
 * The 9/09 cohort left the at-risk list entirely on the night its three days
 * were up — and nothing was swept, because Saturday cannot sweep. So a lead
 * does not leave the at-risk tier by being swept. It leaves by aging past the
 * neglected threshold. Neglected and At Risk are exclusive states on a clock,
 * and the sweep is an ACTION taken on the neglected state, on the days the
 * filter allows, not the thing that produces it.
 *
 * That is exactly how `classifyForList` already works — it tests the neglected
 * tier first and returns on the first match — so the model needed no change.
 * What needed correcting was the explanation attached to SEP_11, which said the
 * tier drains by sweeping. It drains on the clock. A test now pins the
 * distinction so the two cannot be conflated again.
 *
 * THE NUDGE APPEARS TO WORK. The other 9 departures (2 of the 9/10 cohort,
 * 7 of the 9/11) were NOT due and were NOT swept, so something moved them:
 * an agent making contact, or a stage change taking them out of the list.
 * Roughly half of a night's nudges stop being at-risk within a day or two.
 * Encouraging, and not provable from these emails alone — recorded as an
 * observation, not a claim.
 *
 * THE TUESDAY FORECAST, RESTATED. The earlier figure of 24 assumed nobody gets
 * worked. Carrying the observed attrition forward, Tuesday 15 Sep should see
 * the 9/09 cohort (already neglected, unswept, waiting) plus whatever of the
 * 9/10, 9/11 and 9/12 cohorts survives the weekend — an upper bound of about
 * 24 and a realistic figure well under our 30-sweep cap. The cap is still
 * capable of binding on a heavy Tuesday; 8 Sep did 45.
 *
 * Names, FUB ids and per-lead links are deliberately not recorded. The cohort
 * counts above come from cross-referencing rows between two nights; the people
 * are client PII.
 */
export const SEP_12 = {
  date: "2026-09-12",
  weekday: "Saturday",
  total: 856,
  at_risk: 19,
  at_risk_new_notes: 9,
  at_risk_already_flagged: 10,
  /** No neglected email was sent. Saturday is not a sweep day. */
  neglected_email_sent: false,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  /** `At Risk Since` on the 10 carried-over leads. The 9/09 cohort is entirely gone. */
  carriedAtRiskSince: { "2026-09-10": 5, "2026-09-11": 5 },
  /**
   * How each cohort changed from 11 Sep to 12 Sep. The 9/09 row is the finding:
   * a full cohort left the at-risk tier on a night with no sweep.
   */
  cohortAttrition: {
    "2026-09-09": { was: 5, now: 0, dueOn: "2026-09-12", dueOnASweepDay: false },
    "2026-09-10": { was: 7, now: 5, dueOn: "2026-09-13", dueOnASweepDay: false },
    "2026-09-11": { was: 12, now: 5, dueOn: "2026-09-14", dueOnASweepDay: false },
  },
  sourcesSeen: [
    "Trulia",
    "TheRolandTeam.com",
    "Google PPC",
    "HomeLight",
    "Zillow Preferred",
    "zbuyer.com",
    "Leadpops - Google Ads",
    "Company Websites",
  ],
};

/**
 * A SIXTH observation, from the raw .eml of Sun 13 Sep 2026, 7:08 PM PT.
 * At Risk only again — Sunday is not a sweep day either. Both weekend nights
 * now agree with `sweepDayFilter`.
 *
 *   Total records in audit    858
 *   At Risk records            21
 *     already processed        13   (9/12 ×8, 9/11 ×4, and one dated 9/07)
 *     new notes created         8
 *   Excluded bucket/group     0/0
 *
 * ONE ROW CARRIES THE WHOLE FINDING. A lead sits in the carry-over with:
 *
 *     Status "At Risk"  ·  Previous Status "compliant"  ·  At Risk Since 9/07
 *     Action Status: "Action already taken in previous audit"
 *
 * It was compliant yesterday and at risk today, yet Battr did NOT create a new
 * note, and the stamp still reads 9/07 — six days back. Three facts follow, and
 * none of them were visible in any earlier night:
 *
 *   1. `At Risk Since` IS NEVER CLEARED when a lead becomes compliant. Working
 *      a lead removes it from the at-risk list; it does not remove the mark.
 *   2. IDEMPOTENCY KEYS ON THE STAMP EXISTING, not on the previous status. A
 *      lead returning to at-risk gets no second note, ever.
 *   3. THE INTERLOCK IS "EVER WARNED", NOT "RECENTLY WARNED". Because the stamp
 *      survives, a lead that was warned once in the past can be swept the
 *      moment it next goes neglected — with no fresh warning, and no three-day
 *      grace. The lead above would sweep on a stamp six days stale.
 *
 * OUR ENGINE ALREADY DOES ALL THREE. `alreadyFlagged` is a Boolean test on the
 * field, the nudge branch writes the stamp only when it is absent, and nothing
 * anywhere clears it. So this is a confirmation rather than a defect — but it
 * is a sharp edge worth stating out loud: an agent who rescues a lead and then
 * lets it slide again gets no second warning before it is taken.
 *
 * THE SATURDAY CORRECTION, CONFIRMED AGAIN. The 9/10 cohort (5 leads) came due
 * on Sunday 9/13 and left the at-risk list entire, with nothing swept because
 * Sunday cannot sweep. That is the second cohort in two nights to age out of
 * at-risk on a non-sweep day.
 *
 * THE NEGLECTED BACKLOG, NOW COUNTABLE. Nothing has swept since Friday, and
 * three cohorts have aged past the line or will before Tuesday:
 *
 *     9/09 cohort   5   aged out Sat 9/12
 *     9/10 cohort   5   aged out Sun 9/13
 *     9/11 cohort   4   due Mon 9/14 (nudge day, not a sweep day)
 *     9/12 cohort   8   due Tue 9/15
 *                  --
 *                   22  upper bound for Tuesday 15 Sep, less whoever is worked
 *
 * That is a real forecast to check the engine against, and it sits under our
 * 30-sweep cap. The cap can still bind on a heavier Tuesday — 8 Sep did 45.
 *
 * Names, FUB ids and per-lead links are deliberately not recorded.
 */
export const SEP_13 = {
  date: "2026-09-13",
  weekday: "Sunday",
  total: 858,
  at_risk: 21,
  at_risk_new_notes: 8,
  at_risk_already_flagged: 13,
  neglected_email_sent: false,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  carriedAtRiskSince: { "2026-09-07": 1, "2026-09-11": 4, "2026-09-12": 8 },
  /**
   * The row that proves the stamp is sticky: previously compliant, at risk
   * again, no new note, and a stamp from six days earlier.
   */
  stampSurvivedCompliance: { atRiskSince: "2026-09-07", previousStatus: "compliant", action: "already taken" },
  cohortAttrition: {
    "2026-09-10": { was: 5, now: 0, dueOn: "2026-09-13", dueOnASweepDay: false },
    "2026-09-11": { was: 5, now: 4, dueOn: "2026-09-14", dueOnASweepDay: false },
    "2026-09-12": { was: 9, now: 8, dueOn: "2026-09-15", dueOnASweepDay: true },
  },
  sourcesSeen: [
    "ISA Transfer",
    "Zillow Preferred",
    "TheRolandTeam.com",
    "Ylopo",
    "Trulia",
    "Google PPC",
    "Leadpops - Google Ads",
    "HomeLight",
  ],
};

/**
 * A SEVENTH observation, from the raw .eml of Tue 15 Sep 2026, 7:08–7:11 PM PT.
 * The Tuesday this project has been building toward, and it settles three
 * things at once.
 *
 *   Total records in audit    880        Total records in audit    880
 *   At Risk records            23        Neglected records          19
 *     already processed        16        Records moved             19
 *     new notes created         7        Records not moved          0
 *   Excluded bucket/group     0/0        Excluded bucket/group    0/0
 *
 * 1. THE FORECAST HELD. On 13 Sep we predicted the Tuesday backlog from the
 *    cohort dates: 5 + 5 + 4 + 8 = 22 as an upper bound, less whoever got
 *    worked over the weekend, and comfortably under our 30-sweep cap. Battr
 *    swept 19, and the stamps break down exactly as the cohorts predicted:
 *
 *      At Risk Since 9/09   3 swept   (5 flagged, 2 worked)
 *      At Risk Since 9/10   5 swept
 *      At Risk Since 9/11   5 swept
 *      At Risk Since 9/12   6 swept
 *
 *    A model that predicts a number three days out, on the hardest day to
 *    predict, is a model that understands the mechanism.
 *
 * 2. THE STICKY STAMP, CAUGHT CAUSING A SWEEP. One of the 9/11 cohort was in
 *    Saturday's at-risk list, GONE from Sunday's — worked, and compliant — and
 *    swept on Tuesday carrying its original 9/11 stamp. That is the behaviour
 *    recorded on 13 Sep (the stamp survives a compliant excursion, and the
 *    interlock asks "ever warned", not "recently warned") observed end to end,
 *    from warning through rescue through sweep. An agent saved that lead and
 *    got no second warning before it was taken.
 *
 * 3. MONEY TIME EXISTS, AND OUR POND MODEL IS REFUTED. Eighteen leads went to
 *    Pond / Shark Tank. ONE went to Pond / Money Time.
 *
 *    Nineteen sweeps is well under the 25 at which `maxSweepsPerPond` overflows,
 *    so under our model every one of them goes to Shark Tank. The split is
 *    therefore NOT by count, and the rule is wrong in kind rather than in its
 *    number — no value of 25 fixes it.
 *
 *    It is not the owner (two of that agent's other leads went to Shark Tank
 *    the same night) and not the source (eleven Shark Tank leads share it).
 *    Assignment rule set 41 is the screen that would say. The rule is left
 *    unchanged, because pond routing is only ever edited from Battr's own rule
 *    screen, and recorded as known-wrong rather than left looking deliberate.
 *
 * A fourth, smaller note: one at-risk row reads `Previous Status: None` rather
 * than "compliant" — a lead that was not in the audit list at all on the
 * previous run, rather than one that was compliant in it. Worth knowing before
 * anyone reads "None" as a data error.
 *
 * Names, FUB ids and per-lead links are deliberately not recorded.
 */
export const SEP_15 = {
  date: "2026-09-15",
  weekday: "Tuesday",
  total: 880,
  at_risk: 23,
  at_risk_new_notes: 7,
  at_risk_already_flagged: 16,
  neglected: 19,
  records_moved: 19,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  /** THE FINDING: Money Time, on a night far below the 25-lead overflow point. */
  assignmentTargets: { Pond: { "Shark Tank": 18, "Money Time": 1 } },
  /** `At Risk Since` on the 19 swept leads — the cohorts, clearing on schedule. */
  sweptAtRiskSince: { "2026-09-09": 3, "2026-09-10": 5, "2026-09-11": 5, "2026-09-12": 6 },
  /** What we predicted on 13 Sep, before any of this was visible. */
  forecast: { upperBound: 22, actual: 19, capAtTheTime: 30, bound: false },
  sourcesSeen: [
    "Google PPC",
    "zbuyer.com",
    "Zillow Preferred",
    "Jeffery Dragovich",
    "Ylopo",
    "zBuyer",
    "ISA Transfer",
    "TheRolandTeam.com",
    "Citywide Long Form",
    "Noah Cash Offer",
    "Trulia",
    "Company Websites",
    "Leadpops - Google Ads",
  ],
};

/**
 * An EIGHTH observation, Wed 16 Sep 2026 — and the one that shows a lead can be
 * swept twice.
 *
 *   Total records in audit    786   (880 on 15 Sep — down 94)
 *   At Risk records            19   (10 carried, 9 new)
 *   Neglected records           8   (all 8 to Shark Tank)
 *   Excluded bucket/group     0/0
 *
 * TWO OF THE EIGHT WERE SWEPT THE NIGHT BEFORE. Two FUB ids in this list are
 * also in the 15 Sep list, with the same At Risk Since dates, both marked
 * "Successfully swept to pond" on both nights. A lead in a pond fails
 * `notInAPond` and leaves the audit list, so it can only be back if somebody
 * took it OUT of the pond during the day — claimed it — and then did not
 * contact it. Last communication is unchanged, the stamp is sticky, so it
 * crosses the neglected line again that same evening and is swept again.
 *
 * That is a churn loop, and it is worth Mike knowing about as an operational
 * fact rather than a bug: claiming a lead out of Shark Tank buys one day. Both
 * of these belonged to the same agent, which is the kind of thing the per-agent
 * scoreboard exists to surface.
 *
 * Our engine would do the same thing — the behaviour follows from rules we have
 * confirmed, not from a defect — so nothing is changed here. Recorded because
 * "why does the same lead keep appearing" is a question someone will ask.
 *
 * THE POPULATION DROPPED 94 ON A NIGHT THAT SWEPT 8. The other ~86 left for
 * some other reason, and a new pond appeared in our own run the same night:
 * "Brett Pond", absent from the pond list on 14 and 15 Sep. A bulk move into a
 * new pond takes leads out of every member list at once, which fits. Benign,
 * but it means 15→16 Sep is not a night the drain arithmetic can be checked
 * against.
 */
export const SEP_16 = {
  date: "2026-09-16",
  weekday: "Wednesday",
  total: 786,
  at_risk: 19,
  at_risk_new_notes: 9,
  at_risk_already_flagged: 10,
  neglected: 8,
  records_moved: 8,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  assignmentTargets: { Pond: { "Shark Tank": 8 } },
  sweptAtRiskSince: { "2026-09-07": 1, "2026-09-10": 1, "2026-09-12": 1, "2026-09-13": 4, "2026-09-15": 1 },
  /** Swept on 15 Sep AND again on 16 Sep, same stamp. Claimed back, not worked. */
  reSweptFromPreviousNight: 2,
  /** A pond that did not exist on 14 or 15 Sep. ~86 leads left the list unexplained by sweeps. */
  newPondObserved: "Brett Pond",
  /**
   * Somebody moved leads in bulk this day, so the drain arithmetic cannot be
   * checked across 15→16 Sep. Flagged rather than absorbed by a wider tolerance:
   * loosening the bound to fit one explained night would stop it catching an
   * unexplained one.
   */
  bulkMoveObserved: true,
};

/**
 * A NINTH observation, Thu 17 Sep 2026 — the first night our own run can be set
 * against Battr's with the interlock readable on both sides.
 *
 *   Total records in audit    796
 *   At Risk records            32   (10 carried, 22 new)
 *   Neglected records           7   (all 7 to Shark Tank)
 *
 * TWENTY-TWO NEW WARNINGS, AND TEN OF THEM ARE ONE BLOCK. Ten of the new
 * at-risk rows share an owner, the source "Zillow", consecutive FUB ids, and
 * `Previous Status: None` — several with no name at all. Consecutive ids mean
 * they were created together; `Previous Status: None` means they were not in
 * the audit list on the previous run. A sync or import dropped a batch in and
 * they crossed the warn line before anyone touched them.
 *
 * Worth knowing before reading 22 as an accountability signal: it is 12 leads
 * going quiet and 10 leads arriving unworked, which are different problems.
 *
 * A THIRD RE-SWEEP. One of the seven swept tonight was also swept on 16 Sep,
 * carrying the same 9/10 stamp — the third night running that a lead has been
 * claimed back out of a pond and taken again without being contacted. Same
 * agent as the two on 16 Sep.
 */
export const SEP_17 = {
  date: "2026-09-17",
  weekday: "Thursday",
  total: 796,
  at_risk: 32,
  at_risk_new_notes: 22,
  at_risk_already_flagged: 10,
  neglected: 7,
  records_moved: 7,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  assignmentTargets: { Pond: { "Shark Tank": 7 } },
  /** Ten of the 22 new warnings: one owner, one source, consecutive ids, no prior status. */
  bulkArrivalsInNewWarnings: 10,
  reSweptFromPreviousNight: 1,
};

/**
 * OUR RUN THE SAME NIGHT (2026-09-17-qmti), for the record that matters.
 *
 *   audited      828   against Battr's 796   (+4.0%)
 *   neglected     18   against Battr's   7
 *   at risk      279   against Battr's  32
 *
 * THE INTERLOCK IS READABLE. `fields: allFields` landed and the "not one
 * contact carries the stamp" block is gone from the report. Neglected moved
 * 0 → 18, which is the first time that number has meant anything.
 *
 * THE AT-RISK GAP IS THE EMAIL RULE, not a defect — most likely. Battr judges
 * on FUB's own Last Communication, which counts email. We exclude outbound
 * email by policy, because one FUB batch send would mark the database as
 * worked. A lead whose only recent contact is an email therefore reads as
 * worked to Battr and untouched to us. That is the divergence this project
 * chose on day one, and 279 against 32 is roughly its size.
 *
 * Stated as the leading explanation rather than a finding: it has not been
 * measured directly, and the way to measure it is to count leads whose only
 * activity in the window is email.
 */
export const OURS_SEP_17 = {
  date: "2026-09-17",
  runId: "2026-09-17-qmti",
  audited: 828,
  at_risk: 279,
  neglected: 18,
  interlockReadable: true,
  /** Six of eight lists inside 6%. Two left, both the same root cause. */
  drift: {
    "💛 Sphere & Past Clients": 0.1,
    "🗓️ CLEAN UP": -3.3,
    "‼️ YLOPO IMPORTANT": -3.4,
    "📖 Current & Upcoming Clients": 3.5,
    "⭐️ Team Leads (combined)": -5.9,
    "🎤 AI TEXT REPLIES": 10.0,
    "🏹 Zillow Important": 218.2,
    "❗Active Leads": -100.0,
  },
  /**
   * BOTH REMAINING MISSES ARE ONE MISSING FIELD. Battr's rules for these two
   * say "site activity"; we have no website-visit timestamp from FUB, only
   * `lastActivity`, which counts everything.
   *
   * Active Leads used lastActivity and came back 8,083 against 131. Removing
   * that fallback took it to 0 — wrong in the other direction, but visibly and
   * honestly wrong rather than a sixty-fold overcount wearing a plausible
   * number. Zillow Important still reads lastActivity and sits at +218%, which
   * is the same error at a third the scale.
   *
   * The field list we have was read WITHOUT allFields, so it is not the whole
   * record. A fresh inspect run is the thing that settles it.
   */
  blockedOn: "a website-visit timestamp from FUB; lastActivity is not it",
};

/**
 * FRIDAY 18 SEPTEMBER — the first night both sides can be read against each
 * other on the SAME DATE, with Battr's own numbers rather than a row typed in
 * three nights earlier.
 *
 * This matters more than another data point. The drift table in our report has
 * been measuring against Battr's 15 Sep figure of 880, because that was the
 * last row anyone transcribed. Battr's real totals since then are 796 (17 Sep)
 * and 790 (18 Sep) — the audit list has been SHRINKING while our comparison
 * held a stale ceiling. Read against the right night, our population is
 *
 *     17 Sep   828 vs 796   +4.0%
 *     18 Sep   809 vs 790   +2.4%
 *
 * not the −8.1% the report printed. The engine was never 8% short; the
 * baseline was three days old. That is an argument for transcribing Battr's
 * total every night until it is cancelled, and for the report naming the date
 * of the row it is comparing against — which it already does, and which is the
 * only reason this was catchable.
 */
export const SEP_18 = {
  date: "2026-09-18",
  weekday: "Friday",
  total: 790,
  at_risk: 17,
  at_risk_new_notes: 8,
  at_risk_already_flagged: 9,
  neglected: 17,
  records_moved: 17,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  assignmentTargets: { Pond: { "Shark Tank": 15, "Money Time": 2 } },

  /**
   * Ten of the seventeen sweeps: one owner, one source ("Zillow"), consecutive
   * ids 101130–101141, all stamped At Risk 9/17 and swept 9/18. The same
   * bulk-arrival shape as 17 Sep, one night later and larger.
   *
   * A lead created on 17 Sep cannot be four days without contact by 18 Sep, so
   * Hot Leads' 2/4 clock cannot be what caught these. The consistent reading is
   * that Battr treats a NULL last communication as infinitely old rather than
   * as unknown: a lead that arrives and is never touched is neglected on the
   * spot, and the one-day gap is the warn-first interlock, not the threshold.
   *
   * Worth testing directly before it is relied on — it is a behaviour we would
   * be copying, and it decides what happens to every lead that arrives
   * overnight.
   */
  bulkArrivalsInSweeps: 10,

  /**
   * POND ROUTING — the first evidence that is not consistent with overflow.
   *
   * 17 sweeps is well under `maxSweepsPerPond: 25`, so nothing overflowed, yet
   * two leads still went to Money Time. Their sources were LPT Rider and
   * TheRolandTeam.com; all fifteen Shark Tank leads came from portals and
   * aggregators (Zillow, Google PPC, Ylopo, zbuyer.com, ISA Transfer, an agent
   * referral).
   *
   * Hypothesis, NOT a rule: "Pond Assignments" routes by lead source or bucket
   * — direct and organic leads to Money Time, portal leads to Shark Tank —
   * which would fit the names and fit Money Time holding 134 against Shark
   * Tank's 26,900.
   *
   * Recorded rather than implemented. Pond routing is only ever edited to match
   * Battr's own rule screen, and that screen has not been read yet.
   */
  moneyTimeSources: ["LPT Rider", "TheRolandTeam.com"],
  sharkTankWasPortalOnly: true,

  /**
   * Every lead swept this night, by FUB person id. Ids, not names — see the
   * note on SEP_20's cohort for why that distinction is the whole of the
   * privacy question here.
   *
   * Kept so that "the leads warned on 18 Sep were not among the leads swept on
   * 18 Sep" is something the suite can check rather than something a comment
   * asserts. The recovery figure depends on it.
   */
  sweptIds: [
    52423, 99391, 81490, 31505, 85524, 101101, 101102,
    101141, 101140, 101139, 101138, 101137, 101136, 101134, 101133, 101132, 101130,
  ],
  moneyTimeIds: [101101, 101102],
};

/**
 * OUR RUN THE SAME NIGHT (2026-09-18-58c9).
 *
 *   audited      809   against Battr's 790   (+2.4%)
 *   neglected      7   against Battr's  17
 *   at risk      276   against Battr's  17
 *
 * THE AT-RISK GAP IS NOW WELL EVIDENCED, across four nights:
 *
 *     Battr   17 (2 Sep) · 32 (17 Sep) · 17 (18 Sep)
 *     ours   279 (17 Sep) · 276 (18 Sep)
 *
 * Battr finds 2% of its audit at risk; we find 34%. A defect would wander with
 * the population. This does not — it is a different definition applied
 * consistently, and the definition we know differs is email. Battr judges on
 * FUB's Last Communication, which counts an emailed lead as worked. We exclude
 * outbound email deliberately, because one batch send in FUB would otherwise
 * mark the whole database as worked.
 *
 * So 276 is not 17 measured wrongly. It is the number of leads nobody has
 * CALLED OR TEXTED, and 17 is the number nobody has contacted by any channel
 * including a bulk email. Both are correct answers to different questions, and
 * which one the engine should report is Mike's call, not a bug to fix.
 */
export const OURS_SEP_18 = {
  date: "2026-09-18",
  runId: "2026-09-18-58c9",
  audited: 809,
  at_risk: 276,
  neglected: 7,
  interlockReadable: true,
  /** Against Battr's SAME-NIGHT total, not the stale 880 the report used. */
  populationDriftVsSameNight: 2.4,
  atRiskGapExplanation: "email counts as a touch for Battr and deliberately does not for us",
};

/**
 * SUNDAY 20 SEPTEMBER — an At Risk email with no Neglected email, which is the
 * weekend shape seen on 12 and 13 Sep and consistent with the rule screen's
 * "Weekdays Excluding Monday" sweep filter. Nudges every day, sweeps Tue–Fri.
 *
 * THE FIRST MEASUREMENT OF WHETHER A NUDGE ACTUALLY WORKS.
 *
 * Until now every night has been read on its own. Two nights of per-lead rows
 * three days apart can be followed as a COHORT, and that is what finally makes
 * "Battr Recovered" — the state this engine does not model — measurable from
 * the emails alone.
 *
 * Battr warned eight leads on 18 Sep. On 20 Sep, four of those eight are still
 * in the at-risk tier carrying an At Risk Since of 2026-09-18. The other four
 * are gone from it.
 *
 * They were not swept: 19 and 20 Sep are Saturday and Sunday, sweeps do not run
 * on either, and none of the four appears in the 18 Sep sweep list. So they
 * left the at-risk tier by being worked — or by leaving the audit list some
 * other way, such as a stage change. Both readings are recorded below rather
 * than one being asserted, because the emails cannot tell them apart.
 *
 * Read conservatively, that is FOUR OF EIGHT WARNED LEADS ACTED ON WITHIN TWO
 * DAYS. That number is the argument for the whole system, and it is the one
 * Battr's own nightly email never states.
 */
export const SEP_20 = {
  date: "2026-09-20",
  weekday: "Sunday",
  total: 777,
  at_risk: 19,
  at_risk_new_notes: 7,
  at_risk_already_flagged: 12,
  /** Sunday is not a sweep day; Battr sent no Neglected email at all. */
  neglected_email_sent: false,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,

  /**
   * FUB person ids, not names. An id is a pointer that means nothing without
   * access to the CRM, where a name is the client. Kept because a cohort
   * cannot be followed across nights without them, and following the cohort is
   * the only way to measure recovery from these emails.
   */
  warnedOn18Sep: [63970, 79119, 62608, 72773, 65492, 101034, 101122, 99468],
  /** Of those eight, still at risk on 20 Sep with the 18 Sep stamp intact. */
  stillAtRiskOn20Sep: [63970, 79119, 72773, 65492],
  /**
   * The other four. Not in the 18 Sep sweep list, and no sweep ran on either
   * intervening day — so they left the tier without being swept.
   */
  leftTierWithoutSweep: [62608, 101034, 101122, 99468],
  /**
   * CORRECTED 22 Sep. This originally read "worked by the agent, or moved out
   * of the audit list by a stage change", and both readings were too kind.
   *
   * A lead also leaves the at-risk tier by AGEING PAST the neglected threshold
   * — a mechanism confirmed on 12 Sep and which I failed to carry into these
   * two readings. 101122 did exactly that: absent from the at-risk list on
   * 20 Sep, swept to Money Time on 22 Sep still carrying its 18 Sep stamp. It
   * was never worked. It sat in the neglected tier through Saturday, Sunday
   * and Monday, none of which are sweep days, and went on the first Tuesday.
   */
  leftTierReading:
    "worked by the agent, moved out of the audit list by a stage change, or aged past the at-risk " +
    "threshold into the neglected tier — the emails cannot distinguish these",
  /** Confirmed swept later, so NOT recovered. See SEP_22. */
  laterSwept: [101122],
  /** The upper bound on recovery from this cohort, once 101122 is removed. */
  recoveredUpperBound: 3,

  /**
   * The stamp survives across nights, again. Four leads carry At Risk Since
   * 2026-09-18 three days later, which is the third independent confirmation
   * that Battr never clears it — so the warn-first interlock asks "was this
   * lead EVER warned", not "was it warned recently". Our rules already model
   * it that way.
   */
  stampPersists: true,
};

/**
 * OUR RUN THE SAME NIGHT (2026-09-20-h4cs).
 *
 *   audited      811   against Battr's 777   (+4.4%)
 *   at risk      276   against Battr's  19
 *   neglected     12   against a Sunday, when Battr does not sweep at all
 *
 * Our at-risk figure has now been 279, 276, 276 on three consecutive readings
 * while Battr's has been 32, 17, 19. Ours is the steadier of the two, which is
 * what a threshold applied to a slowly-changing population looks like. Battr's
 * moves because its number is the tier AFTER same-day nudges have cleared some
 * of it; ours is the tier before any action, because no action is taken.
 *
 * The neglected comparison is not available on a Sunday. Battr sends no
 * Neglected email on a non-sweep day, so 12 has nothing to sit beside — and
 * writing 0 in the other column would turn "we did not look" into "we looked
 * and it was empty".
 */
export const OURS_SEP_20 = {
  date: "2026-09-20",
  runId: "2026-09-20-h4cs",
  audited: 811,
  at_risk: 276,
  neglected: 12,
  populationDriftVsSameNight: 4.4,
  /** Sunday. Battr ran no sweep, so there is no figure to compare 12 against. */
  neglectedComparable: false,
  /**
   * Still carrying the "AN EXCLUSION PROTECTS NOBODY" banner, because the
   * paused-agent fix is on the feature branch and the nightly runs from main.
   * The banner goes when the branch lands, not before.
   */
  pausedAgentFixLive: false,
};

/**
 * OUR RUN, MONDAY 21 SEPTEMBER (2026-09-21-9bni). 813 audited, 291 at risk,
 * 12 neglected.
 *
 * TWO LISTS NOW LAND EXACTLY: ‼️ YLOPO IMPORTANT at 116 against 116, and
 * 🎤 AI TEXT REPLIES at 10 against 10. Both were guesses reverse-engineered
 * from a compliance split six weeks ago and both were wrong; both were
 * rewritten from Battr's rule screens on 3 Sep. Landing on the number is what
 * a correctly transcribed rule looks like.
 *
 * NOTHING ON THIS BRANCH IS IN THAT RUN. The nightly job runs from main, and
 * this is the third consecutive night whose report carries the stale 880
 * baseline (printing −7.6% where the same-night figure is about +4%), the
 * "AN EXCLUSION PROTECTS NOBODY" banner that the paused-agent fix removes, and
 * a drift table with no staleness marking. Every one of those is fixed here
 * and none of it is running. Recording it so the gap between "fixed" and
 * "live" stays visible in the data rather than only in a chat message.
 */
export const OURS_SEP_21 = {
  date: "2026-09-21",
  runId: "2026-09-21-9bni",
  audited: 813,
  at_risk: 291,
  neglected: 12,
  /** Lists matching Battr's transcribed count exactly. */
  exactMatches: ["‼️ YLOPO IMPORTANT", "🎤 AI TEXT REPLIES"],
  /**
   * The report still compares against Battr's 15 Sep total because the rows
   * transcribed since then live on this branch. Not a new fault — the same one,
   * still shipping.
   */
  comparedAgainstStaleBaseline: true,
  branchLive: false,
};

/**
 * TUESDAY 22 SEPTEMBER. 780 audited, 15 at risk (2 new, 13 already flagged),
 * 16 neglected, all 16 moved, nothing held back.
 *
 * Our run the same night found 17 neglected against this 16 — the closest that
 * number has ever been, on the one tier that actually takes leads off agents.
 *
 * TWO THINGS THIS NIGHT OVERTURNS.
 *
 * 1. POND ROUTING IS NOT BY SOURCE. On 18 Sep the two Money Time leads came
 *    from LPT Rider and TheRolandTeam.com while all fifteen Shark Tank leads
 *    came from portals, and the obvious reading was "direct and organic to
 *    Money Time, portals to Shark Tank". Tonight Money Time took a Zillow
 *    Preferred lead and a Noah Cash Offer lead, while Shark Tank took Zillow
 *    Preferred, Zillow.com, Trulia, Ylopo, Google PPC, zBuyer, ISA Transfer,
 *    TheRolandTeam.com and a Direct Call. Every axis available in these emails
 *    — source, owner, At Risk Since, id range — now appears on both sides.
 *
 *    The hypothesis is REFUTED, not weakened. Nothing was implemented on it,
 *    which is the only reason this costs a comment rather than a rollback, and
 *    it is the argument for waiting on the "Pond Assignments" rule screen
 *    instead of inferring the rule from outcomes.
 *
 * 2. "FOUR OF EIGHT WARNED LEADS WERE ACTED ON" WAS TOO HIGH. Lead 101122 was
 *    one of the four I recorded on 20 Sep as having left the at-risk tier
 *    without being swept. It was swept tonight, to Money Time, carrying its
 *    original 18 Sep stamp.
 *
 *    It never recovered. It aged out of the at-risk tier into the neglected
 *    one — a mechanism this project confirmed on 12 Sep and which I then left
 *    out of the two readings I wrote down on 20 Sep. Sweeps do not run Sat,
 *    Sun or Mon, so it sat neglected for four days with nowhere to go, and the
 *    first sweep day that came round took it.
 *
 *    The honest count is THREE of eight, and even that is an upper bound: the
 *    remaining three were not swept on the only sweep day available, so they
 *    are not sitting in the neglected tier, but "worked by the agent" and
 *    "left the audit list some other way" still cannot be told apart from an
 *    email.
 */
export const SEP_22 = {
  date: "2026-09-22",
  weekday: "Tuesday",
  total: 780,
  at_risk: 15,
  at_risk_new_notes: 2,
  at_risk_already_flagged: 13,
  neglected: 16,
  records_moved: 16,
  records_not_moved: 0,
  excluded_lead_bucket: 0,
  excluded_agent_group: 0,
  assignmentTargets: { Pond: { "Shark Tank": 14, "Money Time": 2 } },
  sweptIds: [
    75704, 70734, 63970, 50545, 44659, 74408, 79119, 44882,
    72773, 65492, 74825, 64791, 47673, 98505, 101122, 101129,
  ],
  moneyTimeIds: [101122, 101129],

  /**
   * Both sides of the pond split, for anyone tempted to re-derive the rule from
   * source. Zillow Preferred appears in BOTH lists on the same night.
   */
  moneyTimeSources: ["Zillow Preferred", "Noah Cash Offer"],
  sharkTankWasPortalOnly: false,
  pondRoutingBySourceRefuted: true,

  /** Of the eight warned on 18 Sep, this one aged through and was swept here. */
  sweptFrom18SepWarnCohort: [101122],
};

/**
 * OUR RUN THE SAME NIGHT (2026-09-22-wjlc). 813 audited, 281 at risk,
 * 17 neglected.
 *
 *   population    813 vs 780   +4.2%
 *   NEGLECTED      17 vs  16   the closest this number has ever been
 *
 * Neglected is the tier that actually takes a lead off an agent. Getting it
 * within one is worth more than any of the report-only lists matching exactly.
 *
 * First run on the merged engine, and all three fixes are visible: the
 * "AN EXCLUSION PROTECTS NOBODY" banner is gone, every drift row is marked
 * with the age of the Battr figure it compares against, and the combined list
 * reads +4.6% against 777 rather than −7.6% against a five-day-old 880.
 *
 * One number moved that should not have: Excluded went 823 → 10. Not a safety
 * change — both nights audited exactly 813 leads across the same 23 agents
 * with identical per-agent counts. Leads owned by an exempt agent used to
 * enter the list and be marked excluded afterwards; they now carry the paused
 * marker and are filtered at membership, so the count never sees them. Fixed
 * by reporting both halves.
 */
export const OURS_SEP_22 = {
  date: "2026-09-22",
  runId: "2026-09-22-wjlc",
  audited: 813,
  at_risk: 281,
  neglected: 17,
  populationDriftVsSameNight: 4.2,
  /** 17 against 16. The tier that moves leads is effectively matched. */
  neglectedDriftVsSameNight: 6.3,
  firstRunOnMergedEngine: true,
  bannerGone: true,
  staleMarkingLive: true,
};

/** The observations in order, for anything that wants the trend. */
export const TIMELINE = [
  { date: "2026-09-02", weekday: "Wed", total: 866, at_risk: 17, neglected: 7 },
  { date: "2026-09-08", weekday: "Tue", total: 903, at_risk: 23, neglected: 45 },
  { date: "2026-09-10", weekday: "Thu", total: 862, at_risk: 20, neglected: 4 },
  { date: "2026-09-11", weekday: "Fri", total: 861, at_risk: 24, neglected: 3 },
  // Saturday: nudges ran, sweeps did not. `neglected: 0` is the day filter, not
  // an empty tier — leads were neglected, nothing was allowed to move them.
  { date: "2026-09-12", weekday: "Sat", total: 856, at_risk: 19, neglected: 0 },
  { date: "2026-09-13", weekday: "Sun", total: 858, at_risk: 21, neglected: 0 },
  // 14 Sep (Mon) not captured — a nudge-only day, like the weekend.
  { date: "2026-09-15", weekday: "Tue", total: 880, at_risk: 23, neglected: 19 },
  // A new pond appeared and ~86 leads left the list by some route other than a
  // sweep, so the drain arithmetic has nothing to say about this pair.
  { date: "2026-09-16", weekday: "Wed", total: 786, at_risk: 19, neglected: 8 },
  { date: "2026-09-17", weekday: "Thu", total: 796, at_risk: 32, neglected: 7 },
  // The largest sweep since 8 Sep, and ten of the seventeen were leads that had
  // arrived the previous day and never been touched.
  { date: "2026-09-18", weekday: "Fri", total: 790, at_risk: 17, neglected: 17 },
  // 19 Sep (Sat) not captured, though eight leads carry its stamp. Sunday's
  // `neglected: 0` is the day filter again — nothing was allowed to move.
  { date: "2026-09-20", weekday: "Sun", total: 777, at_risk: 19, neglected: 0 },
  // 21 Sep (Mon) not captured — Monday is excluded from sweeps by the rule
  // screen, so the backlog from Sat/Sun/Mon all clears on this Tuesday.
  { date: "2026-09-22", weekday: "Tue", total: 780, at_risk: 15, neglected: 16 },
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
    status: "modeled",
    listId: 1150,
    note: "Rule screen read 3 Sep 2026: pond NONE and tags CONTAINS ANY AI_ENGAGED, AI_NEEDS_FOLLOW_UP, thresholds 30/60, no actions. Modelled as list 1150, report-only.",
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
    name: "📖 Current & Upcoming Clients",
    type: "contact",
    status: "modeled",
    listId: 1149,
    note: "The only genuinely new list on the screen. Not a member of Team Leads, so it cannot sweep. Modelled as the live-business stages, every one of which is already on protectedStages — so its leads are doubly protected. Record count and thresholds not yet captured.",
  },
];

/**
 * Lists known to exist but never captured. Now zero: all 15 scheduled audits
 * are accounted for. After the rule screens of 3 Sep were applied on 16 Sep,
 * only ONE still needs its rule — 📊 Database Health Score, a roll-up over 13
 * source lists that cannot be modelled without knowing which 13. Needing a rule
 * is a different thing from not knowing the list exists.
 */
export const unseenCount = () => Math.max(0, OBSERVED_AUDIT_COUNT - observedLists.length);

export const observedFor = (listId) => observedLists.find((l) => l.listId === listId) ?? null;

export const needsRules = () => observedLists.filter((l) => l.status === "needs-rules");

/** Percentage split, for printing next to ours. */
export function split(row) {
  const pct = (n) => (row.total ? `${Math.round((n / row.total) * 100)}%` : "—");
  return { compliant: pct(row.compliant), at_risk: pct(row.at_risk), neglected: pct(row.neglected) };
}
