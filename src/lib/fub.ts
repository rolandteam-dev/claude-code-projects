/**
 * Follow Up Boss lead helper. Sends an event to the FUB Events API. Shared by
 * server routes that need to drop a lead into the CRM (e.g. the Cash Offer
 * request). Env-gated on FUB_API_KEY — returns { sent:false } gracefully when
 * the CRM isn't configured, so callers never fail because of it.
 *
 * FUB Events API: https://docs.followupboss.com/reference/events-post
 */
import { fubHeaders } from "@/lib/homeowners/fubMap";

export type FubLead = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  message?: string;
  type?: string;
  source?: string;
  tags?: string[];
};

export async function sendFubLead(lead: FubLead): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.FUB_API_KEY;
  if (!key) return { sent: false, reason: "not_configured" };
  if (!lead.email && !lead.phone) return { sent: false, reason: "missing_contact" };

  const street = lead.address?.trim();
  const body = {
    source: lead.source || "Roland Luxury Website",
    system: "Roland Luxury Website",
    type: lead.type || "General Inquiry",
    message: lead.message || "",
    person: {
      firstName: lead.firstName || undefined,
      lastName: lead.lastName || undefined,
      emails: lead.email ? [{ value: lead.email }] : [],
      phones: lead.phone ? [{ value: lead.phone, type: "mobile" }] : [],
      addresses: street
        ? [{ type: "home", street, city: lead.city, state: lead.state, code: lead.zip }]
        : undefined,
      tags: lead.tags?.length ? [...new Set(lead.tags.filter(Boolean))] : undefined,
    },
  };

  try {
    const res = await fetch("https://api.followupboss.com/v1/events", {
      method: "POST",
      headers: fubHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) return { sent: false, reason: `fub_${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
