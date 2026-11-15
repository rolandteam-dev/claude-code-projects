/**
 * Seller Engine scoring. Pure functions only (no I/O) so the rules can be
 * unit-tested and tuned from results — see scripts/distress/selftest.mjs.
 *
 * Starting weights come from the build scope. They are a first guess; tune
 * them once the pilot shows which lists actually turn into listings.
 */
import type { ParcelFacts, Signal, SignalType } from "./types";

export const WEIGHTS: Record<SignalType, number> = {
  nod: 40,
  trustee_sale: 60,
  probate: 30,
  tax_delinquent: 20,
  code_violation: 15,
  vacant: 10,
  expired: 15,
  fsbo: 10,
};

/** Extra points when a notice of default AND a trustee sale are both present. */
export const NOD_PLUS_SALE_BONUS = 20;
/** Extra points for a second (or later) open code violation. */
export const MULTI_VIOLATION_BONUS = 10;
/** Extra points for each distinct list beyond the first ("stacking"). */
export const STACK_BONUS = 15;
export const ABSENTEE_BONUS = 10;
export const LONG_OWNERSHIP_BONUS = 10;
export const LONG_OWNERSHIP_YEARS = 10;

/**
 * Signals older than this (in days) no longer count. A notice of default from
 * two years ago has been cured, sold or foreclosed by now. Signals with no
 * date (vendor lists that are current as of export) always count.
 */
export const MAX_AGE_DAYS: Record<SignalType, number> = {
  nod: 270,
  trustee_sale: 120,
  probate: 730,
  tax_delinquent: 540,
  code_violation: 730,
  vacant: 365,
  expired: 365,
  fsbo: 120,
};

const SIGNAL_LABEL: Record<SignalType, string> = {
  nod: "Notice of default",
  trustee_sale: "Trustee sale scheduled",
  probate: "Probate",
  tax_delinquent: "Tax delinquent",
  code_violation: "Open code violation",
  vacant: "Vacant",
  expired: "Expired listing",
  fsbo: "For sale by owner",
};

export function signalLabel(t: SignalType): string {
  return SIGNAL_LABEL[t];
}

export type ScoreResult = {
  score: number;
  /** Human-readable reasons, highest-value first — goes in the FUB note. */
  reasons: string[];
  /** Distinct lists that counted. */
  lists: SignalType[];
  excluded?: string;
};

function ageDays(isoDate: string, now: Date): number | null {
  const t = Date.parse(isoDate);
  if (!Number.isFinite(t)) return null;
  return (now.getTime() - t) / 86_400_000;
}

/** Keep only signals still fresh enough to matter. */
export function liveSignals(signals: Signal[], now: Date = new Date()): Signal[] {
  return signals.filter((s) => {
    if (!s.eventDate) return true;
    const age = ageDays(s.eventDate, now);
    if (age === null) return true;
    return age <= MAX_AGE_DAYS[s.type];
  });
}

export function scoreParcel(signals: Signal[], facts: ParcelFacts = {}, now: Date = new Date()): ScoreResult {
  if (facts.institutional) {
    return { score: 0, reasons: [], lists: [], excluded: "institutional owner" };
  }

  const live = liveSignals(signals, now);
  const lists = [...new Set(live.map((s) => s.type))];
  if (lists.length === 0) return { score: 0, reasons: [], lists: [] };

  const parts: { points: number; reason: string }[] = [];
  for (const t of lists) {
    parts.push({ points: WEIGHTS[t], reason: signalLabel(t) });
  }
  if (lists.includes("nod") && lists.includes("trustee_sale")) {
    parts.push({ points: NOD_PLUS_SALE_BONUS, reason: "Default and sale both recorded" });
  }
  const violations = new Set(
    live.filter((s) => s.type === "code_violation").map((s) => (s.detail || "").trim().toUpperCase()),
  );
  if (violations.size > 1) {
    parts.push({ points: MULTI_VIOLATION_BONUS, reason: `${violations.size} open code violations` });
  }
  if (lists.length > 1) {
    parts.push({ points: STACK_BONUS * (lists.length - 1), reason: `On ${lists.length} distress lists` });
  }
  if (facts.absentee) parts.push({ points: ABSENTEE_BONUS, reason: "Absentee owner" });
  if (facts.yearsOwned !== undefined && facts.yearsOwned >= LONG_OWNERSHIP_YEARS) {
    parts.push({ points: LONG_OWNERSHIP_BONUS, reason: `Owned ${facts.yearsOwned}+ years` });
  }

  parts.sort((a, b) => b.points - a.points);
  return {
    score: parts.reduce((n, p) => n + p.points, 0),
    reasons: parts.map((p) => p.reason),
    lists,
  };
}

/**
 * Owner names that are not motivated sellers: lenders holding REO, government
 * bodies, HOAs. Trusts and LLCs are NOT excluded — many are ordinary owners.
 */
const INSTITUTIONAL = [
  /\bBANK\b/,
  /\bMORTGAGE\b/,
  /\bFEDERAL NATIONAL\b/,
  /\bFANNIE MAE\b/,
  /\bFREDDIE MAC\b/,
  /\bFEDERAL HOME LOAN\b/,
  /\bHOUSING AND URBAN\b/,
  /\bSECRETARY OF\b/,
  /\b(COUNTY|CITY|STATE) OF\b/,
  /\bHOMEOWNERS? ASS(OCIATION|N)\b/,
  /\bCOMMUNITY ASS(OCIATION|N)\b/,
  /\bUNITED STATES\b/,
  /\bLAS VEGAS VALLEY WATER\b/,
];

export function looksInstitutional(ownerName: string | undefined): boolean {
  if (!ownerName) return false;
  const n = ownerName.toUpperCase();
  return INSTITUTIONAL.some((re) => re.test(n));
}
