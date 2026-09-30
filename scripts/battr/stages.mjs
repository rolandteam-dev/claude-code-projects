/**
 * Stage changes, recorded by us because Follow Up Boss will not say when one
 * happened.
 *
 * Battr's playbook counts "stage advanced" as working a lead. FUB's person
 * record carries no stage-changed date under any name we look for (0 of 54,000
 * records on 28 Sep), so a stage move was invisible here — and an agent who
 * answers a warning by moving the lead's stage is, to Battr, compliant again
 * while still at risk to us. On 29 Sep two leads Battr had warned on (62031,
 * 100570) lost their warning stamp with no reassignment, which is that pattern.
 *
 * The fix is to diff. Every run stores each lead's stage; the next run notices
 * which ones differ and dates the change to that run. Resolution is one day,
 * which is all a day-count rule can use. The date is written onto the person as
 * `stageUpdated`, a field `contact.mjs` already reads as a touch.
 *
 * Properties this keeps on purpose:
 *   - FAIL SAFE. A lead with no history, or a first night with no baseline,
 *     gets NO change date. Nothing here can make a lead look worked without a
 *     stage actually having moved, so a cold start changes nothing.
 *   - NARROWING ONLY. A change date only moves a lead's last touch forward, so
 *     it can clear a flag and never raise one.
 *   - A date recorded once is kept until the stage moves again, so two runs in
 *     a day, or a crashed run, do not lose or re-date a change.
 *
 * The date is the run's real time, up to a day later than the move itself, so
 * a lead can read as worked for a day longer than it would to Battr. The
 * alternative — an earlier guess — would flag leads Battr does not.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { profileTouchAt, STAGE_UPDATED_FIELDS } from "./communication.mjs";

export const STAGE_STATE_FILE = "stages.csv";

/** The stage a person is in, by id where FUB gives one (a rename must not look like a mass move). */
export function stageKeyOf(person) {
  const id = person.stageId ?? person.stage_id;
  if (id !== undefined && id !== null && id !== "") return `#${id}`;
  return person.stage ? String(person.stage).replace(/[,\n]/g, ";") : "";
}

/** @returns {{ stages: Map<number, {stage: string, changedAt: number|null}>, since: string|null }} */
export function loadStageState(path) {
  const stages = new Map();
  let since = null;
  if (!existsSync(path)) return { stages, since };
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("~since,")) {
      since = line.slice(7).trim() || null;
      continue;
    }
    const [id, stage, changedAt] = line.split(",");
    if (!id || stage === undefined) continue;
    stages.set(Number(id), { stage, changedAt: changedAt ? Number(changedAt) : null });
  }
  return { stages, since };
}

export function saveStageState(path, stages, since) {
  mkdirSync(dirname(path), { recursive: true });
  const lines = [`~since,${since ?? ""}`];
  for (const [id, { stage, changedAt }] of stages) lines.push(`${id},${stage},${changedAt ?? ""}`);
  writeFileSync(path, `${lines.join("\n")}\n`);
}

/**
 * Compare tonight's stages with the stored ones and stamp `stageUpdated` on any
 * person whose stage moved (or already carries a recorded move).
 *
 * Mutates `people` — that is how the date reaches `normalizeContact` — and
 * returns the state to store plus the counts the report prints.
 */
export function applyStageChanges(people, prior, nowMs = Date.now()) {
  const stages = new Map(prior.stages); // leads not in tonight's pull keep their record
  const baseline = prior.stages.size === 0;
  let moved = 0;
  let tracked = 0;
  let recorded = 0;

  for (const person of people) {
    const stage = stageKeyOf(person);
    if (!stage) continue;
    tracked++;

    const before = prior.stages.get(person.id);
    let changedAt = before?.changedAt ?? null;
    if (before && before.stage !== stage) {
      changedAt = nowMs;
      moved++;
    }
    stages.set(person.id, { stage, changedAt });

    if (changedAt) {
      recorded++;
      // Never overwrite a date FUB itself supplies, should that field ever appear.
      if (profileTouchAt(person, STAGE_UPDATED_FIELDS) === null) person.stageUpdated = new Date(changedAt).toISOString();
    }
  }

  return {
    stages,
    since: prior.since ?? (baseline ? new Date(nowMs).toISOString().slice(0, 10) : null),
    baseline,
    moved,
    tracked,
    recorded,
  };
}
