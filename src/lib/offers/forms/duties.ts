/**
 * Duties Owed by a Nevada Real Estate Licensee (Nevada Real Estate Division form 525, Rev. 10/03/2023)
 * and its Supplemental List of Licensees (525A, Rev. 11/7/16). Buyer-side: the buyer box is checked.
 * Signatures, dates and times are left for the parties.
 */
import type { Agent, Broker } from "./brokerage";
import { cross, openForm, put } from "./draw";

export interface DutiesInput {
  agent: { name: string; license?: string };
  buyers: string[];
  broker: Broker;
  /** Other licensees on the deal (listed on the Supplemental form). */
  additionalLicensees: { name: string; license: string }[];
}

const nameSlot = (buyers: string[]) => ({ first: buyers[0], second: buyers[1], more: Math.max(0, buyers.length - 2) });

export async function fillDuties(blank: Uint8Array, i: DutiesInput): Promise<{ pdf: Uint8Array; stillToDo: string[] }> {
  const pen = await openForm(blank, 1, "Duties Owed");
  const stillToDo: string[] = ["Buyers' signatures, dates and times"];
  put(pen, 1, i.agent.name, 292.6, 127.8, 9, 100);
  put(pen, 1, i.agent.license, 525.3, 127.8, 9, 65);
  if (!i.agent.license) stillToDo.push(`${i.agent.name}'s license number is not on file: add it to the brokerage config`);
  const b = nameSlot(i.buyers);
  put(pen, 1, b.first, 278.6, 146.3, 9, 115);
  if (b.second) {
    put(pen, 1, "&", 399.7, 146.3);
    put(pen, 1, b.more ? `${b.second} + ${b.more} more` : b.second, 436.4, 146.3, 9, 130);
  }
  if (b.more) stillToDo.push("More than two buyers: list the others by hand");
  cross(pen, 1, 177.5, 161.6, 10); // Buyer/Tenant
  put(pen, 1, i.broker.name, 325.6, 182.8, 9, 230);
  put(pen, 1, i.broker.company, 326.5, 201.3, 9, 230);
  if (i.additionalLicensees.length) cross(pen, 1, 301.0, 216.5, 10); // additional licensees: Yes
  else cross(pen, 1, 335.5, 216.5, 10); // No
  // Printed names on the buyers' signature lines.
  put(pen, 1, i.buyers[0], 242.2, 709.0, 9, 200);
  put(pen, 1, i.buyers[1], 242.2, 723.5, 9, 200);
  return { pdf: await pen.doc.save(), stillToDo };
}

export async function fillSupplemental(blank: Uint8Array, i: DutiesInput): Promise<{ pdf: Uint8Array; stillToDo: string[] }> {
  const pen = await openForm(blank, 1, "Duties Owed Supplemental");
  const stillToDo: string[] = ["Buyers' signatures, dates and times"];
  put(pen, 1, i.agent.name, 149.5, 88.1, 9, 110);
  put(pen, 1, i.buyers[0], 392.4, 87.9, 9, 118);
  put(pen, 1, i.buyers[1], 360.1, 101.2, 9, 200);
  put(pen, 1, i.broker.name, 157.2, 116.0, 9, 140);
  i.additionalLicensees.slice(0, 14).forEach((l, n) => {
    const top = 217.2 + 27.6 * n;
    put(pen, 1, l.name, 113.6, top, 9, 125);
    put(pen, 1, l.license, 458.4, top, 9, 100);
  });
  put(pen, 1, i.buyers[0], 95.7, 678.2, 7.4, 190);
  put(pen, 1, i.buyers[1], 95.7, 701.2, 7.4, 190);
  return { pdf: await pen.doc.save(), stillToDo };
}

export type { Agent };
