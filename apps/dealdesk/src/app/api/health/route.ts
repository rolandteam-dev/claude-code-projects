import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getAdminDb } from "@/db";

/** Liveness + database reachability. Deliberately leaks no configuration. */
export async function GET() {
  try {
    await getAdminDb().execute(sql`select 1`);
    return NextResponse.json({ ok: true, database: "reachable" });
  } catch {
    return NextResponse.json(
      { ok: false, database: "unreachable" },
      { status: 503 },
    );
  }
}
