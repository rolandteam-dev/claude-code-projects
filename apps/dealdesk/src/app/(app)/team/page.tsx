import { requireAuth } from "@/lib/auth";
import { listTeamMembers } from "@/lib/repo/deals";
import { Card, Container, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const ROLE_DESCRIPTION: Record<string, string> = {
  owner: "Full access to every deal on the team",
  admin: "Full access to every deal on the team",
  agent: "Sees deals they own or are assigned to",
  tc: "Sees deals they are assigned to",
};

export default async function TeamPage() {
  const ctx = await requireAuth();
  const members = await listTeamMembers(ctx);

  return (
    <Container>
      <h1 className="text-2xl font-semibold tracking-tight">{ctx.team.name}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        {members.length} {members.length === 1 ? "member" : "members"} ·{" "}
        {ctx.team.timezone}
      </p>

      <SectionTitle hint="Invites land with Clerk in Phase 0 follow-up">
        Members
      </SectionTitle>
      <Card className="divide-y divide-border">
        {members.map((m) => (
          <div
            key={m.userId}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <div className="text-sm font-medium">{m.name ?? m.email}</div>
              <div className="text-xs text-ink-muted">{m.email}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium capitalize">{m.role}</div>
              <div className="text-xs text-ink-subtle">
                {ROLE_DESCRIPTION[m.role]}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </Container>
  );
}
