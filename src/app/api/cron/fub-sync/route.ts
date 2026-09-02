import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Imports Follow Up Boss contacts that have a home address into the homeowner
 * store so they receive value dashboards + emails. Idempotent: each contact's
 * dashboard token is derived deterministically from its FUB id via a keyed HMAC
 * (unguessable, but stable across re-syncs so rows update rather than
 * duplicate). Auth + gating mirror the digest cron.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
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

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" }, { status: 200 });

  const url = new URL(req.url);
  let offset = Number(url.searchParams.get("offset") ?? 0) || 0;
  const limit = 100;
  const maxPages = 30; // up to ~3,000 contacts per invocation
  const timeBudgetMs = 45_000; // stop before the 60s function limit; return nextOffset to continue
  const startedAt = Date.now();
  const store = homeownerStore();
  const auth = `Basic ${Buffer.from(`${key}:`).toString("base64")}`;

  let imported = 0;
  let skipped = 0;
  let pages = 0;
  let done = false;

  try {
    for (; pages < maxPages; pages++) {
      if (Date.now() - startedAt > timeBudgetMs) break; // hand back nextOffset for a follow-up run
      const res = await fetch(
        `https://api.followupboss.com/v1/people?limit=${limit}&offset=${offset}&fields=allFields`,
        { headers: { Authorization: auth, "X-System": "TheRolandTeamWebsite" } }
      );
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: `FUB ${res.status}`, imported, skipped }, { status: 502 });
      }
      const data: any = await res.json();
      const people: any[] = data.people ?? [];
      if (people.length === 0) {
        done = true;
        break;
      }
      for (const person of people) {
        const addr = pickAddress(person);
        const email = person.emails?.[0]?.value ?? "";
        if (!addr || !email) {
          skipped++;
          continue;
        }
        const token = tokenForFub(String(person.id));
        const existing = await store.getByToken(token);
        const record: Homeowner = {
          id: `fub-${person.id}`,
          token,
          firstName: person.firstName ?? "",
          lastName: person.lastName ?? "",
          email,
          phone: person.phones?.[0]?.value ?? undefined,
          address: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          subscribed: existing?.subscribed ?? true,
          source: "fub",
          fubPersonId: String(person.id),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimates: existing?.estimates ?? [],
          views: existing?.views ?? [],
          lastEmailedAt: existing?.lastEmailedAt,
        };
        await store.upsert(record);
        imported++;
      }
      offset += people.length;
      if (people.length < limit) {
        done = true;
        break;
      }
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), imported, skipped }, { status: 502 });
  }

  return NextResponse.json({ ok: true, imported, skipped, nextOffset: done ? null : offset });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
