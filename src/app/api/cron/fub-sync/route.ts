import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const FUB_BASE = "https://api.followupboss.com";
const FIRST_PAGE = `${FUB_BASE}/v1/people?limit=100&fields=allFields`;

/**
 * Imports Follow Up Boss contacts that have a home address into the homeowner
 * store so they receive value dashboards + emails. Uses FUB's cursor pagination
 * (`_metadata.nextLink`) so it can walk a database of any size — offset paging
 * caps out around 2,000. Idempotent: each contact's dashboard token is a keyed
 * HMAC of its FUB id, so re-runs update rather than duplicate, preserving each
 * homeowner's estimate/view/subscription history.
 *
 * One invocation works for ~45s then hands back `nextCursor` (the next FUB page
 * URL) so a follow-up call resumes exactly where it left off — the Seller Radar
 * "Import" button loops these calls with a progress bar.
 *
 * Auth: CRON_SECRET (Vercel Cron / manual `?secret=`) or ADMIN_TOKEN (`?key=`).
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

function tokenForFub(id: string): string {
  const salt = process.env.HOMEOWNER_TOKEN_SALT || process.env.CRON_SECRET || "roland-fallback-salt";
  return createHmac("sha256", salt).update(`fub:${id}`).digest("hex").slice(0, 24);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function pickAddress(person: any): { street: string; city: string; state: string; zip: string } | null {
  const addrs: any[] = Array.isArray(person.addresses) ? person.addresses : [];
  const a = addrs.find((x) => x && (x.street || x.streetAddress));
  if (!a) return null;
  const street = (a.street || a.streetAddress || "").trim();
  if (!street) return null;
  return { street, city: (a.city || "").trim(), state: (a.state || "NV").trim(), zip: (a.code || a.zip || "").trim() };
}

// Only ever follow FUB's own pagination URLs (SSRF guard on the cursor param).
function safeFubUrl(u: string | null): string | null {
  if (!u) return null;
  return u.startsWith(`${FUB_BASE}/`) ? u : null;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" }, { status: 200 });

  const params = new URL(req.url).searchParams;
  let pageUrl = safeFubUrl(params.get("cursor")) ?? FIRST_PAGE;

  const timeBudgetMs = 45_000;
  const startedAt = Date.now();
  const store = homeownerStore();
  const auth = `Basic ${Buffer.from(`${key}:`).toString("base64")}`;

  let imported = 0;
  let skipped = 0;
  let total: number | null = null;
  let nextCursor: string | null = null;
  let done = false;

  try {
    for (let page = 0; ; page++) {
      if (Date.now() - startedAt > timeBudgetMs) {
        nextCursor = pageUrl; // resume from this page next call
        break;
      }
      const res = await fetch(pageUrl, {
        headers: { Authorization: auth, "X-System": "TheRolandTeamWebsite" },
      });
      if (!res.ok) {
        // Past the end / transient: a clean finish if we already made progress.
        if (imported + skipped > 0) {
          done = true;
          break;
        }
        return NextResponse.json({ ok: false, error: `FUB ${res.status}`, imported, skipped }, { status: 502 });
      }
      const data: any = await res.json();
      total = Number(data?._metadata?.total) || total;
      const people: any[] = Array.isArray(data.people) ? data.people : [];
      if (people.length === 0) {
        done = true;
        break;
      }

      const batch: Homeowner[] = [];
      for (const person of people) {
        const addr = pickAddress(person);
        const email = person.emails?.[0]?.value ?? "";
        if (!addr || !email) {
          skipped++;
          continue;
        }
        batch.push({
          id: `fub-${person.id}`,
          token: tokenForFub(String(person.id)),
          firstName: person.firstName ?? "",
          lastName: person.lastName ?? "",
          email,
          phone: person.phones?.[0]?.value ?? undefined,
          address: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          subscribed: true,
          source: "fub",
          fubPersonId: String(person.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimates: [],
          views: [],
        });
      }
      if (batch.length) {
        await store.upsertContacts(batch);
        imported += batch.length;
      }

      const nl = safeFubUrl(data?._metadata?.nextLink ?? null);
      if (!nl) {
        done = true;
        break;
      }
      pageUrl = nl;
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), imported, skipped }, { status: 502 });
  }

  return NextResponse.json({ ok: true, imported, skipped, total, done, nextCursor: done ? null : nextCursor });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
