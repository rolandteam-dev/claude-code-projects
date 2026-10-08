/**
 * Referral Watch matching. Given an MLS agent name, decide whether it's one of
 * our former teammates (see src/content/formerAgents.ts). Matches on FIRST +
 * LAST name (middle initials / suffixes ignored) to limit false positives, and
 * handles a cell that holds multiple agents ("A, B").
 */
import { formerAgents } from "@/content/formerAgents";

function tokens(s: string): string[] {
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

const FORMER: Former[] = formerAgents
  .map((n) => {
    const t = tokens(n);
    return t.length >= 2 ? { display: n.trim(), first: t[0], last: t[t.length - 1] } : null;
  })
  .filter((x): x is Former => x !== null);

/** The matched former-teammate display name, or null. */
export function formerAgentMatch(agentName: string): string | null {
  if (!agentName) return null;
  for (const part of agentName.split(/[,/]|\band\b/i)) {
    const t = tokens(part);
    if (t.length < 2) continue;
    const first = t[0];
    const last = t[t.length - 1];
    const hit = FORMER.find((f) => f.first === first && f.last === last);
    if (hit) return hit.display;
  }
  return null;
}
