import type { DealDateKey } from "@/db/schema/deals";
import {
  addBusinessDays,
  addDays,
  rollForwardOffWeekend,
  type IsoDate,
} from "./dates";

/**
 * ============================================================================
 *  !!  UNCONFIRMED — DO NOT SHIP TO PRODUCTION AS-IS  !!
 * ============================================================================
 * These default periods are PLACEHOLDERS standing in for open question #3.
 * They are plausible, they are NOT verified against the NVAR Residential
 * Purchase Agreement, and a one-day error here is a real-money liability.
 *
 * Before launch, confirm with Mike and replace:
 *   1. Are periods counted from the acceptance date, or the day after?
 *   2. What time of day does a period expire (5:00 PM?)
 *   3. Do deadlines landing on a weekend or holiday roll forward?
 *   4. The actual default period for each row below.
 *
 * Every date this file produces is stored with source = 'computed' and is
 * labelled as computed in the UI, so nobody mistakes it for a term read off
 * the signed contract.
 */
export const RULESET_STATUS = "UNCONFIRMED" as const;

export type CountingMode = "calendar" | "business";

export type DeadlineRule = {
  key: DealDateKey;
  label: string;
  /** Days from the basis. */
  days: number;
  mode: CountingMode;
  basis: "acceptance" | "coe";
  /** Negative days count backwards from the basis (e.g. walkthrough before COE). */
  rollOffWeekend: boolean;
};

/** NVAR Residential Purchase Agreement — PLACEHOLDER periods. */
export const NVAR_RPA_RULES: DeadlineRule[] = [
  {
    key: "emd_due",
    label: "Earnest money due",
    days: 1,
    mode: "business",
    basis: "acceptance",
    rollOffWeekend: false,
  },
  {
    key: "due_diligence_end",
    label: "Due diligence / inspection period ends",
    days: 10,
    mode: "calendar",
    basis: "acceptance",
    rollOffWeekend: true,
  },
  {
    key: "title_docs_due",
    label: "Title documents due",
    days: 10,
    mode: "calendar",
    basis: "acceptance",
    rollOffWeekend: true,
  },
  {
    key: "appraisal_deadline",
    label: "Appraisal deadline",
    days: 21,
    mode: "calendar",
    basis: "acceptance",
    rollOffWeekend: true,
  },
  {
    key: "loan_contingency",
    label: "Loan contingency expires",
    days: 21,
    mode: "calendar",
    basis: "acceptance",
    rollOffWeekend: true,
  },
  {
    key: "walkthrough",
    label: "Final walkthrough",
    days: -5,
    mode: "calendar",
    basis: "coe",
    rollOffWeekend: false,
  },
];

/** Default days from acceptance to close, when the contract does not say. */
export const DEFAULT_ESCROW_DAYS = 30;

export type ComputedDeadline = {
  key: DealDateKey;
  label: string;
  value: IsoDate;
  /** Always 'computed' — these are derived, never read off the contract. */
  source: "computed";
};

/**
 * Derives the deadline set from the two anchors a contract always states.
 * Anything the contract states explicitly should be stored as source='contract'
 * and take precedence over the value computed here.
 */
export function computeDeadlines(args: {
  acceptanceDate: IsoDate;
  closeOfEscrowDate?: IsoDate | null;
  rules?: DeadlineRule[];
}): ComputedDeadline[] {
  const { acceptanceDate } = args;
  const rules = args.rules ?? NVAR_RPA_RULES;
  const coe =
    args.closeOfEscrowDate ?? addDays(acceptanceDate, DEFAULT_ESCROW_DAYS);

  return rules.map((rule) => {
    const basis = rule.basis === "acceptance" ? acceptanceDate : coe;
    let value =
      rule.mode === "business"
        ? addBusinessDays(basis, rule.days)
        : addDays(basis, rule.days);
    if (rule.rollOffWeekend) value = rollForwardOffWeekend(value);
    return { key: rule.key, label: rule.label, value, source: "computed" };
  });
}
