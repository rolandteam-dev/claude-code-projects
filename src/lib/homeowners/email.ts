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

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Readable message from a Resend error object / thrown value (avoids "[object Object]"). */
function errMsg(e: unknown): string {
  if (!e) return "unknown error";
  if (typeof e === "string") return e;
  const m = (e as any)?.message ?? (e as any)?.error?.message ?? (e as any)?.name;
  if (typeof m === "string" && m) return m;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function html(h: Homeowner): string {
  const latest = latestEstimate(h)!;
  const appr = appreciation(h);
  const url = dashboardUrl(h.token);
  const unsub = unsubscribeUrl(h.token);
  const first = h.firstName || "there";
  // Lead with the *movement* when we have a baseline — a change is a reason to
  // click; a static number isn't. No baseline yet → omit rather than invent one.
  const movementLine = appr
    ? `<p style="margin:0 0 2px;font-size:15px;color:#3a3a3a;">Since I started tracking it, your estimate is
         <strong style="color:${appr.abs >= 0 ? "#8a6d2b" : "#b4433a"};">${appr.abs >= 0 ? "up" : "down"} ${money(Math.abs(appr.abs))}</strong>
         (${appr.pct >= 0 ? "+" : "−"}${Math.abs(appr.pct).toFixed(1)}%).</p>`
    : "";
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;">
    <div style="padding:20px 0;text-align:center;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-weight:600;">
      ${homeownerBrand.name}
    </div>
    <div style="background:#fff;border:1px solid #e7e3db;border-radius:14px;padding:28px;">
      <p style="margin:0 0 14px;font-size:15px;color:#3a3a3a;">Hi ${first}, it's Mike with ${homeownerBrand.name}. Here's where ${h.address ? `<strong>${h.address}</strong>` : "your home"} stands this month.</p>
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8a8a8a;">My current estimate</div>
      <div style="font-size:40px;line-height:1.1;color:#8a6d2b;font-weight:700;">${money(latest.value)}</div>
      ${latest.low && latest.high ? `<p style="margin:6px 0 10px;color:#5a5a5a;font-size:14px;">Likely range ${money(latest.low)} – ${money(latest.high)}</p>` : ""}
      ${movementLine}
      <p style="margin:14px 0 0;font-size:14px;color:#3a3a3a;">
        The number only tells part of the story. On your private dashboard I keep the homes that actually
        <strong>sold near you</strong>, where <strong>mortgage rates</strong> landed this week, and how much
        <strong>equity</strong> you could put to work — that's what's really moving your value.
      </p>
      <a href="${url}" style="display:inline-block;margin-top:22px;background:#8a6d2b;color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:600;font-size:15px;">
        See what's moving my value →
      </a>
      <p style="margin:20px 0 0;font-size:14px;color:#3a3a3a;">
        Curious what it would actually sell for? Just reply — it comes straight to me — or call
        <a href="tel:${homeownerBrand.phone}" style="color:#8a6d2b;">${homeownerBrand.phone}</a>
        and I'll put together a precise, no-obligation valuation.
      </p>
      <p style="margin:16px 0 0;font-size:14px;color:#3a3a3a;">— Mike Roland</p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#9a9a9a;line-height:1.6;">
      ${homeownerBrand.legalName} · ${homeownerBrand.postalAddress}<br/>
      Automated estimate, not an appraisal. Equal Housing Opportunity.<br/>
      <a href="${unsub}" style="color:#9a9a9a;">Unsubscribe from home value updates</a>
    </div>
  </div>`;
}

function welcomeHtml(h: Homeowner, reason: "requested" | "seller-lead" = "requested"): string {
  const latest = latestEstimate(h);
  const url = dashboardUrl(h.token);
  const unsub = unsubscribeUrl(h.token);
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
        It's Mike — I'll keep an eye on your home's value and send you an update as the market moves. Bookmark your
        private dashboard to check it anytime.
      </p>
      <a href="${url}" style="display:inline-block;margin-top:20px;background:#8a6d2b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">
        View my home dashboard
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#5a5a5a;">
        Ready for a precise, human valuation? Just reply — it comes straight to me — or call
        <a href="tel:${homeownerBrand.phone}" style="color:#8a6d2b;">${homeownerBrand.phone}</a>.
      </p>
      <p style="margin:14px 0 0;font-size:14px;color:#3a3a3a;">— Mike Roland</p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#9a9a9a;line-height:1.6;">
      ${homeownerBrand.legalName} · ${homeownerBrand.postalAddress}<br/>
      Automated estimate, not an appraisal. Equal Housing Opportunity.<br/>
      ${
        reason === "seller-lead"
          ? `You're receiving this because you asked about selling your home with ${homeownerBrand.name}.`
          : "You're receiving this because you requested your home value."
      } <a href="${unsub}" style="color:#9a9a9a;">Unsubscribe</a>.
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

/**
 * From address for homeowner email. Defaults to a PERSONAL sender —
 * "Mike Roland <mike@therolandteam.com>" — because a named human lifts opens and
 * replies far more than a brand name ("The Roland Team") does, and replies land
 * straight in Mike's inbox. Still on the org's verified domain (therolandteam.com)
 * so it passes SPF/DKIM — sending from a different domain (e.g. rolandluxury.com)
 * trips Gmail's "may be impersonating" warning. Override with HOMEOWNER_FROM_EMAIL
 * only to another verified sender.
 */
const DEFAULT_FROM = `${homeownerBrand.founder} <${homeownerBrand.email}>`;
function fromAddress(): string {
  return process.env.HOMEOWNER_FROM_EMAIL || DEFAULT_FROM;
}

const DISABLED = {
  sent: false,
  reason: "sending disabled (HOMEOWNER_EMAIL_ENABLED is not \"true\")",
} as const;

/** Absolute one-click unsubscribe URL for a homeowner token. */
function unsubscribeUrl(token: string): string {
  return `${homeownerBrand.baseUrl.replace(/\/$/, "")}/api/dashboard/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * RFC 8058 one-click unsubscribe headers. Gmail and Yahoo show a native
 * "Unsubscribe" control from these and treat their absence on marketing-style
 * mail as a negative signal; the POST handler lives on the same URL.
 */
function listUnsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export async function sendWelcomeEmail(
  h: Homeowner,
  opts: { reason?: "requested" | "seller-lead" } = {}
): Promise<{ sent: boolean; reason?: string }> {
  if (!sendingEnabled()) return DISABLED;
  const key = process.env.RESEND_API_KEY;
  const from = fromAddress();
  if (!key || !from) return { sent: false, reason: "email not configured" };
  if (!h.email) return { sent: false, reason: "missing email" };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: h.email,
      subject: `Your ${h.city || "Las Vegas"} home value dashboard`,
      html: welcomeHtml(h, opts.reason),
      replyTo: homeownerBrand.email,
      headers: listUnsubscribeHeaders(h.token),
    });
    if (error) return { sent: false, reason: errMsg(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: errMsg(e) };
  }
}

export async function sendCashOfferEmail(to: {
  email: string;
  firstName?: string;
  address?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!sendingEnabled()) return DISABLED;
  const key = process.env.RESEND_API_KEY;
  const from = fromAddress();
  if (!key || !from) return { sent: false, reason: "email not configured" };
  if (!to.email) return { sent: false, reason: "missing email" };
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;">
    <div style="padding:20px 0;text-align:center;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-weight:600;">
      ${homeownerBrand.name}
    </div>
    <div style="background:#fff;border:1px solid #e7e3db;border-radius:14px;padding:28px;">
      <p style="margin:0 0 10px;font-size:19px;font-weight:600;">Got your cash-offer request${to.firstName ? `, ${to.firstName}` : ""}</p>
      <p style="margin:0 0 12px;font-size:15px;color:#3a3a3a;">
        Thanks for reaching out${to.address ? ` about <strong>${to.address}</strong>` : ""} — it's Mike. I'll
        review your home and get back to you shortly with your cash-offer options, plus a side-by-side of what the
        same home could bring on the open market, so you can compare with no pressure.
      </p>
      <a href="tel:${homeownerBrand.phone}" style="display:inline-block;margin-top:8px;background:#8a6d2b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">
        Call ${homeownerBrand.phone}
      </a>
      <p style="margin:16px 0 0;font-size:14px;color:#3a3a3a;">— Mike Roland</p>
    </div>
    <div style="padding:16px 8px;text-align:center;font-size:11px;color:#9a9a9a;line-height:1.6;">
      ${homeownerBrand.legalName} · ${homeownerBrand.postalAddress}<br/>
      Equal Housing Opportunity.
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
    if (error) return { sent: false, reason: errMsg(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: errMsg(e) };
  }
}

export async function sendValueEmail(h: Homeowner): Promise<{ sent: boolean; reason?: string }> {
  if (!sendingEnabled()) return DISABLED;
  const key = process.env.RESEND_API_KEY;
  const from = fromAddress(); // e.g. "Mike Roland <mike@therolandteam.com>"
  if (!key || !from) return { sent: false, reason: "email not configured" };
  if (!h.email || !latestEstimate(h)) return { sent: false, reason: "missing email or estimate" };
  // Lead the subject with the change when it's meaningful; a static dollar figure
  // that's even a little off kills trust before they open. Never lead with a loss.
  const appr = appreciation(h);
  const city = h.city || "Las Vegas";
  const subject =
    appr && appr.abs >= 1000
      ? `Your ${city} home is up about ${money(appr.abs)}`
      : `Your ${city} home — my latest estimate`;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: h.email,
      subject,
      html: html(h),
      replyTo: homeownerBrand.email,
      headers: listUnsubscribeHeaders(h.token),
    });
    if (error) return { sent: false, reason: errMsg(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: errMsg(e) };
  }
}
