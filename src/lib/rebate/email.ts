/**
 * "You're registered for the rebate" email, sent the moment someone submits
 * the form on rebate.therolandteam.com. The thank-you screen already says
 * what happens next; this is the copy people find again on their phone, with
 * the one instruction that matters (do not visit a builder before we talk),
 * the booking link and the terms link.
 *
 * Sends through Resend from the same address as the homeowner and guide mail.
 * Requested and transactional, so it is ON whenever Resend is configured; set
 * REBATE_EMAIL_ENABLED="false" to switch it off without a deploy.
 */
import { Resend } from "resend";
import { rebateContact, rebateOffer } from "@/content/newConstructionRebate";

const DEFAULT_FROM = "The Roland Team <home@therolandteam.com>";

function enabled(): boolean {
  return process.env.REBATE_EMAIL_ENABLED !== "false";
}

function errMsg(e: unknown): string {
  if (!e) return "unknown error";
  if (typeof e === "string") return e;
  const m = (e as { message?: unknown })?.message;
  if (typeof m === "string" && m) return m;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function rebateEmailHtml(firstName?: string): string {
  const name = firstName ? escapeHtml(firstName) : "";
  const termsUrl = `${rebateContact.origin}/terms`;
  const steps = [
    ["Book the call", "Fifteen to thirty minutes on Zoom. We go over the builders and communities on your list and answer whatever you want to ask."],
    ["Sign the buyer agreement", "Sent electronically after the call. It states the rebate in writing so nothing depends on a web page."],
    ["We register you with the builder", "Before your first visit. That one step is what funds the rebate, and most builders only honor it if it happens first."],
  ]
    .map(
      ([title, body], i) => `
      <tr>
        <td style="vertical-align:top;padding:0 14px 16px 0;font-family:Georgia,serif;font-size:26px;line-height:1;color:#7d6533;">0${i + 1}</td>
        <td style="vertical-align:top;padding:0 0 16px;">
          <div style="font-size:16px;font-weight:600;color:#14161b;margin:0 0 3px;">${title}</div>
          <div style="font-size:14px;color:#596170;line-height:1.5;">${body}</div>
        </td>
      </tr>`,
    )
    .join("");

  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#14161b;">
    <div style="padding:22px 0 16px;text-align:center;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7d6533;font-weight:700;">
      The Roland Team
    </div>
    <div style="background:#ffffff;border:1px solid #e6e2da;border-radius:16px;padding:28px;">
      <p style="margin:0 0 6px;font-size:22px;font-weight:600;">You're in${name ? `, ${name}` : ""}.</p>
      <p style="margin:0 0 18px;font-size:15px;color:#3a3f47;line-height:1.55;">
        Your spot in the ${escapeHtml(rebateOffer.programName)} is saved: ${rebateOffer.pricePercent}% of the base purchase price back at closing, up to ${rebateOffer.commissionCapPercent}% of the commission the builder pays us.
      </p>
      <div style="background:#f6f3ee;border-radius:12px;padding:14px 16px;margin:0 0 22px;font-size:14px;line-height:1.5;color:#14161b;">
        <strong>One thing before anything else:</strong> please do not visit a builder's sales office or register on a builder's website until we have talked. Most builders will not pay a commission on a buyer who walked in first, and without that commission there is nothing to rebate.
      </div>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">${steps}</table>
      <a href="${rebateContact.bookingUrl}" style="display:inline-block;background:#14161b;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:600;font-size:15px;margin:6px 0 0;">Book the call</a>
      <p style="margin:22px 0 0;font-size:14px;color:#596170;line-height:1.55;">
        The full program terms are at <a href="${termsUrl}" style="color:#7d6533;">${termsUrl.replace(/^https?:\/\//, "")}</a>. The short version: paid by LPT Realty at closing as a credit toward your closing costs, subject to your lender's approval, on a new home in ${escapeHtml(rebateOffer.area)}.
      </p>
      <p style="margin:18px 0 0;font-size:15px;color:#3a3f47;line-height:1.55;">
        Questions before the call? Call or text
        <a href="${rebateContact.phoneHref}" style="color:#7d6533;">${rebateContact.phoneDisplay}</a>.
        We answer.
      </p>
      <p style="margin:14px 0 0;font-size:15px;color:#3a3f47;">Mike Roland<br/><span style="color:#596170;font-size:13px;">The Roland Team with LPT Realty</span></p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#8a8f99;line-height:1.6;">
      ${rebateContact.legalName} · ${rebateContact.address}<br/>
      ${rebateContact.agentLicense} · ${rebateContact.brokerLicense}<br/>
      You asked about the rebate at ${rebateContact.origin.replace(/^https?:\/\//, "")}. Not a builder program. Equal Housing Opportunity.
    </div>
  </div>`;
}

export async function sendRebateEmail(to: {
  email: string;
  firstName?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!enabled()) return { sent: false, reason: "disabled (REBATE_EMAIL_ENABLED is \"false\")" };
  const key = process.env.RESEND_API_KEY;
  const from = process.env.HOMEOWNER_FROM_EMAIL || DEFAULT_FROM;
  if (!key) return { sent: false, reason: "email not configured" };
  if (!to.email) return { sent: false, reason: "missing email" };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: to.email,
      subject: "Your new construction rebate: one thing before you visit a builder",
      html: rebateEmailHtml(to.firstName),
      replyTo: rebateContact.email,
    });
    if (error) return { sent: false, reason: errMsg(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: errMsg(e) };
  }
}
