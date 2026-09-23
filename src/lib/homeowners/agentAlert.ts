/**
 * Hot-lead alert → the assigned agent's inbox.
 *
 * When a homeowner takes a high-intent action on their dashboard (requests a
 * valuation, asks for a cash offer, wants to list, uses the equity calculator),
 * this emails the agent that lead is assigned to in Follow Up Boss — directly,
 * with the lead's details and a link to their FUB record — so the signal isn't
 * just a timeline entry someone has to notice.
 *
 * OFF BY DEFAULT (like homeowner email). It sends only when either:
 *   • AGENT_ALERT_TO is set → all alerts go there (use your own inbox to test), or
 *   • AGENT_ALERTS_ENABLED === "true" → alerts go to each lead's assigned agent
 *     (falling back to the team email when a lead has no assigned agent).
 *
 * Requires RESEND_API_KEY (send) and FUB_API_KEY (resolve the assigned agent).
 */
import { Resend } from "resend";
import { homeownerBrand } from "./brand";
import { FUB_BASE, fubHeaders } from "./fubMap";

const DEFAULT_HOT_TAGS = ["Requested CMA", "Cash Offer", "List With Us", "Equity Calculator", "Buyer Lead"];

function hotTags(): string[] {
  const raw = (process.env.AGENT_ALERT_TAGS ?? "").trim();
  const list = raw ? raw.split(",").map((t) => t.trim()).filter(Boolean) : DEFAULT_HOT_TAGS;
  return list;
}

/** True when a lead's tags include one of the hot-signal tags. */
export function isHotSignal(tags: string[]): boolean {
  const hot = new Set(hotTags().map((t) => t.toLowerCase()));
  return tags.some((t) => hot.has(t.toLowerCase()));
}

export type AgentAlertLead = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: string;
  tags: string[];
  message?: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Look up the lead in FUB and resolve their assigned agent's email + name + FUB person id. */
async function resolveAssignedAgent(
  leadEmail: string,
): Promise<{ email: string; name: string; personId: string } | null> {
  const key = process.env.FUB_API_KEY;
  if (!key || !leadEmail) return null;
  try {
    const p = new URLSearchParams({ email: leadEmail, limit: "1", fields: "id,name,assignedUserId,assignedTo" });
    const res = await fetch(`${FUB_BASE}/v1/people?${p.toString()}`, { headers: fubHeaders(key) });
    if (!res.ok) return null;
    const data: any = await res.json();
    const person = Array.isArray(data?.people) ? data.people[0] : null;
    if (!person) return null;
    const personId = String(person.id ?? "");
    const name = String(person.assignedTo ?? "");
    const uid = person.assignedUserId;
    if (!uid) return { email: "", name, personId };
    const ures = await fetch(`${FUB_BASE}/v1/users/${uid}`, { headers: fubHeaders(key) });
    if (!ures.ok) return { email: "", name, personId };
    const u: any = await ures.json();
    return { email: String(u?.email ?? ""), name: String(u?.name ?? name), personId };
  } catch {
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);

/**
 * Email the assigned agent about a hot lead. Never throws. Returns
 * {sent:false, reason} when disabled/unconfigured so the caller degrades safely.
 */
export async function notifyAssignedAgent(
  lead: AgentAlertLead,
  opts?: { force?: boolean; signal?: string },
): Promise<{ sent: boolean; reason?: string }> {
  if (!opts?.force && !isHotSignal(lead.tags)) return { sent: false, reason: "not_hot" };

  const override = (process.env.AGENT_ALERT_TO ?? "").trim();
  const enabled = process.env.AGENT_ALERTS_ENABLED === "true";
  if (!override && !enabled) return { sent: false, reason: "disabled" };

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { sent: false, reason: "resend_not_configured" };

  const resolved = lead.email ? await resolveAssignedAgent(lead.email) : null;
  const to = override || resolved?.email || homeownerBrand.email;
  if (!to) return { sent: false, reason: "no_recipient" };

  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || "A homeowner";
  const signal =
    opts?.signal ??
    lead.tags.find((t) => hotTags().map((x) => x.toLowerCase()).includes(t.toLowerCase())) ??
    lead.type ??
    "Dashboard action";
  const subdomain = (process.env.FUB_ACCOUNT_SUBDOMAIN ?? "therolandteam1").trim();
  const fubLink = resolved?.personId && subdomain
    ? `https://${subdomain}.followupboss.com/2/people/view/${resolved.personId}`
    : "";
  const from = process.env.HOMEOWNER_FROM_EMAIL || "The Roland Team <home@therolandteam.com>";

  const row = (label: string, value?: string) =>
    value ? `<tr><td style="padding:2px 12px 2px 0;color:#8a8a8a;">${label}</td><td style="padding:2px 0;color:#1c1c1c;font-weight:600;">${esc(value)}</td></tr>` : "";

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;">
    <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8a6d2b;font-weight:700;">Hot lead · Homeowner Dashboard</div>
    <h2 style="margin:6px 0 2px;font-size:20px;">🔥 ${esc(signal)}</h2>
    <p style="margin:0 0 14px;font-size:14px;color:#5a5a5a;">${esc(name)} took a high-intent action on their home dashboard.</p>
    <table style="font-size:14px;border-collapse:collapse;">
      ${row("Name", name)}
      ${row("Email", lead.email)}
      ${row("Phone", lead.phone)}
      ${row("Address", lead.address)}
      ${resolved?.name ? row("Assigned to", resolved.name) : ""}
    </table>
    ${lead.message ? `<p style="margin:14px 0 0;font-size:14px;color:#3a3a3a;white-space:pre-line;">${esc(lead.message)}</p>` : ""}
    ${fubLink ? `<p style="margin:18px 0 0;"><a href="${fubLink}" style="display:inline-block;background:#8a6d2b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open in Follow Up Boss</a></p>` : ""}
    <p style="margin:16px 0 0;font-size:12px;color:#9a9a9a;">Sent by The Roland Team homeowner dashboard. Reply to reach the lead directly.</p>
  </div>`;

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: lead.email || homeownerBrand.email,
      subject: `🔥 ${signal} — ${name}${lead.address ? ` · ${lead.address}` : ""}`,
      html,
    });
    if (error) return { sent: false, reason: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
