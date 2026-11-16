/**
 * Import a Clark County Recorder export (see recorder.ts) into the Seller
 * Engine store: new notices become signals, rescissions and completed sales
 * remove them, then the touched parcels are rescored.
 */
import type { SignalType } from "./types";
import { looksInstitutional } from "./score";
import { parseRecorderCsv, type RecorderParse } from "./recorder";
import {
  clearSignalsBefore,
  rescore,
  upsertParcelsBulk,
  upsertSignalsBulk,
  type ParcelUpsert,
  type SignalUpsert,
} from "./db";


export type RecorderImportResult = Omit<RecorderParse, "records" | "headers"> & {
  added: Partial<Record<SignalType, number>>;
  cleared: number;
  dryRun: boolean;
};

export const MAX_RECORDER_ROWS = 20_000;

export async function importRecorder(csv: string, opts: { dryRun: boolean }): Promise<RecorderImportResult> {
  const parsed = parseRecorderCsv(csv);
  if (parsed.rows > MAX_RECORDER_ROWS) {
    throw new Error(`Too many rows (${parsed.rows}). Export fewer days at a time.`);
  }
  if (parsed.missing.length > 0) {
    throw new Error(
      `Missing column(s): ${parsed.missing.join(", ")}. Columns found: ${parsed.headers.join(", ") || "none"}.`,
    );
  }
  const { records, headers, ...counts } = parsed;
  void headers;

  const added: Partial<Record<SignalType, number>> = {};
  const parcels: ParcelUpsert[] = [];
  const signals: SignalUpsert[] = [];
  const clears: { parcelKey: string; types: SignalType[]; before: string }[] = [];
  for (const r of records) {
    if (r.action.kind === "add") {
      added[r.action.type] = (added[r.action.type] ?? 0) + 1;
      parcels.push({
        parcelKey: r.apn,
        apn: r.apn,
        address: "",
        city: "",
        zip: "",
        ownerName: r.owner,
        mailAddress: "",
        mailCity: "",
        mailState: "",
        mailZip: "",
        institutional: looksInstitutional(r.owner),
      });
      signals.push({
        parcelKey: r.apn,
        // One signal per recorded document, so re-uploading a day is harmless.
        ref: `recorder:${r.instrument || r.recordDate}`,
        signal: {
          type: r.action.type,
          source: "recorder",
          eventDate: r.recordDate,
          detail: r.instrument ? `${r.action.label}, instrument ${r.instrument}` : r.action.label,
        },
      });
    } else {
      clears.push({ parcelKey: r.apn, types: r.action.types, before: r.recordDate });
    }
  }

  const result: RecorderImportResult = { ...counts, added, cleared: 0, dryRun: opts.dryRun };
  if (opts.dryRun) {
    result.cleared = clears.length;
    return result;
  }

  await upsertParcelsBulk(parcels);
  await upsertSignalsBulk(signals);
  // Clears run after adds, and only remove notices recorded on or before the
  // rescission, so a fresh default recorded later still counts.
  result.cleared = await clearSignalsBefore(clears);
  await rescore([...new Set([...parcels.map((p) => p.parcelKey), ...clears.map((c) => c.parcelKey)])]);
  return result;
}
