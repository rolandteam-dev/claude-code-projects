/**
 * Pure classification logic for the Battr audit — no network, no side effects.
 *
 * Split out from the engine so it can be exercised against fixtures without a
 * live Follow Up Boss key. Everything here is a function of (lead, activity,
 * rules); if this file is right, the audit is right.
 */

export const DAY_MS = 86_400_000;

/** YYYY-MM-DD in Pacific time — the team's timezone, and FUB's display zone. */
export function ptDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export const daysBetween = (from, to = Date.now()) => Math.floor((to - new Date(from).getTime()) / DAY_MS);

export const lower = (s) => String(s ?? "").trim().toLowerCase();

export const hasAny = (list, values) => {
  const set = new Set((values ?? []).map(lower));
  return (list ?? []).some((v) => set.has(lower(v)));
};

/**
 * Fold calls, texts, and emails into one last-touch record per lead.
 *
 * "Touch" means agent-initiated. A lead calling us is not the agent working the
 * lead — but it matters for the unanswered-inbound rule, so both directions are
 * tracked separately.
 */
export function buildTouchIndex({ calls = [], texts = [], emails = [] }) {
  const index = new Map();

  const fold = (rows) => {
    for (const row of rows) {
      const personId = row.personId ?? row.person?.id;
      const created = row.created ?? row.createdAt;
      if (!personId || !created) continue;

      const inbound = row.isIncoming === true || row.direction === "inbound";
      const at = new Date(created).getTime();
      if (!Number.isFinite(at)) continue;

      const entry = index.get(personId) ?? { lastOutbound: 0, lastInbound: 0 };
      if (inbound) entry.lastInbound = Math.max(entry.lastInbound, at);
      else entry.lastOutbound = Math.max(entry.lastOutbound, at);
      index.set(personId, entry);
    }
  };

  fold(calls);
  fold(texts);
  fold(emails);
  return index;
}

/**
 * Decide one lead's compliance status.
 *
 * Returns `excluded` (with a reason), `compliant`, `at_risk`, or `neglected`.
 * Exclusions are evaluated first and most-decisive-first, so a protected stage
 * always beats a day count.
 */
export function classify(person, touchIndex, rules, now = Date.now()) {
  const tags = Array.isArray(person.tags) ? person.tags : [];
  const name = person.name || [person.firstName, person.lastName].filter(Boolean).join(" ") || `#${person.id}`;
  const owner = person.assignedTo || null;

  const base = {
    id: person.id,
    name,
    owner,
    ownerId: person.assignedUserId ?? null,
    source: person.source || "",
    stage: person.stage || "",
    tags,
  };

  // --- exclusions ----------------------------------------------------------
  if (!person.assignedUserId) return { ...base, status: "excluded", reason: "already in a pond / unassigned" };
  if (hasAny([person.stage], rules.protectedStages))
    return { ...base, status: "excluded", reason: `protected stage (${person.stage})` };
  if (hasAny(tags, rules.protectedTags)) return { ...base, status: "excluded", reason: "protected tag" };
  if (owner && hasAny([owner], rules.exemptAgents)) return { ...base, status: "excluded", reason: "exempt agent" };
  if (person.source && hasAny([person.source], rules.exemptSources))
    return { ...base, status: "excluded", reason: "exempt source" };

  const age = daysBetween(person.created, now);
  if (age < rules.minLeadAgeDays) return { ...base, status: "excluded", reason: `too new (${age}d)` };

  // --- the actual measurement ----------------------------------------------
  const touch = touchIndex.get(person.id);
  const lastOutbound = touch?.lastOutbound || 0;
  const lastInbound = touch?.lastInbound || 0;

  // Never touched: the clock runs from when the lead came in.
  const clockFrom = lastOutbound || new Date(person.created).getTime();
  const daysSinceTouch = Math.max(0, daysBetween(clockFrom, now));
  const unanswered = lastInbound > lastOutbound;

  // An ignored inbound message is worse neglect than silence, so the at-risk
  // clock runs at half speed on it — off by default, to mirror Battr exactly.
  const effectiveAtRisk =
    rules.escalateUnanswered && unanswered ? Math.max(1, Math.ceil(rules.atRiskDays / 2)) : rules.atRiskDays;

  const detail = { ...base, daysSinceTouch, unanswered, neverTouched: !lastOutbound };

  if (daysSinceTouch >= rules.neglectedDays) return { ...detail, status: "neglected" };
  if (daysSinceTouch >= effectiveAtRisk) return { ...detail, status: "at_risk" };
  return { ...detail, status: "compliant" };
}
