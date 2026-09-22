import { NextResponse } from "next/server";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { eligibilityBucket, type EligibilityBucket } from "@/lib/homeowners/eligibility";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * READ-ONLY audit of the homeowner store (ADMIN_TOKEN-gated). Buckets every
 * scanned row by eligibility so we can see how many out-of-state / junk-email
 * contacts are already in the table. Writes, deletes, and sends NOTHING.
 *
 * Usage: /api/admin/audit-homeowners?key=ADMIN_TOKEN&limit=5000
 */
const BUCKETS: EligibilityBucket[] = ["eligible", "invalid-email", "out-of-state", "unknown-location"];

function sampleOf(h: Homeowner) {
  return { token: h.token, email: h.email, address: h.address, city: h.city, state: h.state, zip: h.zip };
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (!process.env.ADMIN_TOKEN || params.get("key") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 5000) || 5000, 1), 50000);
  const rows = await homeownerStore().list(limit);

  const counts = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<EligibilityBucket, number>;
  const samples = Object.fromEntries(BUCKETS.map((b) => [b, [] as ReturnType<typeof sampleOf>[]])) as Record<
    EligibilityBucket,
    ReturnType<typeof sampleOf>[]
  >;
  const outOfStateStates: Record<string, number> = {};

  for (const h of rows) {
    const bucket = eligibilityBucket({ email: h.email, state: h.state, zip: h.zip });
    counts[bucket]++;
    if (samples[bucket].length < 5) samples[bucket].push(sampleOf(h));
    if (bucket === "out-of-state") {
      const st = (h.state || "?").toUpperCase();
      outOfStateStates[st] = (outOfStateStates[st] ?? 0) + 1;
    }
  }

  const scanned = rows.length;
  const pct = (n: number) => (scanned ? Math.round((n / scanned) * 1000) / 10 : 0);
  const percentages = Object.fromEntries(BUCKETS.map((b) => [b, pct(counts[b])])) as Record<EligibilityBucket, number>;
  const topOutOfStateStates = Object.entries(outOfStateStates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([state, count]) => ({ state, count }));

  return NextResponse.json({
    ok: true,
    scanned,
    limit,
    counts,
    percentages,
    samples,
    topOutOfStateStates,
  });
}
