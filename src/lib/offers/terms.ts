/**
 * Offer Machine — the deterministic core of the conversational intake (pure; no
 * I/O). The language model only READS what an agent typed into StatedTerms.
 * Everything that decides what the offer says (defaults, what's missing,
 * validation, the terms sheet, the cover email) happens here, in code, so a model
 * can never invent a price, a date or a contingency.
 */
import { OFFER_DEFAULTS_ARE_PLACEHOLDERS, offerDefaults } from "../../content/offerDefaults";
import { standardCloseDate } from "./dates";
import {
  CONTINGENCIES,
  CONTINGENCY_LABEL,
  FINANCING,
  FINANCING_LABEL,
  formatMoney,
  parseMoney,
  validateBuyerForm,
  type BuyerOfferInputs,
  type Contingency,
  type Financing,
  type RawBuyerForm,
} from "./types";

/** Everything the agent has actually said, plus what the MLS lookup found. */
export interface StatedTerms {
  agentName?: string;
  buyerNames?: string[];
  address?: string;
  listPrice?: number;
  offerPrice?: number;
  financing?: Financing;
  earnestMoney?: number;
  closeDate?: string;
  /** When stated this REPLACES the default set ([] = "no contingencies"). */
  contingencies?: Contingency[];
  inspectionDays?: number;
  appraisalDays?: number;
  loanDays?: number;
  sellerCredit?: number;
  downPaymentPercent?: number;
  homeWarranty?: "seller" | "buyer";
  /** Buyers will live in the home (true) or not: investment, second home (false). */
  occupy?: boolean;
  inclusions?: string[];
  notes?: string;
  /** Result of the MLS lookup for `address`. Cleared whenever the address changes. */
  lookup?: { tried: boolean; listPrice?: number; mlsNumber?: string; status?: string; matchedAddress?: string };
}

export interface Extraction {
  terms: StatedTerms;
  cancel: boolean;
}

export type Source = "stated" | "default" | "lookup" | "speaker";
export interface DisplayRow {
  label: string;
  value: string;
  source: Source;
}

export interface ResolvedTerms {
  /** Plain-language things still needed from the agent, in the order to ask. */
  missing: string[];
  /** Validation problems (only computed once nothing is missing). */
  errors: Record<string, string> | null;
  /** The validated offer; null until nothing is missing and validation passes. */
  inputs: BuyerOfferInputs | null;
  /** Rows for the confirmation card, shown even while the offer is incomplete. */
  display: DisplayRow[];
  /** Labels of rows that came from defaults, for the "you didn't say these" warning. */
  defaulted: string[];
}

// ---------------------------------------------------------------- small helpers

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function longDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const roundTo100 = (n: number) => Math.round(n / 100) * 100;
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const warrantyText = (w: "seller" | "buyer") => (w === "seller" ? "Seller-paid" : "Buyer-paid");
const downPaymentText = (pct: number, price: number) => `${pct}% (${formatMoney((price * pct) / 100)})`;

/** Merge a new extraction over what's already stated. A new address invalidates the old lookup. */
export function mergeStated(prev: StatedTerms, next: StatedTerms): StatedTerms {
  const out: Record<string, unknown> = { ...prev };
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined || v === null) continue;
    if (k === "address" && v !== prev.address) delete out.lookup;
    out[k] = v;
  }
  return out as StatedTerms;
}

// ----------------------------------------------------------------- name matching

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

const normName = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

/**
 * Match a typed name ("Mike Rowland") to the team roster ("Mike Roland"). An exact
 * match wins; otherwise the single closest name within 2 edits. Ambiguous or far
 * names return null so the bot says "I couldn't find that agent" rather than guessing.
 */
export function matchPerson(typed: string, candidates: string[]): { name: string; exact: boolean } | null {
  const t = normName(typed);
  if (t.length < 4) return null;
  const scored = candidates
    .map((c) => ({ name: c, n: normName(c) }))
    .filter((c) => c.n.length > 0)
    .map((c) => ({ name: c.name, d: levenshtein(t, c.n) }));
  const exact = scored.find((c) => c.d === 0);
  if (exact) return { name: exact.name, exact: true };
  const best = Math.min(...scored.map((c) => c.d));
  if (!Number.isFinite(best) || best > 2) return null;
  const winners = scored.filter((c) => c.d === best);
  return winners.length === 1 ? { name: winners[0].name, exact: false } : null;
}

// --------------------------------------------------------------------- resolving

export interface ResolveContext {
  /** The Slack speaker's real name; the agent unless they named someone else. */
  speakerName: string;
  /** Today in Las Vegas, YYYY-MM-DD. */
  today: string;
}

function contingencyText(list: Contingency[], days: { inspectionDays?: number; appraisalDays?: number; loanDays?: number }): string {
  if (list.length === 0) return "None";
  const dayOf: Record<Contingency, number | undefined> = {
    inspection: days.inspectionDays,
    appraisal: days.appraisalDays,
    loan: days.loanDays,
    home_sale: undefined,
  };
  return list.map((c) => (dayOf[c] ? `${CONTINGENCY_LABEL[c]} (${dayOf[c]} days)` : CONTINGENCY_LABEL[c])).join(", ");
}

export function resolveTerms(s: StatedTerms, ctx: ResolveContext): ResolvedTerms {
  const display: DisplayRow[] = [];
  const defaulted: string[] = [];
  const lk = s.lookup;

  const buyers = (s.buyerNames ?? []).filter(Boolean);
  const listPrice = s.listPrice ?? lk?.listPrice;
  const listSource: Source = s.listPrice !== undefined ? "stated" : "lookup";
  const offerPrice = s.offerPrice;
  const financing = s.financing;

  const earnestMoney =
    s.earnestMoney ?? (offerPrice ? roundTo100((offerPrice * offerDefaults.earnestMoneyPercent) / 100) : undefined);
  const closeDate = s.closeDate ?? standardCloseDate(ctx.today, offerDefaults.closeOfEscrowDays);

  const defaultList = offerDefaults.contingencies.filter((c) => !(financing === "cash" && c === "loan"));
  const contingencies: Contingency[] = s.contingencies ?? [...defaultList];
  const days: { inspectionDays?: number; appraisalDays?: number; loanDays?: number } = {};
  if (contingencies.includes("inspection")) days.inspectionDays = s.inspectionDays ?? offerDefaults.inspectionDays;
  if (contingencies.includes("appraisal")) days.appraisalDays = s.appraisalDays ?? offerDefaults.appraisalDays;
  if (contingencies.includes("loan")) days.loanDays = s.loanDays ?? offerDefaults.loanDays;

  const agentName = s.agentName ?? ctx.speakerName;

  const row = (label: string, value: string | undefined, source: Source) => {
    if (value === undefined || value === "") return;
    display.push({ label, value, source });
    if (source === "default") defaulted.push(label);
  };

  row("Property", s.address ? `${s.address}${lk?.mlsNumber ? ` (MLS #${lk.mlsNumber})` : ""}` : undefined, "stated");
  row("Buyers", buyers.length ? joinNames(buyers) : undefined, "stated");
  row("Agent", agentName || undefined, s.agentName ? "stated" : "speaker");
  row("Offer price", offerPrice ? formatMoney(offerPrice) : undefined, "stated");
  row("List price", listPrice ? formatMoney(listPrice) : undefined, listSource);
  row("Financing", financing ? FINANCING_LABEL[financing] : undefined, "stated");
  const downPct = s.downPaymentPercent;
  if (downPct !== undefined) row("Down payment", offerPrice ? downPaymentText(downPct, offerPrice) : `${downPct}%`, "stated");
  row("Earnest money", earnestMoney !== undefined ? formatMoney(earnestMoney) : undefined, s.earnestMoney !== undefined ? "stated" : "default");
  row("Close of escrow", longDate(closeDate), s.closeDate ? "stated" : "default");
  row(
    "Contingencies",
    contingencyText(contingencies, days),
    s.contingencies !== undefined ? "stated" : "default",
  );
  if (s.sellerCredit !== undefined) row("Seller credit", formatMoney(s.sellerCredit), "stated");
  if (s.homeWarranty) row("Home warranty", warrantyText(s.homeWarranty), "stated");
  if (s.occupy !== undefined) row("Occupancy", s.occupy ? "Buyers will live in it" : "Buyers will not live in it", "stated");
  if (s.inclusions?.length) row("Included", s.inclusions.map(capFirst).join(", "), "stated");
  if (s.notes) row("Notes", s.notes, "stated");

  const missing: string[] = [];
  if (!agentName) missing.push("which agent is writing it");
  if (buyers.length === 0) missing.push("the buyers' names");
  if (!s.address) missing.push("the property address");
  if (!offerPrice) missing.push("the offer price");
  if (!listPrice) missing.push("the list price");
  if (!financing) missing.push("how they're paying (cash, conventional, FHA, VA)");
  // A down payment is never defaulted: guessing it would put a wrong loan term in the offer.
  if (financing && financing !== "cash" && downPct === undefined) missing.push("the down payment (percent)");
  // Page 1 of the RPA makes the agent declare occupancy; it is the item agents most often forget, so ask.
  if (s.occupy === undefined) missing.push("whether the buyers will live in the home (their residence) or not (investment, second home)");

  if (missing.length > 0) return { missing, errors: null, inputs: null, display, defaulted };

  const raw: RawBuyerForm = {
    address: s.address,
    client_name: joinNames(buyers),
    agent_name: agentName,
    list_price: String(listPrice),
    offer_price: String(offerPrice),
    financing,
    earnest_money: String(earnestMoney),
    close_date: closeDate,
    contingencies,
    inspection_days: days.inspectionDays ? String(days.inspectionDays) : undefined,
    appraisal_days: days.appraisalDays ? String(days.appraisalDays) : undefined,
    loan_days: days.loanDays ? String(days.loanDays) : undefined,
    seller_credit: s.sellerCredit !== undefined ? String(s.sellerCredit) : undefined,
    down_payment_percent: downPct !== undefined ? String(downPct) : undefined,
    home_warranty: s.homeWarranty,
    inclusions: s.inclusions,
    notes: s.notes,
    mls_number: lk?.mlsNumber,
  };
  const checked = validateBuyerForm(raw, new Date(`${ctx.today}T20:00:00Z`));
  if (!checked.ok) return { missing, errors: checked.errors, inputs: null, display, defaulted };
  return { missing, errors: null, inputs: { ...checked.inputs, buyerNames: buyers, ...(s.occupy !== undefined ? { occupy: s.occupy } : {}) }, display, defaulted };
}

/**
 * The /offer form lets earnest money and close of escrow be left blank: fill them from the team's standard
 * (and say so), exactly as the conversation does. Returns the labels that came from defaults.
 */
export function applyFormDefaults(raw: RawBuyerForm, today: string): { raw: RawBuyerForm; defaulted: string[] } {
  const out: RawBuyerForm = { ...raw };
  const defaulted: string[] = [];
  const offer = parseMoney(raw.offer_price);
  if (!(raw.earnest_money ?? "").trim() && offer) {
    out.earnest_money = String(roundTo100((offer * offerDefaults.earnestMoneyPercent) / 100));
    defaulted.push("Earnest money");
  }
  if (!(raw.close_date ?? "").trim()) {
    out.close_date = standardCloseDate(today, offerDefaults.closeOfEscrowDays);
    defaulted.push("Close of escrow");
  }
  const days = [
    ["inspection_days", "inspectionDays", "inspection"],
    ["appraisal_days", "appraisalDays", "appraisal"],
    ["loan_days", "loanDays", "loan"],
  ] as const;
  for (const [rawKey, defKey, contingency] of days) {
    if (!(raw[rawKey] ?? "").trim() && (out.contingencies ?? []).includes(contingency)) {
      out[rawKey] = String(offerDefaults[defKey]);
    }
  }
  return { raw: out, defaulted };
}

/** One message asking for everything still missing. */
export function questionText(missing: string[]): string {
  return `To finish this offer I still need:\n${missing.map((m) => `• ${m}`).join("\n")}\nReply here with whatever you have.`;
}

// ------------------------------------------------------- model output sanitizing

const clip = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

/** A real Las Vegas home price is never under this; "500" almost certainly means $500k. */
const MIN_PLAUSIBLE_PRICE = 10_000;

function price(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= MIN_PLAUSIBLE_PRICE ? Math.round(v) : undefined;
}
function money(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;
}
function dayCount(v: unknown): number | undefined {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 60 ? v : undefined;
}

/**
 * Turn whatever the model returned into StatedTerms, dropping anything that isn't
 * the right shape. Never trusts the model: unknown keys vanish, numbers must be
 * plausible, enums must match, dates must be YYYY-MM-DD.
 */
export function sanitizeExtraction(raw: unknown): Extraction {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const terms: StatedTerms = {};

  const agentName = clip(r.agentName, 80);
  if (agentName) terms.agentName = agentName;
  if (Array.isArray(r.buyerNames)) {
    const names = r.buyerNames.map((n) => clip(n, 80)).filter((n): n is string => Boolean(n)).slice(0, 6);
    if (names.length) terms.buyerNames = names;
  }
  const address = clip(r.address, 200);
  if (address) terms.address = address;
  const list = price(r.listPrice);
  if (list) terms.listPrice = list;
  const offer = price(r.offerPrice);
  if (offer) terms.offerPrice = offer;
  if (typeof r.financing === "string" && (FINANCING as readonly string[]).includes(r.financing)) {
    terms.financing = r.financing as Financing;
  }
  const earnest = money(r.earnestMoney);
  if (earnest !== undefined) terms.earnestMoney = earnest;
  if (typeof r.closeDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.closeDate)) terms.closeDate = r.closeDate;
  if (Array.isArray(r.contingencies)) {
    terms.contingencies = r.contingencies.filter((c): c is Contingency =>
      (CONTINGENCIES as readonly string[]).includes(c as string),
    );
  }
  const inspection = dayCount(r.inspectionDays);
  if (inspection) terms.inspectionDays = inspection;
  const appraisal = dayCount(r.appraisalDays);
  if (appraisal) terms.appraisalDays = appraisal;
  const loan = dayCount(r.loanDays);
  if (loan) terms.loanDays = loan;
  const credit = money(r.sellerCredit);
  if (credit !== undefined) terms.sellerCredit = credit;
  if (typeof r.downPaymentPercent === "number" && Number.isFinite(r.downPaymentPercent) && r.downPaymentPercent >= 0 && r.downPaymentPercent <= 100) {
    terms.downPaymentPercent = Math.round(r.downPaymentPercent * 100) / 100;
  }
  if (r.homeWarranty === "seller" || r.homeWarranty === "buyer") terms.homeWarranty = r.homeWarranty;
  if (typeof r.occupy === "boolean") terms.occupy = r.occupy;
  if (Array.isArray(r.inclusions)) {
    const items = [...new Set(r.inclusions.map((i) => clip(i, 60)).filter((i): i is string => Boolean(i)))].slice(0, 20);
    if (items.length) terms.inclusions = items;
  }
  const notes = clip(r.notes, 1000);
  if (notes) terms.notes = notes;

  return { terms, cancel: r.cancel === true };
}

/** Does this extraction carry any offer term at all? Used to answer "what is this?" gently. */
export function hasAnyTerm(t: StatedTerms): boolean {
  return Object.keys(t).length > 0;
}

// ------------------------------------------------------ terms sheet + cover email

const pad = (label: string) => `${label}:`.padEnd(18);

/** Plain-text terms sheet, in the order the agent keys them into TransactionDesk. */
export function sheetText(i: BuyerOfferInputs, defaulted: string[]): string {
  const pct = Math.round((i.offerPrice / i.listPrice) * 1000) / 10;
  const lines = [
    "OFFER TERMS (verify against the listing before you send)",
    "",
    `${pad("Property")}${i.address}`,
    ...(i.mlsNumber ? [`${pad("MLS #")}${i.mlsNumber}`] : []),
    `${pad("Buyer(s)")}${i.clientName}`,
    ...(i.agentName ? [`${pad("Agent")}${i.agentName}`] : []),
    `${pad("Purchase price")}${formatMoney(i.offerPrice)}  (list ${formatMoney(i.listPrice)}, ${pct}%)`,
    `${pad("Financing")}${FINANCING_LABEL[i.financing]}`,
    ...(i.downPaymentPercent !== undefined ? [`${pad("Down payment")}${downPaymentText(i.downPaymentPercent, i.offerPrice)}`] : []),
    `${pad("Earnest money")}${formatMoney(i.earnestMoney)}`,
    `${pad("Close of escrow")}${longDate(i.closeDate)}`,
    `${pad("Contingencies")}${contingencyText(i.contingencies, i)}`,
    ...(i.sellerCredit !== undefined ? [`${pad("Seller credit")}${formatMoney(i.sellerCredit)}`] : []),
    ...(i.homeWarranty ? [`${pad("Home warranty")}${warrantyText(i.homeWarranty)}`] : []),
    ...(i.inclusions?.length ? [`${pad("Included")}${i.inclusions.map(capFirst).join(", ")}`] : []),
    ...(i.notes ? [`${pad("Notes")}${i.notes}`] : []),
  ];
  if (defaulted.length) {
    lines.push("", `Filled from defaults, not stated: ${defaulted.join(", ")}.`);
    if (OFFER_DEFAULTS_ARE_PLACEHOLDERS) {
      lines.push("The defaults are PLACEHOLDERS, not the team's standard terms yet. Check each one.");
    }
  }
  return lines.join("\n");
}

/** Cover email to the listing agent. Deterministic: it states only what the sheet states. */
export function coverEmail(i: BuyerOfferInputs): { subject: string; body: string } {
  const bullets = [
    `Purchase price: ${formatMoney(i.offerPrice)}`,
    `Financing: ${FINANCING_LABEL[i.financing]}${i.downPaymentPercent !== undefined ? `, ${i.downPaymentPercent}% down` : ""}`,
    `Earnest money deposit: ${formatMoney(i.earnestMoney)}`,
    `Close of escrow: ${longDate(i.closeDate)}`,
    `Contingencies: ${contingencyText(i.contingencies, i)}`,
    ...(i.sellerCredit !== undefined ? [`Seller credit: ${formatMoney(i.sellerCredit)}`] : []),
    ...(i.homeWarranty ? [`Home warranty: ${warrantyText(i.homeWarranty)}`] : []),
    ...(i.inclusions?.length ? [`Included in the sale: ${i.inclusions.join(", ")}`] : []),
  ];
  const body = [
    "Hi [Listing agent name],",
    "",
    `On behalf of my clients, ${i.clientName}, I'm pleased to submit an offer on ${i.address}.`,
    "",
    ...bullets.map((b) => `• ${b}`),
    "",
    "The complete offer is attached. Please call or email me with any questions.",
    "",
    "Thank you,",
    i.agentName ?? "[Your name]",
    "[Phone] | [Brokerage]",
  ].join("\n");
  return { subject: `Offer: ${i.address}`, body };
}

// ------------------------------------------------------------ MLS result picking

/** The street part of an address, lowercased, for matching: "123 Main St, Las Vegas NV" -> "123 main st". */
function streetKey(addr: string): string {
  return addr
    .toLowerCase()
    .split(",")[0]
    .replace(/\b(street)\b/g, "st")
    .replace(/\b(avenue)\b/g, "ave")
    .replace(/\b(drive)\b/g, "dr")
    .replace(/\b(road)\b/g, "rd")
    .replace(/\b(court)\b/g, "ct")
    .replace(/\b(lane)\b/g, "ln")
    .replace(/\b(boulevard)\b/g, "blvd")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pick the listing that is THIS address, or none. Only an exact street match
 * counts; a near miss ("123 Main St" vs "1230 Main St") is never accepted, because
 * a wrong list price on an offer is worse than asking.
 */
export function pickListing<T extends { address: { line1: string } }>(listings: T[], typedAddress: string): T | null {
  const want = streetKey(typedAddress);
  if (!want) return null;
  const hits = listings.filter((l) => streetKey(l.address.line1) === want);
  return hits.length === 1 ? hits[0] : null;
}
