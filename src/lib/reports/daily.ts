/**
 * Daily internal reports — our in-house replacement for Fello's "Property
 * Intelligence Summary" and "(Segment Watch) Daily Summary" emails.
 *
 *  - Property Intelligence: homes IN your database that were recently LISTED or
 *    SOLD (address, status, price, listing agent, the matched contact).
 *  - Segment Watch: a one-line count per segment of what's new since yesterday
 *    (new expireds / closings / listings in your database), with links.
 *
 * READ-ONLY data gathering (MLS + local store). Sends via Resend to the team.
 */
import { Resend } from "resend";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { databaseClosings, databaseNewListings, type IntelMatch } from "@/lib/idx/closings";
import { expiredMatches } from "@/lib/idx/expired";

const money = (n: number) =>
  n > 0 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";

const today = () =>
  new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" });

function fubLink(fubPersonId?: string): string | null {
  if (!fubPersonId) return null;
  const sub = (process.env.FUB_ACCOUNT_SUBDOMAIN || "therolandteam1").trim();
  return `https://${sub}.followupboss.com/2/people/view/${encodeURIComponent(fubPersonId)}`;
}

const adminBase = () => homeownerBrand.baseUrl.replace(/\/$/, "");
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------- Property Intelligence

export type PropertyIntel = {
  listings: IntelMatch[];
  solds: IntelMatch[];
  windowDays: number;
};

export async function propertyIntelData(windowDays: number): Promise<PropertyIntel> {
  const [listings, solds] = await Promise.all([databaseNewListings(windowDays), databaseClosings(windowDays)]);
  return {
    listings: listings.ok ? listings.matched : [],
    solds: solds.ok ? solds.matched : [],
    windowDays,
  };
}

function intelBlock(title: string, rows: IntelMatch[]): string {
  const total = rows.reduce((s, r) => s + (r.price || 0), 0);
  const items = rows
    .map((m) => {
      const name = [m.contact.firstName, m.contact.lastName].filter(Boolean).join(" ") || "Unnamed contact";
      const link = fubLink(m.contact.fubPersonId) || `${adminBase()}/dashboard/${m.contact.token}`;
      const place = [m.city, m.zip].filter(Boolean).join(", ");
      return `
        <tr><td style="padding:10px 0;border-bottom:1px solid #eceef1;">
          <a href="${link}" style="font-size:15px;font-weight:600;color:#8a6d2b;text-decoration:none;">${esc(
            m.address || "Address unavailable",
          )}</a>
          <div style="font-size:13px;color:#6a6f76;margin-top:2px;">
            ${m.status} (MLS) · ${money(m.price)}${m.listAgent ? ` · ${esc(m.listAgent)} (listing)` : ""}${m.buyerAgent ? ` · ${esc(m.buyerAgent)} (buyer)` : ""}
          </div>
          <div style="font-size:13px;color:#6a6f76;margin-top:1px;">${esc(name)}${place ? ` · ${esc(place)}` : ""}</div>
        </td></tr>`;
    })
    .join("");
  return `
    <div style="background:#fafafb;border:1px solid #d5d8de;border-radius:8px;padding:16px;margin-top:16px;">
      <div style="font-size:15px;font-weight:600;color:#3f3d56;">${title}: ${rows.length}</div>
      <div style="font-size:30px;font-weight:600;color:#3f3d56;line-height:1.1;margin-top:2px;">${money(total)}</div>
      ${rows.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${items}</table>` : `<div style="font-size:13px;color:#6a6f76;margin-top:8px;">None in this window.</div>`}
    </div>`;
}

export function renderPropertyIntelEmail(d: PropertyIntel): string {
  return shell(
    "Property Intelligence Summary",
    `Your snapshot of homes in your database recently listed and sold · last ${d.windowDays} day${d.windowDays === 1 ? "" : "s"}`,
    intelBlock("Recent Listings", d.listings) + intelBlock("Recent Solds", d.solds),
  );
}

// ---------------------------------------------------------------- Segment Watch

export type SegmentWatch = {
  windowDays: number;
  segments: { label: string; count: number; href: string }[];
};

export async function segmentWatchData(windowDays: number): Promise<SegmentWatch> {
  const [expired, solds, listings] = await Promise.all([
    expiredMatches(windowDays),
    databaseClosings(windowDays),
    databaseNewListings(windowDays),
  ]);
  const base = adminBase();
  return {
    windowDays,
    segments: [
      { label: "Expired sellers (in your database)", count: expired.ok ? expired.matched.length : 0, href: `${base}/admin/expireds` },
      { label: "Closings (your database)", count: solds.ok ? solds.matched.length : 0, href: `${base}/admin/closings` },
      { label: "Newly listed (your database)", count: listings.ok ? listings.matched.length : 0, href: `${base}/admin/closings` },
    ],
  };
}

export function renderSegmentWatchEmail(d: SegmentWatch): string {
  const rows = d.segments
    .map(
      (s) => `
      <a href="${s.href}" style="display:block;text-decoration:none;background:#fafafb;border:1px solid #d5d8de;border-radius:8px;padding:16px;margin-top:12px;">
        <div style="font-size:15px;font-weight:600;color:#3f3d56;">${esc(s.label)}</div>
        <div style="font-size:28px;font-weight:600;color:${s.count > 0 ? "#8a6d2b" : "#9aa0a6"};margin-top:2px;">${s.count} new</div>
      </a>`,
    )
    .join("");
  return shell("Segment Watch — Daily Summary", `What's new in each segment · last ${d.windowDays} day${d.windowDays === 1 ? "" : "s"}`, rows);
}

// ---------------------------------------------------------------- shell + send

function shell(title: string, subtitle: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f0f0f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;"><tr><td align="center" style="padding:24px 12px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="height:4px;background:#8a6d2b;"></td></tr>
        <tr><td style="padding:28px 30px 0;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2b;font-family:Arial,sans-serif;">The Roland Team</div>
          <div style="font-size:26px;font-weight:700;color:#3f3d56;font-family:Arial,sans-serif;margin-top:6px;">${esc(title)}</div>
          <div style="font-size:14px;color:#656478;font-family:Arial,sans-serif;margin-top:4px;">${esc(subtitle)} · ${today()}</div>
        </td></tr>
        <tr><td style="padding:8px 30px 28px;font-family:Arial,sans-serif;">${inner}</td></tr>
        <tr><td style="padding:0 30px 28px;font-size:12px;color:#9aa0a6;font-family:Arial,sans-serif;">
          Internal report from the Roland Team homeowner engine. Reply to adjust.
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

function recipients(): string[] {
  const raw = (process.env.REPORTS_EMAIL_TO || process.env.AGENT_ALERT_TO || homeownerBrand.email || "").trim();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendReportEmail(
  subject: string,
  html: string,
): Promise<{ sent: boolean; reason?: string; to?: string[] }> {
  const key = process.env.RESEND_API_KEY;
  const from = (process.env.HOMEOWNER_FROM_EMAIL ?? "").trim();
  const to = recipients();
  if (!key || !from) return { sent: false, reason: "email not configured (RESEND_API_KEY / HOMEOWNER_FROM_EMAIL)" };
  if (!to.length) return { sent: false, reason: "no recipient (set REPORTS_EMAIL_TO)" };
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from, to, subject, html, replyTo: homeownerBrand.email });
    if (error) return { sent: false, reason: String((error as { message?: string })?.message ?? error) };
    return { sent: true, to };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
