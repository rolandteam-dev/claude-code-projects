/**
 * Landing-page → Follow Up Boss attribution.
 *
 * Every AgentLoft form on therolandteam.com posts to FUB with the same source
 * ("TheRolandTeam.com") and a tag that only reflects the form TYPE, so a lead
 * from the Guaranteed Sale page is indistinguishable from any other website
 * inquiry in the CRM. FUB does keep the landing URL on the lead EVENT
 * (pageUrl / pageReferrer / description), it just never promotes it to the
 * person. This module reads that event and stamps the person with a tag (and
 * optionally a source) that FUB Lead Flow rules and automations CAN act on.
 *
 * Rules are plain data so new landing pages are a one-line addition.
 * Idempotent: a person who already carries the rule's tag is skipped.
 */
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";

export type LandingPageRule = {
  /** Short id used in logs / responses. */
  id: string;
  /** Case-insensitive substrings; any match on the lead event marks the person. */
  match: string[];
  /** Tag added to the person (mergeTags, nothing removed). */
  tag: string;
  /** When set, the person's source is changed to this value. */
  source?: string;
  /** Only rewrite source if the current source is one of these (lower-cased).
   *  Prevents clobbering a real source like "Zillow" when a Zillow lead later
   *  wanders onto a landing page. Omit to always set. */
  onlyFromSources?: string[];
};

const WEBSITE_SOURCES = ["therolandteam.com", "agentloft", "www.therolandteam.com", ""];

export const LANDING_PAGE_RULES: LandingPageRule[] = [
  {
    id: "guaranteed-sale",
    match: ["guaranteed-home-sale-las-vegas", "show me the 21-day plan", "21-day plan", "guaranteed sale"],
    tag: "Guaranteed Sale",
    source: "Guaranteed Sale",
    onlyFromSources: WEBSITE_SOURCES,
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export type RuleOutcome = {
  personId: string;
  rule?: string;
  action: "tagged" | "already-tagged" | "no-match" | "no-events" | "error";
  sourceChanged?: boolean;
  dryRun?: boolean;
  detail?: string;
};

/** Text FUB stores on a lead event that can identify the landing page. */
function eventText(ev: any): string {
  return [
    ev?.pageUrl,
    ev?.pageReferrer,
    ev?.pageTitle,
    ev?.description,
    ev?.message,
    ev?.source,
    ev?.campaign?.source,
    ev?.campaign?.medium,
    ev?.campaign?.campaign,
    ev?.campaign?.content,
    ev?.property?.url,
  ]
    .filter((v) => typeof v === "string" && v)
    .join(" \n ")
    .toLowerCase();
}

function personText(person: any): string {
  return [person?.sourceUrl, person?.background, person?.source]
    .filter((v) => typeof v === "string" && v)
    .join(" \n ")
    .toLowerCase();
}

export function matchRule(text: string, rules: LandingPageRule[] = LANDING_PAGE_RULES): LandingPageRule | null {
  const t = text.toLowerCase();
  for (const r of rules) {
    if (r.match.some((m) => t.includes(m.toLowerCase()))) return r;
  }
  return null;
}

async function fetchPersonEvents(key: string, personId: string, limit = 25): Promise<any[]> {
  const url = `${FUB_BASE}/v1/events?personId=${encodeURIComponent(personId)}&limit=${limit}`;
  const res = await fetch(url, { headers: fubHeaders(key) });
  if (!res.ok) return [];
  const data: any = await res.json().catch(() => null);
  return Array.isArray(data?.events) ? data.events : [];
}

/**
 * Inspect one FUB person and apply the first matching landing-page rule.
 * `person` is optional; pass it when the caller already fetched allFields to
 * save a round trip. Never throws.
 */
export async function applyLandingPageRules(
  key: string,
  personId: string,
  opts: { person?: any; dryRun?: boolean; rules?: LandingPageRule[] } = {},
): Promise<RuleOutcome> {
  const rules = opts.rules ?? LANDING_PAGE_RULES;
  const dryRun = !!opts.dryRun;
  try {
    let person = opts.person;
    if (!person) {
      const res = await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(personId)}?fields=allFields`, {
        headers: fubHeaders(key),
      });
      if (!res.ok) return { personId, action: "error", detail: `person ${res.status}` };
      person = await res.json();
    }
    const tags: string[] = Array.isArray(person?.tags) ? person.tags : [];
    const tagSet = new Set(tags.map((t) => String(t).toLowerCase()));

    // Cheap pre-check on the person itself, then the lead events.
    let rule = matchRule(personText(person), rules);
    if (!rule) {
      const events = await fetchPersonEvents(key, personId);
      if (events.length === 0) return { personId, action: "no-events" };
      for (const ev of events) {
        rule = matchRule(eventText(ev), rules);
        if (rule) break;
      }
    }
    if (!rule) return { personId, action: "no-match" };
    if (tagSet.has(rule.tag.toLowerCase())) return { personId, rule: rule.id, action: "already-tagged" };

    const currentSource = String(person?.source ?? "").toLowerCase();
    const changeSource =
      !!rule.source &&
      currentSource !== rule.source.toLowerCase() &&
      (!rule.onlyFromSources || rule.onlyFromSources.includes(currentSource));

    if (dryRun) {
      return { personId, rule: rule.id, action: "tagged", sourceChanged: changeSource, dryRun: true };
    }

    const body: Record<string, unknown> = { tags: [rule.tag] };
    if (changeSource) body.source = rule.source;
    const put = await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(personId)}?mergeTags=true`, {
      method: "PUT",
      headers: fubHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!put.ok) {
      const txt = await put.text().catch(() => "");
      return { personId, rule: rule.id, action: "error", detail: `put ${put.status} ${txt.slice(0, 200)}` };
    }
    return { personId, rule: rule.id, action: "tagged", sourceChanged: changeSource };
  } catch (e) {
    return { personId, action: "error", detail: String(e) };
  }
}

/** True when a FUB person was created within the last `hours`. */
export function createdWithin(person: any, hours: number): boolean {
  const c = person?.created ? Date.parse(person.created) : NaN;
  if (Number.isNaN(c)) return false;
  return Date.now() - c <= hours * 3600 * 1000;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
