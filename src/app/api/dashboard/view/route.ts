import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { isFirstToday, sendHomeownerActivity } from "@/lib/homeowners/fubActivity";
import { notifyAssignedAgent } from "@/lib/homeowners/agentAlert";

export const runtime = "nodejs";

/** Distinct calendar days (UTC) with a view inside the last `windowDays`. */
function distinctViewDays(views: string[] | undefined, windowDays: number): Set<string> {
  const cutoff = Date.now() - windowDays * 86_400_000;
  const days = new Set<string>();
  for (const v of views ?? []) {
    const t = Date.parse(v);
    if (Number.isFinite(t) && t >= cutoff) days.add(v.slice(0, 10));
  }
  return days;
}

/**
 * Logs a homeowner dashboard view — the raw engagement signal behind the
 * behavioral propensity score. Fire-and-forget from the dashboard on load.
 *
 * Also writes the view to Follow Up Boss as an event, because a view recorded
 * only here is invisible to the agents' saved calling filters. Throttled to the
 * first view of each day: a homeowner refreshing the page should be one signal,
 * not ten. The read happens before recordView so today's own view doesn't
 * suppress its own event.
 */
export async function POST(req: Request) {
  let token: string | undefined;
  try {
    ({ token } = (await req.json()) as { token?: string });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const store = homeownerStore();
    const homeowner = await store.getByToken(token);
    const firstViewToday = isFirstToday(homeowner?.views);
    await store.recordView(token);
    if (homeowner && firstViewToday) {
      await sendHomeownerActivity("dashboard-view", homeowner);

      // Repeat viewer: fire ONCE when they cross 3 distinct viewing days in the
      // last 7 (counting today). Distinct days — not raw loads — so refreshes
      // don't inflate it. Only checked on the first view of the day, and only at
      // exactly 3, so it can't re-fire on later visits.
      const days = distinctViewDays(homeowner.views, 7);
      days.add(new Date().toISOString().slice(0, 10)); // ensure today is counted (driver-agnostic)
      if (days.size === 3) {
        await sendHomeownerActivity("repeat-viewer", homeowner);
        await notifyAssignedAgent(
          {
            firstName: homeowner.firstName,
            lastName: homeowner.lastName,
            email: homeowner.email,
            phone: homeowner.phone,
            address: `${homeowner.address}, ${homeowner.city}, ${homeowner.state} ${homeowner.zip}`.trim(),
            type: "Seller Inquiry",
            tags: ["Repeat Viewer"],
            message: "Checked their home value on 3+ days in the last week — actively watching. Worth a proactive call.",
          },
          { force: true, signal: "Repeat Viewer — Checking Value" },
        );
      }
    }
  } catch {
    // Never let engagement logging break the page.
  }
  return NextResponse.json({ ok: true });
}
