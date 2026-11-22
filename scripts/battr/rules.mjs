/**
 * Roland Team — internal Battr rule configuration.
 *
 * This is the file you tune. Everything else is machinery.
 *
 * The defaults below mirror the behavior observed in The Roland Team's live
 * Battr audit emails (audit list "⭐️ Team Leads (Nudges & Sweeps)", ~880
 * records, ~10 at-risk notes and ~8 sweeps per day, sweeping to the Shark Tank
 * and Money Time ponds).
 *
 * NOTE ON THRESHOLDS: Battr's emails stamp an "At Risk Since" date but never
 * print the day-count rule behind it. `atRiskDays` / `neglectedDays` below are
 * our best read of the observed behavior — confirm them against the Battr rules
 * screen and edit here. Run with --dry and compare the counts to a recent Battr
 * email; when they track, the mirror is faithful.
 */

export const rules = {
  // ----------------------------------------------------------------- mode
  /**
   * "lists"  — faithful: each list in scripts/battr/lists.mjs carries its own
   *            thresholds, combined worst-status-wins. All six member lists are
   *            configured, so this is the mode that matches the live system.
   * "simple" — one global threshold pair across the database. Kept as a fallback
   *            that depends on no list configuration at all.
   */
  mode: "lists",

  // ------------------------------------------------- safeguards (19 Nov 2026)
  /**
   * THE KILL SWITCH, IN CODE. While true the audit is a DRY RUN no matter what
   * BATTR_LIVE says or which "mode" a manual run is started in: nothing is written
   * to Follow Up Boss and no agent is emailed, and each night Mike is emailed what
   * the run WOULD have done. Why it exists: the first live night read 1,063 leads at
   * risk against Battr's 14 (Battr's last recorded night, 7 Oct), because texts and
   * emails could not be read in bulk. Only `undo` still writes. Mike turns it live by
   * having this set to false (a one-line change) — not by a repository variable.
   */
  forceDryRun: true,

  /**
   * Which rule set the nightly audit judges by.
   *   "battr"    — Battr's six lists and thresholds exactly as they were (see
   *                docs/battr-rules.md). THIS is the default until Mike says otherwise.
   *   "extended" — Battr's plus the lists Mike asked for on 17 Nov 2026 (Met with
   *                Customer 5/8, Appointment Set 5/8, Showing Homes 3/6, Submitting
   *                Offers 2/never, Spoke with Customer without a timeframe 7/10,
   *                Nurture without a timeframe 30/33, Lead/Attempted over 10 days
   *                5/8, NOCONTACT to Missed Opportunities). Defined in lists.mjs
   *                and kept; switched back on by setting this to "extended".
   */
  profile: "battr",

  /**
   * Pass 2 of the contact check. Every lead pass 1 (the bulk data) calls at risk or
   * neglected is looked up PERSON BY PERSON — texts and emails — before anything is
   * done with it. A lead whose history cannot be read is HELD and listed as
   * unverified; "no data" is never read as "no contact".
   */
  maxVerifyLeads: 5000, // a ceiling on one night's lookups; leads past it are held as unverified
  verifyPaceMs: 120, // pause between leads, on top of the client's 429 backoff
  /** If more than this share of lookups fail the evidence source is down: hold everything. */
  maxUnverifiedShare: 0.25,

  /**
   * Hard caps, nudges and sweeps alike. Over the TOTAL (counted before the per-agent
   * limit) the run does nothing and emails Mike the list instead — 1,063 nudges is a
   * fault, not a night's work. At or under it, no agent gets more than the per-agent
   * limit in one night; the rest wait and are listed.
   */
  maxNudgesPerAgentPerNight: 10,
  /**
   * NUDGES ARE A BATCH, NOT A BREAKER (Mike, 22 Nov 2026, "warn the 50 most overdue each
   * night"). Nothing has warned anyone since Battr stopped on 9 Oct, so ~150 leads are
   * already past their line. They are warned 50 a night (10 per agent), the most overdue
   * first, until the backlog is gone. Only a night over `maxNudgeBacklog` is treated as a
   * fault — nothing is done and Mike is emailed the list (1,063 on 18 Nov was that).
   * Sweeps keep the original rule: over `maxSweepsPerNight`, nothing moves.
   */
  maxNudgesPerNight: 50,
  maxNudgeBacklog: 400,
  maxSweepsPerAgentPerNight: 10,
  maxSweepsPerNight: 50,

  /** Where the over-the-cap list and the nightly would-be email go. */
  alertEmail: "mike@therolandteam.com",

  /** Team timezone — all "days since" math and day filters run in it. */
  timezone: "America/Los_Angeles",

  // ---------------------------------------------------------------- thresholds
  //  Simple mode only. In list mode, thresholds live per-list and differ widely:
  //  Hot Leads warn at 2 days and sweep at 4, Active Leads warn at 6 and sweep
  //  at 9, and the nurture lists run far longer.

  /** Days without an agent-initiated touch before a lead is flagged At Risk. */
  atRiskDays: 7,

  /** Days without an agent-initiated touch before a lead is swept. */
  neglectedDays: 14,

  /**
   * Brand-new leads are exempt from the day-count rules for this long, so
   * speed-to-lead (a different problem) doesn't trip the neglect engine.
   */
  minLeadAgeDays: 3,

  /**
   * How far back to pull the activity feed when computing last-touch. Must be
   * comfortably larger than the LONGEST list window, or old leads look untouched.
   *
   * This was 45, which was fine for the single 7/14 pair it was written for and
   * wrong from the day per-list thresholds arrived: Quarterly Nurture and Sphere
   * & Past Clients judge on 93/96 days. A lead called on a quarterly cadence 60
   * days ago had no call inside 45 days of history, so it read as NEVER
   * contacted — at risk on every run, and never able to clear. That is the
   * shape of our at-risk count running 4-8x Battr's and not draining, and of
   * Sphere reading 89 compliant against Battr's 356.
   *
   * More history can only move a lead toward compliant (folding is monotonic),
   * so raising this narrows who can be flagged or swept; it never widens it.
   * The engine also refuses to run on less than longestCommWindowDays() + 4.
   */
  activityLookbackDays: 100,

  /**
   * Follow Up Boss refuses `/v1/textMessages` in bulk — the same 400 it gives
   * for `/v1/emails` — so the daily activity pull carries calls only. Without
   * texts, a lead an agent has only ever texted reads as never contacted, which
   * is why the run refuses to sweep at all when a channel is missing.
   *
   * FUB does serve one person's thread. So after the first classification pass
   * the audit fetches texts per person for exactly the leads an action would
   * touch — the at-risk and neglected ones, a few dozen, not the whole
   * database — and folds them in. Folding only moves last-touch forward, so a
   * backfilled text can move a lead from neglected toward compliant and never
   * the other way.
   */
  perPersonTextBackfill: true,

  /**
   * The most leads to backfill in one run. If more than this many look
   * actionable the backfill is abandoned rather than half-done — a partial
   * backfill is the dangerous state, because it would look complete.
   *
   * THIS IS A RUNAWAY GUARD, NOT A RATION, and it was set wrong at first. At
   * 200 it blocked its own fix: the run of 14 Sep had 420 actionable leads
   * precisely BECAUSE texts were unreadable, so the backfill skipped, the
   * counts stayed inflated, and the number that tripped the cap was the number
   * the cap existed to bring down.
   *
   * The bound that means something is the audit list itself — every lead in it
   * could in principle need backfilling, and 909 were audited on 14 Sep. Above
   * that is not a busy night, it is a broken membership rule, which is the case
   * worth abandoning on.
   */
  maxTextBackfill: 1000,

  /**
   * MIKE'S CALL — ON as of 17 Nov 2026.
   *
   * With the backfill above, last-touch is complete for every lead the run
   * would act on, so the reason sweeps were disabled no longer applies. Turning
   * that into "sweeps may now proceed" takes the number of leads that can be
   * swept from zero to non-zero, so it was held for Mike. Battr was cancelled
   * (last run 9 Oct) and nothing has warned or swept since, so Mike turned it on.
   *
   * It is still safe by construction: a run writes only when BATTR_LIVE is true
   * (or a run is started with mode "live"), sweeps are capped per run and per
   * pond, and `undo <run id>` reverses a whole night — notes, stamps and sweeps.
   * Set this back to false to hold sweeps and nudges again.
   */
  sweepOnBackfilledTexts: true,

  // ------------------------------------------------------------- sweep targets
  /**
   * Where neglected leads land. READ OFF BATTR'S RULE SCREEN, 23 Sep 2026.
   *
   * "Pond Assignments" — 2 rules, evaluated top to bottom:
   *
   *     1. Money Time (Leads No More than 10 Days Old)   Created Days Ago < 11
   *     2. Shark Tank (>10 Days)                         Created Days Ago > 10
   *
   * Confirmed in words by Battr's account manager the same day: "routing to
   * the Money Time pond if the lead is between 1 and 10 days old, and to the
   * Shark Tank pond if the lead is more than 10 days old."
   *
   * It is LEAD AGE. Nothing else. That matches Mike's own description of the
   * ponds — Shark Tank is where the team keeps leads aged 10+ days and
   * prospects out of collectively — and it explains the pond sizes, 134 in
   * Money Time against 26,900 in Shark Tank.
   *
   * TWO MODELS DIED HERE, and both were mine.
   *
   * The first was overflow: Shark Tank until it fills, then Money Time. It
   * survived weeks because most sweeps do go to Shark Tank, and it was refuted
   * on 15 Sep by a 19-sweep night that sent one lead to Money Time well under
   * the cap. The second was source: direct and organic to Money Time, portals
   * to Shark Tank, proposed on 20 Sep from a single night and refuted on
   * 22 Sep when Money Time took a Zillow Preferred lead.
   *
   * Both were plausible readings of the outcomes. Neither was the rule. Every
   * list transcribed from a Battr screen has landed within a few percent; every
   * rule inferred from outcomes has been wrong. That is the lesson worth more
   * than the fix.
   */
  sweepPondRules: [
    { pond: "Money Time", maxCreatedDaysAgo: 10 },
    { pond: "Shark Tank", minCreatedDaysAgo: 11 },
  ],

  /**
   * The destination when a lead matches no rule above — which the two rules as
   * written cannot produce, since they partition on age. Kept so a future edit
   * that leaves a gap fails loudly into the pond leads already mostly go to,
   * rather than silently holding every sweep.
   */
  sweepPond: "Shark Tank",

  /**
   * OURS, not Battr's. Battr has no per-pond cap — a sweep goes wherever the
   * age rule says, however many there are.
   *
   * It stays because it is the only brake on a threshold typo emptying a
   * pipeline in one night, and the largest night ever observed was 45. It is
   * no longer part of ROUTING: it can hold a sweep back, never redirect it to
   * a different pond. Redirecting was the overflow model, and that model is
   * dead.
   */
  maxSweepsPerPond: 25,

  // ------------------------------------------------------------ what to ignore
  /**
   * Stages that are never nudged or swept — live business and closed business.
   * Match your FUB stage names exactly (case-insensitive).
   */
  protectedStages: [
    "Under Contract",
    "Pending",
    "Closed",
    "Trash",
    "Active Client",
    "Past Client",
    "Bad Number",
  ],

  /**
   * Tags that take a lead out of the audit entirely. Deliberately narrower than
   * the triage skill's DNC list: NOTEXT only closes the text channel, the phone
   * still works, so a NOTEXT lead can still be neglected.
   */
  protectedTags: [
    "NOCONTACT",
    "Y_DNC_REGISTRY_TRUE",
    "DNC_Registered_Phone",
    "Unsubscribed",
    "Already has an Agent",
  ],

  /**
   * Leads with no workable phone can't fairly be held against an agent, but
   * they shouldn't silently rot either — excluded from sweeping, still counted
   * and reported so someone fixes the record.
   */
  reportOnlyTags: ["BAD_PHONE"],

  /**
   * Agents exempt from the audit entirely: their leads are never flagged, never
   * swept, and never generate an alert. Matched on the FUB "Assigned to" name,
   * case-insensitively.
   */
  exemptAgents: ["Mike Roland"],

  /**
   * Owner groups excluded from audits, sweeps, and alerts. 52555 is the group
   * the live config excludes — the paused-agent group. Leads owned by someone
   * in it are never swept and their owner never gets an alert.
   *
   * This id comes from Battr, not from Follow Up Boss, and no FUB endpoint
   * returns it. It is kept because the rule JSON in lists.mjs is pasted
   * verbatim from Battr's rule screen and must keep reading the way Battr's
   * does. What now puts it on a lead is `excludeOwnerTeamNames` below.
   */
  excludeOwnerGroupIds: [52555],

  /**
   * The FUB TEAMS whose members' leads are exempt, which is how Battr's rule
   * screen actually words it: "Agent's Assigned FUB Teams DOES NOT CONTAIN ANY
   * [Battr Paused]".
   *
   * Resolved once per run from /v1/teams and stamped onto each lead during
   * normalization. Before this, the exclusion read a field FUB never returns,
   * was `[]` on every lead, and therefore protected nobody while looking
   * enforced.
   *
   * A name here that matches no FUB team is reported as unenforceable rather
   * than read as "nobody is paused" — a typo must not look like an empty team.
   *
   * Note (7 Sep 2026): the "Battr Paused" team currently holds only Mike, who
   * is already exempt by name via `exemptAgents`. So this protects zero line
   * agents today. It is fixed because it was broken, not because someone is
   * relying on it — and it needs to work before anyone is put back on the team.
   */
  excludeOwnerTeamNames: ["Battr Paused"],

  /** Lead sources exempt from the audit ("lead bucket" in Battr's language). */
  exemptSources: [],

  // ------------------------------------------------------- action day filters
  /**
   * Which days each action may fire on. Confirmed against 33 runs of audit
   * history: notes go out every day, sweeps only Tue–Fri. Monday is excluded so
   * the weekend's backlog gets one working day of attention before anything is
   * taken away from an agent.
   */
  /**
   * No sweeping before this Pacific date (YYYY-MM-DD). Mike, 17 Nov 2026: "Today is
   * day 1. Let's warn with nudges first." Nothing has warned agents since 9 Oct, so
   * the first nights only nudge; a lead stamped on the 17th is sweepable on the 20th
   * (the normal 3-day clock) and this date is that day. Leads that still carry an
   * old Battr stamp are held back the same three days. Set to null to remove the gate.
   * PAUSED 19 Nov 2026: pushed out of this year until the audit matches Battr.
   */
  sweepsStartOn: "2027-01-01", // PAUSED 19 Nov 2026 (was 20 Nov) until the parity work is signed off; move it to restart sweeping
  nudgeDayFilter: "Every Day",
  sweepDayFilter: "Weekdays Excluding Monday",

  // --------------------------------------------------------- warn-first interlock
  /**
   * A lead can only be swept if a previous run already warned the agent and
   * stamped `Battr At Risk Since`. This is the safety interlock on the whole
   * automation — without it a lead that has simply been quiet a long time gets
   * taken away with no warning ever issued.
   *
   * Leave this ON. It matches the live system's `customBattrAtRiskSince IS NOT
   * NULL` precondition on the neglected tier.
   */
  requireWarningBeforeSweep: true,

  // ------------------------------------------------------ inbound contact
  /**
   * A call or text FROM the lead counts as a touch and resets the clock.
   *
   * Per Mike. The reasoning is the same one that spares a lead who replies by
   * email: a live two-way conversation is not a neglected lead, whichever side
   * started it, and taking it away mid-thread is the one mistake this engine
   * must not make. Outbound email is still excluded — that one is a single
   * click for thirty people.
   *
   * The cost: a lead who calls in and is never called back now reads as
   * compliant. That case does not disappear — `unansweredInboundDays` below
   * puts it in its own section of the report, by name, every night.
   */
  inboundCountsAsTouch: true,

  /**
   * A MANUAL email counts as working a lead. An automated one does not.
   *
   * READ OFF BATTR'S PLAYBOOK, 23 Sep 2026: "Logged phone call (inbound or
   * outbound), Logged text message, Logged email, Stage updated to a more
   * advanced stage, Timeframe updated in FUB … Automated emails do NOT count —
   * only manual activity resets the clock."
   *
   * This reverses the policy this engine started with, and the reversal is
   * worth stating plainly rather than editing quietly. Email was excluded
   * because a Follow Up Boss batch send is one click for five hundred leads,
   * so counting it would let a single blast mark the database as worked. The
   * reasoning was right. The conclusion — exclude the whole channel — was too
   * blunt, because Battr already draws the line we actually wanted, between an
   * agent writing to a lead and a machine doing it.
   *
   * What the blunt version cost: 281 at risk against Battr's 15 on 22 Sep. A
   * lead an agent emailed by hand read to us as untouched.
   *
   * An email whose origin cannot be determined is NOT counted and NOT ignored.
   * It marks the touch index incomplete, which turns sweeps off for the run.
   * Counting it would reopen the batch-email hole; ignoring it would sweep a
   * lead the agent really did write to.
   */
  emailCountsAsTouch: true,

  /**
   * AUTOMATED EMAIL IS NEVER WORK. Mike's decision, 28 Sep 2026:
   *   "Stay strict: agents who let drips do the work get flagged."
   *
   * Battr's playbook says the same ("Automated emails do NOT count"), and the
   * nightly control group CONFIRMED it on the 28 Sep run: 58% of the at-risk
   * leads Battr also stamped had a drip email in their window, against 59% of
   * the leads only we flag. Battr ignores drips exactly as we do, so this is
   * parity, not a divergence — and a drip explains none of the gap between the
   * two at-risk counts. Do not "fix" that gap by flipping this.
   *
   * Enforced in communication.mjs (foldEmailTouches folds manual email only)
   * and pinned by the self-test.
   */
  automatedEmailCountsAsTouch: false,

  /**
   * Stage and timeframe updates count too, per the same page. Neither is a
   * message, so neither appears in any communication endpoint — they are read
   * from timestamps on the person record, and if FUB carries no such
   * timestamp the run reports that rather than pretending the rule is live.
   */
  stageOrTimeframeUpdateCountsAsTouch: true,

  /**
   * Follow Up Boss's own last-email dates (`lastSentEmail`, `lastEmail`) count as
   * a touch. Evidence, 2 Oct 2026: inside the lead's window for 31 of the 44
   * leads Battr leaves alone and for 0 of the 16 it flagged, while 82% of those
   * 16 had a drip email in the same window — so the fields exclude drips, which
   * stay uncounted (automatedEmailCountsAsTouch is still false).
   *
   * Narrowing only: a date can move a lead's last touch forward, never back.
   * The nightly report re-checks the evidence every run and shouts if a lead
   * Battr flagged ever has one of these dates inside its window, which would
   * mean the fields have started counting emails Battr ignores.
   */
  fubEmailActivityCountsAsTouch: true,

  /**
   * On a lead tagged `Ylopo_Reactivated`, Follow Up Boss's last-sent-inbox-app
   * message date counts as a touch. Mike's call, 6 Oct 2026: "match Battr".
   *
   * Evidence, 5 Oct: all 9 leads only we flagged carried that tag AND a
   * `lastSentInboxAppMessage` inside their window; Battr leaves them alone. So
   * for these reactivated Ylopo leads Battr treats the message as work, which
   * it does not for any other lead (3 of the 36 it flagged had the field in
   * window with no such tag effect).
   *
   * Narrowing only, and tag-gated: it can clear a flag, never raise one, and it
   * touches nobody without the tag. The nightly Summary counts the leads it
   * saves and how many of them carry Battr's own stamp — which must be 0. A
   * non-zero count means Battr does flag leads like these, and the rule is wrong.
   */
  ylopoReactivatedInboxCountsAsTouch: true,
  ylopoReactivatedTag: "Ylopo_Reactivated",

  /**
   * Ceiling on per-lead email lookups in the touch backfill. Same shape and
   * same reason as maxTextBackfill: FUB will not serve /v1/emails in bulk, so
   * the actionable shortlist is fetched one lead at a time, and a run that
   * would need thousands of calls is abandoned rather than half-done.
   */
  maxEmailBackfill: 1000,

  /**
   * Days after an inbound call or text with no outbound reply before the lead
   * is listed under "Inbound, never answered" in the report. Reporting only —
   * these leads are never swept for it.
   */
  unansweredInboundDays: 2,

  // ------------------------------------------------- the lead wrote back
  /**
   * A REPLY from the lead spares it from the sweep.
   *
   * Outbound email is never counted as working a lead: FUB batch-emails thirty
   * people in one click, so a single blast would mark the database worked. A
   * reply is the opposite — it cannot be sent in bulk, and it means there is a
   * live conversation that should not be yanked out from under the agent.
   *
   * Checked per-lead at sweep time only (FUB won't serve email in bulk), which
   * is affordable because only a couple of dozen leads reach that point a day.
   *
   * NOTE: a reply nobody answered is arguably WORSE neglect than silence, and
   * this rule protects it. That is deliberate but it is not free — spared leads
   * are listed by name every day under "Neglected but not swept", so an ignored
   * conversation shows up in the report instead of hiding in it.
   */
  inboundEmailSparesSweep: true,

  /** How recent the reply has to be to count. Older than this and the sweep proceeds. */
  inboundEmailWindowDays: 14,

  /**
   * Ceiling on per-lead email lookups in one run. Sweeps are capped at 30, so
   * this is generous; it exists so a strange run can't turn into thousands of
   * API calls.
   */
  maxEmailChecksPerRun: 100,

  // ------------------------------------------------------------------ behavior
  /**
   * Superseded by `inboundCountsAsTouch`. It used to run the at-risk clock at
   * half speed for a lead whose last word was inbound; now inbound resets the
   * clock outright, so this would fight it. Left at false, and the unanswered
   * case is reported instead of acted on.
   */
  escalateUnanswered: false,

  /** Hard ceiling on sweeps in a single run. A threshold typo can't drain a pipeline. */
  maxSweepsPerRun: 30,

  /**
   * Text of the nudge left on the lead when it first goes At Risk.
   * First line is the live system's exact copy, so agents see no change.
   */
  nudgeNote: (lead) =>
    `This lead is at risk - reach out and keep them going! 🙌\n\n` +
    `${lead.daysSinceTouch ?? "Several"} days with no outreach. Source: ${lead.source || "unknown"}.`,

  // ------------------------------------------------ do-not-contact leads (Mike, 17 Nov 2026)
  /**
   * A lead tagged NOCONTACT is not nudged ("reach out!" would be wrong) and is moved
   * to the Missed Opportunities pond instead. Limited to the early stages — a lead
   * with an appointment, a showing or a deal is never moved on a tag. The usual
   * exclusions all apply (never-swept sources, paused team, exempt agents, leads
   * already in a pond), the move waits for `sweepsStartOn`, runs Tue–Fri, and is
   * undoable like any sweep. Set `noContactPond` to null to switch it off.
   */
  noContactTags: ["NOCONTACT"],
  noContactStages: ["Lead", "Attempted Contact", "Spoke with Customer", "Nurture"],
  noContactPond: "Missed Opportunities",
  maxNoContactMovesPerRun: 25,

  /**
   * The no-timeframe Nurture list (1163) holds ~4,100 leads that have never been
   * warned. Nudging them all at once would write thousands of notes and put a
   * thousand-line list in each agent's email, so only this many are nudged per
   * night; the rest follow, oldest listing order first, and the agent digest shows
   * only the ones that have been nudged.
   */
  maxNoTimeframeNudgesPerRun: 150,

  /** Text of the note left when a do-not-contact lead is moved. */
  noContactNote: (lead) =>
    `Battr: moved to the ${lead.pondName} pond — this lead is tagged NOCONTACT (do not contact). ` +
    `Previously assigned to ${lead.previousOwner || "unassigned"}.`,

  /** Text of the note recorded on the lead when it is swept. */
  sweepNote: (lead) =>
    `Battr: swept to the ${lead.pondName} pond after ${lead.daysSinceTouch ?? "many"} days with no outreach. ` +
    `Previously assigned to ${lead.previousOwner || "unassigned"}. At Risk since ${lead.atRiskSince || "unknown"}.`,
};

export default rules;
