/**
 * Offer Machine — shared types and input validation (pure; no I/O).
 *
 * The Slack modal collects TYPED terms (price, dates, contingencies). Those typed
 * values are the source of truth for the contract: the worker fills
 * TransactionDesk from them, and the review message shows them back to the agent
 * next to whatever the worker reports. Free-text notes never change a term.
 */

export const JOB_TYPES = ["buyer_offer", "counter", "seller_review"] as const;
export type JobType = (typeof JOB_TYPES)[number];

/** Phase 1 ships buyer offers only; counters and seller-side follow. */
export const ENABLED_JOB_TYPES: readonly JobType[] = ["buyer_offer"];

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  buyer_offer: "Buyer offer",
  counter: "Counter offer",
  seller_review: "Seller-side review",
};

export type JobStatus =
  | "queued"
  | "working"
  | "needs_review"
  | "approved"
  | "changes_requested"
  | "failed";

export const FINANCING = ["cash", "conventional", "fha", "va", "other"] as const;
export type Financing = (typeof FINANCING)[number];

export const FINANCING_LABEL: Record<Financing, string> = {
  cash: "Cash",
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  other: "Other financing",
};

export const CONTINGENCIES = ["inspection", "appraisal", "loan", "home_sale"] as const;
export type Contingency = (typeof CONTINGENCIES)[number];

export const CONTINGENCY_LABEL: Record<Contingency, string> = {
  inspection: "Inspection",
  appraisal: "Appraisal",
  loan: "Loan",
  home_sale: "Sale of buyer's home",
};

export interface BuyerOfferInputs {
  address: string;
  clientName: string;
  /** The buyers one per entry, when known (the forms need them separately). */
  buyerNames?: string[];
  /** Optional Follow Up Boss person id, so the worker/agent can find the record. */
  fubPersonId?: string;
  listPrice: number;
  offerPrice: number;
  financing: Financing;
  earnestMoney: number;
  /** Close of escrow, YYYY-MM-DD. */
  closeDate: string;
  contingencies: Contingency[];
  /** Context for the drafter only. Never changes price, dates or contingencies. */
  notes?: string;
  /** Agent writing the offer: the Slack speaker, unless they named someone else. */
  agentName?: string;
  /** Contingency periods in days, set only for contingencies that are included. */
  inspectionDays?: number;
  appraisalDays?: number;
  loanDays?: number;
  /** Seller-paid closing costs / credit, in dollars. */
  sellerCredit?: number;
  mlsNumber?: string;
  /** Percent of the purchase price paid down. Set for financed offers; absent for cash. */
  downPaymentPercent?: number;
  /** Will the buyers live in the home (RPA page 1)? Undefined = not asked/known: the agent ticks it by hand. */
  occupy?: boolean;
  /** Who pays for a home warranty, when one is part of the offer. */
  homeWarranty?: "seller" | "buyer";
  /** Items that convey with the property (appliances, window coverings, ...). */
  inclusions?: string[];
}

/** FHA's minimum down payment (credit score 580+), in percent. */
export const FHA_MIN_DOWN_PERCENT = 3.5;

/** What the worker reports back after drafting in TransactionDesk. */
export interface JobResult {
  summary: string;
  tdUrl?: string;
  /** Things the drafter guessed or could not fill. Shown to the reviewer. */
  flags: string[];
  /**
   * Fields where the TransactionDesk draft disagrees with the typed inputs.
   * Any entry here removes the Approve button — the draft must be fixed first.
   */
  mismatches: string[];
}

/** Raw modal values, keyed by block id. */
export interface RawBuyerForm {
  address?: string;
  client_name?: string;
  fub_person_id?: string;
  list_price?: string;
  offer_price?: string;
  financing?: string;
  earnest_money?: string;
  close_date?: string;
  contingencies?: string[];
  notes?: string;
  agent_name?: string;
  inspection_days?: string;
  appraisal_days?: string;
  loan_days?: string;
  seller_credit?: string;
  mls_number?: string;
  down_payment_percent?: string;
  home_warranty?: string;
  inclusions?: string[];
  /** "yes" / "no": will the buyers live in the home. */
  occupy?: string;
}

export type ValidationResult =
  | { ok: true; inputs: BuyerOfferInputs }
  | { ok: false; errors: Record<string, string> };

/** "$1,250,000" / "1250000" / "1,250,000.50" -> number, else null. */
export function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Today's date (YYYY-MM-DD) in Las Vegas, where every close date is read. */
export function todayLasVegas(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function isRealDate(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd;
}

/** A typo here ends up in a contract, so a wildly off price is an error, not a warning. */
const PRICE_RATIO_MIN = 0.6;
const PRICE_RATIO_MAX = 1.4;

/**
 * `strict` is for the /offer form, where there is no follow-up question: a financed offer must state its down
 * payment, and occupancy (RPA page 1) must be answered. The conversation asks for both itself.
 */
export function validateBuyerForm(raw: RawBuyerForm, now: Date = new Date(), opts: { strict?: boolean } = {}): ValidationResult {
  const errors: Record<string, string> = {};

  const address = (raw.address ?? "").trim();
  if (address.length < 5) errors.address = "Enter the full property address.";

  const clientName = (raw.client_name ?? "").trim();
  if (clientName.length < 2) errors.client_name = "Enter the client's name.";

  const fubRaw = (raw.fub_person_id ?? "").trim();
  if (fubRaw && !/^\d{1,12}$/.test(fubRaw)) errors.fub_person_id = "A Follow Up Boss id is digits only.";

  const listPrice = parseMoney(raw.list_price);
  if (listPrice === null || listPrice <= 0) errors.list_price = "Enter the list price as a number.";

  const offerPrice = parseMoney(raw.offer_price);
  if (offerPrice === null || offerPrice <= 0) errors.offer_price = "Enter the offer price as a number.";

  if (listPrice && offerPrice && !errors.list_price && !errors.offer_price) {
    const ratio = offerPrice / listPrice;
    if (ratio < PRICE_RATIO_MIN || ratio > PRICE_RATIO_MAX) {
      errors.offer_price = `That is ${Math.round(ratio * 100)}% of list. Check the digits.`;
    }
  }

  const financing = (raw.financing ?? "") as Financing;
  if (!FINANCING.includes(financing)) errors.financing = "Choose how the buyer is paying.";

  const earnest = parseMoney(raw.earnest_money);
  if (earnest === null) errors.earnest_money = "Enter the earnest money as a number (0 if none).";
  else if (offerPrice && earnest > offerPrice) errors.earnest_money = "Earnest money is more than the offer.";

  const closeDate = (raw.close_date ?? "").trim();
  if (!isRealDate(closeDate)) errors.close_date = "Pick the close-of-escrow date.";
  else if (closeDate < todayLasVegas(now)) errors.close_date = "Close of escrow can't be in the past.";

  const contingencies = (raw.contingencies ?? []).filter((c): c is Contingency =>
    (CONTINGENCIES as readonly string[]).includes(c),
  );
  if (financing === "cash" && contingencies.includes("loan")) {
    errors.contingencies = "A cash offer has no loan contingency.";
  }

  const notes = (raw.notes ?? "").trim();
  if (notes.length > 1000) errors.notes = "Keep notes under 1,000 characters.";

  const agentName = (raw.agent_name ?? "").trim();
  if (agentName.length > 80) errors.agent_name = "That agent name is too long.";
  const mlsNumber = (raw.mls_number ?? "").trim().slice(0, 20);

  const days: { inspectionDays?: number; appraisalDays?: number; loanDays?: number } = {};
  for (const [rawKey, outKey, label] of [
    ["inspection_days", "inspectionDays", "Inspection"],
    ["appraisal_days", "appraisalDays", "Appraisal"],
    ["loan_days", "loanDays", "Loan"],
  ] as const) {
    const v = (raw[rawKey] ?? "").trim();
    if (!v) continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 60) errors[rawKey] = `${label} days must be a whole number from 1 to 60.`;
    else days[outKey] = n;
  }

  let sellerCredit: number | undefined;
  const creditRaw = (raw.seller_credit ?? "").trim();
  if (creditRaw) {
    const c = parseMoney(creditRaw);
    if (c === null) errors.seller_credit = "Enter the seller credit as a number.";
    else if (offerPrice && c > offerPrice * 0.1) errors.seller_credit = "That credit is over 10% of the offer. Check the digits.";
    else sellerCredit = c;
  }

  let downPaymentPercent: number | undefined;
  const downRaw = (raw.down_payment_percent ?? "").trim();
  if (downRaw) {
    const dp = Number(downRaw);
    if (!/^\d+(\.\d{1,2})?$/.test(downRaw) || dp > 100) {
      errors.down_payment_percent = "Enter the down payment as a percent from 0 to 100.";
    } else if (financing === "cash") {
      errors.down_payment_percent = "A cash offer has no down payment.";
    } else if (financing === "fha" && dp < FHA_MIN_DOWN_PERCENT) {
      errors.down_payment_percent = `FHA requires at least ${FHA_MIN_DOWN_PERCENT}% down.`;
    } else {
      downPaymentPercent = dp;
    }
  }

  let homeWarranty: "seller" | "buyer" | undefined;
  const warrantyRaw = (raw.home_warranty ?? "").trim();
  if (warrantyRaw === "seller" || warrantyRaw === "buyer") homeWarranty = warrantyRaw;
  else if (warrantyRaw) errors.home_warranty = "A home warranty is paid by the seller or the buyer.";

  const occupyRaw = (raw.occupy ?? "").trim().toLowerCase();
  let occupy: boolean | undefined;
  if (occupyRaw === "yes") occupy = true;
  else if (occupyRaw === "no") occupy = false;
  else if (occupyRaw) errors.occupy = "Choose yes or no.";
  if (opts.strict && occupy === undefined && !errors.occupy) errors.occupy = "Say whether the buyers will live in the home (page 1 of the contract asks).";
  if (opts.strict && financing !== "cash" && FINANCING.includes(financing) && downPaymentPercent === undefined && !errors.down_payment_percent) {
    errors.down_payment_percent = "Enter the down payment as a percent (a financed offer needs it).";
  }

  const inclusions = (raw.inclusions ?? []).map((i) => i.trim()).filter(Boolean);
  if (inclusions.length > 20 || inclusions.some((i) => i.length > 60)) {
    errors.inclusions = "List up to 20 included items, each under 60 characters.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    inputs: {
      address,
      clientName,
      ...(fubRaw ? { fubPersonId: fubRaw } : {}),
      listPrice: listPrice as number,
      offerPrice: offerPrice as number,
      financing,
      earnestMoney: earnest as number,
      closeDate,
      contingencies,
      ...(notes ? { notes } : {}),
      ...(agentName ? { agentName } : {}),
      ...days,
      ...(sellerCredit !== undefined ? { sellerCredit } : {}),
      ...(mlsNumber ? { mlsNumber } : {}),
      ...(downPaymentPercent !== undefined ? { downPaymentPercent } : {}),
      ...(homeWarranty ? { homeWarranty } : {}),
      ...(inclusions.length ? { inclusions } : {}),
      ...(occupy !== undefined ? { occupy } : {}),
    },
  };
}

/** Which job type a `/offer <text>` argument means. null = unrecognised. */
export function parseJobType(text: string | null | undefined): JobType | null {
  const t = (text ?? "").trim().toLowerCase();
  if (t === "" || t === "buyer" || t === "offer" || t === "new") return "buyer_offer";
  if (t === "counter") return "counter";
  if (t === "review" || t === "seller") return "seller_review";
  return null;
}

/** Validate a worker's result body. Returns the cleaned result or an error string. */
export function parseJobResult(body: unknown): { ok: true; result: JobResult } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "result must be an object" };
  const b = body as Record<string, unknown>;
  const summary = typeof b.summary === "string" ? b.summary.trim() : "";
  if (!summary) return { ok: false, error: "result.summary is required" };
  const strings = (v: unknown): string[] | null =>
    v === undefined ? [] : Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : null;
  const flags = strings(b.flags);
  const mismatches = strings(b.mismatches);
  if (flags === null) return { ok: false, error: "result.flags must be an array of strings" };
  if (mismatches === null) return { ok: false, error: "result.mismatches must be an array of strings" };
  const tdUrl = typeof b.tdUrl === "string" && /^https:\/\//i.test(b.tdUrl) ? b.tdUrl : undefined;
  if (b.tdUrl !== undefined && !tdUrl) return { ok: false, error: "result.tdUrl must be an https URL" };
  return {
    ok: true,
    result: {
      summary: summary.slice(0, 2000),
      ...(tdUrl ? { tdUrl } : {}),
      flags: flags.map((f) => f.slice(0, 300)).slice(0, 25),
      mismatches: mismatches.map((m) => m.slice(0, 300)).slice(0, 25),
    },
  };
}
