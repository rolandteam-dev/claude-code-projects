import { NextResponse } from "next/server";
import { identityConfigured, sealIdentity } from "@/lib/buyer/identity";
import { homeownerBrand } from "@/lib/homeowners/brand";

export const runtime = "nodejs";

/**
 * Mint campaign links that identify the recipient.
 *
 * A link built here carries ?c=<sealed token>, so when that contact browses
 * listings their activity lands on their Follow Up Boss record. Without this
 * there is no way to produce the tokens, and the buyer write-back never fires.
 *
 * ADMIN_TOKEN-gated, like the other internal endpoints — minting a token for an
 * arbitrary address is exactly the forgery the sealed design prevents, so the
 * minting side has to be protected.
 *
 * One contact (a quick test):
 *   GET /api/admin/buyer-link?key=ADMIN_TOKEN&email=jane@example.com&path=/listings
 *
 * A whole campaign (mail merge):
 *   POST /api/admin/buyer-link  { "key": "...", "emails": [...], "path": "/listings" }
 *   → [{ email, url }] to join onto the export you send from.
 */

const MAX_BATCH = 5000;

function authorized(key: string | null): boolean {
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected && key === expected);
}

/**
 * Without a signing secret no link can be sealed, and a link without ?c= is a
 * plain marketing link that attributes nothing. Answer 503 rather than handing
 * back a list of rows with no urls in it — a mail merge would send the campaign
 * anyway and the write-back would silently never fire.
 */
function notConfigured() {
  return NextResponse.json(
    { ok: false, error: "BUYER_LINK_SECRET (or CRON_SECRET) is not set — no links can be minted" },
    { status: 503 },
  );
}

/**
 * A row in the minted list. Config is already known good by this point, so the
 * only way a row can fail is the address itself — an export of 50,000 contacts
 * will have junk in it, and the bad rows should be visible rather than silently
 * dropped or turned into a link that seals nothing.
 */
function linkFor(email: string, path: string): { email: string; url: string } | { email: string; error: string } {
  const sealed = sealIdentity(email);
  if (!sealed) return { email, error: "not a usable email address" };
  const base = homeownerBrand.baseUrl.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  const sep = clean.includes("?") ? "&" : "?";
  return { email, url: `${base}${clean}${sep}c=${sealed}` };
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!authorized(params.get("key"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!identityConfigured()) return notConfigured();
  const email = (params.get("email") ?? "").trim();
  if (!email) return NextResponse.json({ ok: false, error: "provide ?email=" }, { status: 400 });
  const one = linkFor(email, params.get("path") ?? "/listings");
  // A single lookup either produced a link or it didn't — say so with the
  // status code, rather than a 200 the caller has to inspect.
  if ("error" in one) return NextResponse.json({ ok: false, ...one }, { status: 400 });
  return NextResponse.json({ ok: true, ...one });
}

export async function POST(req: Request) {
  let body: { key?: string; emails?: string[]; path?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
  if (!authorized(body.key ?? null)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!identityConfigured()) return notConfigured();
  const emails = (body.emails ?? []).map((e) => String(e).trim()).filter(Boolean);
  if (emails.length === 0) return NextResponse.json({ ok: false, error: "provide emails[]" }, { status: 400 });
  if (emails.length > MAX_BATCH) {
    return NextResponse.json(
      { ok: false, error: `too many at once — cap is ${MAX_BATCH}, send in chunks` },
      { status: 413 },
    );
  }
  const path = body.path ?? "/listings";
  return NextResponse.json({ ok: true, count: emails.length, links: emails.map((e) => linkFor(e, path)) });
}
