/**
 * Classification — pure logic, no network, no side effects.
 *
 * Two modes:
 *
 *   "lists"  — the faithful model. Runs each contact list's own rule JSON, then
 *              unions the member lists into the combined list, worst-status-wins.
 *              Thresholds are per-list, which is how the live system works.
 *
 *   "simple" — one global threshold pair for the whole database. Less faithful,
 *              but it needs no list configuration and is useful for a baseline
 *              while member-list rules are still being exported.
 *
 * Both are exercised by the self-test.
 */
import { evaluateSet } from "./filters.mjs";
import { memberListsOf } from "./lists.mjs";

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

// ---------------------------------------------------------------- list mode

export const STATUS_RANK = { compliant: 0, at_risk: 1, neglected: 2 };

/** The more severe of two statuses. */
export const worstStatus = (a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a);

/**
 * Classify one contact against one contact list.
 *
 * Returns null when the contact isn't in the list at all. Neglected is evaluated
 * FIRST and wins over At Risk — a lead past the sweep line is not merely at risk.
 */
export function classifyForList(contact, list, now = Date.now()) {
  if (!evaluateSet(list.list_filters, contact, now)) return null;
  if (evaluateSet(list.neglected_filters, contact, now) && !isEmpty(list.neglected_filters)) return "neglected";
  if (evaluateSet(list.at_risk_filters, contact, now) && !isEmpty(list.at_risk_filters)) return "at_risk";
  return "compliant";
}

// An empty tier means "never flag at this tier", NOT "flag everything" — which
// is what a bare evaluateSet would say, since an empty set is vacuously true.
const isEmpty = (set) => {
  const groups = set?.groups;
  if (!Array.isArray(groups) || groups.length === 0) return true;
  return groups.every((g) => !Array.isArray(g) || g.length === 0);
};

/** Run every member list, then combine. Returns one record per contact. */
export function runCombinedList(contacts, combinedList, now = Date.now()) {
  const { resolved, missing } = memberListsOf(combinedList);
  const byContact = new Map();

  for (const list of resolved) {
    for (const contact of contacts) {
      const status = classifyForList(contact, list, now);
      if (status === null) continue;

      const existing = byContact.get(contact.id);
      if (existing) {
        existing.status = worstStatus(existing.status, status);
        existing.source_list_ids.push(list.id);
      } else {
        byContact.set(contact.id, {
          contact,
          id: contact.id,
          name: contact.full_name,
          owner: contact.owner_name,
          ownerId: contact.owner_user_id,
          source: contact.source_normalized,
          stage: contact.stage_name,
          tags: contact.tags_array,
          status,
          source_list_ids: [list.id],
        });
      }
    }
  }

  // The combined list's own conditions are exclusions applied after the union
  // (lead bucket, owner group). The source_list_ids condition is what we just
  // consumed to build the union, so it is skipped here.
  const exclusions = {
    groups: (combinedList.list_filters?.groups ?? []).map((group) =>
      group.filter((c) => !(c.object === "battr.aida_lists" && c.field === "source_list_ids"))
    ),
  };

  const records = [];
  const excluded = [];
  for (const record of byContact.values()) {
    if (evaluateSet(exclusions, record.contact, now)) records.push(record);
    else excluded.push(record);
  }

  return { records, excluded, missingMemberLists: missing };
}

// -------------------------------------------------------------- simple mode

/**
 * One global threshold pair across the whole database. Kept because it needs no
 * list configuration — useful for a baseline before every member list's rule
 * JSON has been exported.
 */
export function classifySimple(contact, touchIndex, rules, now = Date.now()) {
  const person = contact._raw ?? contact;
  const tags = contact.tags_array ?? (Array.isArray(person.tags) ? person.tags : []);
  const name = contact.full_name ?? person.name ?? `#${person.id}`;
  const owner = contact.owner_name ?? person.assignedTo ?? null;
  const ownerId = contact.owner_user_id ?? person.assignedUserId ?? null;
  const stage = contact.stage_name ?? person.stage ?? "";
  const source = contact.source_normalized ?? person.source ?? "";
  const created = contact.crm_created_at ?? person.created;

  const base = { id: person.id, name, owner, ownerId, source, stage, tags };

  if (!ownerId) return { ...base, status: "excluded", reason: "already in a pond / unassigned" };
  if (hasAny([stage], rules.protectedStages)) return { ...base, status: "excluded", reason: `protected stage (${stage})` };
  if (hasAny(tags, rules.protectedTags)) return { ...base, status: "excluded", reason: "protected tag" };
  if (owner && hasAny([owner], rules.exemptAgents)) return { ...base, status: "excluded", reason: "exempt agent" };
  if (source && hasAny([source], rules.exemptSources)) return { ...base, status: "excluded", reason: "exempt source" };

  const age = daysBetween(created, now);
  if (age < rules.minLeadAgeDays) return { ...base, status: "excluded", reason: `too new (${age}d)` };

  const touch = touchIndex.get(person.id);
  const lastOutbound = touch?.lastOutbound || 0;
  const lastInbound = touch?.lastInbound || 0;

  const clockFrom = lastOutbound || new Date(created).getTime();
  const daysSinceTouch = Math.max(0, daysBetween(clockFrom, now));
  const unanswered = lastInbound > lastOutbound;

  const effectiveAtRisk =
    rules.escalateUnanswered && unanswered ? Math.max(1, Math.ceil(rules.atRiskDays / 2)) : rules.atRiskDays;

  const detail = { ...base, daysSinceTouch, unanswered, neverTouched: !lastOutbound };

  if (daysSinceTouch >= rules.neglectedDays) return { ...detail, status: "neglected" };
  if (daysSinceTouch >= effectiveAtRisk) return { ...detail, status: "at_risk" };
  return { ...detail, status: "compliant" };
}

// Back-compat alias — the engine's simple path still calls this name.
export const classify = classifySimple;
