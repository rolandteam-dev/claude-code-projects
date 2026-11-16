/**
 * Seller Engine list import: CSV parsing, header mapping and normalizers.
 * Pure functions only (no I/O) — unit-tested by scripts/distress/selftest.mjs.
 *
 * Built to take a PropStream export (or any similar vendor / county CSV)
 * without a fixed column layout: headers are matched loosely by name, and any
 * header we couldn't use is reported back so the mapping can be extended.
 */
import type { DncStatus, PhoneRecord } from "./types";

/* ---------------------------------------------------------------- normalize */

/**
 * Clark County APNs are 11 digits (e.g. 162-08-510-007). Accepts dashed,
 * spaced or numeric forms; restores a leading zero a spreadsheet dropped.
 */
export function normalizeApn(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  // Numbers from JSON/Excel can arrive as "16208510007.0" or in exponent form.
  if (/^\d+(\.0+)?$/.test(s)) s = s.replace(/\.0+$/, "");
  else if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) s = BigInt(Math.round(Number(s))).toString();
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `0${digits}`;
  if (digits.length === 11) return digits;
  return null;
}

/** US phone to 10 digits, or null if it can't be a dialable US number. */
export function normalizePhone(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return null;
  if (d[0] === "0" || d[0] === "1") return null; // invalid area code
  if (d[3] === "0" || d[3] === "1") return null; // invalid exchange
  return d;
}

/** Uppercase, collapse whitespace, common street-suffix spellings unified. */
export function normalizeAddress(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .toUpperCase()
    .replace(/[.,#]/g, " ")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bCOURT\b/g, "CT")
    .replace(/\bCIRCLE\b/g, "CIR")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse a date cell to YYYY-MM-DD, or undefined. Accepts M/D/YYYY and ISO. */
export function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?!\d)/);
  if (us) {
    let y = Number(us[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    const m = Number(us[1]);
    const d = Number(us[2]);
    if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return undefined;
}

/* ---------------------------------------------------------------------- csv */

/** RFC 4180-ish CSV parser: quoted fields, escaped quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

/* ------------------------------------------------------------------ mapping */

const key = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

type Field =
  | "apn"
  | "address"
  | "city"
  | "zip"
  | "ownerFirst"
  | "ownerLast"
  | "ownerName"
  | "mailAddress"
  | "mailCity"
  | "mailState"
  | "mailZip"
  | "lastSaleDate"
  | "eventDate"
  | "detail"
  | "amountDue";

/** Accepted header spellings, compared after lowercasing and stripping symbols. */
const ALIASES: Record<Field, string[]> = {
  apn: ["apn", "parcel", "parcelnumber", "parcelid", "parcelno", "assessorparcelnumber", "apnparcelid", "apnformatted"],
  address: ["propertyaddress", "address", "siteaddress", "situsaddress", "propertystreet", "propertystreetaddress", "street", "streetaddress"],
  city: ["propertycity", "city", "situscity", "sitecity"],
  zip: ["propertyzip", "propertyzipcode", "zip", "zipcode", "situszip", "sitezip", "postalcode"],
  ownerFirst: ["owner1firstname", "ownerfirstname", "firstname", "owner1first"],
  ownerLast: ["owner1lastname", "ownerlastname", "lastname", "owner1last"],
  ownerName: [
    "owner1fullname",
    "ownerfullname",
    "ownername",
    "owner",
    "owner1name",
    "owner1",
    "ownernames",
    // County Treasurer delinquent list
    "ownerofrecord",
    "nameofownerofrecord",
    "ownerofrecordname",
    "nameofowner",
    "ownersname",
    "taxpayer",
    "taxpayername",
  ],
  mailAddress: ["mailingaddress", "mailaddress", "ownermailingaddress", "mailingstreet", "mailingstreetaddress"],
  mailCity: ["mailingcity", "mailcity", "ownermailingcity"],
  mailState: ["mailingstate", "mailstate", "ownermailingstate"],
  mailZip: ["mailingzip", "mailzip", "mailingzipcode", "ownermailingzip"],
  lastSaleDate: ["lastsaledate", "lastsalerecordingdate", "saledate", "purchasedate", "lastsalerecdate"],
  eventDate: [
    "recordingdate",
    "defaultdate",
    "noddate",
    "foreclosurerecordingdate",
    "foreclosuredate",
    "auctiondate",
    "filingdate",
    "filedate",
    "casedate",
    "violationdate",
    "eventdate",
    "listingdate",
    "expireddate",
    "expirationdate",
    "statusdate",
  ],
  detail: ["detail", "description", "violation", "casenumber", "documentnumber", "instrumentnumber", "notes"],
  amountDue: [
    "amountdue",
    "totaldue",
    "totalamountdue",
    "amountowed",
    "balancedue",
    "delinquentamount",
    "totaldelinquent",
    "taxesdue",
    "amount",
  ],
};

const DNC_LISTED = new Set(["y", "yes", "true", "1", "dnc", "listed", "on", "x"]);
const DNC_CLEAR = new Set(["n", "no", "false", "0", "clear", "off", "notlisted", "notondnc"]);

export type ImportRow = {
  apn: string | null;
  address: string;
  city: string;
  zip: string;
  ownerName: string;
  mailAddress: string;
  mailCity: string;
  mailState: string;
  mailZip: string;
  lastSaleDate?: string;
  eventDate?: string;
  detail?: string;
  phones: PhoneRecord[];
};

export type ImportMapping = {
  /** Field -> column index. */
  fields: Partial<Record<Field, number>>;
  /** Phone columns with the DNC column paired to each, if any. */
  phones: { col: number; dncCols: number[] }[];
  /** Headers we didn't use — return these so the mapping can be extended. */
  unmapped: string[];
};

/** Digits inside a header name, used to pair "Phone 2" with "Phone 2 DNC". */
function indexOf(norm: string): string {
  const m = norm.match(/(\d+)/);
  return m ? m[1] : "";
}

export function mapHeaders(headers: string[]): ImportMapping {
  const fields: Partial<Record<Field, number>> = {};
  const used = new Set<number>();
  const norms = headers.map(key);

  // Exact alias matches, in alias priority order.
  for (const f of Object.keys(ALIASES) as Field[]) {
    for (const alias of ALIASES[f]) {
      const i = norms.findIndex((n, idx) => n === alias && !used.has(idx));
      if (i >= 0) {
        fields[f] = i;
        used.add(i);
        break;
      }
    }
  }

  // DNC / litigator flag columns.
  const dnc: { col: number; idx: string }[] = [];
  norms.forEach((n, i) => {
    if (used.has(i)) return;
    if (n.includes("dnc") || n.includes("donotcall") || n.includes("litigator")) {
      dnc.push({ col: i, idx: indexOf(n) });
      used.add(i);
    }
  });

  // Phone columns: "Phone 1", "Mobile 2", "Wireless", "Landline 3", "Phone Number 1"…
  const phones: { col: number; dncCols: number[] }[] = [];
  norms.forEach((n, i) => {
    if (used.has(i)) return;
    if (/^(phone|mobile|cell|wireless|landline|contactphone|ownerphone)(number)?\d*(number)?$/.test(n)) {
      const idx = indexOf(n);
      // Its own numbered flag ("Phone 2 DNC") plus any unnumbered row-level
      // flag ("DNC", "Litigator"), which applies to every phone on the row.
      phones.push({
        col: i,
        dncCols: dnc.filter((d) => d.idx === idx || d.idx === "").map((d) => d.col),
      });
      used.add(i);
    }
  });

  const unmapped = headers.filter((_, i) => !used.has(i) && headers[i].trim() !== "");
  return { fields, phones, unmapped };
}

/**
 * How to read an EMPTY cell in a DNC column. "unknown" (the default) means the
 * number is treated as not scrubbed and is never pushed for calling. Set
 * "clear" only after confirming the vendor leaves the cell blank for numbers
 * it checked and found clear.
 */
export type BlankDncPolicy = "unknown" | "clear";

export function readDnc(values: string[], hasColumn: boolean, blank: BlankDncPolicy): DncStatus {
  if (!hasColumn) return "unknown";
  let sawBlank = false;
  for (const raw of values) {
    const v = key(raw ?? "");
    if (v === "") sawBlank = true;
    else if (DNC_LISTED.has(v)) return "listed"; // any listed / litigator flag wins
    else if (!DNC_CLEAR.has(v)) return "unknown"; // a value we don't recognise: be safe
  }
  // Every flag for this number must say clear; a blank only counts as clear
  // when the uploader confirmed that's what the vendor's blanks mean.
  if (sawBlank && blank !== "clear") return "unknown";
  return "clear";
}

/** "$1,234.5" or "1234.50" -> "$1,234.50 due"; anything else -> "". */
export function formatAmount(raw: string): string {
  const s = raw.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return "";
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due`;
}

function joinDetail(...parts: string[]): string | undefined {
  const out = parts.filter(Boolean).join(" · ");
  return out || undefined;
}

function cell(r: string[], i: number | undefined): string {
  return i === undefined ? "" : (r[i] ?? "").trim();
}

export function mapRow(r: string[], m: ImportMapping, blank: BlankDncPolicy = "unknown"): ImportRow {
  const f = m.fields;
  const first = cell(r, f.ownerFirst);
  const last = cell(r, f.ownerLast);
  const ownerName = cell(r, f.ownerName) || [first, last].filter(Boolean).join(" ");

  // The same number in two columns keeps the most cautious status.
  const SAFETY: Record<DncStatus, number> = { clear: 0, unknown: 1, listed: 2 };
  const byPhone = new Map<string, DncStatus>();
  for (const p of m.phones) {
    const phone = normalizePhone(cell(r, p.col));
    if (!phone) continue;
    const dnc = readDnc(
      p.dncCols.map((c) => cell(r, c)),
      p.dncCols.length > 0,
      blank,
    );
    const prev = byPhone.get(phone);
    if (!prev || SAFETY[dnc] > SAFETY[prev]) byPhone.set(phone, dnc);
  }
  const phones: PhoneRecord[] = [...byPhone].map(([phone, dnc]) => ({ phone, dnc }));

  return {
    apn: normalizeApn(cell(r, f.apn)),
    address: normalizeAddress(cell(r, f.address)),
    city: cell(r, f.city).toUpperCase(),
    zip: cell(r, f.zip).slice(0, 5),
    ownerName,
    mailAddress: normalizeAddress(cell(r, f.mailAddress)),
    mailCity: cell(r, f.mailCity).toUpperCase(),
    mailState: cell(r, f.mailState).toUpperCase(),
    mailZip: cell(r, f.mailZip).slice(0, 5),
    lastSaleDate: normalizeDate(cell(r, f.lastSaleDate)),
    eventDate: normalizeDate(cell(r, f.eventDate)),
    detail: joinDetail(cell(r, f.detail), formatAmount(cell(r, f.amountDue))),
    phones,
  };
}

/**
 * Stable parcel key: the APN when we have one, otherwise the normalized
 * address + ZIP. Rows with neither can't be matched to anything and are
 * skipped by the importer.
 */
export function parcelKey(row: Pick<ImportRow, "apn" | "address" | "zip">): string | null {
  if (row.apn) return row.apn;
  if (row.address && /^\d{5}$/.test(row.zip)) return `ADDR:${row.address}|${row.zip}`;
  return null;
}

/** Owner gets mail somewhere other than the property. */
export function isAbsentee(row: Pick<ImportRow, "address" | "zip" | "mailAddress" | "mailZip">): boolean | undefined {
  if (!row.mailAddress || !row.address) return undefined;
  if (row.mailAddress !== row.address) return true;
  if (row.mailZip && row.zip && row.mailZip !== row.zip) return true;
  return false;
}

export function yearsSince(isoDate: string | undefined, now: Date = new Date()): number | undefined {
  if (!isoDate) return undefined;
  const t = Date.parse(isoDate);
  if (!Number.isFinite(t)) return undefined;
  return Math.floor((now.getTime() - t) / (365.25 * 86_400_000));
}
