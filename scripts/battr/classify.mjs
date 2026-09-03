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

/**
 * Did the lead write back?
 *
 * Outbound email is never a touch — Follow Up Boss sends one batch email to
 * thirty leads in a single click, so counting it would let one blast mark the
 * whole database as worked. A REPLY is the opposite: it cannot be manufactured
 * in bulk, and it is direct evidence the lead is alive and in conversation.
 *
 * Direction is read the same way the touch index reads calls and texts. Rows
 * that carry no direction at all are counted separately rather than guessed —
 * treating an unreadable row as inbound would quietly reopen the batch-email
 * hole, and treating it as outbound would quietly sweep live conversations.
 *
 * @returns {{ latest: number, undirected: number }} latest inbound epoch ms (0 = none)
 */
export function readInboundEmails(emails = []) {
  let latest = 0;
  let undirected = 0;

  for (const row of emails) {
    const at = new Date(row?.created ?? row?.createdAt ?? 0).getTime();
    if (!Number.isFinite(at) || at === 0) continue;

    if (row?.isIncoming === undefined && row?.direction === undefined) {
      undirected++;
      continue;
    }
    if (row.isIncoming === true || lower(row.direction) === "inbound") {
      latest = Math.max(latest, at);
    }
  }

  return { latest, undirected };
}

/**
 * Leads who reached out and got no call or text back.
 *
 * Counting inbound as a touch (Mike's rule) makes these leads read as compliant
 * everywhere else — correct, since there IS a live conversation, but it would
 * also make the worst case in the database invisible: a lead who called in and
 * was never called back. This finds them so they can be reported by name.
 *
 * Sorted longest-waiting first, because that is the order to work them in.
 */
export function findUnansweredInbound(results, days, now = Date.now()) {
  const cutoff = days * DAY_MS;
  return results
    .filter((r) => {
      const t = r.contact?._touch;
      if (!t?.lastInbound) return false;
      if (t.lastInbound <= (t.lastOutbound ?? 0)) return false;
      return now - t.lastInbound > cutoff;
    })
    .map((r) => ({ ...r, waitingDays: Math.floor((now - r.contact._touch.lastInbound) / DAY_MS) }))
    .sort((a, b) => b.waitingDays - a.waitingDays);
}

/**
 * Run the lists that are audited but never actioned, and count them.
 *
 * These mirror lists Battr runs alongside the sweep list. They exist so the
 * nightly report covers what Battr's screen covers — and so a rule we have
 * modelled wrongly shows up as a count that disagrees with Battr's, rather than
 * as silence. Nothing here can move a lead.
 */
export function runReportOnlyLists(contacts, reportLists, now = Date.now()) {
  return reportLists.map((list) => {
    const tally = { compliant: 0, at_risk: 0, neglected: 0 };
    for (const contact of contacts) {
      const status = classifyForList(contact, list, now);
      if (status) tally[status]++;
    }
    return {
      id: list.id,
      name: list.name,
      total: tally.compliant + tally.at_risk + tally.neglected,
      ...tally,
      observed: list.observed ?? null,
      thresholdsInferred: Boolean(list.thresholds_inferred),
    };
  });
}

// ------------------------------------------------------------ agent exemption

/**
 * Is this lead's owner exempt from the audit entirely?
 *
 * Applied in BOTH modes. It used to live only inside classifySimple, which meant
 * that once "lists" became the default the exemption silently stopped applying —
 * an exempt agent's leads were classified and swept like anyone else's.
 */
export function isExemptAgent(ownerName, rules) {
  return Boolean(ownerName) && hasAny([ownerName], rules?.exemptAgents ?? []);
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
