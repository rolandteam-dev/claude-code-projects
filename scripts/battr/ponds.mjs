/**
 * Which pond a neglected lead is swept to.
 *
 * READ OFF BATTR'S "Pond Assignments" RULE SCREEN, 23 Sep 2026 — two rules,
 * evaluated top to bottom, on one condition each:
 *
 *     1. Money Time (Leads No More than 10 Days Old)   Created Days Ago < 11
 *     2. Shark Tank (>10 Days)                         Created Days Ago > 10
 *
 * It is LEAD AGE, and nothing else. Not the source, not a per-pond cap, not
 * the owner, not how long the lead has been neglected. A lead swept eleven
 * days after it arrived goes to Shark Tank however it came in; one swept on
 * day three goes to Money Time even if it came from the same portal.
 *
 * This module exists so that rule is one testable function rather than a
 * condition buried in the sweep loop. Two earlier models — overflow, then
 * source — were both plausible readings of Battr's outcomes and both wrong,
 * and the reason they survived as long as they did is that they were only
 * ever checked against the nights that suggested them.
 */

const DAY = 86400000;

/** Whole days between a lead's creation and now. Negative ages clamp to 0. */
export function ageInDays(createdAt, now = Date.now()) {
  const ms = typeof createdAt === "number" ? createdAt : Date.parse(createdAt ?? "");
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((now - ms) / DAY));
}

/**
 * @param createdAt  the lead's FUB `created` timestamp
 * @param rules      needs `sweepPondRules` and `sweepPond`
 * @returns { pondName, ageDays, rule, fallback } — never null, so the caller
 *          always has something to resolve and report.
 *
 * An unreadable creation date does NOT silently pick a pond. It falls back to
 * `rules.sweepPond` and says so, because a lead with no age cannot be matched
 * by an age rule and guessing "it must be new" would route a stale lead into
 * the pond reserved for fresh ones.
 */
export function pondForLead(createdAt, rules, now = Date.now()) {
  const ageDays = ageInDays(createdAt, now);

  if (ageDays === null) {
    return { pondName: rules.sweepPond, ageDays: null, rule: null, fallback: "no readable created date" };
  }

  for (const rule of rules.sweepPondRules ?? []) {
    const underMax = rule.maxCreatedDaysAgo === undefined || ageDays <= rule.maxCreatedDaysAgo;
    const overMin = rule.minCreatedDaysAgo === undefined || ageDays >= rule.minCreatedDaysAgo;
    if (underMax && overMin) return { pondName: rule.pond, ageDays, rule, fallback: null };
  }

  // The two rules as written partition every age, so this is unreachable today.
  // It is here for the edit that leaves a gap: falling through to the pond most
  // leads already go to is recoverable, and holding every sweep is not.
  return { pondName: rules.sweepPond, ageDays, rule: null, fallback: `age ${ageDays}d matched no rule` };
}
