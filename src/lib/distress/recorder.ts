/**
 * Clark County Recorder documents (default notices, trustee sales, lis
 * pendens, rescissions, trustee deeds) -> Seller Engine signals.
 *
 * Input is the "Export to CSV" file from the Recorder's public record search
 * (AcclaimWeb, Search by Document Type), run each morning for the previous
 * recording day. See docs/seller-engine.md for the exact search.
 *
 * Pure functions only (no I/O), unit-tested by scripts/distress/selftest.mjs.
 * importRecorder.ts does the database work.
 */
import type { SignalType } from "./types";
import { normalizeApn, normalizeDate, parseCsv } from "./parse";
import { looksInstitutional } from "./score";

/* ------------------------------------------------------------------ headers */

type Col = "firstParty" | "crossParty" | "instrument" | "docType" | "modifier" | "recordDate" | "apn";

// Grid titles as shown on screen, plus the grid's internal field names, in
// case the export uses those instead.
const COLS: Record<Col, string[]> = {
  firstParty: ["firstpartyname", "firstparty", "directname", "grantor"],
  crossParty: ["firstcrosspartyname", "firstcrossparty", "crosspartyname", "indirectname", "grantee"],
  instrument: ["instrument", "instrumentnumber", "instrumentno", "documentnumber"],
  docType: ["documenttype", "doctypedescription", "doctype"],
  modifier: ["modifier", "comments2"],
  recordDate: ["recorddate", "recordingdate", "daterecorded"],
  apn: ["parcel", "parcelnumber", "parcelno", "apn"],
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

export function mapRecorderHeaders(headers: string[]): { cols: Partial<Record<Col, number>>; missing: Col[] } {
  const n = headers.map(norm);
  const cols: Partial<Record<Col, number>> = {};
  for (const c of Object.keys(COLS) as Col[]) {
    for (const alias of COLS[c]) {
      const i = n.indexOf(alias);
      if (i >= 0) {
        cols[c] = i;
        break;
      }
    }
  }
  const required: Col[] = ["docType", "recordDate", "apn"];
  return { cols, missing: required.filter((c) => cols[c] === undefined) };
}

/* ----------------------------------------------------------- classification */

/** Parties that file liens and notices rather than own the home. */
const LIENHOLDER = [
  /\bASS(OCIATION|OC|N)\b/,
  /\bHOA\b/,
  /\bTRUSTEE (CORP|SERVICES?|COMPANY)\b/,
  /\bSERVIC(ES|ING)\b/,
  /\bRECON\b/,
  /\bDEFAULT\b/,
  /\bFORECLOSURE\b/,
  /\bTITLE\b/,
  /\bESCROW\b/,
  /\bLOAN\b/,
  /\bLENDING\b/,
  /\bFUNDING\b/,
  /\bFINANCIAL\b/,
  /\bCREDIT UNION\b/,
  /\bCOLLECTIONS?\b/,
  /\bLAS VEGAS CITY\b/,
];

export function looksLikeLienholder(name: string): boolean {
  const n = name.toUpperCase();
  return looksInstitutional(n) || LIENHOLDER.some((re) => re.test(n));
}

// HOA defaults are usually filed by the association or its collection agent.
const HOA = [/\bASS(OCIATION|OC|N)\b/, /\bHOA\b/, /\bOWNERS\b/, /\bMAINTENANCE\b/, /\bCOLLECTIONS?\b/];
function looksLikeHoa(name: string): boolean {
  const n = name.toUpperCase();
  return HOA.some((re) => re.test(n));
}

/**
 * The homeowner is whichever party isn't a lender, trustee, servicer or HOA.
 * The Recorder's party order isn't consistent between filers, so look at both.
 */
export function pickOwner(firstParty: string, crossParty: string): { owner: string; lienholder: string } {
  const a = firstParty.trim();
  const b = crossParty.trim();
  const aLien = !a || looksLikeLienholder(a);
  const bLien = !b || looksLikeLienholder(b);
  if (aLien && !bLien) return { owner: b, lienholder: a };
  if (bLien && !aLien) return { owner: a, lienholder: b };
  // Both or neither look like a lienholder: default to the Recorder's first party.
  return { owner: a, lienholder: b };
}

/** Foreclosure-type signals a rescission or a completed sale cancels. */
export const FORECLOSURE_SIGNALS: SignalType[] = ["nod", "hoa_default", "trustee_sale", "lis_pendens"];

export type RecorderAction =
  | { kind: "add"; type: SignalType; label: string }
  | { kind: "clear"; types: SignalType[]; label: string }
  | { kind: "ignore" };

/**
 * What one recorded document means for the parcel. Rescissions and
 * cancellations clear the matching notice (the default was cured or the sale
 * called off). A trustee's deed or deed in lieu means the owner has already
 * lost the home, so every foreclosure signal goes.
 */
export function classifyDocument(docType: string, modifier: string, lienholder: string): RecorderAction {
  const t = docType.toUpperCase().replace(/\s+/g, " ").trim();
  const m = modifier.toUpperCase();
  const cancels = /RESCI|RESCIND|CANCEL|WITHDRAW|RELEASE/.test(m);

  if (/^TRUSTEE DEED\b|^TRUSTEE'?S DEED\b|DEED IN LIEU/.test(t)) {
    return { kind: "clear", types: FORECLOSURE_SIGNALS, label: "foreclosure completed" };
  }
  const isDefault =
    /^(SUBSTITUTION\/)?(DEFAULT|BREACH)\b/.test(t) && !/REFUND/.test(t); // excludes "BETS/DETS REFUND"
  if (isDefault) {
    if (cancels) return { kind: "clear", types: ["nod", "hoa_default"], label: "default rescinded" };
    const hoa = looksLikeHoa(lienholder);
    return { kind: "add", type: hoa ? "hoa_default" : "nod", label: hoa ? "HOA default" : "Lender default" };
  }
  if (/^NOTICE OF TRUSTEE'?S? SALE\b/.test(t)) {
    if (cancels) return { kind: "clear", types: ["trustee_sale"], label: "trustee sale cancelled" };
    return { kind: "add", type: "trustee_sale", label: "Notice of trustee sale" };
  }
  if (/^LIS PENDENS\b/.test(t)) {
    if (cancels) return { kind: "clear", types: ["lis_pendens"], label: "lis pendens released" };
    return { kind: "add", type: "lis_pendens", label: "Lis pendens" };
  }
  return { kind: "ignore" };
}

/* ------------------------------------------------------------------- parse */

export type RecorderRecord = {
  apn: string;
  recordDate: string;
  instrument: string;
  owner: string;
  action: Exclude<RecorderAction, { kind: "ignore" }>;
};

export type RecorderParse = {
  rows: number;
  records: RecorderRecord[];
  ignored: number;
  skippedNoApn: number;
  skippedNoDate: number;
  /** Doc types seen that we don't use, so the search can be tightened. */
  ignoredTypes: string[];
  missing: string[];
  headers: string[];
};

export function parseRecorderCsv(csv: string): RecorderParse {
  const table = parseCsv(csv);
  const [headers = [], ...body] = table;
  const { cols, missing } = mapRecorderHeaders(headers);
  const out: RecorderParse = {
    rows: body.length,
    records: [],
    ignored: 0,
    skippedNoApn: 0,
    skippedNoDate: 0,
    ignoredTypes: [],
    missing,
    headers,
  };
  if (missing.length > 0) return out;

  const cell = (r: string[], c: Col) => (cols[c] === undefined ? "" : (r[cols[c]!] ?? "").trim());
  const ignoredTypes = new Set<string>();
  for (const r of body) {
    const docType = cell(r, "docType");
    const { owner, lienholder } = pickOwner(cell(r, "firstParty"), cell(r, "crossParty"));
    const action = classifyDocument(docType, cell(r, "modifier"), lienholder);
    if (action.kind === "ignore") {
      out.ignored++;
      if (docType) ignoredTypes.add(docType.toUpperCase());
      continue;
    }
    const apn = normalizeApn(cell(r, "apn"));
    if (!apn) {
      out.skippedNoApn++;
      continue;
    }
    const recordDate = normalizeDate(cell(r, "recordDate"));
    if (!recordDate) {
      out.skippedNoDate++;
      continue;
    }
    out.records.push({ apn, recordDate, instrument: cell(r, "instrument"), owner, action });
  }
  out.ignoredTypes = [...ignoredTypes].sort();
  return out;
}
