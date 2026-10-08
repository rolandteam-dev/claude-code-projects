import { NextResponse } from "next/server";
import {
  propertyIntelData,
  segmentWatchData,
  renderPropertyIntelEmail,
  renderSegmentWatchEmail,
  sendReportEmail,
} from "@/lib/reports/daily";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily internal reports: Property Intelligence (homes in your DB recently
 * listed/sold) + Segment Watch (what's new per segment). Our replacement for
 * the Fello emails of the same names.
 *
 * OFF by default: the scheduled run no-ops unless REPORTS_ENABLED === "true".
 * An admin `?key=` run always works, and `&dryRun=1` returns the data/counts
 * without sending. `&report=property|segment|both` (default both).
 * Window: REPORTS_WINDOW_DAYS (default 2). Recipients: REPORTS_EMAIL_TO
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
  const which = (params.get("report") || "both").toLowerCase();
  const windowDays = Math.min(Math.max(Number(params.get("days") ?? process.env.REPORTS_WINDOW_DAYS ?? 2) || 2, 1), 30);

  const out: Record<string, unknown> = { ok: true, mode: dryRun ? "dry-run" : "send", windowDays };

  if (which === "property" || which === "both") {
    const data = await propertyIntelData(windowDays);
    const subject = `Property Intelligence Summary — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    out.property = { listings: data.listings.length, solds: data.solds.length };
    if (!dryRun) {
      const r = await sendReportEmail(subject, renderPropertyIntelEmail(data));
      (out.property as Record<string, unknown>).sent = r.sent;
      if (!r.sent) (out.property as Record<string, unknown>).reason = r.reason;
    }
  }

  if (which === "segment" || which === "both") {
    const data = await segmentWatchData(windowDays);
    const subject = `(Segment Watch) Daily Summary — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    out.segment = { segments: data.segments };
    if (!dryRun) {
      const r = await sendReportEmail(subject, renderSegmentWatchEmail(data));
      (out.segment as Record<string, unknown>).sent = r.sent;
      if (!r.sent) (out.segment as Record<string, unknown>).reason = r.reason;
    }
  }

  return NextResponse.json(out);
}
