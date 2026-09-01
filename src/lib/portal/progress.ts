import { journeyStages, type JourneyKind, type PortalStage } from "@/content/portal";

export type StageProgress = {
  stage: PortalStage;
  done: number;
  total: number;
  complete: boolean;
};

export type JourneyProgress = {
  stages: StageProgress[];
  done: number;
  total: number;
  /** The first stage that isn't finished — "where the client actually is". */
  current: PortalStage | null;
  /** The next few unchecked tasks, in journey order. */
  nextUp: { stageLabel: string; taskId: string; label: string; detail: string; href?: string; hrefLabel?: string }[];
};

/** Derive everything the portal shows about progress from the checked task ids. */
export function journeyProgress(kind: JourneyKind, doneIds: string[], nextUpCount = 3): JourneyProgress {
  const done = new Set(doneIds);
  const stages = journeyStages(kind).map((stage) => {
    const count = stage.tasks.filter((t) => done.has(t.id)).length;
    return { stage, done: count, total: stage.tasks.length, complete: count === stage.tasks.length };
  });

  const nextUp = stages
    .flatMap(({ stage }) =>
      stage.tasks
        .filter((t) => !done.has(t.id))
        .map((t) => ({
          stageLabel: stage.label,
          taskId: t.id,
          label: t.label,
          detail: t.detail,
          href: t.href,
          hrefLabel: t.hrefLabel,
        })),
    )
    .slice(0, nextUpCount);

  return {
    stages,
    done: stages.reduce((n, s) => n + s.done, 0),
    total: stages.reduce((n, s) => n + s.total, 0),
    current: stages.find((s) => !s.complete)?.stage ?? null,
    nextUp,
  };
}
