/**
 * Database-closings tracker. Pulls recently SOLD MLS listings from the Repliers
 * GLVAR feed and matches them, by address, against the homeowner store (our
 * mirror of Follow Up Boss contacts) — so you're told when a home you have on
 * file closes, even if someone else sold it. Each match also carries the
 * listing agent, which is the first signal for a possible referral.
 *
 * READ-ONLY. Pulls from the MLS and reads the local store; writes nothing.
 *
 * Valley-wide sales are high-volume, so this paginates (most-recent first) up
 * to a page cap and defaults to a 30-day window. For complete coverage, check
 * it on a short cadence (a daily sweep of the last few days never misses one).
 */
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { keyOf, splitAddr } from "./expired";

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193";
const WORKING_SET = 8000;
const MAX_PAGES = 30; // 30 × 100 = up to 3,000 most-recent sales per run

export type Closing = {
  mlsNumber: string;
  address: string;
  city: string;
  zip: string;
  soldPrice: number;
  soldDate: string;
  dom: number | null;
  listAgent: string;
};

export type ClosingMatch = Closing & {
  contact: {
    token: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    fubPersonId?: string;
  };
};

export type ClosingsResult =
  | { ok: true; pulled: number; indexed: number; matched: ClosingMatch[]; sinceDays: number; moreToScan: boolean }
  | { ok: false; reason: "not_configured" | "upstream_error"; detail?: string };

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

/** Best-effort listing-agent name from the varied Repliers shapes. */
export function agentOf(r: any): string {
  const a = r?.agents;
  if (Array.isArray(a) && a.length) {
    const names = a
      .map((x: any) => x?.name || [x?.firstName, x?.lastName].filter(Boolean).join(" "))
      .filter(Boolean);
    if (names.length) return names.join(", ");
  }
  return String(r?.listAgentName ?? r?.listingAgentName ?? r?.listAgent ?? r?.office?.brokerageName ?? "").trim();
}

async function fetchSold(key: string, sinceTs: number): Promise<{ list: Closing[]; more: boolean }> {
  const boardId = (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
  const since = new Date(sinceTs).toISOString().slice(0, 10);
  const list: Closing[] = [];
  let more = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const p = new URLSearchParams();
    p.set("boardId", boardId);
    p.set("type", "sale");
    p.set("status", "U");
    p.set("lastStatus", "Sld");
    p.set("minSoldDate", since);
    p.set("resultsPerPage", "100");
    p.set("pageNum", String(page));
    p.set("sortBy", "soldDateDesc");
    p.set(
      "fields",
      "mlsNumber,address,details,soldPrice,soldDate,daysOnMarket,agents,office,listAgentName,listingAgentName",
    );

    const res = await fetch(`${API_BASE}/listings?${p.toString()}`, {
      headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) break;
    const data: any = await res.json();
    const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];
    if (rows.length === 0) break;

    for (const r of rows) {
      const addr = r?.address ?? {};
      const streetNumber = String(addr.streetNumber ?? "").trim();
      const streetName = String(addr.streetName ?? addr.street ?? "").trim();
      const addressLine =
        [streetNumber, streetName].filter(Boolean).join(" ").trim() || String(addr.address ?? "").trim();
      list.push({
        mlsNumber: String(r.mlsNumber ?? "").trim(),
        address: addressLine,
        city: String(addr.city ?? "").trim(),
        zip: String(addr.zip ?? addr.postalCode ?? addr.zipCode ?? "").trim(),
        soldPrice: num(r.soldPrice, r.price, r?.details?.soldPrice),
        soldDate: String(r.soldDate ?? r.lastStatusUpdate ?? "").slice(0, 10),
        dom: num(r.daysOnMarket, r?.details?.daysOnMarket) || null,
        listAgent: agentOf(r),
      });
    }

    if (rows.length < 100) break;
    if (page === MAX_PAGES) more = true;
  }
  return { list, more };
}

/** Recently sold homes that match a contact in the homeowner store. */
export async function databaseClosings(sinceDays = 30): Promise<ClosingsResult> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };

  const sinceTs = Date.now() - Math.max(1, sinceDays) * 86_400_000;

  const homeowners: Homeowner[] = await homeownerStore().list(WORKING_SET);
  const index = new Map<string, Homeowner>();
  for (const h of homeowners) {
    const { num: n, street } = splitAddr(h.address);
    const k = keyOf(n, street, h.zip);
    if (k) index.set(k, h);
  }

  let sold: { list: Closing[]; more: boolean };
  try {
    sold = await fetchSold(key, sinceTs);
  } catch (e) {
    return { ok: false, reason: "upstream_error", detail: String(e).slice(0, 300) };
  }

  const matched: ClosingMatch[] = [];
  for (const s of sold.list) {
    const { num: ln, street } = splitAddr(s.address);
    const k = keyOf(ln, street, s.zip);
    const h = k ? index.get(k) : undefined;
    if (!h) continue;
    matched.push({
      ...s,
      contact: {
        token: h.token,
        firstName: h.firstName,
        lastName: h.lastName,
        email: h.email,
        phone: h.phone,
        fubPersonId: h.fubPersonId,
      },
    });
  }
  matched.sort((a, b) => (a.soldDate < b.soldDate ? 1 : -1));

  return { ok: true, pulled: sold.list.length, indexed: index.size, matched, sinceDays, moreToScan: sold.more };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
