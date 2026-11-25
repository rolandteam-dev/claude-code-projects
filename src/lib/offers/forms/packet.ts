/**
 * Offer Machine — the forms packet for a confirmed offer, in signing order:
 * Duties Owed, its Supplemental list, the Buyer Brokerage agreement (BBRA), then the purchase agreement.
 *
 * Each form is filled independently; one that can't be built (blank not uploaded, layout out of date,
 * Blob down) is skipped with a note rather than blocking the rest or the terms sheet.
 */
import type { BuyerOfferInputs } from "../types";
import { fillRpa } from "../rpa/fill";
import { FORM_LABEL, loadBlank, loadBrokerageJson, type FormName } from "../rpa/store";
import { fillBbra } from "./bbra";
import { findAgent, parseBrokerage, type BrokerageConfig } from "./brokerage";
import { fillDuties, fillSupplemental } from "./duties";
import { splitBuyers } from "./draw";

export interface PacketItem {
  kind: FormName;
  label: string;
  pdf: Uint8Array;
  stillToDo: string[];
  warnings: string[];
  /** Shown beside the link, e.g. "only if the buyer hasn't signed one". */
  note?: string;
}

export interface Packet {
  items: PacketItem[];
  /** Forms that could not be built, with the reason (for the logs and a short line in Slack). */
  skipped: { kind: FormName; reason: string }[];
}

export async function loadBrokerage(): Promise<BrokerageConfig | null> {
  const json = await loadBrokerageJson();
  if (!json) return null;
  return parseBrokerage(JSON.parse(json));
}

export async function buildPacket(inputs: BuyerOfferInputs, today: string): Promise<Packet> {
  const items: PacketItem[] = [];
  const skipped: Packet["skipped"] = [];
  const skip = (kind: FormName, reason: string) => skipped.push({ kind, reason });

  let cfg: BrokerageConfig | null = null;
  try {
    cfg = await loadBrokerage();
  } catch (e) {
    console.error("[offers] brokerage config unreadable", e);
  }

  const buyers = splitBuyers(inputs.buyerNames, inputs.clientName);

  if (cfg && inputs.agentName) {
    const rostered = findAgent(cfg, inputs.agentName);
    const agent = { name: rostered?.name ?? inputs.agentName, license: rostered?.license || undefined, phone: rostered?.phone || cfg.officePhone || undefined };
    const emails = [rostered?.email, ...cfg.contactEmails].filter((e, n, all): e is string => Boolean(e) && all.indexOf(e) === n);
    const common = { agent, buyers, broker: cfg.broker, additionalLicensees: cfg.additionalLicensees };
    const unknownAgent = rostered ? [] : [`${inputs.agentName} isn't on the license roster: add them to the brokerage config`];

    const build = async (kind: FormName, make: (blank: Uint8Array) => Promise<{ pdf: Uint8Array; stillToDo: string[] }>, note?: string) => {
      try {
        const blank = await loadBlank(kind);
        if (!blank) return skip(kind, "blank form not uploaded");
        const r = await make(blank);
        items.push({ kind, label: FORM_LABEL[kind], pdf: r.pdf, stillToDo: [...unknownAgent, ...r.stillToDo], warnings: [], note });
      } catch (e) {
        console.error(`[offers] ${kind} failed`, e);
        skip(kind, e instanceof Error ? e.message : String(e));
      }
    };
    await build("duties", (b) => fillDuties(b, common));
    if (cfg.additionalLicensees.length) await build("supp", (b) => fillSupplemental(b, common));
    await build("bbra", (b) => fillBbra(b, { agent, buyers, broker: cfg.broker, contactEmails: emails, today }), "only if the buyers haven't already signed one with us");
  } else if (!cfg) {
    for (const kind of ["duties", "supp", "bbra"] as const) skip(kind, "brokerage config not uploaded");
  }

  try {
    const blank = await loadBlank("rpa");
    if (!blank) skip("rpa", "blank form not uploaded");
    else {
      const rostered = cfg ? findAgent(cfg, inputs.agentName) : undefined;
      const rpaCtx = cfg
        ? {
            broker: cfg.broker,
            agent: { name: rostered?.name ?? inputs.agentName ?? "", license: rostered?.license || undefined, email: rostered?.email },
            phone: rostered?.phone || cfg.officePhone || undefined,
            emails: [rostered?.email, ...cfg.contactEmails].filter((e, n, all): e is string => Boolean(e) && all.indexOf(e) === n),
          }
        : undefined;
      const r = await fillRpa(blank, inputs, today, inputs.agentName ? rpaCtx : undefined);
      items.push({ kind: "rpa", label: FORM_LABEL.rpa, pdf: r.pdf, stillToDo: r.stillToDo, warnings: r.warnings });
    }
  } catch (e) {
    console.error("[offers] rpa failed", e);
    skip("rpa", e instanceof Error ? e.message : String(e));
  }
  return { items, skipped };
}
