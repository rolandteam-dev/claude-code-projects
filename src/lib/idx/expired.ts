/**
 * Expired-listing → owner matcher. Pulls recently expired MLS listings from the
 * Repliers GLVAR feed and matches them, by address, against the homeowner store
 * (our mirror of Follow Up Boss contacts) — so you see the expireds where you
 * ALREADY have the owner's contact. No skip-tracing, no third party; just the
 * warm ones you can call today.
 *
 * READ-ONLY. Pulls from the MLS and reads the local store; writes nothing to the
 * CRM or the store.
 *
 * NOTE: on GLVAR/Repliers, an off-market record is `status=U`; "expired" is
 * `lastStatus=Exp` (mirrors the sold-comp query which uses `lastStatus=Sld`).
 * The exact code set can vary by MLS — if a live pull returns zero, widen
 * `EXPIRED_STATUSES` and re-check the admin page's diagnostic line.
 */
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";

const API_BASE = "https://api.repliers.io";
const DEFAULT_BOARD_ID = "193"; // GLVAR / Las Vegas REALTORS®

/** lastStatus codes that mean "was listed, came off without selling". */
const EXPIRED_STATUSES = ["Exp"]; // extend if needed, e.g. ["Exp","Ter","Can","Sus"]

const WORKING_SET = 8000; // homeowner records to index for matching

export type ExpiredListing = {
  mlsNumber: string;
  address: string; // "807 Pine Flower Court"
  city: string;
  zip: string;
  listPrice: number;
  expiredDate: string; // best available off-market date (may be "")
  dom: number | null; // days on market, if the feed carries it
  lastStatus: string;
};

export type ExpiredMatch = ExpiredListing & {
  contact: {
    token: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    fubPersonId?: string;
  };
};

export type ExpiredResult =
  | { ok: true; pulled: number; indexed: number; matched: ExpiredMatch[]; sinceDays: number }
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

/** Lowercase, strip punctuation + common street suffixes (same idea as nvValue). */
function normStreet(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[.,#]/g, "")
    .replace(
      /\b(ave|avenue|st|street|dr|drive|ln|lane|rd|road|ct|court|blvd|boulevard|way|cir|circle|pl|place|pkwy|parkway|ter|terrace|hwy|highway|trl|trail|loop|cv|cove)\b/g,
      "",
    )
    .replace(/\bunit\b.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a stored street line ("807 Pine Flower Court") into number + street. */
function splitAddr(full: string): { num: string; street: string } {
  const m = (full || "").trim().match(/^(\d+)\s+(.*)$/);
  return m ? { num: m[1], street: m[2] } : { num: "", street: full || "" };
}

/** Match key: street number + normalized street name + 5-digit ZIP. */
function keyOf(numPart: string, street: string, zip: string): string {
  const z = (zip || "").trim().slice(0, 5);
  const n = (numPart || "").trim();
  const s = normStreet(street);
  if (!n || !s || !z) return ""; // never match on a partial key
  return `${n}|${s}|${z}`;
}

async function fetchExpired(key: string, sinceTs: number): Promise<ExpiredListing[]> {
  const boardId = (process.env.REPLIERS_BOARD_ID ?? DEFAULT_BOARD_ID).trim();
  const byMls = new Map<string, ExpiredListing>();

  for (const st of EXPIRED_STATUSES) {
    const p = new URLSearchParams();
    p.set("boardId", boardId);
    p.set("type", "sale");
    p.set("status", "U"); // off-market
    p.set("lastStatus", st); // single value (Repliers rejects a list)
    p.set("resultsPerPage", "100");
    p.set("sortBy", "updatedOnDesc");
    p.set(
      "fields",
      "mlsNumber,address,details,listPrice,listDate,expiryDate,unavailableDate,updatedOn,lastStatusUpdate,lastStatus,daysOnMarket",
    );

    const res = await fetch(`${API_BASE}/listings?${p.toString()}`, {
      headers: { "REPLIERS-API-KEY": key, "Content-Type": "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) continue; // skip a bad status code rather than fail the whole pull
    const data: any = await res.json();
    const rows: any[] = Array.isArray(data?.listings) ? data.listings : [];

    for (const r of rows) {
      const addr = r?.address ?? {};
      const streetNumber = String(addr.streetNumber ?? "").trim();
      const streetName = String(addr.streetName ?? addr.street ?? "").trim();
      const addressLine =
        [streetNumber, streetName].filter(Boolean).join(" ").trim() || String(addr.address ?? "").trim();
      const zip = String(addr.zip ?? addr.postalCode ?? addr.zipCode ?? "").trim();
      const expiredDate = String(
        r.expiryDate ?? r.unavailableDate ?? r.lastStatusUpdate ?? r.updatedOn ?? "",
      ).slice(0, 10);

      // Window filter: keep when within range, or when no usable date (fail open).
      if (expiredDate && sinceTs && Number.isFinite(Date.parse(expiredDate)) && Date.parse(expiredDate) < sinceTs) {
        continue;
      }
      const mls = String(r.mlsNumber ?? "").trim();
      if (!mls || byMls.has(mls)) continue;

      byMls.set(mls, {
        mlsNumber: mls,
        address: addressLine,
        city: String(addr.city ?? "").trim(),
        zip,
        listPrice: num(r.listPrice, r.price, r?.details?.listPrice),
        expiredDate,
        dom: num(r.daysOnMarket, r?.details?.daysOnMarket) || null,
        lastStatus: String(r.lastStatus ?? st),
      });
    }
  }
  return [...byMls.values()];
}

/**
 * Pull expired listings from the last `sinceDays` and match them to homeowner
 * records by address. Returns the matched set (expireds whose owner you have).
 */
export async function expiredMatches(sinceDays = 90): Promise<ExpiredResult> {
  const key = process.env.REPLIERS_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };

  const sinceTs = Date.now() - Math.max(1, sinceDays) * 86_400_000;

  // Index the homeowner store (our FUB mirror) by match key.
  const homeowners: Homeowner[] = await homeownerStore().list(WORKING_SET);
  const index = new Map<string, Homeowner>();
  for (const h of homeowners) {
    const { num: n, street } = splitAddr(h.address);
    const k = keyOf(n, street, h.zip);
    if (k) index.set(k, h);
  }

  let listings: ExpiredListing[];
  try {
    listings = await fetchExpired(key, sinceTs);
  } catch (e) {
    return { ok: false, reason: "upstream_error", detail: String(e).slice(0, 300) };
  }

  const matched: ExpiredMatch[] = [];
  for (const L of listings) {
    const { num: ln, street } = splitAddr(L.address);
    const k = keyOf(ln, street, L.zip);
    const h = k ? index.get(k) : undefined;
    if (!h) continue;
    matched.push({
      ...L,
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
  // Freshest first.
  matched.sort((a, b) => (a.expiredDate < b.expiredDate ? 1 : -1));

  return { ok: true, pulled: listings.length, indexed: index.size, matched, sinceDays };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
