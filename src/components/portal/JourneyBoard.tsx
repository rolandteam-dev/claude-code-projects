"use client";

import Link from "next/link";
import { usePortal } from "@/lib/portal/store";
import { journeyProgress } from "@/lib/portal/progress";
import { trackPortal } from "@/lib/portal/track";
import { journeyStages } from "@/content/portal";
import { CheckIcon, Card, Pill } from "./ui";

/**
 * The full step-by-step journey. Checking a step is the client telling their
 * agent where they are, so completions post to the CRM — including a separate
 * event when a whole stage closes out, which is usually the moment an agent
 * wants to call.
 */
export function JourneyBoard({ compact = false }: { compact?: boolean }) {
  const { state, toggleTask } = usePortal();
  const profile = state.profile;
  if (!profile) return null;

  const kind = profile.journey;
  const progress = journeyProgress(kind, state.done);
  const doneSet = new Set(state.done);

  function onToggle(taskId: string, label: string, stageId: string, stageLabel: string) {
    const wasDone = doneSet.has(taskId);
    toggleTask(taskId);
    if (wasDone) return; // un-checking is a correction, not a milestone

    trackPortal("portal.task-complete", `${stageLabel}: ${label}`);

    // Did that check finish the stage? Recompute against the post-toggle set.
    const stage = journeyStages(kind).find((s) => s.id === stageId);
    if (stage && stage.tasks.every((t) => t.id === taskId || doneSet.has(t.id))) {
      trackPortal("portal.stage-complete", `Finished "${stage.label}"`, { always: true });
    }
  }

  return (
    <div className="space-y-5">
      {progress.stages.map(({ stage, done, total, complete }, i) => {
        const isCurrent = progress.current?.id === stage.id;
        return (
          <Card
            key={stage.id}
            className={isCurrent ? "border-[var(--color-gold)] shadow-[var(--shadow-soft)]" : ""}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Stage {i + 1}
                  </span>
                  {complete ? <Pill tone="gold">Complete</Pill> : isCurrent ? <Pill tone="sand">You are here</Pill> : null}
                </div>
                <h3 className="mt-1.5 font-serif text-[1.6rem] leading-tight text-[var(--color-ink)]">{stage.label}</h3>
                <p className="mt-1 max-w-[62ch] font-sans text-[0.9rem] text-[var(--color-ink-soft)]">{stage.blurb}</p>
              </div>
              <div className="text-right">
                <div className="font-sans text-[0.8rem] font-semibold text-[var(--color-ink)]">
                  {done}/{total}
                </div>
                <div className="font-sans text-[0.72rem] text-[var(--color-muted)]">{stage.timing}</div>
              </div>
            </div>

            <ul className="mt-5 space-y-1">
              {stage.tasks.map((task) => {
                const isDone = doneSet.has(task.id);
                return (
                  <li key={task.id} className="rounded-md px-2 py-2 transition-colors hover:bg-[var(--color-sand)]">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isDone}
                        onClick={() => onToggle(task.id, task.label, stage.id, stage.label)}
                        className="flex items-start gap-3 text-left"
                      >
                        <CheckIcon done={isDone} />
                        <span
                          className={[
                            "font-sans text-[0.94rem] font-semibold",
                            isDone ? "text-[var(--color-muted)] line-through" : "text-[var(--color-ink)]",
                          ].join(" ")}
                        >
                          {task.label}
                        </span>
                      </button>
                    </div>
                    {!compact && (
                      <div className="ml-8 mt-1">
                        <p className="max-w-[68ch] font-sans text-[0.86rem] leading-relaxed text-[var(--color-ink-soft)]">
                          {task.detail}
                        </p>
                        {task.href && (
                          <Link href={task.href} className="link-gold mt-1.5 inline-block">
                            {task.hrefLabel ?? "Open"} →
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
