/**
 * Drops every table and re-applies migrations from scratch.
 * Local convenience only — it destroys data.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { sql } from "drizzle-orm";
import { getAdminDb } from ".";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to reset the database in production.");
}

async function main() {
  const db = getAdminDb();
  console.log("Dropping schema public…");
  await db.execute(sql`drop schema public cascade`);
  await db.execute(sql`create schema public`);
  console.log("Done. Now run: npm run db:migrate && npm run db:seed");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
