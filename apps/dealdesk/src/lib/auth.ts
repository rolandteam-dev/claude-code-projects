import { eq } from "drizzle-orm";
import { getAdminDb } from "@/db";
import * as s from "@/db/schema";
import { env, isProduction } from "./env";

export type Role = "owner" | "admin" | "agent" | "tc";

export type AuthContext = {
  user: { id: string; email: string; name: string | null };
  team: { id: string; name: string; slug: string; timezone: string };
  role: Role;
  /** True when this session came from the local dev bypass, not a real login. */
  isDevBypass: boolean;
};

/**
 * Resolving who is calling requires reading across tenants (we do not yet know
 * which team the caller belongs to), so this bootstrap lookup uses the owner
 * connection. Everything downstream of it goes through withTeam().
 */
async function loadContext(
  where: { externalUserId: string } | { email: string },
): Promise<Omit<AuthContext, "isDevBypass"> | null> {
  const db = getAdminDb();
  const [user] = await db
    .select()
    .from(s.users)
    .where(
      "externalUserId" in where
        ? eq(s.users.externalUserId, where.externalUserId)
        : eq(s.users.email, where.email),
    )
    .limit(1);

  if (!user) return null;

  // First active membership wins. Multi-team switching is a later phase; the
  // shape here already supports it.
  const [membership] = await db
    .select({ team: s.teams, role: s.teamMembers.role })
    .from(s.teamMembers)
    .innerJoin(s.teams, eq(s.teams.id, s.teamMembers.teamId))
    .where(eq(s.teamMembers.userId, user.id))
    .limit(1);

  if (!membership) return null;

  return {
    user: { id: user.id, email: user.email, name: user.name },
    team: {
      id: membership.team.id,
      name: membership.team.name,
      slug: membership.team.slug,
      timezone: membership.team.timezone,
    },
    role: membership.role as Role,
  };
}

/**
 * The single place that answers "who is calling, and for which team".
 *
 * Two providers:
 *   - Clerk, when both keys are configured (the real path)
 *   - A local dev bypass keyed on DEV_AUTH_EMAIL, so the app and its seed data
 *     are usable before a Clerk account exists
 *
 * The bypass is refused outright in production — not merely ignored — so a
 * misconfigured deploy fails loudly instead of silently authenticating someone.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  if (env.clerk.configured()) {
    // Imported lazily: @clerk/nextjs/server throws when keys are absent, and
    // the dev-bypass path must not depend on Clerk being installed or set up.
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    const ctx = await loadContext({ externalUserId: userId });
    return ctx ? { ...ctx, isDevBypass: false } : null;
  }

  const devEmail = env.devAuthEmail();
  if (!devEmail) return null;

  if (isProduction) {
    throw new Error(
      "DEV_AUTH_EMAIL is set in a production build. Refusing to authenticate. " +
        "Configure Clerk (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY) " +
        "and remove DEV_AUTH_EMAIL.",
    );
  }

  const ctx = await loadContext({ email: devEmail });
  return ctx ? { ...ctx, isDevBypass: true } : null;
}

/** For pages and handlers that must not render without a session. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error("Not authenticated");
  }
  return ctx;
}

const ROLE_RANK: Record<Role, number> = {
  owner: 4,
  admin: 3,
  tc: 2,
  agent: 1,
};

export function hasAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/**
 * Owners and admins see the whole team's pipeline. Agents and TCs see only what
 * they own or are attached to — enforced in the query layer, not the UI.
 */
export function canSeeAllTeamDeals(role: Role): boolean {
  return role === "owner" || role === "admin";
}
