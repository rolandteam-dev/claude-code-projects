import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getDeal } from "@/lib/repo/deals";
import { formatIso } from "@/lib/dates";
import { RULESET_STATUS } from "@/lib/deadlines";
import {
  Card,
  Container,
  ProgressBar,
  RiskPill,
  SectionTitle,
  SourceTag,
  formatMoney,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_MARK: Record<string, { mark: string; className: string }> = {
  done: { mark: "✓", className: "bg-risk-ok text-white" },
  in_progress: { mark: "◐", className: "bg-risk-warn text-white" },
  blocked: { mark: "!", className: "bg-risk-critical text-white" },
  na: { mark: "–", className: "bg-surface-sunken text-ink-subtle" },
  pending: { mark: "", className: "border border-border-strong bg-surface" },
};

const ROLE_LABEL: Record<string, string> = {
  buyer: "Buyer",
  seller: "Seller",
  buyer_agent: "Buyer's agent",
  listing_agent: "Listing agent",
  loan_officer: "Loan officer",
  escrow_officer: "Escrow officer",
  title_officer: "Title officer",
  tc: "Transaction coordinator",
  inspector: "Inspector",
  other: "Other",
};

export default async function DealPage({
  params,
}: {
  // Next 16: params is a promise.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuth();
  const detail = await getDeal(ctx, id);
  if (!detail) notFound();

  const { deal, milestones, dates, parties, flags, audit } = detail;
  const doneCount = milestones.filter((m) => m.status === "done").length;

  return (
    <Container>
      <Link
        href="/deals"
        className="text-sm text-ink-muted hover:text-ink hover:underline"
      >
        ← Pipeline
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {deal.addressLine1}
            </h1>
            <RiskPill level={deal.riskLevel} score={deal.riskScore} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {deal.city}, {deal.state} {deal.postalCode} ·{" "}
            <span className="numeric">
              {formatMoney(deal.purchasePriceCents)}
            </span>
            {deal.mlsNumber ? ` · MLS ${deal.mlsNumber}` : null}
            {deal.escrowNumber ? ` · ${deal.escrowNumber}` : null}
          </p>
        </div>
        <div className="w-64">
          <ProgressBar
            done={doneCount}
            total={milestones.length}
            level={deal.riskLevel}
          />
        </div>
      </div>

      {flags.length > 0 ? (
        <Card className="mb-6 border-risk-critical/30 bg-risk-critical-soft p-4">
          <h2 className="text-sm font-semibold text-risk-critical">
            Needs attention
          </h2>
          <ul className="mt-2 space-y-1">
            {flags.map((flag) => (
              <li key={flag.id} className="text-sm text-risk-critical">
                ▲ {flag.message}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle hint="Read-only in Phase 0 — editing lands in Phase 2">
            Milestone timeline
          </SectionTitle>
          <Card className="divide-y divide-border">
            {milestones.map((m) => {
              const mark = STATUS_MARK[m.status] ?? STATUS_MARK.pending;
              return (
                <div key={m.id} className="flex items-center gap-4 p-4">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${mark.className}`}
                    aria-hidden
                  >
                    {mark.mark}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        className={`text-sm font-medium ${
                          m.status === "done" ? "text-ink-muted" : "text-ink"
                        }`}
                      >
                        {m.label}
                      </span>
                      {m.isDeadline ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-risk-warn">
                          deadline
                        </span>
                      ) : null}
                    </div>
                    {m.clientLabel && m.clientLabel !== m.label ? (
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        Client sees: “{m.clientLabel}”
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="numeric text-sm">{formatIso(m.dueDate)}</div>
                    <div className="text-xs text-ink-subtle">
                      {m.status === "done" ? "complete" : m.status.replace("_", " ")}
                      <SourceTag source={m.dueDateSource} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>

        <div className="space-y-6">
          <section>
            <SectionTitle hint={`ruleset: ${RULESET_STATUS}`}>
              Contract dates
            </SectionTitle>
            <Card className="divide-y divide-border">
              {dates
                .slice()
                .sort((a, b) => a.value.localeCompare(b.value))
                .map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="text-sm text-ink-muted">
                      {d.key.replace(/_/g, " ")}
                    </span>
                    <span className="numeric text-sm font-medium">
                      {formatIso(d.value)}
                      <SourceTag source={d.source} />
                    </span>
                  </div>
                ))}
            </Card>
            <p className="mt-2 text-xs text-ink-subtle">
              Computed dates are derived from the contract’s anchors using an{" "}
              <strong>unconfirmed</strong> NVAR ruleset. Confirm the day-counting
              rules before relying on them.
            </p>
          </section>

          <section>
            <SectionTitle>Parties</SectionTitle>
            <Card className="divide-y divide-border">
              {parties.map((p) => (
                <div key={p.contactId} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-xs text-ink-subtle">
                      {ROLE_LABEL[p.role] ?? p.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {p.company ? `${p.company} · ` : ""}
                    {p.email}
                  </p>
                </div>
              ))}
            </Card>
          </section>

          <section>
            <SectionTitle hint={`${audit.length} most recent`}>
              Audit trail
            </SectionTitle>
            <Card className="divide-y divide-border">
              {audit.map((event) => (
                <div key={event.id} className="px-4 py-2.5 text-xs">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">
                      {event.entityType} {event.action.replace(/_/g, " ")}
                    </span>
                    <span className="numeric text-ink-subtle">
                      {event.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-ink-subtle">
                    via {event.source} · {event.actorType}
                  </p>
                </div>
              ))}
            </Card>
          </section>
        </div>
      </div>
    </Container>
  );
}
