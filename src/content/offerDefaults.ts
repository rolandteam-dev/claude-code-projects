import type { Contingency } from "../lib/offers/types";

/**
 * PLACEHOLDER offer defaults. These are illustrative, NOT the Roland Team's
 * standard terms. Replace them with the team's standard offer (the transaction
 * coordinator's template), then set OFFER_DEFAULTS_ARE_PLACEHOLDERS to false.
 *
 * What the Offer Machine does with them: when an agent doesn't state a term, the
 * bot fills it from here and labels it "(default)" on the confirmation card and
 * the terms sheet, so an agent always sees what they didn't say. While this flag
 * is true, every sheet also carries a warning that the defaults are unconfirmed.
 *
 * Public repo: standard terms only. Never put a client, a deal or a license
 * number here.
 */
export const OFFER_DEFAULTS_ARE_PLACEHOLDERS = true;

export const offerDefaults: {
  /** Earnest money as a percent of the offer price, rounded to the nearest $100. */
  earnestMoneyPercent: number;
  /** Close of escrow, in days from today. */
  closeOfEscrowDays: number;
  /** Contingencies included unless the agent says otherwise (loan is dropped for cash). */
  contingencies: readonly Contingency[];
  inspectionDays: number;
  appraisalDays: number;
  loanDays: number;
} = {
  earnestMoneyPercent: 1,
  closeOfEscrowDays: 30,
  contingencies: ["inspection", "appraisal", "loan"],
  inspectionDays: 10,
  appraisalDays: 17,
  loanDays: 21,
};
