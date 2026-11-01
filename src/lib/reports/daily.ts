/**
 * Daily internal reports — our in-house replacement for Fello's "Property
 * Intelligence Summary" and "(Segment Watch) Daily Summary" emails.
 *
 *  - Property Intelligence: homes IN your database newly LISTED or SOLD.
 *  - Segment Watch: a one-line count per segment of what's NEW since the last
 *    report (new expireds / closings / listings in your database).
 *
 * MLS sold/expired data lags, so we pull a WIDE look-back window and report only
 * items we haven't reported before (see seen.ts) — "new since yesterday" the way
 * Fello counts "N new contacts", instead of a tight sold-date window that misses
 * everything. READ-ONLY data gathering (MLS + local store). Sends via Resend.
 */
import { Resend } from "resend";
import { homeownerBrand } from "@/lib/homeowners/brand";
import { databaseClosings, databaseNewListings, type IntelMatch } from "@/lib/idx/closings";
import { expiredMatches, type ExpiredMatch } from "@/lib/idx/expired";
import { loadFormerMatcher } from "@/lib/idx/referral";
import { filterNew } from "./seen";

type Matcher = (name: string) => string | null;

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

// ---------------------------------------------------------------- gather (once, deduped)

type RawCounts = { listings: number; solds: number; expired: number };

export type DailyData = {
  lookbackDays: number;
  newListings: IntelMatch[];
  newSolds: IntelMatch[];
  newExpired: ExpiredMatch[];
  matchFormer: Matcher;
  /** diagnostics: how many each MLS query returned, and how many matched the DB */
  pulled: RawCounts;
  matched: RawCounts;
};

/**
 * Pull a wide window, match to the database, then keep only items not reported
 * before (unless dryRun). Shared by both emails so an item is deduped once.
 */
export async function gatherDailyData(lookbackDays: number, dryRun = false): Promise<DailyData> {
  const [listings, solds, expired, matchFormer] = await Promise.all([
    databaseNewListings(lookbackDays),
    databaseClosings(lookbackDays),
    expiredMatches(lookbackDays),
    loadFormerMatcher(),
  ]);
  const [newListings, newSolds, newExpired] = await Promise.all([
    filterNew("listed", listings.ok ? listings.matched : [], { dryRun }),
    filterNew("sold", solds.ok ? solds.matched : [], { dryRun }),
    filterNew("expired", expired.ok ? expired.matched : [], { dryRun }),
  ]);
  return {
    lookbackDays,
    newListings,
    newSolds,
    newExpired,
    matchFormer,
    pulled: {
      listings: listings.ok ? listings.pulled : 0,
      solds: solds.ok ? solds.pulled : 0,
      expired: expired.ok ? expired.pulled : 0,
    },
    matched: {
      listings: listings.ok ? listings.matched.length : 0,
      solds: solds.ok ? solds.matched.length : 0,
      expired: expired.ok ? expired.matched.length : 0,
    },
  };
}

// ---------------------------------------------------------------- Property Intelligence

function intelBlock(title: string, rows: IntelMatch[], matchFormer: Matcher): string {
  const total = rows.reduce((s, r) => s + (r.price || 0), 0);
  const items = rows
    .map((m) => {
      const name = [m.contact.firstName, m.contact.lastName].filter(Boolean).join(" ") || "Unnamed contact";
      const link = fubLink(m.contact.fubPersonId) || `${adminBase()}/dashboard/${m.contact.token}`;
      const place = [m.city, m.zip].filter(Boolean).join(", ");
      const former = matchFormer(m.listAgent);
      return `
        <tr><td style="padding:10px 0;border-bottom:1px solid #eceef1;">
          <a href="${link}" style="font-size:15px;font-weight:600;color:#8a6d2b;text-decoration:none;">${esc(
            m.address || "Address unavailable",
          )}</a>
          <div style="font-size:13px;color:#6a6f76;margin-top:2px;">
            ${m.status} (MLS) · ${money(m.price)}${m.listAgent ? ` · ${esc(m.listAgent)} (listing)` : ""}${m.buyerAgent ? ` · ${esc(m.buyerAgent)} (buyer)` : ""}
          </div>
          ${former ? `<div style="font-size:13px;font-weight:600;color:#b4433a;margin-top:1px;">⚠️ Former teammate (${esc(former)}) — possible referral</div>` : ""}
          <div style="font-size:13px;color:#6a6f76;margin-top:1px;">${esc(name)}${place ? ` · ${esc(place)}` : ""}</div>
        </td></tr>`;
    })
    .join("");
  return `
    <div style="background:#fafafb;border:1px solid #d5d8de;border-radius:8px;padding:16px;margin-top:16px;">
      <div style="font-size:15px;font-weight:600;color:#3f3d56;">${title}: ${rows.length}</div>
      <div style="font-size:30px;font-weight:600;color:#3f3d56;line-height:1.1;margin-top:2px;">${money(total)}</div>
      ${rows.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${items}</table>` : `<div style="font-size:13px;color:#6a6f76;margin-top:8px;">Nothing new since the last report.</div>`}
    </div>`;
}

export function renderPropertyIntelEmail(d: DailyData): string {
  return shell(
    "Property Intelligence Summary",
    "Homes in your database newly listed and sold · new since the last report",
    intelBlock("Recent Listings", d.newListings, d.matchFormer) + intelBlock("Recent Solds", d.newSolds, d.matchFormer),
  );
}

// ---------------------------------------------------------------- Segment Watch

export function renderSegmentWatchEmail(d: DailyData): string {
  const base = adminBase();
  const referral =
    d.newSolds.filter((m) => d.matchFormer(m.listAgent)).length +
    d.newListings.filter((m) => d.matchFormer(m.listAgent)).length;
  const segments = [
    { label: "⚠️ Referral watch — former teammate on your DB deal", count: referral, href: `${base}/admin/closings` },
    { label: "Expired sellers (in your database)", count: d.newExpired.length, href: `${base}/admin/expireds` },
    { label: "Closings (your database)", count: d.newSolds.length, href: `${base}/admin/closings` },
    { label: "Newly listed (your database)", count: d.newListings.length, href: `${base}/admin/closings` },
  ];
  const rows = segments
    .map(
      (s) => `
      <a href="${s.href}" style="display:block;text-decoration:none;background:#fafafb;border:1px solid #d5d8de;border-radius:8px;padding:16px;margin-top:12px;">
        <div style="font-size:15px;font-weight:600;color:#3f3d56;">${esc(s.label)}</div>
        <div style="font-size:28px;font-weight:600;color:${s.count > 0 ? "#8a6d2b" : "#9aa0a6"};margin-top:2px;">${s.count} new</div>
      </a>`,
    )
    .join("");
  return shell("Segment Watch — Daily Summary", "What's new in each segment since the last report", rows);
}

/** Totals for an admin dry-run preview (no send). */
export function dailyCounts(d: DailyData) {
  const referral =
    d.newSolds.filter((m) => d.matchFormer(m.listAgent)).length +
    d.newListings.filter((m) => d.matchFormer(m.listAgent)).length;
  return {
    lookbackDays: d.lookbackDays,
    newListings: d.newListings.length,
    newSolds: d.newSolds.length,
    newExpired: d.newExpired.length,
    referralWatch: referral,
    // Diagnostics: raw rows the MLS returned vs. how many matched the database,
    // before dedup. Lets a dry-run tell "feed returned nothing" (pulled 0) apart
    // from "nothing in the DB overlapped" (pulled > 0, matched 0).
    pulled: d.pulled,
    matched: d.matched,
  };
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
