import { NextResponse } from "next/server";
import { distressAuth } from "@/lib/distress/auth";
import { distressDbConfigured, summary } from "@/lib/distress/db";
import { pushConfig } from "@/lib/distress/push";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Seller Engine overview: parcel counts, how many lists each owner stacks on,
 * phone Do Not Call status and the current top 25.
 * GET /api/admin/distress?key=ADMIN_TOKEN
 */
export async function GET(req: Request) {
  if (!distressAuth(req, { allowCron: false }).ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!distressDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured (DATABASE_URL)." }, { status: 200 });
  }
  const cfg = pushConfig();
  return NextResponse.json({ ok: true, push: { ...cfg, agents: cfg.agents.length }, ...(await summary()) });
}
