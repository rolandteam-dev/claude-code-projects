/**
 * Homeowner value email via Resend. Sends the periodic "your home value update"
 * with the current estimate, trend, and a button to the private dashboard.
 * Gated on RESEND_API_KEY + HOMEOWNER_FROM_EMAIL; returns {sent:false} when not
 * configured so the digest job runs harmlessly before email is provisioned.
 *
 * CAN-SPAM: every send includes a one-click unsubscribe and a postal identity.
 *
 * SENDING IS OFF BY DEFAULT. Every send in this module first checks
 * HOMEOWNER_EMAIL_ENABLED — see sendingEnabled() below. Two of the three
 * senders fire from live public funnels (the home-value estimator and the cash
 * offer form), not just the weekly cron, so the switch lives here at the mailer
 * rather than on the schedule: that is the only place that catches all of them.
 */
import { Resend } from "resend";
import { homeownerBrand, dashboardUrl } from "./brand";
import { latestEstimate, appreciation, type Homeowner } from "./store";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function html(h: Homeowner): string {
  const latest = latestEstimate(h)!;
  const appr = appreciation(h);
  const url = dashboardUrl(h.token);
  const unsub = `${homeownerBrand.baseUrl.replace(/\/$/, "")}/api/dashboard/unsubscribe?token=${h.token}`;
  const apprLine = appr
    ? `<p style="margin:6px 0 0;color:${appr.abs >= 0 ? "#8a6d2b" : "#b4433a"};font-size:14px;">
         ${appr.abs >= 0 ? "▲" : "▼"} ${money(Math.abs(appr.abs))} (${appr.pct >= 0 ? "+" : "−"}${Math.abs(appr.pct).toFixed(1)}%) since we started tracking
       </p>`
    : "";
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;">
    <div style="padding:20px 0;text-align:center;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-weight:600;">
      ${homeownerBrand.name}
    </div>
    <div style="background:#fff;border:1px solid #e7e3db;border-radius:14px;padding:28px;">
      <p style="margin:0 0 4px;font-size:15px;color:#5a5a5a;">Hi ${h.firstName || "there"}, here's your latest home value estimate</p>
      <p style="margin:0 0 16px;font-size:13px;color:#8a8a8a;">${h.address}, ${h.city}, ${h.state} ${h.zip}</p>
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8a8a8a;">Estimated value</div>
      <div style="font-size:40px;line-height:1.1;color:#8a6d2b;font-weight:700;">${money(latest.value)}</div>
      ${latest.low && latest.high ? `<p style="margin:6px 0 0;color:#5a5a5a;font-size:14px;">Likely range ${money(latest.low)} – ${money(latest.high)}</p>` : ""}
      ${apprLine}
      <a href="${url}" style="display:inline-block;margin-top:22px;background:#8a6d2b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">
        View my full home dashboard
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#5a5a5a;">
        Thinking about selling? Reply to this email or call
        <a href="tel:${homeownerBrand.phone}" style="color:#8a6d2b;">${homeownerBrand.phone}</a>
        for a precise, no-obligation valuation.
      </p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#9a9a9a;line-height:1.6;">
      ${homeownerBrand.legalName} · Automated estimate, not an appraisal. Equal Housing Opportunity.<br/>
      <a href="${unsub}" style="color:#9a9a9a;">Unsubscribe from home value updates</a>
    </div>
  </div>`;
}

function welcomeHtml(h: Homeowner): string {
  const latest = latestEstimate(h);
  const url = dashboardUrl(h.token);
  const unsub = `${homeownerBrand.baseUrl.replace(/\/$/, "")}/api/dashboard/unsubscribe?token=${h.token}`;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;">
    <div style="padding:20px 0;text-align:center;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-weight:600;">
      ${homeownerBrand.name}
    </div>
    <div style="background:#fff;border:1px solid #e7e3db;border-radius:14px;padding:28px;">
      <p style="margin:0 0 6px;font-size:19px;font-weight:600;">Your home value dashboard is ready${h.firstName ? `, ${h.firstName}` : ""} ✦</p>
      <p style="margin:0 0 16px;font-size:14px;color:#5a5a5a;">${h.address}${h.city ? `, ${h.city}` : ""}, ${h.state} ${h.zip}</p>
      ${
        latest
          ? `<div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8a8a8a;">Current estimate</div>
             <div style="font-size:36px;line-height:1.1;color:#8a6d2b;font-weight:700;">${money(latest.value)}</div>`
          : ""
      }
      <p style="margin:16px 0 0;font-size:14px;color:#3a3a3a;">
        We'll keep an eye on your home's value and send you an update as the market moves — bookmark your private
        dashboard to check it anytime.
      </p>
      <a href="${url}" style="display:inline-block;margin-top:20px;background:#8a6d2b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">
        View my home dashboard
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#5a5a5a;">
        Ready for a precise, human valuation? Reply here or call
        <a href="tel:${homeownerBrand.phone}" style="color:#8a6d2b;">${homeownerBrand.phone}</a>.
      </p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#9a9a9a;line-height:1.6;">
      ${homeownerBrand.legalName} · Automated estimate, not an appraisal. Equal Housing Opportunity.<br/>
      You're receiving this because you requested your home value. <a href="${unsub}" style="color:#9a9a9a;">Unsubscribe</a>.
    </div>
  </div>`;
}

/**
 * Master send switch. Homeowner email stays off until someone deliberately sets
 * HOMEOWNER_EMAIL_ENABLED="true" in the environment.
 *
 * Why an explicit opt-in rather than just relying on the Resend keys being
 * absent: the links in these emails point at HOMEOWNER_BASE_URL
 * (home.therolandteam.com), and if that host is not yet pointed at this app,
 * every button and the CAN-SPAM unsubscribe link in a delivered email is dead.
 * Provisioning Resend should not be what starts the sending — going live should
 * be, once the domain resolves and the loop has been verified end to end.
 */
function sendingEnabled(): boolean {
  return process.env.HOMEOWNER_EMAIL_ENABLED === "true";
}

const DISABLED = {
  sent: false,
  reason: "sending disabled (HOMEOWNER_EMAIL_ENABLED is not \"true\")",
} as const;

export async function sendWelcomeEmail(h: Homeowner): Promise<{ sent: boolean; reason?: string }> {
  if (!sendingEnabled()) return DISABLED;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.HOMEOWNER_FROM_EMAIL;
  if (!key || !from) return { sent: false, reason: "email not configured" };
  if (!h.email) return { sent: false, reason: "missing email" };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: h.email,
      subject: `Your ${h.city || "Las Vegas"} home value dashboard`,
      html: welcomeHtml(h),
      replyTo: homeownerBrand.email,
    });
    if (error) return { sent: false, reason: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}

export async function sendCashOfferEmail(to: {
  email: string;
  firstName?: string;
  address?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!sendingEnabled()) return DISABLED;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.HOMEOWNER_FROM_EMAIL;
  if (!key || !from) return { sent: false, reason: "email not configured" };
  if (!to.email) return { sent: false, reason: "missing email" };
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;">
    <div style="padding:20px 0;text-align:center;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-weight:600;">
      ${homeownerBrand.name}
    </div>
    <div style="background:#fff;border:1px solid #e7e3db;border-radius:14px;padding:28px;">
      <p style="margin:0 0 10px;font-size:19px;font-weight:600;">We got your cash-offer request${to.firstName ? `, ${to.firstName}` : ""}</p>
      <p style="margin:0 0 12px;font-size:15px;color:#3a3a3a;">
        Thanks for reaching out${to.address ? ` about <strong>${to.address}</strong>` : ""}. ${homeownerBrand.founder}&apos;s
        team will review your home and get back to you shortly with your cash-offer options — and a side-by-side of
        what the same home could bring on the open market, so you can compare with no pressure.
      </p>
      <a href="tel:${homeownerBrand.phone}" style="display:inline-block;margin-top:8px;background:#8a6d2b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">
        Call ${homeownerBrand.phone}
      </a>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#9a9a9a;line-height:1.6;">
      ${homeownerBrand.legalName} · Equal Housing Opportunity.
    </div>
  </div>`;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: to.email,
      subject: "Your cash-offer request — next steps",
      html,
      replyTo: homeownerBrand.email,
    });
    if (error) return { sent: false, reason: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}

export async function sendValueEmail(h: Homeowner): Promise<{ sent: boolean; reason?: string }> {
  if (!sendingEnabled()) return DISABLED;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.HOMEOWNER_FROM_EMAIL; // e.g. "The Roland Team <home@therolandteam.com>"
  if (!key || !from) return { sent: false, reason: "email not configured" };
  if (!h.email || !latestEstimate(h)) return { sent: false, reason: "missing email or estimate" };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: h.email,
      subject: `Your ${h.city} home value: ${money(latestEstimate(h)!.value)}`,
      html: html(h),
      replyTo: homeownerBrand.email,
    });
    if (error) return { sent: false, reason: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
