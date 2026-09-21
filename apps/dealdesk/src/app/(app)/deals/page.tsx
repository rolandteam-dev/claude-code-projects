import Link from "next/link";
import { requireAuth, canSeeAllTeamDeals } from "@/lib/auth";
import { listDeals } from "@/lib/repo/deals";
import { formatIso, diffDays, today } from "@/lib/dates";
import {
  Card,
  Container,
  ProgressBar,
  RiskPill,
  formatMoney,
} from "@/components/ui";

export const dynamic = "force-dynamic";

function daysToClose(coe: string | null): string {
  if (!coe) return "—";
  const days = diffDays(today(), coe);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Closes today";
  return `${days}d to close`;
}

export default async function DealsPage() {
  const ctx = await requireAuth();
  const deals = await listDeals(ctx);

  const atRisk = deals.filter((d) => d.riskLevel === "critical").length;

  return (
    <Container>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Active pipeline
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {deals.length} active {deals.length === 1 ? "deal" : "deals"}
            {atRisk > 0 ? (
              <>
                {" · "}
                <span className="font-medium text-risk-critical">
                  {atRisk} needing attention
                </span>
              </>
            ) : null}
            {canSeeAllTeamDeals(ctx.role)
              ? " · whole team"
              : " · yours and assigned"}
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-ink-muted">
            No active deals. Run <code className="font-mono">npm run db:seed</code>{" "}
            to load sample data.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="transition-shadow hover:shadow-md">
              <Link href={`/deals/${deal.id}`} className="block p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate text-base font-semibold">
                        {deal.addressLine1}
                      </h3>
                      <RiskPill level={deal.riskLevel} score={deal.riskScore} />
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {deal.city}, {deal.state} ·{" "}
                      <span className="numeric">
                        {formatMoney(deal.purchasePriceCents)}
                      </span>
                      {deal.ownerName ? ` · ${deal.ownerName}` : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="numeric text-sm font-medium">
                      {daysToClose(deal.closeOfEscrowDate)}
                    </div>
                    <div className="numeric text-xs text-ink-subtle">
                      COE {formatIso(deal.closeOfEscrowDate)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <ProgressBar
                    done={deal.doneCount}
                    total={deal.totalCount}
                    level={deal.riskLevel}
                  />
                  <div className="text-sm text-ink-muted sm:text-right">
                    Next:{" "}
                    <span className="font-medium text-ink">
                      {deal.nextStepLabel ?? "Complete"}
                    </span>
                    {deal.nextStepDueDate ? (
                      <span className="numeric text-ink-subtle">
                        {" "}
                        · {formatIso(deal.nextStepDueDate)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {deal.topFlagMessage ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-risk-critical-soft px-3 py-2 text-sm text-risk-critical">
                    <span aria-hidden>▲</span>
                    <span>
                      {deal.topFlagMessage}
                      {deal.openFlagCount > 1 ? (
                        <span className="opacity-70">
                          {" "}
                          (+{deal.openFlagCount - 1} more)
                        </span>
                      ) : null}
                    </span>
                  </p>
                ) : null}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
