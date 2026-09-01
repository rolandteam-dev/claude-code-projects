#!/usr/bin/env node
/**
 * Seed the At Bats ledger from a Battr CSV export.
 *
 *   node scripts/battr/import-atbats.mjs ~/Downloads/at-bats.csv
 *   node scripts/battr/import-atbats.mjs ~/Downloads/at-bats.csv --dry
 *
 * WHY THIS EXISTS: our own At Bats tracking works by diffing ownership between
 * runs, so it can only accrue forward from the first run. The 180-day conversion
 * metrics would take six months to mean anything. Battr already holds that
 * history and every one of its data grids exports CSV — so export At Bats from
 * Battr BEFORE the subscription lapses and run this once.
 *
 * Column names are matched loosely (case- and separator-insensitive) because the
 * export's exact headers haven't been seen. Run with --dry first: it prints the
 * header mapping it inferred and the first parsed rows without writing anything.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { appendAtBats, loadAtBats, AT_BAT_TYPES } from "./atbats.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEDGER = join(ROOT, "battr-logs", "at-bats.jsonl");

/** Minimal RFC4180-ish parser: handles quoted fields and embedded commas. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Find a column index by trying several candidate header names. */
export function findColumn(headers, candidates) {
  const normalized = headers.map(norm);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(norm(candidate));
    if (idx !== -1) return idx;
  }
  // Fall back to a contains match — exports often prefix or suffix labels.
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(norm(candidate)));
    if (idx !== -1) return idx;
  }
  return -1;
}

const COLUMNS = {
  contactId: ["fub id", "contact id", "crm contact exid", "person id", "id"],
  contactName: ["name", "contact", "full name", "contact name"],
  atBatType: ["at bat type", "type", "at_bat_type"],
  timestamp: ["changed at", "at bat timestamp", "date", "at_bat_timestamp", "created"],
  newOwner: ["to", "new owner", "assigned to", "new_owner"],
  previousOwner: ["from", "previous owner", "prior owner", "previous_owner"],
  stage: ["stage at change", "stage", "stage_at_change"],
  source: ["source", "lead source", "source normalized"],
};

const TYPE_MAP = {
  brandnewlead: AT_BAT_TYPES.BRAND_NEW,
  newlead: AT_BAT_TYPES.BRAND_NEW,
  pondclaim: AT_BAT_TYPES.POND_CLAIM,
  claim: AT_BAT_TYPES.POND_CLAIM,
  othertransfer: AT_BAT_TYPES.TRANSFER,
  transfer: AT_BAT_TYPES.TRANSFER,
};

export function mapRows(rows) {
  const [headers, ...body] = rows;
  const idx = Object.fromEntries(Object.entries(COLUMNS).map(([key, names]) => [key, findColumn(headers, names)]));

  const at = (row, key) => (idx[key] === -1 ? "" : (row[idx[key]] ?? "").trim());

  const events = body
    .map((row) => {
      // Guard the empty string explicitly: Number("") is 0, which is finite, so
      // a blank id would otherwise import as a phantom contact 0.
      const rawId = at(row, "contactId");
      const contactId = Number(rawId);
      if (!rawId || !Number.isFinite(contactId) || contactId <= 0) return null;

      const rawTs = at(row, "timestamp");
      const ts = rawTs ? new Date(rawTs) : null;
      if (!ts || Number.isNaN(ts.getTime())) return null;

      return {
        contact_id: contactId,
        contact_name: at(row, "contactName"),
        at_bat_type: TYPE_MAP[norm(at(row, "atBatType"))] ?? AT_BAT_TYPES.TRANSFER,
        at_bat_timestamp: ts.toISOString(),
        previous_owner_id: null,
        previous_owner_name: at(row, "previousOwner"),
        new_owner_id: null, // resolved by name at report time; the export gives names, not ids
        new_owner_name: at(row, "newOwner"),
        previous_pond_id: null,
        new_pond_id: null,
        stage_exid_at_change: null,
        stage_name_at_change: at(row, "stage"),
        source_normalized: at(row, "source"),
        is_battr_sweep: false,
        imported: true,
      };
    })
    .filter(Boolean);

  return { idx, events };
}

function main() {
  const [file, ...flags] = process.argv.slice(2);
  const dry = flags.includes("--dry");
  if (!file) {
    console.error("Usage: node scripts/battr/import-atbats.mjs <export.csv> [--dry]");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(file, "utf8"));
  if (rows.length < 2) throw new Error("The CSV has no data rows.");

  const { idx, events } = mapRows(rows);

  console.log("Column mapping inferred from the header row:");
  for (const [key, i] of Object.entries(idx)) {
    console.log(`  ${key.padEnd(15)} ${i === -1 ? "NOT FOUND" : `column ${i} ("${rows[0][i]}")`}`);
  }
  console.log(`\nParsed ${events.length} of ${rows.length - 1} data rows.`);
  if (events.length) console.log("\nFirst row:\n", JSON.stringify(events[0], null, 2));

  if (dry) {
    console.log("\n--dry: nothing written. Re-run without --dry to import.");
    return;
  }

  // Don't double-import: skip anything already in the ledger with the same
  // contact and timestamp.
  const seen = new Set(loadAtBats(LEDGER).map((e) => `${e.contact_id}@${e.at_bat_timestamp}`));
  const fresh = events.filter((e) => !seen.has(`${e.contact_id}@${e.at_bat_timestamp}`));

  appendAtBats(LEDGER, fresh);
  console.log(`\nImported ${fresh.length} at bats (${events.length - fresh.length} already present) → ${LEDGER}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
