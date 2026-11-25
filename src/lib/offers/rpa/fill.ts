/**
 * Types the terms of a buyer offer onto the blank GLVAR Residential Purchase Agreement.
 *
 * Fills ONLY what the agent actually stated (or what the team's defaults supply, which the
 * caller marks). Anything not known stays blank for the agent: methods of payment, who holds
 * the deposit, compensation, escrow officer, signatures. It never guesses a legal term.
 *
 * Pure apart from pdf-lib; the blank form bytes are passed in (it is GLVAR's copyrighted form,
 * so it is not stored in this public repo).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { BuyerOfferInputs } from "../types";
import { BOX, FOOTER, P1, P2, P3, P5, RPA_PAGES, type Box, type TextBlank } from "./layout";

const INK = rgb(0.05, 0.1, 0.55);
const PAGE_H = 792;

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** 400000 -> "Four Hundred Thousand and 00/100". */
export function dollarsInWords(amount: number): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  if (whole === 0) return `Zero and ${String(cents).padStart(2, "0")}/100`;
  const groups: [number, string][] = [
    [Math.floor(whole / 1_000_000_000), "Billion"],
    [Math.floor(whole / 1_000_000) % 1000, "Million"],
    [Math.floor(whole / 1000) % 1000, "Thousand"],
    [whole % 1000, ""],
  ];
  const words = groups.filter(([n]) => n > 0).map(([n, label]) => `${below1000(n)}${label ? ` ${label}` : ""}`);
  return `${words.join(" ")} and ${String(cents).padStart(2, "0")}/100`;
}

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "2026-12-24" -> "12/24/2026". */
function usDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[2])}/${Number(m[3])}/${m[1]}` : iso;
}

const CLARK_CITIES = ["las vegas", "henderson", "north las vegas", "boulder city", "mesquite", "laughlin", "summerlin", "enterprise", "spring valley", "paradise", "sunrise manor", "whitney", "winchester", "moapa"];

/** "272 Helmsdale Dr., Henderson, NV 89014" -> city / zip / county. Blank where it can't be told. */
export function parseAddress(address: string): { city: string; zip: string; county: string } {
  const zip = /\b(\d{5})(?:-\d{4})?\s*$/.exec(address.trim())?.[1] ?? "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  let city = "";
  if (parts.length >= 3) city = parts[parts.length - 2];
  else if (parts.length === 2 && !/^NV\b/i.test(parts[1])) city = parts[1].replace(/\s+NV.*$/i, "").trim();
  const county = CLARK_CITIES.includes(city.toLowerCase()) ? "Clark" : "";
  return { city, zip, county };
}

interface Ctx {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
}

function text(ctx: Ctx, b: TextBlank, value: string | undefined) {
  if (!value) return;
  const page = ctx.doc.getPage(b.page - 1);
  let size = b.size ?? 10;
  while (size > 5.5 && ctx.font.widthOfTextAtSize(value, size) > b.width) size -= 0.5;
  // The blank's underline sits ~10pt below its top; sit the text just above it.
  page.drawText(value, { x: b.x, y: PAGE_H - b.top - 8.2 + (b.lift ?? 0), size, font: ctx.font, color: INK });
}

function check(ctx: Ctx, b: Box, on: boolean) {
  if (!on) return;
  const page = ctx.doc.getPage(b.page - 1);
  // Centre of the 6pt box: the glyph's visible square sits about 2pt below its top.
  page.drawText("X", { x: b.x + 1.2, y: PAGE_H - b.top - 9.4, size: 7.5, font: ctx.bold, color: INK });
}

/** Greedy-wrap `value` into the given blanks; returns what did not fit. */
function wrapInto(ctx: Ctx, blanks: TextBlank[], value: string): string {
  const words = value.split(/\s+/).filter(Boolean);
  let i = 0;
  for (const b of blanks) {
    const size = b.size ?? 9;
    let line = "";
    while (i < words.length) {
      const next = line ? `${line} ${words[i]}` : words[i];
      if (ctx.font.widthOfTextAtSize(next, size) > b.width) break;
      line = next;
      i++;
    }
    text(ctx, { ...b, size }, line);
  }
  return words.slice(i).join(" ");
}

export interface RpaFillResult {
  pdf: Uint8Array;
  /** Plain-English list of blanks the agent still has to complete. */
  stillToDo: string[];
  /** Anything that did not fit or could not be placed. */
  warnings: string[];
}

/** Which RPA blanks are filled from `inputs`, and which remain for the agent. */
export async function fillRpa(blank: Uint8Array, inputs: BuyerOfferInputs, today: string): Promise<RpaFillResult> {
  const doc = await PDFDocument.load(blank);
  if (doc.getPageCount() !== RPA_PAGES) {
    throw new Error(`RPA has ${doc.getPageCount()} pages, expected ${RPA_PAGES}: the form was revised, re-map src/lib/offers/rpa/layout.ts`);
  }
  const ctx: Ctx = { doc, font: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  const warnings: string[] = [];
  const financed = inputs.financing !== "cash";
  const { city, zip, county } = parseAddress(inputs.address);

  // Page 1: the parties, property and price.
  text(ctx, P1.date, usDate(today));
  text(ctx, P1.buyer, inputs.clientName);
  text(ctx, P1.property, inputs.address);
  text(ctx, P1.city, city);
  text(ctx, P1.county, county);
  text(ctx, P1.zip, zip);
  text(ctx, P1.price, money(inputs.offerPrice));
  text(ctx, P1.priceWords, dollarsInWords(inputs.offerPrice));
  text(ctx, P1.emd, money(inputs.earnestMoney));
  text(ctx, P1.total, money(inputs.offerPrice));

  // Financing: loan amount + loan type for financed offers; balance of down payment either way.
  const down = financed && inputs.downPaymentPercent !== undefined ? Math.round((inputs.offerPrice * inputs.downPaymentPercent) / 100) : 0;
  if (financed) {
    if (inputs.downPaymentPercent !== undefined) text(ctx, P1.loanAmount, money(inputs.offerPrice - down));
    check(ctx, BOX.loanConventional, inputs.financing === "conventional");
    check(ctx, BOX.loanFha, inputs.financing === "fha");
    check(ctx, BOX.loanVa, inputs.financing === "va");
    check(ctx, BOX.loanOther, inputs.financing === "other");
    if (inputs.downPaymentPercent !== undefined) text(ctx, P1.balance, money(Math.max(0, down - inputs.earnestMoney)));
  } else {
    text(ctx, P1.balance, money(Math.max(0, inputs.offerPrice - inputs.earnestMoney)));
  }

  // Page 2: contingency periods and items that convey.
  if (financed && inputs.contingencies.includes("appraisal")) text(ctx, P2.appraisalDays, inputs.appraisalDays ? String(inputs.appraisalDays) : undefined);
  if (financed && inputs.contingencies.includes("loan")) text(ctx, P2.loanDays, inputs.loanDays ? String(inputs.loanDays) : undefined);
  if (inputs.inclusions?.length) {
    const left = wrapInto(ctx, P2.inclusionLines, inputs.inclusions.join(", "));
    if (left) warnings.push(`Included items did not all fit on the form: add "${left}" by addendum.`);
  }

  // Page 3: close of escrow and the due-diligence (inspection) period.
  text(ctx, P3.coeDate, usDate(inputs.closeDate));
  const inspection = inputs.contingencies.includes("inspection");
  check(ctx, BOX.dueDiligenceIs, inspection);
  check(ctx, BOX.dueDiligenceIsNot, !inspection);
  if (inspection && inputs.inspectionDays) text(ctx, P3.dueDiligenceDays, String(inputs.inspectionDays));

  // Page 5: seller credit toward closing costs, and who pays for the home warranty.
  if (inputs.sellerCredit) {
    check(ctx, BOX.closingCostDollars, true);
    text(ctx, P5.closingCostDollars, money(inputs.sellerCredit));
  }
  if (inputs.homeWarranty) {
    check(ctx, BOX.warrantyRequires, true);
    check(ctx, BOX.warrantySeller, inputs.homeWarranty === "seller");
    check(ctx, BOX.warrantyBuyer, inputs.homeWarranty === "buyer");
  }

  // Footer on every page: buyer names + property address.
  for (let p = 1; p <= RPA_PAGES; p++) {
    const first = p === 1;
    text(ctx, { page: p, x: FOOTER.buyerX, top: first ? FOOTER.buyerTops[1] : FOOTER.buyerTops.rest, width: FOOTER.width, size: 8, lift: 1.6 }, inputs.clientName);
    text(ctx, { page: p, x: FOOTER.addressX, top: first ? FOOTER.addressTops[1] : FOOTER.addressTops.rest, width: FOOTER.width, size: 8, lift: 1.6 }, inputs.address);
  }

  // A clear marker so nobody mistakes the draft for a finished contract.
  const first: PDFPage = doc.getPage(0);
  first.drawText("DRAFT prepared by the Offer Machine - verify every blank, then complete the rest in TransactionDesk before signing.", {
    x: 54,
    y: PAGE_H - 14,
    size: 7,
    font: ctx.bold,
    color: rgb(0.7, 0.1, 0.1),
  });

  const stillToDo = [
    "Method of earnest money and who holds it, and delivery days (Section 1A)",
    "Escrow company and officer (Section 6A)",
    "Buyer's broker compensation (Section 2)",
    "Property APN, and loan-application / due-diligence days if not stated (Sections 1, 3A)",
    "Buyer's broker/agent details, seller response deadline, and all signatures (pages 9-10)",
  ];
  if (!inputs.sellerCredit && !inputs.homeWarranty) stillToDo.push("Seller credit / home protection plan (Section 9) were not part of this offer");
  if (financed && inputs.downPaymentPercent === undefined) stillToDo.push("Loan amount: down payment was not stated");
  if (county === "") stillToDo.push("County could not be read from the address");
  return { pdf: await doc.save(), stillToDo, warnings };
}
