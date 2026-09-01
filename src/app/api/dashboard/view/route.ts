import { NextResponse } from "next/server";
import { homeownerStore } from "@/lib/homeowners/store";

export const runtime = "nodejs";

/**
 * Logs a homeowner dashboard view — the raw engagement signal behind the
 * behavioral propensity score. Fire-and-forget from the dashboard on load.
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
    await homeownerStore().recordView(token);
  } catch {
    // Never let engagement logging break the page.
  }
  return NextResponse.json({ ok: true });
}
