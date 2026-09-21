/**
 * Environment access in one place, so a missing variable fails loudly at the
 * boundary instead of surfacing as a confusing runtime error deep in a request.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const isProduction = process.env.NODE_ENV === "production";

export const env = {
  /**
   * Owner connection. Runs migrations and the small number of legitimately
   * cross-tenant paths (cron, inbound webhooks resolving which tenant an
   * address belongs to). Bypasses RLS — treat every use as needing a reason.
   */
  databaseUrl: () => required("DATABASE_URL"),

  /**
   * Restricted runtime connection. RLS is FORCEd on this role, so a forgotten
   * `where team_id = ...` cannot leak another tenant's pipeline.
   * Falls back to DATABASE_URL only outside production, and says so loudly.
   */
  databaseUrlApp: () => optional("DATABASE_URL_APP"),

  appBaseUrl: () => optional("APP_BASE_URL") ?? "http://localhost:3000",

  clerk: {
    publishableKey: () => optional("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    secretKey: () => optional("CLERK_SECRET_KEY"),
    /** True once both halves are present. */
    configured: () =>
      Boolean(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
          process.env.CLERK_SECRET_KEY,
      ),
  },

  /**
   * Local-only auth bypass so the app is runnable (and the seed data visible)
   * before a Clerk account exists. Hard-refused in production — see lib/auth.ts.
   */
  devAuthEmail: () => optional("DEV_AUTH_EMAIL"),

  cronSecret: () => optional("CRON_SECRET"),
} as const;
