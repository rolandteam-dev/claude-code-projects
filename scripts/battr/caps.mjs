/**
 * Hard nightly caps, shared by nudges and sweeps (rules.max*PerAgentPerNight /
 * rules.max*PerNight).
 *
 * TWO LIMITS, IN THIS ORDER
 *   1. TOTAL. If the number of leads that would be acted on is OVER the total, the
 *      night does NOTHING and the whole list goes to Mike instead. The total is
 *      counted BEFORE the per-agent limit on purpose: it is a circuit breaker for a
 *      night that is simply wrong (1,063 nudges against Battr's 14), and it must
 *      trip on one agent with 200 leads as surely as on thirty agents with 7.
 *   2. PER AGENT. At or under the total, no agent is acted on for more than
 *      `perAgent` leads in one night; the worst-neglected come first and the rest
 *      wait, listed, for another night.
 *
 * Pure: no I/O, so the rule can be tested without a Follow Up Boss.
 */
export function planCaps(
  items,
  { perAgent, total, batch = null, ceiling = null, rank = (item) => item.daysSinceTouch ?? 0, agentOf = (item) => item.owner ?? "(unassigned)" }
) {
  // Worst first, so a cap sheds the least urgent leads and never the most.
  const ordered = [...items].sort((a, b) => rank(b) - rank(a) || (b.daysSinceTouch ?? 0) - (a.daysSinceTouch ?? 0));

  // TRIP MODE (sweeps, and the default): over `total`, do nothing. BATCH MODE (nudges,
  // since 22 Nov 2026): work the backlog down `batch` leads a night, most overdue first,
  // and trip only past `ceiling` — a night so big it is a fault, not a backlog.
  const tripAt = batch !== null ? ceiling ?? Infinity : total;
  const limit = batch !== null ? batch : total;
  const reason =
    batch !== null
      ? `over the sanity ceiling of ${tripAt} — nothing is done tonight`
      : `over the nightly total of ${total} — nothing is done tonight`;

  if (ordered.length > tripAt) {
    return {
      tripped: true,
      total: ordered.length,
      send: [],
      sendIds: new Set(),
      held: ordered.map((item) => ({ ...item, holdReason: reason })),
      heldIds: new Set(ordered.map((item) => item.id)),
    };
  }

  const perAgentCount = new Map();
  const send = [];
  const held = [];
  for (const item of ordered) {
    const agent = agentOf(item);
    const n = perAgentCount.get(agent) ?? 0;
    if (n >= perAgent) {
      held.push({ ...item, holdReason: `${agent} already has ${perAgent} tonight (per-agent limit)` });
    } else if (send.length >= limit) {
      held.push({ ...item, holdReason: batch !== null ? `waiting its turn: the backlog is warned ${batch} a night, most overdue first` : `over the nightly total of ${total}` });
    } else {
      send.push(item);
      perAgentCount.set(agent, n + 1);
    }
  }

  // Nights until the backlog is gone at this pace (the per-agent limit can be the slower of the two).
  const byAgent = new Map();
  for (const item of ordered) byAgent.set(agentOf(item), (byAgent.get(agentOf(item)) ?? 0) + 1);
  const nightsToClear = ordered.length
    ? Math.max(Math.ceil(ordered.length / limit), ...[...byAgent.values()].map((n) => Math.ceil(n / perAgent)))
    : 0;

  return {
    tripped: false,
    total: ordered.length,
    send,
    sendIds: new Set(send.map((item) => item.id)),
    held,
    heldIds: new Set(held.map((item) => item.id)),
    nightsToClear,
  };
}

/** Plain-text list of leads grouped by agent, for the over-the-cap email. */
export function renderCapList(items, { agentOf = (item) => item.owner ?? "(unassigned)" } = {}) {
  const byAgent = new Map();
  for (const item of items) {
    const agent = agentOf(item);
    if (!byAgent.has(agent)) byAgent.set(agent, []);
    byAgent.get(agent).push(item);
  }
  return [...byAgent.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([agent, rows]) =>
      [`${agent} (${rows.length})`, ...rows.map((r) => `  • ${r.name} (#${r.id}) — ${r.stage || "no stage"}, ${r.source || "no source"}, ${r.daysSinceTouch ?? "?"} days quiet`)].join("\n")
    )
    .join("\n\n");
}
