import { NextResponse } from "next/server";
import { homeownerStore, engagementScore } from "@/lib/homeowners/store";
import { sendFubLead } from "@/lib/fub";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Push the hot list to Follow Up Boss: tag every homeowner at or above the
 * engagement threshold as a "Hot Seller" so they surface in the agent's CRM
 * workflow. Recomputes the list server-side (never trusts the client) and is
 * gated by ADMIN_TOKEN. Best-effort per contact; returns how many were tagged.
 */
export async function POST(req: Request) {
  let body: { key?: string; minScore?: number };
  try {
    body = (await req.json()) as { key?: string; minScore?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const expected = process.env.ADMIN_TOKEN;
  if (!expected || body.key !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.FUB_API_KEY) {
    return NextResponse.json({ ok: false, error: "Follow Up Boss isn't connected (FUB_API_KEY not set)." }, { status: 200 });
  }

  const minScore = Number.isFinite(body.minScore) ? Number(body.minScore) : 60;
  const all = await homeownerStore().list();
  const hot = all.filter((h) => h.email && engagementScore(h) >= minScore);

  let pushed = 0;
  for (const h of hot) {
    const score = engagementScore(h);
    const r = await sendFubLead({
      firstName: h.firstName,
      lastName: h.lastName,
      email: h.email,
      phone: h.phone,
      address: h.address,
      city: h.city,
      state: h.state,
      zip: h.zip,
      type: "Seller Inquiry",
      source: "Seller Radar",
      tags: ["Seller Radar", "Hot Seller"],
      message: `Seller Radar hot signal — engagement ${score}/100 from ${h.views.length} dashboard view${
        h.views.length === 1 ? "" : "s"
      }.`,
    });
    if (r.sent) pushed++;
  }

  return NextResponse.json({ ok: true, pushed, considered: hot.length });
}
