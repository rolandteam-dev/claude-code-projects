import { NextResponse } from "next/server";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { FUB_BASE, fubHeaders, personToHomeowner } from "@/lib/homeowners/fubMap";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Real-time Follow Up Boss webhook. FUB calls this the moment a contact is
 * created or updated; if that contact has a home address + email we add/refresh
 * them in the homeowner store immediately (no waiting for the weekly import).
 * Valuation stays lazy — it happens the first time the dashboard is opened — so
 * this handler only needs to be fast and idempotent.
 *
 * FUB webhook payloads carry the changed record ids in `resourceIds` (and a
 * `uri`), not the records themselves, so we fetch each id back from the People
 * API and map it the same way the bulk importer does.
 *
 * Security: FUB lets you register the webhook URL with a query string, so the
 * URL itself carries the shared secret (?secret=...). We require it to match
 * FUB_WEBHOOK_SECRET (or CRON_SECRET) — without a configured secret the
 * endpoint refuses, so it can never be driven anonymously.
 */
function authorized(req: Request): boolean {
  const secret = process.env.FUB_WEBHOOK_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;
  const params = new URL(req.url).searchParams;
  if (params.get("secret") === secret) return true;
  // Some setups prefer a Bearer token instead of a query param.
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractIds(payload: any): string[] {
  const ids = new Set<string>();
  const push = (v: any) => {
    if (v === null || v === undefined) return;
    const s = String(v).trim();
    if (s) ids.add(s);
  };
  if (Array.isArray(payload?.resourceIds)) payload.resourceIds.forEach(push);
  if (Array.isArray(payload?.resources)) payload.resources.forEach((r: any) => push(r?.id));
  push(payload?.resourceId);
  // Fall back to parsing ids out of the provided uri (e.g. /v1/people/123,456).
  const uri: string = typeof payload?.uri === "string" ? payload.uri : "";
  const m = uri.match(/\/people\/([0-9,]+)/);
  if (m) m[1].split(",").forEach(push);
  return [...ids];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.FUB_API_KEY;
  if (!key) {
    // 200 so FUB doesn't retry forever while the CRM key is being provisioned.
    return NextResponse.json({ ok: true, note: "FUB_API_KEY not set; ignored" });
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }
  const ids = extractIds(payload).slice(0, 100); // bound bursts
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, added: 0 });
  }

  const headers = fubHeaders(key);
  const store = homeownerStore();
  const batch: Homeowner[] = [];
  let missing = 0;

  for (const id of ids) {
    try {
      const res = await fetch(`${FUB_BASE}/v1/people/${encodeURIComponent(id)}?fields=allFields`, {
        headers,
      });
      if (!res.ok) {
        missing++;
        continue;
      }
      const person = await res.json();
      const record = personToHomeowner(person);
      if (record) batch.push(record);
      else missing++;
    } catch {
      missing++;
    }
  }

  if (batch.length) await store.upsertContacts(batch);

  return NextResponse.json({ ok: true, processed: ids.length, added: batch.length, skipped: missing });
}

export async function POST(req: Request) {
  return handle(req);
}
// FUB "verifies" a webhook URL with a GET when you register it — answer 200.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ready: true });
}
