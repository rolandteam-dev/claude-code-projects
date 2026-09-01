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
  // ---------------------------------------------------------------- thresholds
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

  /** Agents exempt from the audit — team lead, admin, ISA seats. By name. */
  exemptAgents: ["Mike Roland", "Adin Roland"],

  /** Lead sources exempt from the audit ("lead bucket" in Battr's language). */
  exemptSources: [],

  // ------------------------------------------------------------------ behavior
  /**
   * OFF mirrors Battr exactly. ON is our improvement: when a lead has spoken
   * last and nobody answered, the at-risk clock runs at half speed — an ignored
   * inbound message is worse neglect than silence, not the same.
   */
  escalateUnanswered: false,

  /** Hard ceiling on sweeps in a single run. A threshold typo can't drain a pipeline. */
  maxSweepsPerRun: 30,

  /** Text of the nudge left on the lead when it first goes At Risk. */
  nudgeNote: (lead) =>
    `Battr: this lead is At Risk — ${lead.daysSinceTouch} days with no outreach from the assigned agent. ` +
    `Reach out today or it will be swept to the ${rules.sweepPond} pond after ${rules.neglectedDays} days. ` +
    `Source: ${lead.source || "unknown"}.`,

  /** Text of the note recorded on the lead when it is swept. */
  sweepNote: (lead) =>
    `Battr: swept to the ${lead.pondName} pond after ${lead.daysSinceTouch} days with no outreach. ` +
    `Previously assigned to ${lead.previousOwner || "unassigned"}. At Risk since ${lead.atRiskSince || "unknown"}.`,
};

export default rules;
