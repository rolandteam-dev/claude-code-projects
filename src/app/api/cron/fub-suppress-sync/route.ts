import { NextResponse } from "next/server";
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";
import { suppressTags } from "@/lib/homeowners/sellerAuto";
import { homeownerStore } from "@/lib/homeowners/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * FUB suppression sync — reconcile FUB-side "Bounced" / "Unsubscribed" tags into
 * the homeowner store so the recurring value digest stops mailing them.
 *
 * Why a sweep instead of a per-send check: the digest mails the ~35k database in
 * batches and has no FUB person object at send time, so it cannot read a tag per
 * contact. Instead this sweep pulls every FUB contact carrying a suppression tag
 * (set by an agent, or by our own bounce/complaint webhook) and flips the
 * matching homeowner to unsubscribed. The digest's existing `subscribed = true`
 * filter then skips them — one place to honor FUB suppression for the whole list.
 * (The seller send path reads the tag inline at send time; this covers the bulk
 * path the same way, after the fact.)
 *
 * Direction is one-way: it only SUPPRESSES. Removing a FUB tag never re-subscribes
 * anyone here — re-subscription is a deliberate manual action, not an automatic one.
 *
 * Which tags count: FUB_SUPPRESS_TAGS (default Bounced, Unsubscribed, Complained,
 * Do Not Email) — the same set the seller path uses.
 *
 * Conservative, like the other write crons:
 *   - OFF on schedule by default. The scheduled run no-ops unless
 *     FUB_SUPPRESS_SYNC_ENABLED === "true". An admin `?key=` run always works.
 *   - `?dryRun=1` reports how many suppressed contacts FUB holds, writing nothing.
 *
 * Auth: CRON_SECRET (Vercel Cron / `?secret=`) or ADMIN_TOKEN (`?key=`).
 * Preview: `/api/cron/fub-suppress-sync?key=ADMIN_TOKEN&dryRun=1`.
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

function safeFubUrl(u: string | null): string | null {
  if (!u) return null;
  return u.startsWith(`${FUB_BASE}/`) ? u : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const auth = authorized(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Scheduled runs do nothing until explicitly enabled; an admin key always runs
  // (so you can dry-run a preview before flipping the switch).
  if (!auth.admin && process.env.FUB_SUPPRESS_SYNC_ENABLED !== "true") {
    return NextResponse.json({
      ok: true,
      skipped: "suppress sync off (set FUB_SUPPRESS_SYNC_ENABLED=true to run on schedule)",
    });
  }

  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" }, { status: 200 });

  const params = new URL(req.url).searchParams;
  const dryRun = params.get("dryRun") === "1";
  const maxPages = Math.min(Math.max(Number(params.get("pages") ?? 50) || 50, 1), 200);
  const tags = suppressTags();
  const headers = fubHeaders(key);
  const store = homeownerStore();

  const seen = new Set<string>(); // de-dupe emails across tags + pages
  const perTag: Record<string, { scanned: number; emails: number; suppressed: number; moreToScan: boolean }> = {};
  let scanned = 0;
  let emailsSeen = 0;
  let newlySuppressed = 0;

  try {
    for (const tag of tags) {
      const stat = { scanned: 0, emails: 0, suppressed: 0, moreToScan: false };
      perTag[tag] = stat;
      let pageUrl: string | null =
        `${FUB_BASE}/v1/people?limit=100&tags=${encodeURIComponent(tag)}&fields=allFields`;

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
          stat.scanned++;
          const emails: string[] = Array.isArray(person?.emails)
            ? person.emails.map((e: any) => String(e?.value ?? "").trim().toLowerCase()).filter(Boolean)
            : [];
          for (const email of emails) {
            if (seen.has(email)) continue;
            seen.add(email);
            emailsSeen++;
            stat.emails++;
            if (dryRun) continue;
            try {
              const r = await store.suppressByEmail(email);
              newlySuppressed += r.matched;
              stat.suppressed += r.matched;
            } catch {
              // best effort — one email's DB hiccup shouldn't abort the whole sweep
            }
          }
        }

        pageUrl = safeFubUrl(data?._metadata?.nextLink ?? null);
        if (page === maxPages - 1 && pageUrl) stat.moreToScan = true;
      }
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), scanned, newlySuppressed }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    mode: dryRun ? "dry-run" : "sync",
    tags,
    scanned,
    emailsSeen,
    // Only meaningful on a real run; a dry run writes nothing.
    ...(dryRun ? {} : { newlySuppressed }),
    perTag,
    ...(dryRun
      ? { note: "dry run — nothing changed; emailsSeen is how many tagged addresses FUB holds" }
      : {}),
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
