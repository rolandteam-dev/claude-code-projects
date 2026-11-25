import type { Contingency } from "../lib/offers/types";

/**
 * The Roland Team's STANDARD offer terms, as given by the transaction coordinator (Kristi Tildahl,
 * 2026-11-24). When an agent doesn't state a term, the Offer Machine fills it from here and labels it
 * "(default)" on the confirmation card and terms sheet, so an agent always sees what they didn't say.
 *
 * Public repo: standard terms only. Never put a client, a deal, a license number, a broker's address
 * or a phone number here. Those live in the private brokerage config (Vercel Blob, config/brokerage.json).
 */
export const OFFER_DEFAULTS_ARE_PLACEHOLDERS = false;

export const offerDefaults: {
  /** Earnest money as a percent of the offer price, rounded to the nearest $100. */
  earnestMoneyPercent: number;
  /** Close of escrow, in days from today, then moved to the next Tue/Wed/Thu that isn't a holiday. */
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
  appraisalDays: 21,
  loanDays: 30,
};

/** The rest of the standard offer: terms the RPA carries that agents rarely change. */
export const standardTerms = {
  emd: { method: "wire", businessDays: 3, heldBy: "escrow" },
  buyerBrokerCompensationPercent: 3,
  escrow: { company: "Magnus Title - RETA", officer: "Denise Barragan" },
  /** Home protection plan: required, seller pays. */
  homeProtection: { company: "Achosa", paidBy: "seller", maxPrice: 795 },
  /** "Additional Terms" attached to every offer (RPA page 9). */
  additionalTerms: [
    "Seller shall be required to respond to Buyer’s request for repairs if such request is submitted following Buyer’s home inspection. In the event Seller fails to provide a response prior to the expiration of the Due Diligence Period, the Due Diligence Period shall automatically extend and remain in effect until all repair requests have been addressed and a written agreement regarding such repairs has been reached by all parties.",
    "Seller agrees to pay off any outstanding balance related to SIDS/LIDS, special assessments, and any existing solar system financing or lease, in full, at or before the close of escrow.",
    "Buyer and Seller agree that the Buyer’s Due Diligence Period shall not commence until Seller or Seller’s agent confirms in writing, that all utilities at the property have been turned on.",
    "If the Condominium Certification or Questionnaire indicates that the subject property is considered a non-warrantable condominium, Buyer shall have the right to cancel this agreement and receive a full refund of their Earnest Money Deposit upon written notice to Seller.",
    "Buyer may add any previously waived inspections at any time before Close of Escrow. These are optional, not contingencies, and do not require an amendment to this Agreement.",
  ],
  /** Exclusive Buyer Brokerage Representation Agreement. */
  bbra: {
    propertyTypes: ["residential", "investment", "customBuild", "newHome"],
    cities: "Las Vegas, North Las Vegas, Henderson, Boulder City",
    otherDescription: [
      "- This agreement encompasses all property types that the named real estate licensee is legally authorized to sell. It further applies",
      "to any geographic area within the coverage of the Las Vegas Association of REALTORS® Multiple Listing Service (LVAR MLS).",
    ],
    additionalTerms: [
      "- Nothing in this agreement shall preclude the buyer and agent from engaging in negotiations or entering into separate agreements",
      "outside the scope of this contract, provided that all such actions are mutually agreed upon by the parties and are in compliance",
      "with applicable laws and regulations.",
    ],
    termMonths: 12,
    compensationPercent: 3,
    transactionFee: { amount: 950, towards: "LPT Realty - Transaction Fee" },
    tailDays: 180,
  },
} as const;
