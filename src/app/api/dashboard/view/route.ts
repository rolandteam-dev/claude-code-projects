import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";
import { isFirstToday, sendHomeownerActivity } from "@/lib/homeowners/fubActivity";

export const runtime = "nodejs";

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
    }
  } catch {
    // Never let engagement logging break the page.
  }
  return NextResponse.json({ ok: true });
}
