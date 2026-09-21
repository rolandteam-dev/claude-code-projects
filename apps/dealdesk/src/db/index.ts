import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { env, isProduction } from "@/lib/env";
import * as schema from "./schema";

export { schema };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function client(url: string) {
  // prepare: false keeps this safe behind transaction-mode connection poolers.
  return postgres(url, { max: 5, prepare: false });
}

let appDbSingleton: ReturnType<typeof buildAppDb> | undefined;
let adminDbSingleton: ReturnType<typeof buildAdminDb> | undefined;

function buildAppDb() {
  const appUrl = env.databaseUrlApp();
  if (!appUrl) {
    if (isProduction) {
      throw new Error(
        "DATABASE_URL_APP is required in production: the app must connect as " +
          "the RLS-restricted role, not as the database owner.",
      );
    }
    console.warn(
      "[db] DATABASE_URL_APP is unset — falling back to DATABASE_URL. " +
        "Row-level security is NOT enforced in this mode. Local use only.",
    );
    return drizzle(client(env.databaseUrl()), { schema });
  }
  return drizzle(client(appUrl), { schema });
}

function buildAdminDb() {
  return drizzle(client(env.databaseUrl()), { schema });
}

/**
 * Runtime connection. Every tenant-scoped read and write should go through
 * `withTeam`, which additionally pins the RLS team context.
 */
export function getAppDb() {
  appDbSingleton ??= buildAppDb();
  return appDbSingleton;
}

/**
 * Owner connection — bypasses RLS. Legitimate uses: migrations, the cron job
 * runner, and inbound webhook handlers that must resolve which tenant an
 * address or phone number belongs to before any team context exists.
 * Anything else should be using `withTeam`.
 */
export function getAdminDb() {
  adminDbSingleton ??= buildAdminDb();
  return adminDbSingleton;
}

export type Tx = Parameters<
  Parameters<ReturnType<typeof getAppDb>["transaction"]>[0]
>[0];

/**
 * Opens a transaction with the RLS team context pinned for its duration, then
 * runs `fn` inside it.
 *
 * `set_config(..., true)` is transaction-local, so the context cannot leak to
 * the next request that reuses this pooled connection. We use set_config rather
 * than `SET LOCAL` because SET does not accept bind parameters.
 */
export async function withTeam<T>(
  teamId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(teamId)) {
    throw new Error(`withTeam called with a non-uuid teamId: ${teamId}`);
  }
  const db = getAppDb();
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_team_id', ${teamId}, true)`,
    );
    return fn(tx);
  });
}
