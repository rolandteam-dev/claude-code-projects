/**
 * A running record of this engine's numbers against Battr's, night by night.
 *
 * The team pays for Battr and runs this engine against the same database at the
 * same time. That overlap is the only window in which this engine's answers can
 * be checked against a known-good one, and it closes the day the subscription
 * lapses. After that, every number it produces is taken on faith.
 *
 * Until now the only comparison was a frozen snapshot of Battr from one day,
 * hard-coded into observed.mjs. That catches a rule that is wrong today. It
 * cannot catch a rule that drifts next month, and it is worth nothing the
 * moment either system changes.
 *
 * So: `battr-logs/comparison.csv`, one row per list per night per source. The
 * audit writes its own rows automatically. Battr's rows are typed in from its
 * Aida Audits screen, which has no export.
 *
 * DESIGN DECISIONS WORTH KEEPING
 *
 *   Plain CSV, properly quoted. It has to be editable six months from now by a
 *   person with a spreadsheet and no tooling, after everyone involved has
 *   forgotten how any of this works. A list name containing a comma must not
 *   corrupt the file, which is why writing goes through quote() rather than
 *   join(",").
 *
 *   Append-only. A night's numbers are a fact about that night; correcting them
 *   later would destroy the drift history that is the entire point.
 *
 *   Battr's rows are never written by the engine. Anything in this file
 *   attributed to Battr was read off Battr's own screen by a person. The engine
 *   inventing them would make the comparison circular.
 */

import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const COMPARISON_HEADER = "date,source,list_id,list_name,total,compliant,at_risk,neglected";

/** RFC4180-ish: quote when the value could otherwise break the row. */
const quote = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Split one CSV line, honouring quotes and doubled quotes inside them. */
export function parseCsvLine(line) {
  const out = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      out.push(field);
      field = "";
    } else field += c;
  }
  out.push(field);
  return out;
}

const num = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Every row in the file. Malformed rows are skipped, never guessed at. */
export function readComparisons(path) {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const rows = [];
  for (const line of lines) {
    if (line.startsWith("date,")) continue; // header
    const [date, source, listId, listName, total, compliant, atRisk, neglected] = parseCsvLine(line);
    if (!date || !source || !listId) continue;
    rows.push({
      date,
      source,
      listId: Number(listId),
      listName,
      total: num(total),
      compliant: num(compliant),
      at_risk: num(atRisk),
      neglected: num(neglected),
    });
  }
  return rows;
}

/** Append rows, writing the header first if the file is new. */
export function appendComparisons(path, rows) {
  if (!rows.length) return;
  mkdirSync(dirname(path), { recursive: true });
  const fresh = !existsSync(path);
  const body = rows
    .map((r) =>
      [r.date, r.source, r.listId, r.listName, r.total, r.compliant, r.at_risk, r.neglected].map(quote).join(",")
    )
    .join("\n");
  appendFileSync(path, `${fresh ? `${COMPARISON_HEADER}\n` : ""}${body}\n`);
}

/**
 * Our latest row against Battr's latest row, per list, worst drift first.
 *
 * Battr's rows are typed in by hand and will usually be older than ours, so the
 * comparison is latest-against-latest rather than same-date-only — otherwise the
 * table is empty on every night nobody transcribed. The dates are carried
 * through so a stale Battr row is visible as stale rather than read as current.
 */
export function drift(rows) {
  const latest = (source, listId) =>
    rows
      .filter((r) => r.source === source && r.listId === listId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1) ?? null;

  const listIds = [...new Set(rows.map((r) => r.listId))];
  const out = [];
  for (const listId of listIds) {
    const ours = latest("ours", listId);
    const theirs = latest("battr", listId);
    if (!ours || !theirs || !theirs.total) continue;
    const pct = ((ours.total - theirs.total) / theirs.total) * 100;
    // How far apart the two rows being compared actually are.
    //
    // This is the difference between a number and a number you can act on. On
    // 20 Sep the combined list read −7.8%, which looks like the engine falling
    // behind; it was our 20 Sep count against Battr's 15 Sep count, and Battr's
    // list had shrunk from 880 to 777 in between. Same-night, it was +4.4%.
    //
    // A drift figure whose two sides are five days apart is measuring the
    // passage of time, not a disagreement, and the report has to say so where
    // the number is rather than in a footnote under it.
    const staleDays = Math.round(
      (Date.parse(`${ours.date}T00:00:00Z`) - Date.parse(`${theirs.date}T00:00:00Z`)) / 86400000
    );
    out.push({
      listId,
      listName: ours.listName || theirs.listName,
      ours: ours.total,
      oursDate: ours.date,
      battr: theirs.total,
      battrDate: theirs.date,
      driftPct: pct,
      staleDays,
      /** Same night, or one either side of it — close enough to read as a disagreement. */
      comparable: Math.abs(staleDays) <= 1,
    });
  }
  return out.sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct));
}
