/**
 * "Here are your guides" email, sent the moment someone requests them from
 * guide.therolandteam.com. The thank-you screen already opens both guides;
 * this is the copy people find again later on their phone.
 *
 * Sends through Resend from the same address as the homeowner mail. It is a
 * requested, transactional message, so it is ON whenever Resend is configured;
 * set GUIDE_EMAIL_ENABLED="false" to switch it off without a deploy.
 */
import { Resend } from "resend";
import { combinedGuidePdfUrl, guideContact, relocationGuides } from "@/content/relocationGuides";

const DEFAULT_FROM = "The Roland Team <home@therolandteam.com>";

function enabled(): boolean {
  return process.env.GUIDE_EMAIL_ENABLED !== "false";
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

export function guideEmailHtml(firstName?: string): string {
  const name = firstName ? escapeHtml(firstName) : "";
  const cards = relocationGuides
    .map(
      (g) => `
      <div style="border:1px solid #e6e2da;border-radius:14px;padding:20px 22px;margin:0 0 14px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d6533;font-weight:700;">${g.part}</div>
        <div style="font-size:20px;font-weight:600;margin:6px 0 4px;color:#14161b;">${escapeHtml(g.title)}</div>
        <div style="font-size:14px;color:#596170;line-height:1.5;margin:0 0 14px;">${escapeHtml(g.blurb)}</div>
        <a href="${g.readUrl}" style="display:inline-block;background:#14161b;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:999px;font-weight:600;font-size:14px;margin:0 8px 8px 0;">Read online</a>
        <a href="${g.pdfUrl}" style="display:inline-block;border:1px solid #14161b;color:#14161b;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600;font-size:14px;margin:0 0 8px;">Download PDF</a>
      </div>`,
    )
    .join("");

  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#14161b;">
    <div style="padding:22px 0 16px;text-align:center;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7d6533;font-weight:700;">
      The Roland Team
    </div>
    <div style="background:#ffffff;border:1px solid #e6e2da;border-radius:16px;padding:28px;">
      <p style="margin:0 0 6px;font-size:22px;font-weight:600;">Your Las Vegas guides${name ? `, ${name}` : ""}</p>
      <p style="margin:0 0 20px;font-size:15px;color:#3a3f47;line-height:1.55;">
        Both guides are below, to read online or keep as a PDF. Part one is what the move actually costs and the deadlines that catch people. Part two is the city you'll live in once the boxes are unpacked, with zero Strip recommendations.
      </p>
      ${cards}
      <p style="margin:6px 0 0;font-size:13px;color:#596170;">
        Prefer one file? <a href="${combinedGuidePdfUrl}" style="color:#7d6533;">Download both guides as a single PDF</a>.
      </p>
      <p style="margin:22px 0 0;font-size:15px;color:#3a3f47;line-height:1.55;">
        If you want a second opinion on a neighborhood, call or text
        <a href="${guideContact.phoneHref}" style="color:#7d6533;">${guideContact.phoneDisplay}</a>.
        We answer.
      </p>
      <p style="margin:14px 0 0;font-size:15px;color:#3a3f47;">Mike Roland<br/><span style="color:#596170;font-size:13px;">The Roland Team with LPT Realty</span></p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#8a8f99;line-height:1.6;">
      ${guideContact.legalName} · ${guideContact.address}<br/>
      You asked for these guides at ${guideContact.origin.replace(/^https?:\/\//, "")}. Equal Housing Opportunity.
    </div>
  </div>`;
}

export async function sendGuideEmail(to: {
  email: string;
  firstName?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!enabled()) return { sent: false, reason: "disabled (GUIDE_EMAIL_ENABLED is \"false\")" };
  const key = process.env.RESEND_API_KEY;
  const from = process.env.HOMEOWNER_FROM_EMAIL || DEFAULT_FROM;
  if (!key) return { sent: false, reason: "email not configured" };
  if (!to.email) return { sent: false, reason: "missing email" };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: to.email,
      subject: "Your Las Vegas guides",
      html: guideEmailHtml(to.firstName),
      replyTo: guideContact.email,
    });
    if (error) return { sent: false, reason: errMsg(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: errMsg(e) };
  }
}
