/**
 * Import one distress list (CSV) into the Seller Engine store.
 *
 * One upload = one list type (e.g. a PropStream "Pre-Foreclosure" export is
 * uploaded with list=nod). Rows are matched to parcels by APN (address + ZIP
 * as a fallback), so an owner who appears on several uploads stacks up.
 */
import type { SignalType } from "./types";
import { isAbsentee, mapHeaders, mapRow, parcelKey, parseCsv, type BlankDncPolicy } from "./parse";
import { looksInstitutional } from "./score";
import {
  rescore,
  upsertParcelsBulk,
  upsertPhonesBulk,
  upsertSignalsBulk,
  type ParcelUpsert,
  type PhoneUpsert,
  type SignalUpsert,
} from "./db";

export type ImportResult = {
  rows: number;
  imported: number;
  skippedNoKey: number;
  institutional: number;
  phones: { clear: number; listed: number; unknown: number };
  mapped: string[];
  unmapped: string[];
  phoneColumns: number;
  dncColumns: number;
  warnings: string[];
};

export const MAX_IMPORT_ROWS = 20_000;

export async function importList(
  csv: string,
  opts: {
    list: SignalType;
    source: string;
    blankDnc: BlankDncPolicy;
    /** YYYY-MM-DD the whole list is current as of, used when a row has no date of its own. */
    asOf?: string;
  },
): Promise<ImportResult> {
  const table = parseCsv(csv);
  const warnings: string[] = [];
  if (table.length < 2) {
    return {
      rows: 0,
      imported: 0,
      skippedNoKey: 0,
      institutional: 0,
      phones: { clear: 0, listed: 0, unknown: 0 },
      mapped: [],
      unmapped: [],
      phoneColumns: 0,
      dncColumns: 0,
      warnings: ["No data rows found."],
    };
  }

  const [headers, ...body] = table;
  if (body.length > MAX_IMPORT_ROWS) {
    throw new Error(`Too many rows (${body.length}). Split the file into ${MAX_IMPORT_ROWS}-row parts.`);
  }
  const mapping = mapHeaders(headers);
  if (mapping.fields.apn === undefined) warnings.push("No APN column found; matching on address + ZIP only.");
  if (mapping.phones.length === 0) warnings.push("No phone columns found; these owners can't be called yet.");
  const dncCols = new Set(mapping.phones.flatMap((p) => p.dncCols));
  if (mapping.phones.length > 0 && dncCols.size === 0) {
    warnings.push("No Do Not Call column found; every number is treated as unscrubbed and won't be pushed for calling.");
  }

  const result: ImportResult = {
    rows: body.length,
    imported: 0,
    skippedNoKey: 0,
    institutional: 0,
    phones: { clear: 0, listed: 0, unknown: 0 },
    mapped: Object.keys(mapping.fields),
    unmapped: mapping.unmapped,
    phoneColumns: mapping.phones.length,
    dncColumns: dncCols.size,
    warnings,
  };

  const touched = new Set<string>();
  const parcels: ParcelUpsert[] = [];
  const signals: SignalUpsert[] = [];
  const phones: PhoneUpsert[] = [];
  for (const cells of body) {
    const row = mapRow(cells, mapping, opts.blankDnc);
    const key = parcelKey(row);
    if (!key) {
      result.skippedNoKey++;
      continue;
    }
    const institutional = looksInstitutional(row.ownerName);
    if (institutional) result.institutional++;

    parcels.push({
      parcelKey: key,
      apn: row.apn,
      address: row.address,
      city: row.city,
      zip: row.zip,
      ownerName: row.ownerName,
      mailAddress: row.mailAddress,
      mailCity: row.mailCity,
      mailState: row.mailState,
      mailZip: row.mailZip,
      absentee: isAbsentee(row),
      lastSaleDate: row.lastSaleDate,
      institutional,
    });
    // One signal per (list, source): re-uploading the same list refreshes it
    // instead of piling up duplicates.
    signals.push({
      parcelKey: key,
      ref: `${opts.source}:${opts.list}`,
      signal: { type: opts.list, source: opts.source, eventDate: row.eventDate ?? opts.asOf, detail: row.detail },
    });
    for (const p of row.phones) {
      phones.push({ parcelKey: key, phone: p, source: opts.source });
      result.phones[p.dnc]++;
    }
    touched.add(key);
    result.imported++;
  }

  // Parcels first: signals and phones reference them.
  await upsertParcelsBulk(parcels);
  await upsertSignalsBulk(signals);
  await upsertPhonesBulk(phones);
  await rescore([...touched]);
  return result;
}
