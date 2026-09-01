"use client";

import Link from "next/link";
import { usePortal } from "@/lib/portal/store";
import { journeyProgress } from "@/lib/portal/progress";
import { trackPortal } from "@/lib/portal/track";
import { AgentCard } from "./AgentCard";
import { Card, CardTitle, CheckIcon, EmptyState, Pill, money } from "./ui";

/**
 * Portal home. Answers three questions in order, because that's the order a
 * client actually asks them: what do I do next, what have I saved, and who do
 * I call.
 */
export function Dashboard() {
  const { state, toggleTask, reset } = usePortal();
  const profile = state.profile;
  if (!profile) return null;

  const progress = journeyProgress(profile.journey, state.done, 4);
  const isSeller = profile.journey === "sell";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-8">
        <Card>
          <CardTitle hint={progress.current ? progress.current.timing : undefined}>
            {progress.nextUp.length ? "Your next steps" : "You're all the way through"}
          </CardTitle>

          {progress.nextUp.length === 0 ? (
            <EmptyState title="Every step is checked off">
              Congratulations. Your hub stays here for the long haul — we&apos;ll keep an eye on your home&apos;s value
              and you&apos;ll always have your pros a click away.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {progress.nextUp.map((t) => (
                <li key={t.taskId} className="flex items-start gap-3 rounded-md p-2 hover:bg-[var(--color-sand)]">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={false}
                    aria-label={`Mark "${t.label}" complete`}
                    onClick={() => {
                      toggleTask(t.taskId);
                      trackPortal("portal.task-complete", `${t.stageLabel}: ${t.label}`);
                    }}
                  >
                    <CheckIcon done={false} />
                  </button>
                  <div>
                    <div className="font-sans text-[0.95rem] font-semibold text-[var(--color-ink)]">{t.label}</div>
                    <p className="mt-0.5 max-w-[62ch] font-sans text-[0.86rem] leading-relaxed text-[var(--color-ink-soft)]">
                      {t.detail}
                    </p>
                    {t.href && (
                      <Link href={t.href} className="link-gold mt-1 inline-block">
                        {t.hrefLabel ?? "Open"} →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link href="/portal/journey" className="link-gold mt-5 inline-block">
            See the full {isSeller ? "selling" : "buying"} journey →
          </Link>
        </Card>

        <Card>
          <CardTitle hint={`${progress.done}/${progress.total} steps`}>Where you are</CardTitle>
          <ol className="space-y-2">
            {progress.stages.map(({ stage, done, total, complete }) => {
              const current = progress.current?.id === stage.id;
              return (
                <li
                  key={stage.id}
                  className={[
                    "flex items-center justify-between gap-4 rounded-md px-3 py-2.5",
                    current ? "bg-[var(--color-sand)]" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <CheckIcon done={complete} />
                    <span
                      className={[
                        "font-sans text-[0.92rem]",
                        complete ? "text-[var(--color-muted)]" : "font-semibold text-[var(--color-ink)]",
                      ].join(" ")}
                    >
                      {stage.label}
                    </span>
                    {current && <Pill tone="sand">Now</Pill>}
                  </div>
                  <span className="font-sans text-[0.8rem] tabular-nums text-[var(--color-muted)]">
                    {done}/{total}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardTitle>Your snapshot</CardTitle>
          <dl className="space-y-2 font-sans text-[0.9rem]">
            <Detail label={isSeller ? "Expected sale price" : "Target price"} value={profile.budget ? money(profile.budget) : "Not set"} />
            <Detail label="Timeline" value={profile.timeline || "Not set"} />
            <Detail label="Areas" value={profile.areas.length ? profile.areas.join(", ") : "Open to ideas"} />
            <Detail label="Saved homes" value={String(state.saved.length)} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/portal/budget" className="link-gold">
              {isSeller ? "Estimate my net →" : "Run my numbers →"}
            </Link>
            <Link href="/listings" className="link-gold">Search homes →</Link>
          </div>
        </Card>

        <AgentCard />

        <Card>
          <CardTitle>Your hub</CardTitle>
          <p className="font-sans text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
            Saved in this browser only — no password, nothing to log into. Using a different device? Ask your agent to
            resend your hub link.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear your saved homes, notes and progress from this browser?")) reset();
            }}
            className="mt-3 font-sans text-[0.8rem] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Clear my hub
          </button>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] pb-2 last:border-0">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
