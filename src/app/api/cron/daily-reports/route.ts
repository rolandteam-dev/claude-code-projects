import { NextResponse } from "next/server";
import {
  gatherDailyData,
  dailyCounts,
  renderPropertyIntelEmail,
  renderSegmentWatchEmail,
  sendReportEmail,
} from "@/lib/reports/daily";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily internal reports: Property Intelligence (homes in your DB newly
 * listed/sold) + Segment Watch (what's new per segment). Our replacement for
 * the Fello emails of the same names.
 *
 * Reports NEW items (deduped) from a wide look-back window — because MLS data
 * lags, a tight date window shows nothing. OFF by default: the scheduled run
 * no-ops unless REPORTS_ENABLED === "true". An admin `?key=` run always works,
 * and `&dryRun=1` returns the counts without sending (and without marking items
 * seen). Window: REPORTS_WINDOW_DAYS (default 45). Recipients: REPORTS_EMAIL_TO
 * (falls back to AGENT_ALERT_TO, then the team email).
 *
 * Auth: CRON_SECRET (Vercel Cron / `?secret=`) or ADMIN_TOKEN (`?key=`).
 */
function auth(req: Request): { ok: boolean; admin: boolean } {
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

export async function GET(req: Request) {
  const a = auth(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  if (!a.admin && process.env.REPORTS_ENABLED !== "true") {
    return NextResponse.json({ ok: true, skipped: "reports off (set REPORTS_ENABLED=true to run on schedule)" });
  }

  const params = new URL(req.url).searchParams;
  const dryRun = params.get("dryRun") === "1";
  const windowDays = Math.min(Math.max(Number(params.get("days") ?? process.env.REPORTS_WINDOW_DAYS ?? 45) || 45, 1), 120);

  // Gather once (dedup shared across both emails). dryRun does not mark items seen.
  const data = await gatherDailyData(windowDays, dryRun);
  const out: Record<string, unknown> = { ok: true, mode: dryRun ? "dry-run" : "send", ...dailyCounts(data) };

  if (!dryRun) {
    const stamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sends: Record<string, unknown> = {};
    const p = await sendReportEmail(`Property Intelligence Summary — ${stamp}`, renderPropertyIntelEmail(data));
    sends.property = p.sent ? "sent" : p.reason;
    const s = await sendReportEmail(`(Segment Watch) Daily Summary — ${stamp}`, renderSegmentWatchEmail(data));
    sends.segment = s.sent ? "sent" : s.reason;
    out.sends = sends;
  }

  return NextResponse.json(out);
}
