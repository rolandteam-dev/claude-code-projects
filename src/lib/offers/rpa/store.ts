/**
 * Offer Machine — where the blank RPA and the filled drafts live (Vercel Blob, PRIVATE store).
 *
 * The blank form is GLVAR's copyrighted PDF and stays out of this public repo: it is uploaded
 * once through /api/admin/offers-forms and read from the store at fill time. Filled drafts carry
 * client names and prices, so they are private blobs with a random id, auto-deleted after
 * DRAFT_TTL_DAYS, and only reachable through a signed, expiring link.
 *
 * Needs BLOB_READ_WRITE_TOKEN (set when the store is connected to the project) and
 * SLACK_SIGNING_SECRET (the link signing key is derived from it).
 */
import { createHmac, randomBytes } from "crypto";
import { get, put } from "@vercel/blob";
import { safeEqual } from "../config";

export const FORM_NAMES = ["rpa", "duties", "supp", "bbra"] as const;
export type FormName = (typeof FORM_NAMES)[number];
/** Pages each blank must have (a revised form has a different count and its layout must be re-mapped). */
export const FORM_PAGES: Record<FormName, number> = { rpa: 11, duties: 1, supp: 1, bbra: 3 };
export const FORM_LABEL: Record<FormName, string> = {
  rpa: "Residential Purchase Agreement",
  duties: "Duties Owed",
  supp: "Duties Owed Supplemental List",
  bbra: "Buyer Brokerage Agreement (BBRA)",
};
const blankPath = (name: FormName) => `forms/${name}-blank.pdf`;
export const BROKERAGE_PATH = "config/brokerage.json";
const DRAFT_TTL_DAYS = 14;
const LINK_DAYS = 7;

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function storeBlank(name: FormName, bytes: Uint8Array): Promise<void> {
  await put(blankPath(name), Buffer.from(bytes), { access: "private", contentType: "application/pdf", allowOverwrite: true, addRandomSuffix: false });
}

/** A blank form, or null when it hasn't been uploaded (or Blob isn't set up). */
export async function loadBlank(name: FormName): Promise<Uint8Array | null> {
  if (!blobConfigured()) return null;
  const res = await get(blankPath(name), { access: "private", useCache: false });
  return res?.stream ? readAll(res.stream) : null;
}

export async function storeBrokerageJson(json: string): Promise<void> {
  await put(BROKERAGE_PATH, json, { access: "private", contentType: "application/json", allowOverwrite: true, addRandomSuffix: false });
}

export async function loadBrokerageJson(): Promise<string | null> {
  if (!blobConfigured()) return null;
  const res = await get(BROKERAGE_PATH, { access: "private", useCache: false });
  return res?.stream ? new TextDecoder().decode(await readAll(res.stream)) : null;
}

/** Stores a filled draft; the id carries the form kind ("duties-<32 hex>"). */
export async function saveDraft(kind: FormName, pdf: Uint8Array): Promise<string> {
  const id = `${kind}-${randomBytes(16).toString("hex")}`;
  await put(`drafts/${id}.pdf`, Buffer.from(pdf), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: false,
    ttlDays: DRAFT_TTL_DAYS,
  });
  return id;
}

export const DRAFT_ID = /^(rpa|duties|supp|bbra)-[0-9a-f]{32}$/;

export async function loadDraft(id: string): Promise<Uint8Array | null> {
  if (!DRAFT_ID.test(id) || !blobConfigured()) return null;
  const res = await get(`drafts/${id}.pdf`, { access: "private", useCache: false });
  return res?.stream ? readAll(res.stream) : null;
}

function sign(id: string, exp: number): string | null {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return null;
  return createHmac("sha256", `offer-rpa-link:${secret}`).update(`${id}.${exp}`).digest("hex");
}

/** A link the agent can click in Slack: signed, expiring, no login needed. Null if signing isn't possible. */
export function draftLink(id: string, baseUrl: string, now = Date.now()): string | null {
  const exp = Math.floor(now / 1000) + LINK_DAYS * 86400;
  const sig = sign(id, exp);
  if (!sig) return null;
  return `${baseUrl.replace(/\/$/, "")}/api/offers/rpa/${id}?exp=${exp}&sig=${sig}`;
}

export function verifyDraftLink(id: string, exp: string | null, sig: string | null, now = Date.now()): boolean {
  if (!exp || !sig || !/^\d{9,12}$/.test(exp)) return false;
  if (Number(exp) * 1000 < now) return false;
  const want = sign(id, Number(exp));
  return want !== null && safeEqual(sig, want);
}
