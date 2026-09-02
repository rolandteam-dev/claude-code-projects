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
   * comfortably larger than neglectedDays or old leads look untouched.
   */
  activityLookbackDays: 45,

  // ------------------------------------------------------------- sweep targets
  /**
   * Where neglected leads land. The first pond that resolves by name is used;
   * `overflowPond` catches sweeps once `maxSweepsPerPond` is hit in one run.
   * Battr sweeps mostly to Shark Tank with a minority to Money Time.
   */
  sweepPond: "Shark Tank",
  overflowPond: "Money Time",
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
   */
  excludeOwnerGroupIds: [52555],

  /** Lead sources exempt from the audit ("lead bucket" in Battr's language). */
  exemptSources: [],

  // ------------------------------------------------------- action day filters
  /**
   * Which days each action may fire on. Confirmed against 33 runs of audit
   * history: notes go out every day, sweeps only Tue–Fri. Monday is excluded so
   * the weekend's backlog gets one working day of attention before anything is
   * taken away from an agent.
   */
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
   * OFF mirrors Battr exactly. ON is our improvement: when a lead has spoken
   * last and nobody answered, the at-risk clock runs at half speed — an ignored
   * inbound message is worse neglect than silence, not the same.
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
    `${lead.daysSinceTouch} days with no outreach. Source: ${lead.source || "unknown"}.`,

  /** Text of the note recorded on the lead when it is swept. */
  sweepNote: (lead) =>
    `Battr: swept to the ${lead.pondName} pond after ${lead.daysSinceTouch} days with no outreach. ` +
    `Previously assigned to ${lead.previousOwner || "unassigned"}. At Risk since ${lead.atRiskSince || "unknown"}.`,
};

export default rules;
