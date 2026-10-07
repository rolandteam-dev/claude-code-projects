import { NextResponse } from "next/server";
import { FUB_BASE, fubHeaders, personToHomeowner } from "@/lib/homeowners/fubMap";
import {
  isSellerCandidate,
  maybeSendSellerReport,
  sellerTag,
  dailyCap,
} from "@/lib/homeowners/sellerAuto";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Throttled back-catalog seller invite. The real-time path (webhook / fub-recent)
 * only invites NEWLY created or NEWLY tagged leads; this sweep covers the
 * EXISTING database of "Seller"-tagged contacts that predate it, slowly.
 *
 * It reuses the exact same per-contact send as the live path
 * (`maybeSendSellerReport` with manual:true, which drops the new-lead age check),
 * so every safety guarantee carries over: idempotent (one send per person ever,
 * via the "Home Report Sent" claim + tag), eligibility-gated (valid email +
 * Nevada ZIP), unsubscribe-aware, and bounded by the shared SELLER_AUTO_DAILY_CAP.
 *
 * Deliberately conservative to protect a young sending domain:
 *   - OFF by default. The scheduled run does nothing unless
 *     SELLER_BACKFILL_ENABLED === "true" (an admin `?key=` run can always
 *     dry-run to preview).
 *   - Sends at most SELLER_BACKFILL_PER_RUN per run (default 10), on top of the
 *     hard SELLER_AUTO_DAILY_CAP ceiling shared with the live path.
 *   - Requires HOMEOWNER_EMAIL_ENABLED === "true" to actually send (enforced in
 *     maybeSendSellerReport).
 *
 * Auth: CRON_SECRET (Vercel Cron / `?secret=`) or ADMIN_TOKEN (`?key=`).
 * Preview before enabling: `/api/cron/seller-backfill?key=ADMIN_TOKEN&dryRun=1`
 * reports how many eligible contacts are waiting, without sending anything.
 */
function authorized(req: Request): { ok: boolean; admin: boolean } {
  const params = new URL(req.url).searchParams;
  const cron = process.env.CRON_SECRET;
  const admin = process.env.ADMIN_TOKEN;
  if (admin && params.get("key") === admin) return { ok: true, admin: true };
  if (cron) {
    if (req.headers.get("authorization") === `Bearer ${cron}`) return { ok: true, admin: false };
    if (params.get("secret") === cron) return { ok: true, admin: false };
  }
  return { ok: false, admin: false };
}

function perRunCap(): number {
  const n = Number(process.env.SELLER_BACKFILL_PER_RUN ?? 10);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.trunc(n), 200) : 10;
}

function safeFubUrl(u: string | null): string | null {
  if (!u) return null;
  return u.startsWith(`${FUB_BASE}/`) ? u : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const auth = authorized(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Scheduled runs do nothing until explicitly enabled. An admin key can always
  // run (so you can dry-run a preview before flipping the switch).
  if (!auth.admin && process.env.SELLER_BACKFILL_ENABLED !== "true") {
    return NextResponse.json({
      ok: true,
      skipped: "backfill off (set SELLER_BACKFILL_ENABLED=true to run on schedule)",
    });
  }

  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" }, { status: 200 });

  const params = new URL(req.url).searchParams;
  const dryRun = params.get("dryRun") === "1";
  const perRun = perRunCap();
  const maxPages = Math.min(Math.max(Number(params.get("pages") ?? 20) || 20, 1), 100);

  const headers = fubHeaders(key);
  let pageUrl: string | null =
    `${FUB_BASE}/v1/people?limit=100&tags=${encodeURIComponent(sellerTag())}` +
    `&sort=-created&fields=allFields`;

  let scanned = 0;
  let eligible = 0; // tagged, not-yet-sent, with a usable NV address + email
  let sent = 0;
  let capped = false; // hit the shared daily cap
  const skips: Record<string, number> = {};
  let moreToScan = false;

  try {
    for (let page = 0; page < maxPages && pageUrl; page++) {
      const res: Response = await fetch(pageUrl, { headers });
      if (!res.ok) {
        if (scanned > 0) break; // past the end / transient after progress
        return NextResponse.json({ ok: false, error: `FUB ${res.status}` }, { status: 502 });
      }
      const data: any = await res.json();
      const people: any[] = Array.isArray(data.people) ? data.people : [];
      if (people.length === 0) break;

      for (const person of people) {
        scanned++;
        // Cheap eligibility read (no writes): tagged "Seller", not already sent,
        // and resolves to a homeowner (valid email + Nevada address).
        if (!(isSellerCandidate(person, true) && personToHomeowner(person))) continue;
        eligible++;

        if (dryRun) continue;
        if (sent >= perRun || capped) continue;

        try {
          const r = await maybeSendSellerReport(person, { manual: true });
          if (r.status === "sent") {
            sent++;
          } else {
            skips[r.reason ?? r.status] = (skips[r.reason ?? r.status] ?? 0) + 1;
            if ((r.reason ?? "").includes("daily cap")) capped = true;
          }
        } catch (e) {
          skips[String(e)] = (skips[String(e)] ?? 0) + 1;
        }
      }

      pageUrl = safeFubUrl(data?._metadata?.nextLink ?? null);
      // For a real run, stop once this run's send budget is spent.
      if (!dryRun && (sent >= perRun || capped)) {
        moreToScan = !!pageUrl;
        break;
      }
      if (page === maxPages - 1 && pageUrl) moreToScan = true;
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), scanned, sent }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    mode: dryRun ? "dry-run" : "send",
    scanned,
    eligibleFound: eligible,
    [dryRun ? "wouldSend" : "sent"]: dryRun ? Math.min(eligible, perRun) : sent,
    perRunCap: perRun,
    dailyCap: dailyCap(),
    capped,
    moreToScan,
    skips,
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
