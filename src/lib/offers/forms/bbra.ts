/**
 * Exclusive Buyer Brokerage Representation Agreement (GLVAR, created 9.26, 3 pages).
 * Filled to the team's standard (property types, cities, 3% + the transaction fee, 12-month term,
 * 180-day tail). Buyer signatures, telephone numbers and e-mails, and the broker's signature stay blank.
 */
import { standardTerms } from "../../../content/offerDefaults";
import type { Broker } from "./brokerage";
import { cross, openForm, put } from "./draw";

export interface BbraInput {
  agent: { name: string; license?: string; phone?: string };
  buyers: string[];
  broker: Broker;
  contactEmails: string[];
  /** YYYY-MM-DD: today, the day the agreement is made. */
  today: string;
}

const BOX_Y = 264.9;
const PROPERTY_BOXES: Record<string, number> = { residential: 59.3, investment: 135.9, customBuild: 375.7, newHome: 462.9 };

const usDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}/${y}`;
};

/** The same calendar day `months` later (clamped to the month's last day). */
function plusMonths(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export async function fillBbra(blank: Uint8Array, i: BbraInput): Promise<{ pdf: Uint8Array; stillToDo: string[] }> {
  const pen = await openForm(blank, 3, "BBRA");
  const t = standardTerms.bbra;
  const stillToDo = [
    "Buyers' signatures, telephone numbers, e-mails and the date/time signed (page 3)",
    "Initials on pages 1 and 2",
    "Broker's signature, date and time (page 3)",
  ];

  // Page 1: properties, term, compensation.
  for (const kind of t.propertyTypes) cross(pen, 1, PROPERTY_BOXES[kind], BOX_Y, 10);
  put(pen, 1, t.cities, 253.2, 323.7, 9, 330);
  t.otherDescription.forEach((line, n) => put(pen, 1, line, 57.6, 361.8 + 10.4 * n, 9));
  put(pen, 1, usDate(plusMonths(i.today, t.termMonths)), 296.1, 541.6);
  cross(pen, 1, 59.1, 615.6, 10);
  put(pen, 1, String(t.compensationPercent), 76.0, 617.4);
  cross(pen, 1, 59.1, 646.2, 10);
  put(pen, 1, t.transactionFee.amount.toFixed(2), 86.4, 648.0, 9, 60);
  put(pen, 1, t.transactionFee.towards, 296.0, 648.0, 9, 165);
  put(pen, 1, String(t.tailDays), 304.0, 673.3);

  // Page 3: additional terms, buyers, brokerage.
  t.additionalTerms.forEach((line, n) => put(pen, 3, line, 62.5, 216.7 + 10.4 * n, 9));
  put(pen, 3, i.buyers[0], 229.9, 322.0, 9, 160);
  put(pen, 3, i.buyers[1], 229.9, 375.0, 9, 160);
  put(pen, 3, i.agent.name, 227.1, 560.2, 9, 130);
  put(pen, 3, i.agent.license, 520.3, 560.2, 9, 70);
  if (!i.agent.license) stillToDo.push(`${i.agent.name}'s license number is not on file: add it to the brokerage config`);
  put(pen, 3, i.agent.phone, 133.4, 573.3, 9, 90);
  put(pen, 3, i.contactEmails.join("  |  "), 311.4, 573.3, 9, 260);
  put(pen, 3, i.broker.company, 165.2, 626.3, 9, 120);
  put(pen, 3, i.broker.name, 433.9, 626.3, 9, 130);
  put(pen, 3, i.broker.license, 230.9, 639.5, 9, 90);
  put(pen, 3, i.broker.address, 140.1, 679.3, 9, 160);
  put(pen, 3, i.broker.city, 363.6, 679.3, 9, 90);
  put(pen, 3, i.broker.state, 491.0, 679.3, 9, 30);
  put(pen, 3, i.broker.zip, 545.9, 679.3, 9, 45);
  put(pen, 3, i.broker.phone, 119.6, 692.4, 9, 100);
  put(pen, 3, i.broker.email, 427.5, 692.4, 9, 140);

  // Footer on every page: buyer names.
  for (let p = 1; p <= 3; p++) {
    put(pen, p, i.buyers[0], 109.5, 723.0, 9, 78);
    if (i.buyers[1]) {
      put(pen, p, "&", 189.6, 723.0);
      put(pen, p, i.buyers[1], 203.6, 724.2, 6.3, 100);
    }
  }
  return { pdf: await pen.doc.save(), stillToDo };
}
