/**
 * Referral Watch matching. Given an MLS agent name, decide whether it's one of
 * our former teammates. Matches on FIRST + LAST name (middle initials/suffixes
 * ignored) to limit false positives, and handles a cell that holds multiple
 * agents ("A, B").
 *
 * The former-teammate list comes from the Slack-synced roster (DB) when
 * available, falling back to the static src/content/formerAgents.ts seed.
 */
import { formerAgents } from "@/content/formerAgents";
import { formerAgentNames } from "@/lib/team/roster";

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

type Former = { display: string; first: string; last: string };

/** Build a sync matcher closure from a list of former-teammate names. */
export function buildMatcher(names: string[]): (agentName: string) => string | null {
  const FORMER: Former[] = names
    .map((n) => {
      const t = tokenize(n);
      return t.length >= 2 ? { display: n.trim(), first: t[0], last: t[t.length - 1] } : null;
    })
    .filter((x): x is Former => x !== null);

  return (agentName: string): string | null => {
    if (!agentName) return null;
    for (const part of agentName.split(/[,/]|\band\b/i)) {
      const t = tokenize(part);
      if (t.length < 2) continue;
      const first = t[0];
      const last = t[t.length - 1];
      const hit = FORMER.find((f) => f.first === first && f.last === last);
      if (hit) return hit.display;
    }
    return null;
  };
}

const staticMatcher = buildMatcher(formerAgents);

/** Sync fallback matcher using the static seed list. */
export function formerAgentMatch(agentName: string): string | null {
  return staticMatcher(agentName);
}

/** Async matcher using the synced roster (DB), falling back to the static seed. */
export async function loadFormerMatcher(): Promise<(agentName: string) => string | null> {
  try {
    const names = await formerAgentNames();
    return buildMatcher(names);
  } catch {
    return staticMatcher;
  }
}
