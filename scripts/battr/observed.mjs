/**
 * Every list Battr actually runs, as seen on the Aida Audits screen.
 *
 * Source: app.battr.ai/aida/audits?date=2026-09-02, scope "The Roland Team",
 * scheduled. The screen reported **15 audits**; nine were captured. This file is
 * the inventory, and it is deliberately allowed to be incomplete — a list we
 * know exists but cannot yet model is recorded here as a NAMED GAP rather than
 * left out. A gap you can see is a decision waiting; a gap you can't is a
 * surprise on go-live night.
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

/** The screen said 15 scheduled audits ran that day. */
export const OBSERVED_AUDIT_COUNT = 15;

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
    note: "THE sweep list, and the only one that acts. 866 against Warm Back Up's 10,783 means the combined list sheds ~92% of its members — in our model, the lead-bucket exclusion plus the protected-source check.",
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
    note: "Member of Team Leads. The 94% at-risk / 5% neglected split is the warn-first interlock at work: a lead cannot be counted neglected until an earlier run stamped it.",
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
];

/** Lists we know ran but have not captured — the six below the fold. */
export const unseenCount = () => OBSERVED_AUDIT_COUNT - observedLists.length;

export const observedFor = (listId) => observedLists.find((l) => l.listId === listId) ?? null;

export const needsRules = () => observedLists.filter((l) => l.status === "needs-rules");

/** Percentage split, for printing next to ours. */
export function split(row) {
  const pct = (n) => (row.total ? `${Math.round((n / row.total) * 100)}%` : "—");
  return { compliant: pct(row.compliant), at_risk: pct(row.at_risk), neglected: pct(row.neglected) };
}
