/**
 * Seller Engine (distress lead engine) — shared types.
 *
 * A "parcel" is one Clark County property keyed by its 11-digit APN. Every
 * distress list it appears on is a "signal". Owners on more than one list
 * ("stacked") score highest. See docs/seller-engine.md.
 */
export type SignalType =
  | "nod" // notice of default recorded
  | "trustee_sale" // notice of trustee's sale recorded / auction scheduled
  | "probate" // probate case opened for the owner
  | "tax_delinquent" // on the Treasurer's delinquent list
  | "code_violation" // open code-enforcement case
  | "vacant" // vendor vacancy flag
  | "expired" // MLS listing expired / withdrawn
  | "fsbo"; // for sale by owner

export const SIGNAL_TYPES: readonly SignalType[] = [
  "nod",
  "trustee_sale",
  "probate",
  "tax_delinquent",
  "code_violation",
  "vacant",
  "expired",
  "fsbo",
];

export function isSignalType(v: string): v is SignalType {
  return (SIGNAL_TYPES as readonly string[]).includes(v);
}

export type Signal = {
  type: SignalType;
  /** Where it came from: "propstream", "lv-code-open-data", "manual", … */
  source: string;
  /** ISO date (YYYY-MM-DD) of the underlying event, when known. */
  eventDate?: string;
  /** Free-text detail (violation description, case number, …). */
  detail?: string;
};

/** Do Not Call status of one phone number, as the list source reported it. */
export type DncStatus = "clear" | "listed" | "unknown";

export type PhoneRecord = { phone: string; dnc: DncStatus };

export type ParcelFacts = {
  /** Mailing address differs from the property address. */
  absentee?: boolean;
  /** Whole years since the last recorded sale, when known. */
  yearsOwned?: number;
  /** Owner name looks like a bank, government body, HOA or other non-seller. */
  institutional?: boolean;
};
