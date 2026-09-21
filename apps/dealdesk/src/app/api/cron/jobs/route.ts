import { NextResponse } from "next/server";
import { drainJobs, requeueStale } from "@/lib/jobs";
import { env, isProduction } from "@/lib/env";

/**
 * Job runner. Vercel Cron calls this once a minute with
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * Fails closed: without CRON_SECRET configured in production the endpoint
 * refuses to run rather than exposing a public trigger.
 */
function authorize(request: Request): { ok: true } | { ok: false; body: string } {
  const secret = env.cronSecret();
  if (!secret) {
    if (isProduction) {
      return { ok: false, body: "CRON_SECRET is not configured" };
    }
    return { ok: true }; // local convenience only
  }
  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return { ok: false, body: "Unauthorized" };
  }
  return { ok: true };
}

export async function GET(request: Request) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.body }, { status: 401 });
  }

  const requeued = await requeueStale();
  const result = await drainJobs();

  return NextResponse.json({
    ok: true,
    requeuedStale: requeued,
    ...result,
  });
}
