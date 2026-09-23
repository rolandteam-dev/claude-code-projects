import { NextResponse } from "next/server";
import { FUB_BASE, fubHeaders } from "@/lib/homeowners/fubMap";

export const runtime = "nodejs";

/**
 * Admin: list Follow Up Boss custom fields (name + API key) so you can find the
 * exact key to set as FUB_DASHBOARD_FIELD. ADMIN_TOKEN-gated, read-only.
 * Usage: /api/admin/fub-custom-fields?key=ADMIN_TOKEN
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.FUB_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "FUB_API_KEY not set" });

  try {
    const res = await fetch(`${FUB_BASE}/v1/customFields?limit=100`, { headers: fubHeaders(key) });
    if (!res.ok) return NextResponse.json({ ok: false, error: `FUB ${res.status}`, body: (await res.text()).slice(0, 300) });
    const data: any = await res.json();
    const fields = (Array.isArray(data?.customfields) ? data.customfields : data?.customFields ?? []).map((f: any) => ({
      label: f.label ?? f.name,
      apiKey: f.name, // FUB's API field key, e.g. "customHomeDashboard"
      type: f.type,
    }));
    return NextResponse.json({
      ok: true,
      count: fields.length,
      currentDashboardField: process.env.FUB_DASHBOARD_FIELD ?? null,
      fields,
      note: "Set FUB_DASHBOARD_FIELD to the apiKey of your dashboard-link field.",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
