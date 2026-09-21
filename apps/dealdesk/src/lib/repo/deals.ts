import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { withTeam } from "@/db";
import * as s from "@/db/schema";
import { canSeeAllTeamDeals, type AuthContext } from "@/lib/auth";
import type { IsoDate } from "@/lib/dates";

export type DealListItem = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  status: string;
  riskScore: number;
  riskLevel: "info" | "warn" | "critical" | null;
  purchasePriceCents: number | null;
  acceptanceDate: IsoDate | null;
  closeOfEscrowDate: IsoDate | null;
  ownerName: string | null;
  doneCount: number;
  totalCount: number;
  openFlagCount: number;
  topFlagMessage: string | null;
  nextStepLabel: string | null;
  nextStepDueDate: IsoDate | null;
};

/**
 * Visibility rule in one place: owners and admins see the team's whole
 * pipeline; agents and TCs see deals they own or are assigned to.
 *
 * RLS already guarantees we cannot cross tenants; this is the narrower
 * within-team rule on top of it.
 */
function visibilityFilter(ctx: AuthContext) {
  if (canSeeAllTeamDeals(ctx.role)) return undefined;
  return or(
    eq(s.deals.ownerUserId, ctx.user.id),
    sql`exists (
      select 1 from ${s.dealAssignees} da
      where da.deal_id = ${s.deals.id} and da.user_id = ${ctx.user.id}
    )`,
  );
}

/** Dashboard query: active deals, most at-risk first. */
export async function listDeals(ctx: AuthContext): Promise<DealListItem[]> {
  return withTeam(ctx.team.id, async (tx) => {
    const rows = await tx
      .select({
        id: s.deals.id,
        addressLine1: s.deals.addressLine1,
        city: s.deals.city,
        state: s.deals.state,
        status: s.deals.status,
        riskScore: s.deals.riskScore,
        riskLevel: s.deals.riskLevel,
        purchasePriceCents: s.deals.purchasePriceCents,
        acceptanceDate: s.deals.acceptanceDate,
        closeOfEscrowDate: s.deals.closeOfEscrowDate,
        ownerName: s.users.name,
      })
      .from(s.deals)
      .leftJoin(s.users, eq(s.users.id, s.deals.ownerUserId))
      .where(
        and(
          inArray(s.deals.status, ["draft", "active", "paused"]),
          isNull(s.deals.archivedAt),
          visibilityFilter(ctx),
        ),
      )
      .orderBy(desc(s.deals.riskScore), asc(s.deals.closeOfEscrowDate));

    if (rows.length === 0) return [];
    const dealIds = rows.map((r) => r.id);

    const milestones = await tx
      .select({
        dealId: s.dealMilestones.dealId,
        key: s.dealMilestones.key,
        label: s.dealMilestones.label,
        status: s.dealMilestones.status,
        dueDate: s.dealMilestones.dueDate,
        sortOrder: s.dealMilestones.sortOrder,
      })
      .from(s.dealMilestones)
      .where(inArray(s.dealMilestones.dealId, dealIds))
      .orderBy(asc(s.dealMilestones.sortOrder));

    const flags = await tx
      .select({
        dealId: s.dealRiskFlags.dealId,
        severity: s.dealRiskFlags.severity,
        message: s.dealRiskFlags.message,
      })
      .from(s.dealRiskFlags)
      .where(
        and(
          inArray(s.dealRiskFlags.dealId, dealIds),
          isNull(s.dealRiskFlags.resolvedAt),
        ),
      );

    return rows.map((deal) => {
      const mine = milestones.filter((m) => m.dealId === deal.id);
      const next = mine.find((m) => m.status !== "done" && m.status !== "na");
      const dealFlags = flags.filter((f) => f.dealId === deal.id);
      const critical = dealFlags.find((f) => f.severity === "critical");
      return {
        ...deal,
        doneCount: mine.filter((m) => m.status === "done").length,
        totalCount: mine.length,
        openFlagCount: dealFlags.length,
        topFlagMessage: (critical ?? dealFlags[0])?.message ?? null,
        nextStepLabel: next?.label ?? null,
        nextStepDueDate: next?.dueDate ?? null,
      };
    });
  });
}

export type DealDetail = Awaited<ReturnType<typeof getDeal>>;

export async function getDeal(ctx: AuthContext, dealId: string) {
  return withTeam(ctx.team.id, async (tx) => {
    const [deal] = await tx
      .select()
      .from(s.deals)
      .where(and(eq(s.deals.id, dealId), visibilityFilter(ctx)))
      .limit(1);

    if (!deal) return null;

    const [milestones, dates, parties, flags, audit] = await Promise.all([
      tx
        .select()
        .from(s.dealMilestones)
        .where(eq(s.dealMilestones.dealId, dealId))
        .orderBy(asc(s.dealMilestones.sortOrder)),
      tx
        .select()
        .from(s.dealDates)
        .where(
          and(eq(s.dealDates.dealId, dealId), isNull(s.dealDates.supersededById)),
        ),
      tx
        .select({
          role: s.dealParties.role,
          side: s.dealParties.side,
          firstName: s.contacts.firstName,
          lastName: s.contacts.lastName,
          company: s.contacts.company,
          email: s.contacts.email,
          phoneE164: s.contacts.phoneE164,
          contactId: s.contacts.id,
        })
        .from(s.dealParties)
        .innerJoin(s.contacts, eq(s.contacts.id, s.dealParties.contactId))
        .where(eq(s.dealParties.dealId, dealId)),
      tx
        .select()
        .from(s.dealRiskFlags)
        .where(
          and(
            eq(s.dealRiskFlags.dealId, dealId),
            isNull(s.dealRiskFlags.resolvedAt),
          ),
        )
        .orderBy(desc(s.dealRiskFlags.severity)),
      tx
        .select()
        .from(s.auditEvents)
        .where(eq(s.auditEvents.dealId, dealId))
        .orderBy(desc(s.auditEvents.createdAt))
        .limit(25),
    ]);

    return { deal, milestones, dates, parties, flags, audit };
  });
}

export async function listTeamMembers(ctx: AuthContext) {
  return withTeam(ctx.team.id, async (tx) =>
    tx
      .select({
        userId: s.users.id,
        name: s.users.name,
        email: s.users.email,
        role: s.teamMembers.role,
        status: s.teamMembers.status,
      })
      .from(s.teamMembers)
      .innerJoin(s.users, eq(s.users.id, s.teamMembers.userId))
      .where(eq(s.teamMembers.teamId, ctx.team.id))
      .orderBy(asc(s.users.name)),
  );
}
