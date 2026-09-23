import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { valueHome } from "@/lib/homeowners/nvValue";
import { sendValueEmail } from "@/lib/homeowners/email";
import { isEligible } from "@/lib/homeowners/eligibility";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Periodic homeowner digest: for each subscriber due for an update, refresh the
 * AVM estimate (Repliers), append it to history, send the value email (Resend),
 * and mark them emailed. Wired to a schedule via vercel.json cron.
 *
 * Auth: requires CRON_SECRET. Vercel Cron sends it as a Bearer token; manual
 * runs can pass ?secret=. If CRON_SECRET is unset the endpoint refuses, so it
 * can never be triggered anonymously.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 14);
  const dryRun = url.searchParams.get("dryRun") === "1";

  // Batch cap: never run all ~34k due rows inside a 60s function (it would time
  // out and blast a brand-new sending domain). ?limit= wins, else
  // HOMEOWNER_DIGEST_BATCH, else 50; hard max 1000.
  const limitRaw = Number(url.searchParams.get("limit") ?? process.env.HOMEOWNER_DIGEST_BATCH ?? 50);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : 50, 0), 1000);

  const store = homeownerStore();
  const due = await store.listDueForEmail(Number.isFinite(days) ? days : 14);

  // Enforce eligibility at send time so rows already in the table (out-of-state
  // / junk email) can never be mailed, independent of import-time filtering.
  let eligibleList = due.filter((h) => isEligible({ email: h.email, state: h.state, zip: h.zip }));
  const skippedIneligible = due.length - eligibleList.length;

  // Segment targeting for a safe warm-up: send to your warmest people first.
  //   ?source=home-value,fub  — only these record sources (comma-separated)
  //   ?engaged=1              — only homeowners who have opened their dashboard
  const sourceParam = (url.searchParams.get("source") ?? "").trim();
  const sources = sourceParam ? new Set(sourceParam.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  const engagedOnly = url.searchParams.get("engaged") === "1";
  if (sources) eligibleList = eligibleList.filter((h) => sources.has(h.source));
  if (engagedOnly) eligibleList = eligibleList.filter((h) => (h.views?.length ?? 0) > 0);

  const batch = eligibleList.slice(0, limit);
  const remaining = Math.max(0, eligibleList.length - batch.length);

  let refreshed = 0;
  let emailed = 0;
  const errors: string[] = [];

  for (const h of batch) {
    try {
      const { estimate: est, facts } = await valueHome(h);
      if (facts && !dryRun) await store.updateFacts(h.token, facts);
      if (est) {
        if (!dryRun) await store.addEstimate(h.token, est);
        // reflect the new estimate locally so the email shows it
        h.estimates.push(est);
        refreshed++;
      }
      if (!dryRun) {
        const r = await sendValueEmail(h);
        if (r.sent) {
          await store.markEmailed(h.token);
          emailed++;
        } else if (r.reason) {
          errors.push(`${h.token}: ${r.reason}`);
        }
      }
    } catch (e) {
      errors.push(`${h.token}: ${String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    eligible: eligibleList.length,
    skippedIneligible,
    segment: { source: sourceParam || null, engagedOnly },
    limit,
    attempted: batch.length,
    refreshed,
    emailed,
    remaining,
    dryRun,
    errors: errors.slice(0, 10),
  });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
