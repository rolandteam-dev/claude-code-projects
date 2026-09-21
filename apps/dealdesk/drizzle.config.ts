import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next loads .env.local automatically; drizzle-kit does not, so do it here.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations run as the owner, not as the restricted app role.
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
