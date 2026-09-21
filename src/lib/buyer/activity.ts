/**
 * Buyer activity → Follow Up Boss.
 *
 * The seller side of the database writes back through
 * lib/homeowners/fubActivity; this is the same idea for buyers. Portal clients
 * already report their own actions, but that only covers people who set up a
 * hub — someone who clicks a campaign link and browses ten listings produced
 * nothing but an anonymous pixel hit. These are the events that put them in
 * front of an agent.
 *
 * Events, not notes: FUB's activity filters and action plans key on events.
 */
import { sendFubLead } from "@/lib/fub";

export type BuyerActivity = "viewed-property" | "saved-property" | "repeat-interest";

export type PropertyRef = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  beds?: number;
  baths?: number;
  mlsNumber?: string;
  url?: string;
};

/**
 * How each activity lands in FUB. `type` must be one of FUB's supported event
 * types — an unrecognised one is rejected. These mirror the types already in
 * use elsewhere in this app. Tags are what the agents' saved filters key on.
 */
const ACTIVITY: Record<BuyerActivity, { type: string; source: string; tags: string[]; label: string }> = {
  "viewed-property": {
    type: "Property Inquiry",
    source: "Home Search",
    tags: ["Buyer Activity", "Viewed Property"],
    label: "Viewed a listing",
  },
  "saved-property": {
    type: "Property Inquiry",
    source: "Home Search",
    tags: ["Buyer Activity", "Saved Property"],
    label: "Saved a listing",
  },
  "repeat-interest": {
    type: "Property Inquiry",
    source: "Home Search",
    tags: ["Buyer Activity", "Repeat Interest"],
    label: "Returned to the same listing several times — high interest",
  },
};

function describe(p?: PropertyRef): string {
  if (!p) return "";
  const where = [p.address, [p.city, p.state].filter(Boolean).join(", "), p.zip].filter(Boolean).join(" · ");
  const facts = [
    p.price ? `$${Math.round(p.price).toLocaleString("en-US")}` : "",
    p.beds ? `${p.beds} bd` : "",
    p.baths ? `${p.baths} ba` : "",
    p.mlsNumber ? `MLS ${p.mlsNumber}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return [where, facts, p.url].filter(Boolean).join("\n");
}

/** Send one buyer activity event. Never throws — CRM trouble must not break browsing. */
export async function sendBuyerActivity(
  activity: BuyerActivity,
  email: string,
  property?: PropertyRef,
): Promise<{ sent: boolean; reason?: string }> {
  if (!email) return { sent: false, reason: "missing_email" };
  const a = ACTIVITY[activity];
  try {
    return await sendFubLead({
      email,
      // The address on a property event is the LISTING, not the contact's home,
      // so it is deliberately left out of the person record and kept in the
      // message instead. Writing it as the person's address would overwrite
      // where they actually live.
      type: a.type,
      source: a.source,
      tags: a.tags,
      message: [a.label, describe(property)].filter(Boolean).join("\n"),
    });
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
