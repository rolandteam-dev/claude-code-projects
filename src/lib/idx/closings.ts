/**
 * Database property intelligence. Pulls recently SOLD and recently LISTED MLS
 * listings from the Repliers GLVAR feed and matches them, by address, against
 * the homeowner store (our mirror of Follow Up Boss contacts) — so you're told
 * when a home you have on file closes or comes on the market, even if someone
 * else is the agent. Each match carries the listing agent (the first referral
 * signal) and the matched contact.
 *
 * READ-ONLY. Pulls from the MLS and reads the local store; writes nothing.
 *
 * Valley-wide sales/listings are high-volume, so this paginates (most-recent
 * first) up to a page cap and uses a tight default window. For complete
 * coverage, check on a short cadence (a daily sweep of the last few days never
 * misses one).
 */
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { keyOf, splitAddr } from "./expired";

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193";
const WORKING_SET = 8000;
const MAX_PAGES = 30; // 30 × 100 = up to 3,000 most-recent rows per run

type Contact = {
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  fubPersonId?: string;
};

export type IntelListing = {
  mlsNumber: string;
  address: string;
  city: string;
  zip: string;
  /** sold price for a closing, list price for a new listing */
  price: number;
  /** sold date for a closing, list date for a new listing (YYYY-MM-DD) */
  date: string;
  dom: number | null;
  listAgent: string;
  buyerAgent: string;
  status: "Sold" | "Active";
};

export type IntelMatch = IntelListing & { contact: Contact };

// Back-compat aliases for the /admin/closings page.
export type Closing = IntelListing & { soldPrice: number; soldDate: string };
export type ClosingMatch = Closing & { contact: Contact };

export type IntelResult<T> =
  | { ok: true; pulled: number; indexed: number; matched: T[]; sinceDays: number; moreToScan: boolean }
  | { ok: false; reason: "not_configured" | "upstream_error"; detail?: string };

export type ClosingsResult = IntelResult<ClosingMatch>;
export type NewListingsResult = IntelResult<IntelMatch>;

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (...vals: any[]): number => {
  for (const v of vals) {
    if (v != null && v !== "") {
      const x = Number(v);
      if (Number.isFinite(x)) return x;
    }
  }
  return 0;
};

/**
 * Best-effort split of a sale's agents into listing side vs buyer side from the
 * varied Repliers shapes. When roles aren't labeled, the first agent is treated
 * as the listing agent (matches the old single-agent behavior). Fields and role
 * labels vary by MLS, so this fails soft to "" rather than guessing wrong.
 */
export function agentsByRole(r: any): { listing: string; buyer: string } {
  let listing = "";
  let buyer = "";
  const add = (cur: string, name: string) => (cur ? `${cur}, ${name}` : name);
  const a = r?.agents;
  if (Array.isArray(a)) {
    for (const x of a) {
      const name = String(x?.name || [x?.firstName, x?.lastName].filter(Boolean).join(" ")).trim();
      if (!name) continue;
      const role = String(x?.type ?? x?.role ?? x?.agentType ?? x?.side ?? "").toLowerCase();
      if (/buyer|coop|co-?op|selling|sell\b/.test(role) && !/list/.test(role)) buyer = add(buyer, name);
      else if (/list/.test(role)) listing = add(listing, name);
      else if (!listing) listing = name; // unlabeled → assume listing side
    }
  }
  if (!listing) listing = String(r?.listAgentName ?? r?.listingAgentName ?? r?.listAgent ?? "").trim();
  if (!buyer) buyer = String(r?.buyerAgentName ?? r?.coopAgentName ?? r?.sellingAgentName ?? "").trim();
  return { listing, buyer };
}

/** Back-compat: the listing-agent name only. */
export function agentOf(r: any): string {
  return agentsByRole(r).listing;
}

function rowToListing(r: any, mode: "sold" | "active"): IntelListing {
  const addr = r?.address ?? {};
  const streetNumber = String(addr.streetNumber ?? "").trim();
  const streetName = String(addr.streetName ?? addr.street ?? "").trim();
  const addressLine =
    [streetNumber, streetName].filter(Boolean).join(" ").trim() || String(addr.address ?? "").trim();
  const date =
    mode === "sold"
      ? String(r.soldDate ?? r.lastStatusUpdate ?? "").slice(0, 10)
      : String(r.listDate ?? r.listingDate ?? r.updatedOn ?? "").slice(0, 10);
  const roles = agentsByRole(r);
  return {
    mlsNumber: String(r.mlsNumber ?? "").trim(),
    address: addressLine,
    city: String(addr.city ?? "").trim(),
    zip: String(addr.zip ?? addr.postalCode ?? addr.zipCode ?? "").trim(),
    price: mode === "sold" ? num(r.soldPrice, r.price, r?.details?.soldPrice) : num(r.listPrice, r.price),
    date,
    dom: num(r.daysOnMarket, r?.details?.daysOnMarket) || null,
    listAgent: roles.listing,
    buyerAgent: roles.buyer,
    status: mode === "sold" ? "Sold" : "Active",
  };
}

async function fetchListings(
  key: string,
  mode: "sold" | "active",
  sinceTs: number,
): Promise<{ list: IntelListing[]; more: boolean }> {
  const boardId = (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
  const since = new Date(sinceTs).toISOString().slice(0, 10);
  const list: IntelListing[] = [];
  let more = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const p = new URLSearchParams();
    p.set("boardId", boardId);
    p.set("type", "sale");
    p.set("resultsPerPage", "100");
    p.set("pageNum", String(page));
    p.set(
      "fields",
      "mlsNumber,address,details,soldPrice,listPrice,price,soldDate,listDate,lastStatusUpdate,updatedOn,daysOnMarket,agents,office,listAgentName,listingAgentName",
    );
    if (mode === "sold") {
      p.set("status", "U");
      p.set("lastStatus", "Sld");
      p.set("minSoldDate", since);
      p.set("sortBy", "soldDateDesc");
    } else {
      p.set("status", "A");
      p.set("minListDate", since);
      p.set("sortBy", "listDateDesc");
    }

    const res = await fetch(`${API_BASE}/listings?${p.toString()}`, {
      headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) break;
    const data: any = await res.json();
    const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];
    if (rows.length === 0) break;

    for (const r of rows) {
      const item = rowToListing(r, mode);
      // For active listings the feed may not honor minListDate; enforce in-app.
      if (mode === "active" && item.date && Date.parse(item.date) < sinceTs) continue;
      list.push(item);
    }

    if (rows.length < 100) break;
    if (page === MAX_PAGES) more = true;
  }
  return { list, more };
}

async function indexHomeowners(): Promise<Map<string, Homeowner>> {
  const homeowners = await homeownerStore().list(WORKING_SET);
  const index = new Map<string, Homeowner>();
  for (const h of homeowners) {
    const { num: n, street } = splitAddr(h.address);
    const k = keyOf(n, street, h.zip);
    if (k) index.set(k, h);
  }
  return index;
}

const contactOf = (h: Homeowner): Contact => ({
  token: h.token,
  firstName: h.firstName,
  lastName: h.lastName,
  email: h.email,
  phone: h.phone,
  fubPersonId: h.fubPersonId,
});

function matchByAddress(list: IntelListing[], index: Map<string, Homeowner>): IntelMatch[] {
  const out: IntelMatch[] = [];
  for (const item of list) {
    const { num: ln, street } = splitAddr(item.address);
    const k = keyOf(ln, street, item.zip);
    const h = k ? index.get(k) : undefined;
    if (!h) continue;
    out.push({ ...item, contact: contactOf(h) });
  }
  return out;
}

async function intel(mode: "sold" | "active", sinceDays: number): Promise<IntelResult<IntelMatch>> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const sinceTs = Date.now() - Math.max(1, sinceDays) * 86_400_000;
  const index = await indexHomeowners();
  let pulled: { list: IntelListing[]; more: boolean };
  try {
    pulled = await fetchListings(key, mode, sinceTs);
  } catch (e) {
    return { ok: false, reason: "upstream_error", detail: String(e).slice(0, 300) };
  }
  const matched = matchByAddress(pulled.list, index).sort((a, b) => (a.date < b.date ? 1 : -1));
  return { ok: true, pulled: pulled.list.length, indexed: index.size, matched, sinceDays, moreToScan: pulled.more };
}

/** Recently SOLD homes that match a contact in the homeowner store. */
export async function databaseClosings(sinceDays = 30): Promise<ClosingsResult> {
  const r = await intel("sold", sinceDays);
  if (!r.ok) return r;
  // Add the back-compat soldPrice/soldDate aliases the page expects.
  const matched: ClosingMatch[] = r.matched.map((m) => ({ ...m, soldPrice: m.price, soldDate: m.date }));
  return { ...r, matched };
}

/** Recently LISTED homes that match a contact in the homeowner store. */
export async function databaseNewListings(sinceDays = 7): Promise<NewListingsResult> {
  return intel("active", sinceDays);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
