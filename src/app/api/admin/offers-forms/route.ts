import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { parseBrokerage } from "@/lib/offers/forms/brokerage";
import { safeEqual } from "@/lib/offers/config";
import {
  BROKERAGE_PATH,
  FORM_NAMES,
  FORM_PAGES,
  blobConfigured,
  loadBlank,
  loadBrokerageJson,
  storeBlank,
  storeBrokerageJson,
  type FormName,
} from "@/lib/offers/rpa/store";

export const runtime = "nodejs";

/**
 * Admin: upload / check the blank forms and the private brokerage config the Offer Machine uses.
 *
 *   GET  ?key=…                  reports which blanks and the brokerage config are stored. Writes nothing.
 *   POST ?key=…&name=rpa|duties|supp|bbra   body = the raw, UNLOCKED blank PDF. Checked for page count.
 *   POST ?key=…&name=brokerage   body = the brokerage JSON (see src/lib/offers/forms/brokerage.ts).
 *
 * key = ADMIN_TOKEN or OFFER_FORMS_KEY. Fails closed when neither is set. name defaults to rpa.
 */
function authorized(req: Request): boolean {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  return [process.env.ADMIN_TOKEN, process.env.OFFER_FORMS_KEY].some((t) => Boolean(t) && safeEqual(key, t as string));
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!blobConfigured()) return NextResponse.json({ ok: true, blobConfigured: false });
  const forms: Record<string, { stored: boolean; bytes: number }> = {};
  for (const n of FORM_NAMES) {
    const b = await loadBlank(n);
    forms[n] = { stored: Boolean(b), bytes: b?.length ?? 0 };
  }
  const json = await loadBrokerageJson();
  let agents: number | null = null;
  try {
    agents = json ? parseBrokerage(JSON.parse(json)).agents.length : null;
  } catch {
    agents = -1; // stored but unreadable
  }
  return NextResponse.json({ ok: true, blobConfigured: true, forms, brokerage: { stored: Boolean(json), path: BROKERAGE_PATH, agents } });
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!blobConfigured()) return NextResponse.json({ ok: false, error: "BLOB_READ_WRITE_TOKEN is not set" }, { status: 503 });
  const name = new URL(req.url).searchParams.get("name") ?? "rpa";

  if (name === "brokerage") {
    try {
      const cfg = parseBrokerage(JSON.parse(await req.text()));
      await storeBrokerageJson(JSON.stringify(cfg));
      return NextResponse.json({ ok: true, agents: cfg.agents.length, additionalLicensees: cfg.additionalLicensees.length });
    } catch (e) {
      return NextResponse.json({ ok: false, error: `bad brokerage config: ${e instanceof Error ? e.message : String(e)}` }, { status: 422 });
    }
  }

  if (!(FORM_NAMES as readonly string[]).includes(name)) {
    return NextResponse.json({ ok: false, error: `name must be one of ${FORM_NAMES.join(", ")}, brokerage` }, { status: 400 });
  }
  const form = name as FormName;
  const bytes = new Uint8Array(await req.arrayBuffer());
  try {
    const doc = await PDFDocument.load(bytes);
    if (doc.getPageCount() !== FORM_PAGES[form]) {
      return NextResponse.json({ ok: false, error: `${form} must have ${FORM_PAGES[form]} pages, got ${doc.getPageCount()}` }, { status: 422 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: `not a readable, unlocked PDF: ${e instanceof Error ? e.message : String(e)}` }, { status: 422 });
  }
  await storeBlank(form, bytes);
  return NextResponse.json({ ok: true, name: form, bytes: bytes.length });
}
