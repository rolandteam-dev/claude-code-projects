import { NextResponse } from "next/server";
import { site } from "@/lib/site";
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";

export const runtime = "nodejs";

/**
 * One-click Follow Up Boss webhook setup (ADMIN_TOKEN-gated). Registers the
 * webhooks that keep the homeowner store in sync in real time, so any new or
 * updated FUB contact with a home address is tracked immediately.
 *
 *   ?key=ADMIN_TOKEN                 → list what's currently registered
 *   ?key=ADMIN_TOKEN&action=install  → create the peopleCreated + peopleUpdated webhooks
 *   ?key=ADMIN_TOKEN&action=uninstall→ remove the ones pointing at this site
 *
 * The registered URL carries the shared secret as ?secret= so the webhook
 * endpoint can authenticate FUB's calls. The secret is masked in the response.
 */
const EVENTS = ["peopleCreated", "peopleUpdated"] as const;

function mask(url: string): string {
  return url.replace(/([?&]secret=)[^&]+/i, "$1***");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" });

  const secret = process.env.FUB_WEBHOOK_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({
      ok: false,
      error: "Set FUB_WEBHOOK_SECRET (or CRON_SECRET) first so the webhook can be secured.",
    });
  }

  const headers = fubHeaders(key, { "Content-Type": "application/json" });
  const targetUrl = `${site.url.replace(/\/$/, "")}/api/webhooks/fub?secret=${encodeURIComponent(secret)}`;
  const action = (params.get("action") || "list").toLowerCase();

  // Current webhooks
  let existing: any[] = [];
  try {
    const res = await fetch(`${FUB_BASE}/v1/webhooks`, { headers });
    const data: any = await res.json();
    existing = Array.isArray(data?.webhooks) ? data.webhooks : [];
  } catch (e) {
    return NextResponse.json({ ok: false, error: `could not list webhooks: ${String(e)}` });
  }

  const mine = existing.filter((w) => typeof w?.url === "string" && w.url.includes("/api/webhooks/fub"));

  if (action === "list") {
    return NextResponse.json({
      ok: true,
      action,
      targetUrl: mask(targetUrl),
      registered: mine.map((w) => ({ id: w.id, event: w.event, url: mask(String(w.url ?? "")), status: w.status })),
      note: mine.length ? "Webhooks are registered." : "None registered yet — add &action=install to set them up.",
    });
  }

  if (action === "uninstall") {
    const results: any[] = [];
    for (const w of mine) {
      try {
        const res = await fetch(`${FUB_BASE}/v1/webhooks/${w.id}`, { method: "DELETE", headers });
        results.push({ id: w.id, event: w.event, deleted: res.ok, status: res.status });
      } catch (e) {
        results.push({ id: w.id, event: w.event, deleted: false, error: String(e) });
      }
    }
    return NextResponse.json({ ok: true, action, results });
  }

  if (action === "install") {
    const have = new Set(mine.map((w) => w.event));
    const results: any[] = [];
    for (const event of EVENTS) {
      if (have.has(event)) {
        results.push({ event, created: false, note: "already registered" });
        continue;
      }
      try {
        const res = await fetch(`${FUB_BASE}/v1/webhooks`, {
          method: "POST",
          headers,
          body: JSON.stringify({ event, url: targetUrl }),
        });
        const body = await res.text();
        results.push({ event, created: res.ok, status: res.status, response: res.ok ? undefined : body.slice(0, 300) });
      } catch (e) {
        results.push({ event, created: false, error: String(e) });
      }
    }
    const allOk = results.every((r) => r.created || r.note === "already registered");
    return NextResponse.json({
      ok: allOk,
      action,
      targetUrl: mask(targetUrl),
      results,
      note: allOk
        ? "Real-time sync is on. New/updated FUB contacts with an address are now tracked instantly."
        : "Some webhooks failed. A 403 'X-System-Key header missing' means FUB needs a registered system key — set FUB_X_SYSTEM and FUB_X_SYSTEM_KEY in the environment (request them from FUB), then run this again.",
    });
  }

  return NextResponse.json({ ok: false, error: `unknown action "${action}"` });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
