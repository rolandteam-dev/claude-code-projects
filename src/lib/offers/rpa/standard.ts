/**
 * The RPA terms the Roland Team fills the same way on (nearly) every offer: EMD delivery, compensation,
 * escrow, inspections, fees, CIC, disclosures, walk-through, possession, additional terms, and the
 * buyer's-broker block. Positions come from the team's own filled offer (see forms/draw.ts); values from
 * `standardTerms` in src/content/offerDefaults.ts and the private brokerage config.
 *
 * Deliberately NOT filled: occupancy when unknown, the Disclosure of Interest (the licensee's own
 * declaration, page 10), the seller response deadline, the listing side (page 11), signatures and initials.
 */
import { rgb } from "pdf-lib";
import { standardTerms } from "../../../content/offerDefaults";
import type { Broker } from "../forms/brokerage";
import { cross, put, splitBuyers, type Pen } from "../forms/draw";
import type { BuyerOfferInputs } from "../types";

export interface RpaContext {
  broker: Broker;
  agent: { name: string; license?: string; email?: string };
  /** Phone shown on the buyer's-broker block. */
  phone?: string;
  /** All e-mails to print on the buyer's-broker block (agent first). */
  emails: string[];
}

const T = standardTerms;

/** Right-aligned amount ending at xRight (the team's forms line amounts up on the right of the blank). */
function putRight(pen: Pen, page: number, value: string, xRight: number, top: number, size = 9) {
  put(pen, page, value, xRight - pen.font.widthOfTextAtSize(value, size), top, size);
}

/** Word-wrap `text` to `width` at `size`, using the form's own font metrics. */
function wrap(pen: Pen, text: string, width: number, size: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (line && pen.font.widthOfTextAtSize(next, size) > width) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export function fillStandard(pen: Pen, i: BuyerOfferInputs, ctx: RpaContext | undefined, today: string): { stillToDo: string[]; warnings: string[] } {
  const stillToDo: string[] = [];
  const warnings: string[] = [];
  const financed = i.financing !== "cash";
  const buyers = splitBuyers(i.buyerNames, i.clientName);

  // ---- Page 1: occupancy, deposit delivery, amounts the team always writes out.
  if (i.occupy === true) cross(pen, 1, 276.5, 187.0, 7.5);
  else if (i.occupy === false) cross(pen, 1, 330.4, 187.0, 7.5);
  else stillToDo.push("Page 1: tick whether the buyers DO or DO NOT intend to occupy the property (the most-missed item)");
  cross(pen, 1, 198.3, 286.0, 8); // EMD by wire transfer
  put(pen, 1, "----", 342.7, 286.1); // "Other:" not used
  put(pen, 1, String(T.emd.businessDays), 325.4, 298.4, 8.8);
  cross(pen, 1, 317.6, 310.0, 8); // held by Escrow Holder
  putRight(pen, 1, "0.00", 104, 345.8); // B. additional deposit
  put(pen, 1, "----", 467.7, 345.8);
  putRight(pen, 1, "0.00", 104, 433.8); // D. assume existing loan
  putRight(pen, 1, "0.00", 104, 527.2); // E. promissory note
  if (!financed) stillToDo.push("Section 3D cash purchase: business days to show proof of funds");

  // ---- Page 2: compensation, loan application, personal property.
  put(pen, 2, String(T.buyerBrokerCompensationPercent), 146.9, 61.1, 8.8);
  put(pen, 2, "----", 380.6, 61.1, 8.8);
  if (financed) {
    put(pen, 2, "Done", 278.3, 125.0, 8.8);
    put(pen, 2, "N/A", 235.4, 421.6, 8.8);
  } else {
    put(pen, 2, "N/A", 278.3, 125.0, 8.8);
  }
  const mls = i.mlsNumber ? `#${i.mlsNumber} ` : "";
  const included = i.inclusions?.length ? `, including ${i.inclusions.join(", ")}` : "";
  const lines = wrap(pen, `Everything in the MLS ${mls}as of ${usDate(today)}${included}.`, 465, 9);
  lines.slice(0, 3).forEach((l, n) => put(pen, 2, l, 89.5, 647.0 + 17.3 * n, 9));
  if (lines.length > 3) warnings.push("The personal-property list did not fit on page 2: add the rest by addendum.");
  if (!i.mlsNumber) stillToDo.push("Page 2: add the MLS number to the personal-property line (the listing wasn't found)");

  // ---- Page 3: escrow.
  put(pen, 3, T.escrow.company, 328.7, 78.9, 8.8, 150);
  put(pen, 3, T.escrow.officer, 360.4, 90.2, 9, 120);

  // ---- Page 4: inspections (8D) and fees (9A).
  const ins = T.inspections;
  const cols = [225, 376, 540];
  const rowTops = [290.0, 302.0, 314.0, 325.7, 337.7, 350.1, 374.2, 397.9];
  rowTops.forEach((top, r) => {
    cols.forEach((x, c) => {
      if (r === 7 && c === 2) return; // "Other:" gets N/A below
      const value = r === 0 && c === 0 ? ins.home : ins.others;
      put(pen, 4, value, x, top, 7.7);
    });
  });
  put(pen, 4, "N/A", 546.5, 397.9, 7.7);
  put(pen, 4, ins.otherNote, 424.5, 407.0, 8.1);
  const f = T.fees;
  put(pen, 4, f.escrow, 216.5, 661.2);
  put(pen, 4, f.lendersPolicy, 377.2, 661.2);
  put(pen, 4, f.ownersPolicy, 540.8, 661.2);
  put(pen, 4, f.transferTax, 216.3, 684.8);
  put(pen, 4, f.appraisal, 377.2, 684.8);
  put(pen, 4, f.other, 544.8, 684.8);
  put(pen, 4, f.other, 430.7, 694.7, 8.8);

  // ---- Page 5: home protection (9E) and CIC expenses (11A).
  const hpp = T.homeProtection;
  const buyerPays = i.homeWarranty === "buyer";
  cross(pen, 5, 434.4, 286.6, 7.7); // Buyer REQUIRES a Home Protection Plan
  put(pen, 5, hpp.company, 249.8, 299.7, 8.8, 140);
  cross(pen, 5, buyerPays ? 472.6 : 404.0, 299.4, 8); // Seller / Buyer will pay
  put(pen, 5, hpp.maxPrice.toFixed(2), 321.6, 311.3, 8.8);
  for (const [x, top] of [[233.1, 631.9], [479.8, 631.9], [233.1, 645.2], [479.8, 645.4]] as const) put(pen, 5, T.cicPaidBy, x, top);

  // ---- Page 6: disclosures (12), walk-through (14), possession (15).
  if (T.disclosures.includes("srpd")) cross(pen, 6, 90.3, 72.4, 8);
  if (T.disclosures.includes("constructionDefect")) cross(pen, 6, 90.3, 108.4, 8);
  put(pen, 6, String(T.walkThroughDays), 183.4, 249.6, 9);
  cross(pen, 6, 143.0, 433.2, 8); // possession at COE
  stillToDo.push("Page 6: add the Solar Panel Addendum (and Lead-Based Paint if built before 1978) when they apply");

  // ---- Page 7: broker's compensation (22).
  cross(pen, 7, T.buyerPaysAdditionalCompensation ? 336.5 : 392.3, 622.0, 8);

  // ---- Page 9: addendum N/A (29) and the standard additional terms.
  put(pen, 9, "N/A", 51.5, 419.0);
  // The additional-terms area is ruled for one line of text per rule; the standard terms are single-spaced
  // like TransactionDesk does it, so blank out the rules under them first.
  pen.doc.getPage(8).drawRectangle({ x: 50, y: 792 - 658, width: 514, height: 658 - 477, color: rgb(1, 1, 1) });
  let top = 482.1;
  let overflow = false;
  T.additionalTerms.forEach((term, n) => {
    const ls = wrap(pen, `${n + 1}.) ${term}`, 495, 9);
    if (top + 10.4 * (ls.length - 1) > 700) {
      overflow = true;
      return;
    }
    ls.forEach((l, k) => put(pen, 9, l, 51.5, top + 10.4 * k, 9));
    top += 10.4 * (ls.length + 1);
  });
  if (overflow) warnings.push("The additional terms did not all fit on page 9: attach the rest by addendum.");
  stillToDo.push("Page 10: Disclosure of Interest (NRS 645.252): choose DOES NOT / DOES (the licensee's own declaration)");

  // ---- Page 10: the buyer's broker block, buyers' printed names.
  if (ctx) {
    const b = ctx.broker;
    put(pen, 10, b.name, 164.5, 97.2, 8.8, 120);
    put(pen, 10, b.company, 175.3, 108.8, 8.8, 110);
    put(pen, 10, b.license, 195.2, 120.8, 8.4, 90);
    put(pen, 10, ctx.phone, 148.0, 132.4, 8.4, 110);
    put(pen, 10, ctx.agent.name, 423.3, 97.2, 8.8, 120);
    put(pen, 10, ctx.agent.license, 446.3, 108.8, 8.8, 100);
    put(pen, 10, b.address, 399.1, 120.8, 8.4, 150);
    put(pen, 10, b.city, 392.0, 132.4, 8.4, 90);
    put(pen, 10, b.state, 487.3, 132.4, 8.4, 25);
    put(pen, 10, b.zip, 518.0, 132.4, 8.4, 45);
    put(pen, 10, ctx.emails.join("  |  "), 320.0, 143.2, 8.8, 250);
    if (!ctx.agent.license) stillToDo.push(`Page 10: ${ctx.agent.name}'s license number is not on file (add it to the brokerage config)`);
  } else {
    stillToDo.push("Page 10: the buyer's broker block (brokerage config not available)");
  }
  put(pen, 10, buyers[0], 193.4, 315.8, 8.8, 160);
  put(pen, 10, buyers[1], 193.4, 361.9, 8.8, 160);
  stillToDo.push("Page 10: seller response deadline (time, AM/PM and date) and the buyers' signatures");
  stillToDo.push("Page 11: the listing broker/agent block (the most-skipped item)");
  stillToDo.push("Initials on every page, and signatures");
  return { stillToDo, warnings };
}

function usDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}/${y}`;
}
