import { NextResponse } from "next/server";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { FUB_BASE, fubHeaders, personToHomeowner } from "@/lib/homeowners/fubMap";
import { isSellerCandidate, maxPerRun, maybeSendSellerReport } from "@/lib/homeowners/sellerAuto";
import { applyLandingPageRules, createdWithin } from "@/lib/fub/landingPageRules";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Near-real-time FUB sync (no webhook, no system key needed). Pulls the most
 * recently updated Follow Up Boss contacts and upserts any with a home address
 * so brand-new leads land in the homeowner store within the poll interval. This
 * is the safety net for the instant webhook (which needs a FUB system key): it
 * uses the same read access the weekly bulk import already uses.
 *
 * Only scans the top few pages sorted by most-recent update — cheap to run
 * often. Idempotent (token is a keyed HMAC of the FUB id), so overlapping polls
 * are harmless. Wired to a schedule in vercel.json.
 *
 * Auth: CRON_SECRET (Vercel Cron / `?secret=`) or ADMIN_TOKEN (`?key=`).
 */
function authorized(req: Request): boolean {
  const params = new URL(req.url).searchParams;
  const cron = process.env.CRON_SECRET;
  const admin = process.env.ADMIN_TOKEN;
  if (cron) {
    if (req.headers.get("authorization") === `Bearer ${cron}`) return true;
    if (params.get("secret") === cron) return true;
  }
  if (admin && params.get("key") === admin) return true;
  return false;
}

function safeFubUrl(u: string | null): string | null {
  if (!u) return null;
  return u.startsWith(`${FUB_BASE}/`) ? u : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" }, { status: 200 });

  const params = new URL(req.url).searchParams;
  const pages = Math.min(Math.max(Number(params.get("pages") ?? 2) || 2, 1), 5);
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 100) || 100, 1), 100);
  // Most-recently-updated first. Overridable via ?sort= without a redeploy.
  const sort = params.get("sort") ?? "-updated";

  const store = homeownerStore();
  const headers = fubHeaders(key);
  let pageUrl: string | null =
    `${FUB_BASE}/v1/people?limit=${limit}&sort=${encodeURIComponent(sort)}&fields=allFields`;

  let imported = 0;
  let skipped = 0;
  let scanned = 0;
  let sellerSent = 0;
  const sellerSkips: Record<string, number> = {};
  const sellerDry = params.get("dryRun") === "1";
  let newestUpdated: string | null = null;
  const attribution: Record<string, number> = {};
  let oldestUpdated: string | null = null;

  try {
    for (let page = 0; page < pages && pageUrl; page++) {
      const res: Response = await fetch(pageUrl, { headers });
      if (!res.ok) {
        if (imported + skipped > 0) break; // past the end / transient after progress
        return NextResponse.json({ ok: false, error: `FUB ${res.status}`, imported, skipped }, { status: 502 });
      }
      const data: any = await res.json();
      const people: any[] = Array.isArray(data.people) ? data.people : [];
      if (people.length === 0) break;

      const batch: Homeowner[] = [];
      for (const person of people) {
        scanned++;
        const upd: string | null = person?.updated ?? null;
        if (upd) {
          if (!newestUpdated || upd > newestUpdated) newestUpdated = upd;
          if (!oldestUpdated || upd < oldestUpdated) oldestUpdated = upd;
        }
        const record = personToHomeowner(person);
        if (record) batch.push(record);
        else skipped++;
        // Safety net for the webhook: stamp landing-page attribution on
        // anything created in the last 2 days that the webhook missed.
        if (createdWithin(person, 48)) {
          const a = await applyLandingPageRules(key, String(person.id), { person, dryRun: sellerDry });
          if (a.action !== "no-match" && a.action !== "no-events") {
            const k = `${a.rule ?? "?"}:${a.action}`;
            attribution[k] = (attribution[k] ?? 0) + 1;
          }
        }
        // New seller leads (Seller tag + address) get the home report.
        if (sellerSent < maxPerRun() && isSellerCandidate(person, false)) {
          try {
            const r = await maybeSendSellerReport(person, { manual: false, dryRun: sellerDry });
            if (r.status === "sent" || r.status === "would-send") sellerSent++;
            else sellerSkips[r.reason ?? r.status] = (sellerSkips[r.reason ?? r.status] ?? 0) + 1;
          } catch {
            // never fail the sync on a send
          }
        }
      }
      if (batch.length) {
        await store.upsertContacts(batch);
        imported += batch.length;
      }
      pageUrl = safeFubUrl(data?._metadata?.nextLink ?? null);
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), imported, skipped }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    imported,
    skipped,
    scanned,
    newestUpdated,
    oldestUpdated,
    sellerReports: { [sellerDry ? "wouldSend" : "sent"]: sellerSent, skipped: sellerSkips },
    attribution,
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
