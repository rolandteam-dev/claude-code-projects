/**
 * Resolve the agents whose leads are exempt from nudges and sweeps.
 *
 * WHY THIS IS NOT A FIELD ON THE LEAD
 *
 * Battr's ⭐️ Team Leads rule screen carries the condition
 *
 *     Agent's Assigned FUB Teams DOES NOT CONTAIN ANY [Battr Paused]
 *
 * and we modelled it as `owner_group_ids DOES NOT CONTAIN ANY [52555]`, read
 * from `person.assignedUserGroupIds ?? person.groupIds`. Follow Up Boss returns
 * NEITHER of those on a person record. The field was `[]` on every lead, and
 * `[] DOES NOT CONTAIN ANY [52555]` is true for everybody — so the exclusion
 * matched nobody while rendering on the rule screen as active. It is the same
 * silent failure as the timeframe and the At Risk Since stamp: a condition that
 * evaluates cleanly and protects no one.
 *
 * The mistake underneath it was treating team membership as lead data. It is
 * ROSTER data: it belongs to the agent, not to the lead, and it is fetched once
 * per run from `/v1/teams` and stamped onto each lead during normalization. The
 * rule JSON then matches without being rewritten — which matters, because that
 * JSON is pasted verbatim from Battr and editing it to fit our data is how the
 * two drift apart.
 *
 * 52555 is a Battr-internal id that no Follow Up Boss endpoint returns. It is
 * kept as the marker value purely so the pasted rule reads the same as Battr's.
 */

/** The group id Battr's rule excludes. Not a FUB id — see above. */
export const PAUSED_GROUP_MARKER = 52555;

/** Team names differ only by spacing and case between screens. */
const sameName = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/** FUB nests team members under several key names depending on the account. */
function memberIds(team) {
  const rows = team?.users ?? team?.members ?? team?.userIds ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => (typeof row === "number" ? row : (row?.id ?? row?.userId))).filter((id) => Number.isFinite(id));
}

/**
 * @returns {{ userIds:Set<number>, matched:string[], missing:string[], enforceable:boolean }}
 *
 * `missing` is the load-bearing part of this return. A team name in the config
 * that matches no team in FUB is a typo protecting nobody, and it has to be
 * reported rather than read as "nobody is paused" — that is exactly the failure
 * this module exists to end.
 */
export async function resolvePausedOwners(fub, teamNames = [], log = () => {}) {
  const userIds = new Set();
  const matched = [];
  const missing = [];

  if (!teamNames.length) return { userIds, matched, missing, enforceable: false };

  let teams;
  try {
    teams = await fub.teams();
  } catch (err) {
    log(`  /teams unreadable (${err.message}) — the paused-agent exclusion cannot be enforced this run.`);
    return { userIds, matched, missing: [...teamNames], enforceable: false };
  }

  for (const wanted of teamNames) {
    // Every team of that name, unioned: this account has two teams both called
    // "The Roland Team", and taking the first would silently drop half a roster.
    const hits = teams.filter((t) => sameName(t.name, wanted));
    if (!hits.length) {
      missing.push(wanted);
      continue;
    }
    matched.push(wanted);
    for (const team of hits) for (const id of memberIds(team)) userIds.add(id);
  }

  return { userIds, matched, missing, enforceable: matched.length > 0 };
}
