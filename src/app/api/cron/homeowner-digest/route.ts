import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { fetchEstimate } from "@/lib/homeowners/avm";
import { sendValueEmail } from "@/lib/homeowners/email";

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

  const store = homeownerStore();
  const due = await store.listDueForEmail(Number.isFinite(days) ? days : 14);

  let refreshed = 0;
  let emailed = 0;
  const errors: string[] = [];

  for (const h of due) {
    try {
      const est = await fetchEstimate(h);
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
    refreshed,
    emailed,
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
