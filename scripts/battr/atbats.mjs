/**
 * At Bats — lead-ownership change tracking.
 *
 * An "At Bat" is a chance an agent got: a brand-new lead assigned to them, a
 * lead they claimed out of a pond, or a transfer. It is the denominator for the
 * only question that matters at review time — of the chances this agent got,
 * how many did they convert, and how many did they keep?
 *
 * Detection works by diffing ownership against the previous run's snapshot, so
 * this accrues FORWARD from the first run. It cannot see history it wasn't
 * running for; seed that from a Battr At Bats CSV export (see import-atbats.mjs)
 * before the subscription lapses, or the 180-day conversion metrics start from
 * zero and need six months to become meaningful.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";

export const AT_BAT_TYPES = {
  BRAND_NEW: "brand_new_lead",
  POND_CLAIM: "pond_claim",
  TRANSFER: "other_transfer",
};

/**
 * Stages that count as a conversion. Resolved to external ids at runtime from
 * /v1/stages so a renamed stage doesn't silently break the metric.
 */
export const DEFAULT_CONVERTED_STAGES = ["Closed", "Under Contract"];

// ------------------------------------------------------------------- storage

/**
 * The ownership snapshot is rewritten in place each run rather than appended,
 * so git stores a small diff instead of a full copy per day.
 * Format: one `id,ownerUserId,pondId` line per contact.
 */
export function loadOwnership(path) {
  if (!existsSync(path)) return new Map();
  const map = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const [id, owner, pond] = line.split(",");
    map.set(Number(id), {
      ownerUserId: owner === "" ? null : Number(owner),
      pondId: pond === "" ? null : Number(pond),
    });
  }
  return map;
}

export function saveOwnership(path, contacts) {
  mkdirSync(dirname(path), { recursive: true });
  const lines = contacts.map((c) => `${c.id},${c.owner_user_id ?? ""},${c.crm_pond_id ?? ""}`);
  writeFileSync(path, `${lines.join("\n")}\n`);
}

/** The ledger is append-only: one JSON object per line. */
export function appendAtBats(path, events) {
  if (!events.length) return;
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${events.map((e) => JSON.stringify(e)).join("\n")}\n`);
}

export function loadAtBats(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ----------------------------------------------------------------- detection

/**
 * Diff current ownership against the previous snapshot and emit an event per
 * change.
 *
 * @param previous  Map<contactId, {ownerUserId, pondId}> from the last run
 * @param contacts  normalized contacts from this run
 * @param sweptIds  Set of contact ids OUR sweep moved this run — those are
 *                  flagged so an agent isn't credited with an at bat the
 *                  automation manufactured
 */
export function detectAtBats(previous, contacts, { sweptIds = new Set(), now = Date.now() } = {}) {
  const events = [];

  for (const contact of contacts) {
    const before = previous.get(contact.id);
    const nowOwner = contact.owner_user_id ?? null;
    const nowPond = contact.crm_pond_id ?? null;

    // First time we've seen this contact. Only an at bat if someone owns it —
    // a lead landing straight into a pond is not a chance anyone got yet.
    if (!before) {
      if (nowOwner) {
        events.push(makeEvent(contact, AT_BAT_TYPES.BRAND_NEW, { from: null, toOwner: nowOwner, sweptIds, now }));
      }
      continue;
    }

    const ownerChanged = (before.ownerUserId ?? null) !== nowOwner;
    const pondChanged = (before.pondId ?? null) !== nowPond;
    if (!ownerChanged && !pondChanged) continue;

    // Unowned before, owned now: either a first assignment or a pond claim.
    if (!before.ownerUserId && nowOwner) {
      const type = before.pondId ? AT_BAT_TYPES.POND_CLAIM : AT_BAT_TYPES.BRAND_NEW;
      events.push(
        makeEvent(contact, type, { from: before, toOwner: nowOwner, fromPond: before.pondId, sweptIds, now })
      );
      continue;
    }

    // Everything else that moved is a transfer: user→user, user→pond, pond→pond.
    events.push(
      makeEvent(contact, AT_BAT_TYPES.TRANSFER, {
        from: before,
        toOwner: nowOwner,
        toPond: nowPond,
        fromPond: before.pondId,
        sweptIds,
        now,
      })
    );
  }

  return events;
}

function makeEvent(contact, type, { from, toOwner, toPond, fromPond, sweptIds, now }) {
  return {
    contact_id: contact.id,
    contact_name: contact.full_name,
    at_bat_type: type,
    at_bat_timestamp: new Date(now).toISOString(),
    previous_owner_id: from?.ownerUserId ?? null,
    new_owner_id: toOwner ?? null,
    previous_pond_id: fromPond ?? null,
    new_pond_id: toPond ?? null,
    stage_exid_at_change: contact.crm_stage_exid ?? null,
    stage_name_at_change: contact.stage_name ?? "",
    source_normalized: contact.source_normalized ?? "",
    is_battr_sweep: sweptIds.has(contact.id),
  };
}

// ------------------------------------------------------------------- metrics

/**
 * Per-agent conversion and retention over a window.
 *
 * Conversion: of the at bats this agent got, how many are now in a converted
 * stage. Retention: how many are still with them. Sweeps we caused are excluded
 * from the denominator — taking a lead away and handing it to someone else is
 * not a chance that agent was given.
 */
export function summarizeAgents(atBats, contactsById, { convertedStageExids = [], windowDays = 180, now = Date.now(), userNames = new Map() } = {}) {
  const cutoff = now - windowDays * 86_400_000;
  const converted = new Set(convertedStageExids.map(Number));
  const byAgent = new Map();

  for (const event of atBats) {
    if (event.is_battr_sweep) continue;
    if (!event.new_owner_id) continue;
    if (new Date(event.at_bat_timestamp).getTime() < cutoff) continue;

    const key = event.new_owner_id;
    const row = byAgent.get(key) ?? {
      agentId: key,
      agent: userNames.get(key) ?? `User ${key}`,
      atBats: 0,
      converted: 0,
      retained: 0,
      pondClaims: 0,
    };

    row.atBats++;
    if (event.at_bat_type === AT_BAT_TYPES.POND_CLAIM) row.pondClaims++;

    const current = contactsById.get(event.contact_id);
    if (current) {
      if (converted.has(Number(current.crm_stage_exid))) row.converted++;
      if ((current.owner_user_id ?? null) === event.new_owner_id) row.retained++;
    }

    byAgent.set(key, row);
  }

  const rate = (n, d) => (d === 0 ? null : n / d);

  return [...byAgent.values()]
    .map((r) => ({ ...r, conversionRate: rate(r.converted, r.atBats), retentionRate: rate(r.retained, r.atBats) }))
    .sort((a, b) => (b.conversionRate ?? -1) - (a.conversionRate ?? -1) || b.atBats - a.atBats);
}

/** Format a rate for the report: `--` when undefined, never a misleading 0%. */
export const formatRate = (value) => (value === null || value === undefined ? "--" : `${(value * 100).toFixed(1)}%`);
