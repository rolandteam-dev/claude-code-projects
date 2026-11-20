import { NextResponse } from "next/server";
import { listRecent, offersDbConfigured } from "@/lib/offers/db";

export const runtime = "nodejs";

/**
 * Read-only view of the Offer Machine queue: `/api/admin/offers?key=ADMIN_TOKEN`.
 *
 * Deliberately thin — type, status, address and timing only. Buyer names, prices
 * and FUB ids stay in the database; this endpoint exists to answer "is the
 * machine keeping up?", not to browse client data.
 */
export async function GET(req: Request) {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin || new URL(req.url).searchParams.get("key") !== admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!offersDbConfigured()) return NextResponse.json({ ok: true, skipped: "no database configured" });

  const jobs = await listRecent(50);
  const counts: Record<string, number> = {};
  for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;

  return NextResponse.json({
    ok: true,
    counts,
    jobs: jobs.map((j) => ({
      id: j.id,
      type: j.jobType,
      status: j.status,
      requestedBy: j.requestedBy,
      address: j.inputs.address,
      attempts: j.attempts,
      mismatches: j.result?.mismatches.length ?? 0,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      ...(j.error ? { error: j.error } : {}),
    })),
  });
}
