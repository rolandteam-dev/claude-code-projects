import { NextResponse } from "next/server";
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";
import { applyLandingPageRules, LANDING_PAGE_RULES, type RuleOutcome } from "@/lib/fub/landingPageRules";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Backfill / audit landing-page attribution (ADMIN_TOKEN-gated).
 *
 *   ?key=ADMIN_TOKEN&days=30            → dry run: list who WOULD be tagged
 *   ?key=ADMIN_TOKEN&days=30&apply=1    → actually tag (and re-source) them
 *   ?key=ADMIN_TOKEN&personId=123       → run the rules on one contact
 *
 * Scans FUB people created in the last `days` (newest first, up to `max`,
 * default 300) and applies LANDING_PAGE_RULES to each. Dry run is the default;
 * nothing is written without apply=1.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" });

  const apply = params.get("apply") === "1";
  const personId = params.get("personId");
  if (personId) {
    const r = await applyLandingPageRules(key, personId, { dryRun: !apply });
    return NextResponse.json({ ok: true, dryRun: !apply, results: [r] });
  }

  const days = Math.min(Math.max(Number(params.get("days") ?? 30) || 30, 1), 365);
  const max = Math.min(Math.max(Number(params.get("max") ?? 300) || 300, 1), 1000);
  const since = Date.now() - days * 86400 * 1000;
  const headers = fubHeaders(key);

  const results: RuleOutcome[] = [];
  const summary: Record<string, number> = {};
  let scanned = 0;
  let url: string | null = `${FUB_BASE}/v1/people?limit=100&sort=-created&fields=allFields`;
  const started = Date.now();

  while (url && scanned < max && Date.now() - started < 50_000) {
    const res: Response = await fetch(url, { headers });
    if (!res.ok) return NextResponse.json({ ok: false, error: `FUB ${res.status}`, scanned, results }, { status: 502 });
    const data: any = await res.json();
    const people: any[] = Array.isArray(data?.people) ? data.people : [];
    if (people.length === 0) break;
    let reachedOlder = false;
    for (const person of people) {
      if (scanned >= max) break;
      const created = person?.created ? Date.parse(person.created) : NaN;
      if (!Number.isNaN(created) && created < since) {
        reachedOlder = true;
        break;
      }
      scanned++;
      const r = await applyLandingPageRules(key, String(person.id), { person, dryRun: !apply });
      const k = `${r.rule ?? "-"}:${r.action}`;
      summary[k] = (summary[k] ?? 0) + 1;
      if (r.action !== "no-match" && r.action !== "no-events") {
        results.push({ ...r, detail: r.detail ?? `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() });
      }
    }
    if (reachedOlder) break;
    const next: string | null = data?._metadata?.nextLink ?? null;
    url = next && next.startsWith(`${FUB_BASE}/`) ? next : null;
  }

  return NextResponse.json({
    ok: true,
    dryRun: !apply,
    days,
    scanned,
    rules: LANDING_PAGE_RULES.map((r) => ({ id: r.id, tag: r.tag, source: r.source ?? null })),
    summary,
    results,
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
